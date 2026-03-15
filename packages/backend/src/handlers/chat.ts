import type { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isString } from "../utils/validation";
import { ok, created, badRequest, unauthorized, notFound, internalError } from "../utils/response";

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

  if (!isString(match_id)) return badRequest("match_id is required");
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
    console.error("sendMessage error:", err);
    return internalError();
  }
}

async function getMessages(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const params = (event.queryStringParameters ?? {}) as GetMessagesQuery;
  const { match_id, limit: limitStr, before } = params;

  if (!match_id || !isString(match_id)) return badRequest("match_id query param is required");

  const limit = Math.min(parseInt(limitStr ?? "50", 10) || 50, 100);

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

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
         ${before ? "AND created_at < $3" : ""}
       ORDER BY created_at DESC
       LIMIT $2`,
      before ? [match_id, limit, before] : [match_id, limit]
    );

    return ok({
      match_id,
      count: result.rows.length,
      messages: result.rows.reverse(), // oldest first
    });
  } catch (err) {
    console.error("getMessages error:", err);
    return internalError();
  }
}
