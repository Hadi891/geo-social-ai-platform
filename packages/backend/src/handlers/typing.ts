import type { APIGatewayProxyEvent } from "aws-lambda";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isUUID } from "../utils/validation";
import { ok, badRequest, unauthorized, notFound, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

// { matchId: { userId: timestampMs } }
const typingStates: Record<string, Record<string, number>> = {};

const TYPING_TTL_MS = 5000;

export async function handlePostTyping(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ match_id: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { match_id } = body;
  if (!isUUID(match_id)) return badRequest("match_id must be a valid UUID");

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

    logInfo("/chat/typing", { userId, matchId: match_id });

    if (!typingStates[match_id]) typingStates[match_id] = {};
    typingStates[match_id][userId] = Date.now();

    return ok({ ok: true });
  } catch (err) {
    logError("/chat/typing", err, { sub: claims.sub });
    return internalError();
  }
}

export async function handleGetTyping(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const params = event.queryStringParameters ?? {};
  const match_id = params["match_id"];
  if (!isUUID(match_id)) return badRequest("match_id must be a valid UUID");

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    logInfo("/chat/typing", { userId, matchId: match_id });

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
    logError("/chat/typing", err, { sub: claims.sub });
    return internalError();
  }
}
