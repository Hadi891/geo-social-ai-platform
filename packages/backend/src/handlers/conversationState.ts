import type { APIGatewayProxyEvent } from "aws-lambda";
import OpenAI from "openai";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isUUID } from "../utils/validation";
import { ok, badRequest, unauthorized, notFound, forbidden, internalError } from "../utils/response";
import { logInfo, logWarn, logError } from "../utils/logger";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConversationMode = "discovery" | "flow" | "stalled";

const VALID_MODES: ConversationMode[] = ["discovery", "flow", "stalled"];

type MessageRow = {
  sender_id: string;
  message_text: string;
  created_at: Date;
};

type Signals = {
  message_count: number;
  last_message_gap_hours: number;
  avg_reply_gap_minutes: number;
  short_reply_ratio: number;
  negative_keyword_count: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const CHECKPOINT_INTERVAL   = 5;
const INACTIVE_THRESHOLD_H  = 24;
const SHORT_REPLY_MAX_WORDS = 4;

const NEGATIVE_KEYWORDS: string[] = [
  "stop", "not interested", "leave me alone", "go away", "bye",
  "whatever", "annoying", "no thanks", "nope", "blocked",
  "don't text me", "stop texting", "please stop", "i'm done",
  "i'm not interested",
];

const openai = new OpenAI();

// ── Signal computation ────────────────────────────────────────────────────────

function computeSignals(
  allDesc: MessageRow[],   // all non-deleted messages, newest first
  lastFive: MessageRow[],  // up to 5 newest non-deleted messages, newest first
  now: Date,
): Signals {
  const message_count = allDesc.length;

  if (message_count === 0) {
    return { message_count: 0, last_message_gap_hours: 0, avg_reply_gap_minutes: 0, short_reply_ratio: 0, negative_keyword_count: 0 };
  }

  // Time since last message
  const lastMsgAt = new Date(allDesc[0].created_at).getTime();
  const last_message_gap_hours = Math.round(((now.getTime() - lastMsgAt) / (1000 * 60 * 60)) * 10) / 10;

  // Average reply gap between alternating senders (oldest-first traversal)
  const allAsc = [...allDesc].reverse();
  let gapSum = 0;
  let gapCount = 0;
  for (let i = 1; i < allAsc.length; i++) {
    if (allAsc[i].sender_id !== allAsc[i - 1].sender_id) {
      gapSum += (new Date(allAsc[i].created_at).getTime() - new Date(allAsc[i - 1].created_at).getTime()) / (1000 * 60);
      gapCount++;
    }
  }
  const avg_reply_gap_minutes = gapCount > 0 ? Math.round((gapSum / gapCount) * 10) / 10 : 0;

  // Short reply ratio from last 5
  const shortCount = lastFive.filter(m => m.message_text.trim().split(/\s+/).length <= SHORT_REPLY_MAX_WORDS).length;
  const short_reply_ratio = lastFive.length > 0 ? Math.round((shortCount / lastFive.length) * 10) / 10 : 0;

  // Negative keyword count from last 5
  let negative_keyword_count = 0;
  for (const msg of lastFive) {
    const lower = msg.message_text.toLowerCase();
    for (const kw of NEGATIVE_KEYWORDS) {
      if (lower.includes(kw)) {
        negative_keyword_count++;
        break;
      }
    }
  }

  return { message_count, last_message_gap_hours, avg_reply_gap_minutes, short_reply_ratio, negative_keyword_count };
}

// ── AI mode inference ─────────────────────────────────────────────────────────

async function inferModeWithAI(
  signals: Signals,
  lastFive: MessageRow[],
  senderAId: string,
  storedMode: ConversationMode | null,
): Promise<ConversationMode> {
  // Build anonymised transcript (newest first → reverse to chronological)
  const transcript = [...lastFive].reverse().map(m => {
    const speaker = m.sender_id === senderAId ? "User A" : "User B";
    return `${speaker}: ${m.message_text}`;
  }).join("\n");

  const systemPrompt = `You are a conversation state classifier for a dating app.
The conversation has at least 5 messages and the last message is recent (under 24h ago).
Classify it into exactly one of these two modes:

- flow     : healthy, active, engaged exchange — substantive messages, reasonable reply times
- stalled  : losing momentum, disengaged, cold, or hostile — slow replies, very short messages, or one party pushing back

Rules:
- If short_reply_ratio >= 0.8 AND avg_reply_gap_minutes >= 60 → strongly prefer "stalled"
- If negative_keyword_count >= 2 → strongly prefer "stalled"
- Prefer stability: keep the stored mode unless signals clearly justify a change.

Respond with ONLY a JSON object: {"mode": "flow"} or {"mode": "stalled"}`;

  const userContent = `Signals:
- message_count: ${signals.message_count}
- last_message_gap_hours: ${signals.last_message_gap_hours}
- avg_reply_gap_minutes: ${signals.avg_reply_gap_minutes}
- short_reply_ratio: ${signals.short_reply_ratio}
- negative_keyword_count: ${signals.negative_keyword_count}

Current stored mode: ${storedMode ?? "none"}

Last messages (chronological):
${transcript || "(no messages yet)"}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 20,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userContent },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  try {
    const parsed = JSON.parse(raw) as { mode: string };
    if (VALID_MODES.includes(parsed.mode as ConversationMode)) {
      return parsed.mode as ConversationMode;
    }
  } catch {
    // fall through to fallback
  }

  // Fallback: keep stored mode or default to discovery
  return storedMode ?? "discovery";
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleConversationState(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ match_id: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { match_id } = body;
  if (!isUUID(match_id)) return badRequest("match_id must be a valid UUID");

  try {
    // Resolve caller
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    // Verify match exists
    const matchResult = await db.query(
      "SELECT id, user_a, user_b FROM matches WHERE id = $1",
      [match_id]
    );
    if (matchResult.rowCount === 0) return notFound("Match not found.");

    const match = matchResult.rows[0];
    if (match.user_a !== userId && match.user_b !== userId) {
      return forbidden("You are not part of this match.");
    }

    // Fetch all non-deleted messages (newest first)
    const allResult = await db.query(
      `SELECT sender_id, message_text, created_at
       FROM messages
       WHERE match_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [match_id]
    );
    const allMessages: MessageRow[] = allResult.rows;
    const message_count = allMessages.length;
    const lastFive = allMessages.slice(0, CHECKPOINT_INTERVAL);

    // Fetch stored state
    const stateResult = await db.query(
      "SELECT mode, message_checkpoint FROM match_states WHERE match_id = $1",
      [match_id]
    );
    const storedState = stateResult.rowCount! > 0 ? stateResult.rows[0] : null;
    const storedMode: ConversationMode | null = storedState?.mode ?? null;
    const storedCheckpoint: number = storedState?.message_checkpoint ?? 0;

    const now = new Date();
    const signals = computeSignals(allMessages, lastFive, now);

    // Determine whether re-evaluation is needed
    const currentCheckpoint = Math.floor(message_count / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL;
    const stalledOverride = signals.last_message_gap_hours >= INACTIVE_THRESHOLD_H;
    const needsRecompute =
      storedState === null ||
      currentCheckpoint > storedCheckpoint ||
      stalledOverride;

    let finalMode: ConversationMode = storedMode ?? "discovery";
    let finalCheckpoint = storedCheckpoint;

    if (needsRecompute) {
      // Hard rules applied in code — deterministic, no AI needed
      if (signals.message_count === 0 || signals.message_count < CHECKPOINT_INTERVAL) {
        finalMode = "discovery";
      } else if (signals.last_message_gap_hours >= INACTIVE_THRESHOLD_H) {
        finalMode = "stalled";
      } else {
        // Judgment call: flow / stalled / tension — let gpt-4o-mini decide
        try {
          finalMode = await inferModeWithAI(signals, lastFive, match.user_a, storedMode);
        } catch (aiErr) {
          logWarn("/conversation-state", { warning: "OpenAI call failed, keeping stored mode", error: String(aiErr) });
          finalMode = storedMode ?? "discovery";
        }
      }

      finalCheckpoint = currentCheckpoint;

      await db.query(
        `INSERT INTO match_states (match_id, mode, message_checkpoint, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (match_id)
         DO UPDATE SET mode = $2, message_checkpoint = $3, updated_at = NOW()`,
        [match_id, finalMode, finalCheckpoint]
      );
    }

    logInfo("/conversation-state", {
      userId,
      matchId: match_id,
      mode: finalMode,
      message_count,
      message_checkpoint: finalCheckpoint,
    });

    return ok({
      match_id,
      mode: finalMode,
      message_checkpoint: finalCheckpoint,
      signals,
    });
  } catch (err) {
    logError("/conversation-state", err, { sub: claims.sub });
    return internalError();
  }
}
