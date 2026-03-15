import type { APIGatewayProxyEvent } from "aws-lambda";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isString } from "../utils/validation";
import { ok, badRequest, unauthorized, notFound, internalError } from "../utils/response";

// { matchId: { userId: timestampMs } }
const typingStates: Record<string, Record<string, number>> = {};

const TYPING_TTL_MS = 5000;

export async function handlePostTyping(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ match_id: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { match_id } = body;
  if (!isString(match_id)) return badRequest("match_id is required");

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

    if (!typingStates[match_id]) typingStates[match_id] = {};
    typingStates[match_id][userId] = Date.now();

    return ok({ ok: true });
  } catch (err) {
    console.error("handlePostTyping error:", err);
    return internalError();
  }
}

export async function handleGetTyping(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const params = event.queryStringParameters ?? {};
  const match_id = params["match_id"];
  if (!match_id || !isString(match_id)) return badRequest("match_id query param is required");

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

    const now = Date.now();
    const matchTyping = typingStates[match_id] ?? {};
    const typing_user_ids = Object.entries(matchTyping)
      .filter(([uid, ts]) => uid !== userId && now - ts < TYPING_TTL_MS)
      .map(([uid]) => uid);

    return ok({ match_id, typing_user_ids });
  } catch (err) {
    console.error("handleGetTyping error:", err);
    return internalError();
  }
}
