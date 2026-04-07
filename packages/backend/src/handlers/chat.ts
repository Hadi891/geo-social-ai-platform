import type { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isString, isUUID, isValidTimestamp } from "../utils/validation";
import { ok, created, badRequest, unauthorized, notFound, forbidden, internalError } from "../utils/response";
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
  const method: string = event.httpMethod ?? (event as any).requestContext?.http?.method ?? "";
  if (method === "POST") return handleSendMessage(event);
  if (method === "GET")  return handleGetMessages(event);
  return badRequest("Method not allowed");
}

export async function handleSendMessage(event: APIGatewayProxyEvent) {
  return sendMessage(event);
}

export async function handleGetMessages(event: APIGatewayProxyEvent) {
  return getMessages(event);
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
      `SELECT
         id,
         match_id,
         sender_id,
         CASE WHEN deleted_at IS NOT NULL THEN NULL ELSE message_text END AS message_text,
         message_type,
         created_at,
         updated_at,
         deleted_at,
         (deleted_at IS NOT NULL) AS is_deleted,
         (updated_at IS NOT NULL) AS is_edited
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

// ─── PATCH /chat/message ──────────────────────────────────────────────────────

export async function handleEditMessage(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ message_id: string; message_text: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { message_id, message_text } = body;
  if (!isUUID(message_id)) return badRequest("message_id must be a valid UUID");
  if (!isString(message_text)) return badRequest("message_text must be a non-empty string");

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    // Fetch message and verify the caller is in the match (JOIN enforces it)
    const msgResult = await db.query(
      `SELECT m.id, m.sender_id, m.message_type, m.deleted_at
       FROM messages m
       JOIN matches ma ON ma.id = m.match_id AND (ma.user_a = $2 OR ma.user_b = $2)
       WHERE m.id = $1`,
      [message_id, userId]
    );
    if (msgResult.rowCount === 0) return notFound("Message not found.");

    const msg = msgResult.rows[0];
    if (msg.sender_id !== userId) return forbidden("You can only edit your own messages.");
    if (msg.message_type !== "text") return badRequest("Only text messages can be edited.");
    if (msg.deleted_at !== null) return badRequest("Cannot edit a deleted message.");

    logInfo("/chat/message PATCH", { userId, messageId: message_id });

    await db.query(
      "UPDATE messages SET message_text = $1, updated_at = NOW() WHERE id = $2",
      [message_text, message_id]
    );

    return ok({ ok: true });
  } catch (err) {
    logError("/chat/message PATCH", err, { sub: claims.sub });
    return internalError();
  }
}

// ─── DELETE /chat/message ─────────────────────────────────────────────────────

export async function handleDeleteMessage(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ message_id: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { message_id } = body;
  if (!isUUID(message_id)) return badRequest("message_id must be a valid UUID");

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    // Fetch message and verify the caller is in the match (JOIN enforces it)
    const msgResult = await db.query(
      `SELECT m.id, m.sender_id, m.deleted_at
       FROM messages m
       JOIN matches ma ON ma.id = m.match_id AND (ma.user_a = $2 OR ma.user_b = $2)
       WHERE m.id = $1`,
      [message_id, userId]
    );
    if (msgResult.rowCount === 0) return notFound("Message not found.");

    const msg = msgResult.rows[0];
    if (msg.sender_id !== userId) return forbidden("You can only delete your own messages.");
    if (msg.deleted_at !== null) return badRequest("Message is already deleted.");

    logInfo("/chat/message DELETE", { userId, messageId: message_id });

    await db.query(
      "UPDATE messages SET deleted_at = NOW() WHERE id = $1",
      [message_id]
    );

    return ok({ ok: true });
  } catch (err) {
    logError("/chat/message DELETE", err, { sub: claims.sub });
    return internalError();
  }
}
