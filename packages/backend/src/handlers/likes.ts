import type { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isString } from "../utils/validation";
import { ok, created, badRequest, unauthorized, notFound, tooManyRequests, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

export async function handleLike(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ liked_user_id: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { liked_user_id } = body;
  if (!isString(liked_user_id)) return badRequest("liked_user_id is required");

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    if (userId === liked_user_id) return badRequest("You cannot like yourself");

    logInfo("/like", { userId, likedUserId: liked_user_id });

    // Rate limit: max 100 likes per 24 hours
    const rateLimitResult = await db.query(
      "SELECT COUNT(*) FROM likes WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day'",
      [userId]
    );
    if (parseInt(rateLimitResult.rows[0].count, 10) >= 100) {
      return tooManyRequests("Like limit reached. You can send up to 100 likes per 24 hours.");
    }

    // Verify the liked user exists
    const likedUserResult = await db.query(
      "SELECT id FROM users WHERE id = $1",
      [liked_user_id]
    );
    if (likedUserResult.rowCount === 0) return notFound("Liked user not found.");

    // Insert like (ignore if already liked)
    await db.query(
      `INSERT INTO likes (user_id, liked_user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, liked_user_id]
    );

    // Check if the other user already liked back
    const mutualResult = await db.query(
      "SELECT 1 FROM likes WHERE user_id = $1 AND liked_user_id = $2",
      [liked_user_id, userId]
    );

    const isMatch = (mutualResult.rowCount ?? 0) > 0;

    if (isMatch) {
      // Order UUIDs to satisfy UNIQUE(user_a, user_b) constraint
      const [userA, userB] = userId < liked_user_id
        ? [userId, liked_user_id]
        : [liked_user_id, userId];

      const matchResult = await db.query(
        `INSERT INTO matches (id, user_a, user_b)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_a, user_b) DO NOTHING
         RETURNING id`,
        [uuidv4(), userA, userB]
      );

      const matchId: string | null = matchResult.rows[0]?.id ?? null;
      return created({ match: true, match_id: matchId });
    }

    return ok({ match: false });
  } catch (err) {
    logError("/like", err, { sub: claims.sub });
    return internalError();
  }
}

export async function handleGetMatches(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    logInfo("/matches", { userId });

    const result = await db.query(
      `SELECT
         m.id AS match_id,
         m.created_at AS matched_at,
         u.id,
         u.name,
         u.age,
         u.bio,
         u.interests,
         p.image_url AS profile_photo_url,
         last_msg.message_text AS last_message,
         last_msg.created_at AS last_message_time
       FROM matches m
       JOIN users u ON u.id = CASE
         WHEN m.user_a = $1 THEN m.user_b
         ELSE m.user_a
       END
       LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_photo = TRUE
       LEFT JOIN LATERAL (
         SELECT message_text, created_at
         FROM messages
         WHERE match_id = m.id
         ORDER BY created_at DESC
         LIMIT 1
       ) last_msg ON TRUE
       WHERE m.user_a = $1 OR m.user_b = $1
       ORDER BY COALESCE(last_msg.created_at, m.created_at) DESC`,
      [userId]
    );

    return ok({
      count: result.rows.length,
      matches: result.rows,
    });
  } catch (err) {
    logError("/matches", err, { sub: claims.sub });
    return internalError();
  }
}
