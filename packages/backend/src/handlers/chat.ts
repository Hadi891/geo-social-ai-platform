import type { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isString, isUUID, isValidTimestamp } from "../utils/validation";
import { ok, created, badRequest, unauthorized, notFound, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

type SendMessageBody = {
  match_id: string;
  message_text: string;
  message_type?: string;
};

type GetMessagesQuery = {
  match_id?: string;
  limit?: string;
  before?: string; // ISO timestamp for pagination
};

const ALLOWED_MESSAGE_TYPES = ["text", "image", "ai_suggestion"];

export async function handleChat(event: APIGatewayProxyEvent) {
  if (event.httpMethod === "POST") return sendMessage(event);
  if (event.httpMethod === "GET") return getMessages(event);
  return badRequest("Method not allowed");
}

async function sendMessage(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<SendMessageBody>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { match_id, message_text, message_type = "text" } = body;

  if (!isUUID(match_id)) return badRequest("match_id must be a valid UUID");
  if (!isString(message_text)) return badRequest("message_text is required");
  if (!ALLOWED_MESSAGE_TYPES.includes(message_type)) {
    return badRequest(`message_type must be one of: ${ALLOWED_MESSAGE_TYPES.join(", ")}`);
  }

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    logInfo("/chat", { userId, matchId: match_id, messageType: message_type });

    // Verify user is part of the match (returns nothing if not)
    const matchResult = await db.query(
      "SELECT id FROM matches WHERE id = $1 AND (user_a = $2 OR user_b = $2)",
      [match_id, userId]
    );
    if (matchResult.rowCount === 0) {
      return notFound("Match not found or you are not part of this match.");
    }

    const result = await db.query(
      `INSERT INTO messages (id, match_id, sender_id, message_text, message_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, match_id, sender_id, message_text, message_type, created_at`,
      [uuidv4(), match_id, userId, message_text, message_type]
    );

    return created(result.rows[0]);
  } catch (err) {
    logError("/chat", err, { sub: claims.sub });
    return internalError();
  }
}

async function getMessages(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const params = (event.queryStringParameters ?? {}) as GetMessagesQuery;
  const { match_id, limit: limitStr, before } = params;

  if (!isUUID(match_id)) return badRequest("match_id must be a valid UUID");
  if (before !== undefined && !isValidTimestamp(before)) return badRequest("before must be a valid ISO timestamp");

  const limit = Math.min(Math.max(parseInt(limitStr ?? "30", 10) || 30, 1), 100);

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    logInfo("/chat", { userId, matchId: match_id, limit, before: before ?? null });

    const matchResult = await db.query(
      "SELECT id FROM matches WHERE id = $1 AND (user_a = $2 OR user_b = $2)",
      [match_id, userId]
    );
    if (matchResult.rowCount === 0) {
      return notFound("Match not found or you are not part of this match.");
    }

    const result = await db.query(
      `SELECT id, match_id, sender_id, message_text, message_type, created_at
       FROM messages
       WHERE match_id = $1
         AND ($2::timestamp IS NULL OR created_at < $2)
       ORDER BY created_at DESC
       LIMIT $3`,
      [match_id, before ?? null, limit]
    );

    return ok({
      match_id,
      count: result.rows.length,
      messages: result.rows.reverse(), // oldest first
    });
  } catch (err) {
    logError("/chat", err, { sub: claims.sub });
    return internalError();
  }
}

export async function handleMarkRead(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ matchId: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { matchId } = body;
  if (!isUUID(matchId)) return badRequest("matchId must be a valid UUID");

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    const matchResult = await db.query(
      "SELECT id FROM matches WHERE id = $1 AND (user_a = $2 OR user_b = $2)",
      [matchId, userId]
    );
    if (matchResult.rowCount === 0) {
      return notFound("Match not found or you are not part of this match.");
    }

    logInfo("/chat/read", { userId, matchId });

    await db.query(
      `INSERT INTO match_reads (match_id, user_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (match_id, user_id)
       DO UPDATE SET last_read_at = NOW()`,
      [matchId, userId]
    );

    return ok({ ok: true });
  } catch (err) {
    logError("/chat/read", err, { sub: claims.sub });
    return internalError();
  }
}
