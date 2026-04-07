import type { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isUUID } from "../utils/validation";
import { ok, created, badRequest, unauthorized, notFound, tooManyRequests, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

const s3     = new S3Client({ region: process.env["AWS_REGION"] ?? "eu-north-1" });
const BUCKET = process.env["S3_BUCKET"] ?? "";

export async function handleLike(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ liked_user_id: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { liked_user_id } = body;
  if (!isUUID(liked_user_id)) return badRequest("liked_user_id must be a valid UUID");

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
         p.image_url AS profile_photo_key,
         last_msg.message_text AS last_message,
         last_msg.created_at  AS last_message_time,
         (
           SELECT COUNT(*)
           FROM messages msg
           WHERE msg.match_id   = m.id
             AND msg.sender_id != $1
             AND msg.deleted_at IS NULL
             AND msg.created_at > COALESCE(
               (SELECT last_read_at FROM match_reads WHERE match_id = m.id AND user_id = $1),
               '1970-01-01'::timestamptz
             )
         )::int AS unread_count
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
           AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1
       ) last_msg ON TRUE
       WHERE m.user_a = $1 OR m.user_b = $1
       ORDER BY COALESCE(last_msg.created_at, m.created_at) DESC`,
      [userId]
    );

    // Generate presigned URLs for profile photos
    const matches = await Promise.all(
      result.rows.map(async (row) => {
        let profile_photo_url: string | null = null;
        if (row.profile_photo_key && BUCKET) {
          try {
            const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: row.profile_photo_key });
            profile_photo_url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
          } catch {
            // leave null if signing fails
          }
        }
        const { profile_photo_key: _, ...rest } = row;
        return { ...rest, profile_photo_url };
      })
    );

    return ok({ count: matches.length, matches });
  } catch (err) {
    logError("/matches", err, { sub: claims.sub });
    return internalError();
  }
}
