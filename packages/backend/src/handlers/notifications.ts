import type { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { ok, unauthorized, notFound, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

const s3 = new S3Client({ region: process.env["AWS_REGION"] ?? "eu-north-1" });
const BUCKET = process.env["S3_BUCKET"] ?? "";

async function signPhoto(key: string | null): Promise<string | null> {
  if (!key || !BUCKET) return null;
  try {
    return await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
  } catch {
    return null;
  }
}

// ── GET /notifications ───────────────────────────────────────────────────────
// Returns:
//   matches[]  – the user's matches (for the top "New Matches" section)
//   activities[] – recent activity: profile likes, post likes, post comments, new matches

export async function handleGetNotifications(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub],
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    logInfo("/notifications", { userId });

    // ── 1. Matches (top row: avatars) ──────────────────────────────────────
    const matchesResult = await db.query(
      `SELECT
         m.id AS match_id,
         m.created_at,
         u.id AS user_id,
         u.name,
         p.image_url AS photo_key
       FROM matches m
       JOIN users u ON u.id = CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END
       LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_photo = TRUE
       WHERE m.user_a = $1 OR m.user_b = $1
       ORDER BY m.created_at DESC
       LIMIT 20`,
      [userId],
    );

    const matches = await Promise.all(
      matchesResult.rows.map(async (r: any) => ({
        match_id: r.match_id,
        user_id: r.user_id,
        name: r.name,
        avatar_url: await signPhoto(r.photo_key),
      })),
    );

    // ── 2. Activities ──────────────────────────────────────────────────────
    // We UNION four queries into one ordered list, capped at 50 items.

    const activitiesResult = await db.query(
      `SELECT * FROM (
        (
          SELECT
            'like_profile'::text AS type,
            l.user_id AS actor_id,
            u.name   AS actor_name,
            p.image_url AS actor_photo_key,
            NULL::text  AS extra_text,
            NULL::uuid  AS ref_id,
            l.created_at
          FROM likes l
          JOIN users u ON u.id = l.user_id
          LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_photo = TRUE
          WHERE l.liked_user_id = $1
          ORDER BY l.created_at DESC
          LIMIT 20
        )
        UNION ALL
        (
          SELECT
            'like_post'::text AS type,
            pl.user_id  AS actor_id,
            u.name      AS actor_name,
            p.image_url AS actor_photo_key,
            NULL::text  AS extra_text,
            pl.post_id  AS ref_id,
            pl.created_at
          FROM post_likes pl
          JOIN posts po ON po.id = pl.post_id AND po.author_id = $1
          JOIN users u ON u.id = pl.user_id
          LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_photo = TRUE
          WHERE pl.user_id != $1
          ORDER BY pl.created_at DESC
          LIMIT 20
        )
        UNION ALL
        (
          SELECT
            'comment'::text AS type,
            pc.author_id AS actor_id,
            u.name       AS actor_name,
            p.image_url  AS actor_photo_key,
            pc.content   AS extra_text,
            pc.post_id   AS ref_id,
            pc.created_at
          FROM post_comments pc
          JOIN posts po ON po.id = pc.post_id AND po.author_id = $1
          JOIN users u ON u.id = pc.author_id
          LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_photo = TRUE
          WHERE pc.author_id != $1
          ORDER BY pc.created_at DESC
          LIMIT 20
        )
        UNION ALL
        (
          SELECT
            'match'::text AS type,
            u.id    AS actor_id,
            u.name  AS actor_name,
            p.image_url AS actor_photo_key,
            NULL::text AS extra_text,
            m.id       AS ref_id,
            m.created_at
          FROM matches m
          JOIN users u ON u.id = CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END
          LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_photo = TRUE
          WHERE m.user_a = $1 OR m.user_b = $1
          ORDER BY m.created_at DESC
          LIMIT 20
        )
      ) combined
      ORDER BY created_at DESC
      LIMIT 50`,
      [userId],
    );

    const activities = await Promise.all(
      activitiesResult.rows.map(async (r: any) => ({
        type: r.type,
        actor_id: r.actor_id,
        actor_name: r.actor_name,
        actor_avatar_url: await signPhoto(r.actor_photo_key),
        extra_text: r.extra_text,
        ref_id: r.ref_id,
        created_at: r.created_at,
      })),
    );

    return ok({ matches, activities });
  } catch (err) {
    logError("/notifications", err, { sub: claims.sub });
    return internalError();
  }
}

// ── GET /notifications/liker-profile ─────────────────────────────────────────
// Returns full profile of a user who liked me (for the popup)

export async function handleGetLikerProfile(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const likerId = event.queryStringParameters?.["liker_id"]
    ?? (event as any).queryStringParameters?.["liker_id"];
  if (!likerId) return notFound("liker_id query param required");

  try {
    const meResult = await db.query(
      "SELECT id, interests, introversion_score FROM users WHERE cognito_sub = $1",
      [claims.sub],
    );
    if (meResult.rowCount === 0) return notFound("User profile not found.");
    const me = meResult.rows[0];

    const likerResult = await db.query(
      `SELECT u.id, u.name, u.age, u.bio, u.interests, u.introversion_score,
              p.image_url AS photo_key
       FROM users u
       LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_photo = TRUE
       WHERE u.id = $1`,
      [likerId],
    );
    if (likerResult.rowCount === 0) return notFound("User not found.");
    const liker = likerResult.rows[0];

    // Compute distance if both have locations
    const distResult = await db.query(
      `SELECT ST_Distance(a.geom::geography, b.geom::geography) AS dist_m
       FROM locations a, locations b
       WHERE a.user_id = $1 AND b.user_id = $2`,
      [me.id, liker.id],
    );
    const distance_m = distResult.rows[0]?.dist_m ?? null;

    // Compute shared interests
    const myInterests: string[] = me.interests ?? [];
    const likerInterests: string[] = liker.interests ?? [];
    const commonInterests = myInterests.filter((i: string) => likerInterests.includes(i));
    const otherInterests = likerInterests.filter((i: string) => !commonInterests.includes(i));

    // Simple compatibility score: shared interests weight + introversion proximity
    const interestScore = myInterests.length > 0
      ? (commonInterests.length / Math.max(myInterests.length, likerInterests.length)) * 70
      : 35;
    const introMe = me.introversion_score ?? 50;
    const introLiker = liker.introversion_score ?? 50;
    const introDiff = Math.abs(introMe - introLiker);
    const introScore = Math.max(0, 30 - introDiff * 0.3);
    const compatibility = Math.round(Math.min(100, interestScore + introScore));

    const avatar_url = await signPhoto(liker.photo_key);

    return ok({
      id: liker.id,
      name: liker.name,
      age: liker.age,
      bio: liker.bio,
      avatar_url,
      distance_m,
      common_interests: commonInterests,
      other_interests: otherInterests,
      compatibility,
    });
  } catch (err) {
    logError("/notifications/liker-profile", err, { sub: claims.sub });
    return internalError();
  }
}
