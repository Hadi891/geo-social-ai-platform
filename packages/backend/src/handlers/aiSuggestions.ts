import type { APIGatewayProxyEvent } from "aws-lambda";
import OpenAI from "openai";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isUUID } from "../utils/validation";
import { ok, badRequest, unauthorized, notFound, forbidden, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

type ContextType = "initial" | "chat";
type ConversationMode = "discovery" | "flow" | "stalled" | "tension";

type AiSuggestionsBody = {
  match_id: string;
  context_type: ContextType;
};

type MessageRow = {
  sender_id: string;
  message_text: string;
  created_at: Date;
};

const STALLED_THRESHOLD_HOURS = 12;

// ── Infer lightweight conversation mode from recent messages ─────────────────
function inferMode(messages: MessageRow[], now: Date): ConversationMode {
  const nonDeleted = messages; // already filtered

  if (nonDeleted.length < 4) return "discovery";

  const latest = nonDeleted[nonDeleted.length - 1];
  const hoursSinceLast =
    (now.getTime() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60);

  if (hoursSinceLast > STALLED_THRESHOLD_HOURS) return "stalled";

  // Simple tension heuristic: very short / cold recent replies
  const recentThree = nonDeleted.slice(-3).map(m => m.message_text.toLowerCase().trim());
  const tensionPhrases = ["ok", "k", "sure", "fine", "whatever", "leave me alone", "stop", "no"];
  const tensionHits = recentThree.filter(t =>
    tensionPhrases.some(p => t === p || t.startsWith(p + " ") || t.endsWith(" " + p))
  ).length;

  if (tensionHits >= 2) return "tension";

  return "flow";
}

// ── Build OpenAI prompt ───────────────────────────────────────────────────────
function buildPrompt(params: {
  contextType: ContextType;
  mode: ConversationMode | null;
  myName: string;
  otherName: string;
  sharedInterests: string[];
  myInterests: string[];
  otherInterests: string[];
  recentMessages: MessageRow[];
  myId: string;
}): string {
  const {
    contextType,
    mode,
    myName,
    otherName,
    sharedInterests,
    myInterests,
    otherInterests,
    recentMessages,
    myId,
  } = params;

  const sharedStr =
    sharedInterests.length > 0
      ? sharedInterests.join(", ")
      : "none detected";

  const myExtraStr =
    myInterests.filter(i => !sharedInterests.includes(i)).join(", ") || "none";

  const otherExtraStr =
    otherInterests.filter(i => !sharedInterests.includes(i)).join(", ") || "none";

  const lines: string[] = [
    "You are a helpful assistant for a dating app.",
    "Your task is to suggest 3 short, natural, and friendly chat messages for a user.",
    "",
    "Rules:",
    "- Return ONLY a JSON array of exactly 3 strings, nothing else.",
    "- Each suggestion must be 1–2 sentences at most.",
    "- Suggestions must feel natural, low-pressure, and human.",
    "- Do NOT be overly enthusiastic, pushy, or generic.",
    "- Do NOT use manipulation, pickup lines, or unsafe language.",
    "- Write from the perspective of the user sending the message.",
    "",
    `User: ${myName}`,
    `Match: ${otherName}`,
    `Shared interests: ${sharedStr}`,
    `User's other interests: ${myExtraStr}`,
    `Match's other interests: ${otherExtraStr}`,
  ];

  if (contextType === "initial") {
    lines.push(
      "",
      "Context: This is the very start of the conversation. No messages have been exchanged yet.",
      "Goal: Generate 3 conversation openers or icebreakers that feel warm and genuine.",
      "Use shared interests as hooks when possible. If no shared interests, use the match's interests.",
    );
  } else {
    lines.push(
      "",
      `Conversation mode: ${mode}`,
    );

    if (mode === "stalled") {
      lines.push("The conversation has gone quiet. Suggest messages that re-open it naturally.");
    } else if (mode === "tension") {
      lines.push("The conversation seems a bit cold or tense. Suggest light, non-confrontational messages.");
    } else if (mode === "discovery") {
      lines.push("The conversation has just started. Suggest replies that build connection and curiosity.");
    } else {
      lines.push("The conversation is flowing well. Suggest contextually relevant follow-up messages.");
    }

    if (recentMessages.length > 0) {
      lines.push("", "Recent messages (oldest first):");
      recentMessages.forEach(m => {
        const speaker = m.sender_id === myId ? myName : otherName;
        lines.push(`  ${speaker}: ${m.message_text}`);
      });
    }

    lines.push("", "Goal: Generate 3 short replies that continue the conversation naturally.");
  }

  lines.push(
    "",
    'Respond with ONLY a JSON array, e.g.: ["suggestion 1", "suggestion 2", "suggestion 3"]',
  );

  return lines.join("\n");
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function handleAiSuggestions(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<AiSuggestionsBody>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { match_id, context_type } = body;

  if (!isUUID(match_id)) return badRequest("match_id must be a valid UUID");
  if (context_type !== "initial" && context_type !== "chat") {
    return badRequest('context_type must be "initial" or "chat"');
  }

  try {
    // ── Resolve authenticated user ────────────────────────────────────────
    const userResult = await db.query(
      `SELECT id, name, COALESCE(interests, '{}') AS interests
       FROM users WHERE cognito_sub = $1`,
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const me = userResult.rows[0];
    const userId: string = me.id;

    // ── Validate match and membership ─────────────────────────────────────
    const matchResult = await db.query(
      `SELECT m.id, m.user_a, m.user_b
       FROM matches m
       WHERE m.id = $1`,
      [match_id]
    );
    if (matchResult.rowCount === 0) return notFound("Match not found.");

    const match = matchResult.rows[0];
    if (match.user_a !== userId && match.user_b !== userId) {
      return forbidden("You are not part of this match.");
    }

    const otherId = match.user_a === userId ? match.user_b : match.user_a;

    // ── Load other user's context ─────────────────────────────────────────
    const otherResult = await db.query(
      `SELECT id, name, COALESCE(interests, '{}') AS interests, introversion_score
       FROM users WHERE id = $1`,
      [otherId]
    );
    if (otherResult.rowCount === 0) return notFound("Matched user not found.");
    const other = otherResult.rows[0];

    // ── Compute shared interests ──────────────────────────────────────────
    const myInterests: string[]    = me.interests    ?? [];
    const otherInterests: string[] = other.interests ?? [];
    const sharedInterests = myInterests.filter((i: string) => otherInterests.includes(i));

    logInfo("/ai-suggestions", {
      userId,
      matchId: match_id,
      contextType: context_type,
      sharedInterestsCount: sharedInterests.length,
    });

    // ── Fetch recent messages (chat mode) ─────────────────────────────────
    let recentMessages: MessageRow[] = [];
    let mode: ConversationMode | null = null;

    if (context_type === "chat") {
      const msgResult = await db.query(
        `SELECT sender_id, message_text, created_at
         FROM messages
         WHERE match_id = $1
           AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 15`,
        [match_id]
      );
      recentMessages = (msgResult.rows as MessageRow[]).reverse(); // chronological order
      mode = inferMode(recentMessages, new Date());
    } else {
      // initial mode: treat as discovery
      mode = null;
    }

    logInfo("/ai-suggestions", {
      userId,
      matchId: match_id,
      contextType: context_type,
      inferredMode: mode,
      recentMessageCount: recentMessages.length,
    });

    // ── Build prompt and call OpenAI ──────────────────────────────────────
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logError("/ai-suggestions", "OPENAI_API_KEY not set", { userId });
      return internalError();
    }

    const openai = new OpenAI({ apiKey });

    const prompt = buildPrompt({
      contextType: context_type,
      mode,
      myName:        me.name    ?? "User",
      otherName:     other.name ?? "Match",
      sharedInterests,
      myInterests,
      otherInterests,
      recentMessages,
      myId: userId,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";

    // ── Parse suggestions from OpenAI response ────────────────────────────
    let suggestions: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        suggestions = parsed
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .slice(0, 3);
      }
    } catch {
      // Fallback: extract quoted strings if JSON parse fails
      const matches = raw.match(/"([^"]+)"/g);
      if (matches) {
        suggestions = matches.slice(0, 3).map(s => s.replace(/^"|"$/g, ""));
      }
    }

    // Ensure exactly 3 suggestions (pad with safe fallbacks if needed)
    const fallbacks = [
      "How's your day going?",
      "What have you been up to lately?",
      "Anything interesting happening with you?",
    ];
    while (suggestions.length < 3) {
      suggestions.push(fallbacks[suggestions.length]);
    }

    return ok({
      match_id,
      context_type,
      mode: context_type === "initial" ? null : mode,
      suggestions,
    });
  } catch (err) {
    logError("/ai-suggestions", err, { sub: claims.sub });
    return internalError();
  }
}
