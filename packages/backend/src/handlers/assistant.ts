import type { APIGatewayProxyEvent } from "aws-lambda";
import OpenAI from "openai";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isString } from "../utils/validation";
import { ok, badRequest, unauthorized, notFound, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";
import { retrieveSections, formatSections } from "../assistant/retrieval";

type AssistantBody = {
  message?: string;
};

type UserProfile = {
  id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  sexual_orientation: string | null;
  interests: string[];
  introversion_score: number | null;
  bio: string | null;
  has_photo: boolean;
};

// ── Build the system prompt ───────────────────────────────────────────────────
function buildSystemPrompt(user: UserProfile, knowledgeBlock: string): string {
  const interestStr =
    user.interests.length > 0 ? user.interests.join(", ") : "none listed";

  const profileSummary = [
    user.name    ? `Name: ${user.name}`                            : null,
    user.age     ? `Age: ${user.age}`                             : null,
    user.gender  ? `Gender: ${user.gender}`                       : null,
    user.sexual_orientation ? `Interested in: ${user.sexual_orientation}` : null,
    `Interests: ${interestStr}`,
    user.introversion_score !== null
      ? `Introversion score: ${user.introversion_score}/100`      : null,
    user.bio     ? `Bio: "${user.bio}"`                           : null,
    `Profile photo: ${user.has_photo ? "uploaded" : "not uploaded yet"}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `
You are a helpful in-app assistant for a geo-social dating app.
Your role is to help users understand how the app works and offer respectful, practical guidance
on dating conversations within the app.

## What you can help with
- How the app's features work: profiles, nearby discovery, compatibility scoring, filters,
  likes, matches, chat, typing indicators, read receipts, message edit/delete, AI chat
  suggestions, posts, comments, stories, and media upload.
- Understanding the compatibility score and how the discovery feed is ranked.
- Using the AI suggestions feature in chat conversations.
- General dating-conversation guidance: how to start a conversation, keep it going,
  re-open a stalled or inactive chat, communicate respectfully.

## What you must NOT do
- Answer questions unrelated to this app or dating communication (no coding help,
  homework, medical/legal/financial advice, general trivia, etc.).
- Claim access to the user's private chat history — you do not have it.
- Invent features that do not exist in this app.
- Encourage manipulative, dishonest, or disrespectful behaviour.
- Give long-winded responses — be concise and direct.

If a question is clearly outside your scope, politely acknowledge it and redirect the user
to ask about the app or dating conversations instead.

## Current user profile
${profileSummary}

Use this context to personalise your answer where relevant (e.g. if the user asks how
compatibility works, you can reference their own interests or introversion score).
Do not repeat or expose this profile data unnecessarily.

## Relevant app knowledge
${knowledgeBlock}

Answer only based on the knowledge above and the user profile provided.
If the retrieved knowledge does not cover the question, say so honestly and suggest
what the user could try instead.
`.trim();
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function handleAssistant(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<AssistantBody>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { message } = body;
  if (!isString(message)) return badRequest("message is required and must be a non-empty string");

  try {
    // ── Load user profile ───────────────────────────────────────────────────
    const userResult = await db.query(
      `SELECT
         u.id,
         u.name,
         u.age,
         u.gender,
         u.sexual_orientation,
         COALESCE(u.interests, '{}') AS interests,
         u.introversion_score,
         u.bio,
         EXISTS (
           SELECT 1 FROM photos p
           WHERE p.user_id = u.id AND p.is_profile_photo = TRUE
         ) AS has_photo
       FROM users u
       WHERE u.cognito_sub = $1`,
      [claims.sub]
    );

    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const user: UserProfile = userResult.rows[0];

    // ── Retrieve relevant knowledge sections ────────────────────────────────
    const sections      = retrieveSections(message);
    const knowledgeBlock = formatSections(sections);
    const inScope        = sections.length > 0;

    logInfo("/assistant", {
      userId:        user.id,
      messageLength: message.length,
      inScope,
      sectionsMatched: sections.map(s => s.id),
    });

    // ── Build prompt and call OpenAI ────────────────────────────────────────
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logError("/assistant", "OPENAI_API_KEY not set", { userId: user.id });
      return internalError();
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = buildSystemPrompt(user, knowledgeBlock);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: message },
      ],
      temperature: 0.5,
      max_tokens:  400,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "Sorry, I could not generate a response.";

    return ok({ reply });
  } catch (err) {
    logError("/assistant", err, { sub: claims.sub });
    return internalError();
  }
}
