import type { APIGatewayProxyEvent } from "aws-lambda";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { ok, badRequest, unauthorized, notFound, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

const DEFAULT_RADIUS_M = 5000;
const MAX_RADIUS_M = 50000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function handleGetNearby(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const params = event.queryStringParameters ?? {};

  const radius = Math.min(Math.max(parseInt(params["radius"] ?? "0", 10) || DEFAULT_RADIUS_M, 1), MAX_RADIUS_M);
  const limit  = Math.min(Math.max(parseInt(params["limit"]  ?? "0", 10) || DEFAULT_LIMIT,   1), MAX_LIMIT);
  const offset = Math.max(parseInt(params["offset"] ?? "0", 10) || 0, 0);

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) {
      return notFound("User profile not found. Call POST /users first.");
    }
    const userId: string = userResult.rows[0].id;

    logInfo("/nearby", { userId, radius, limit, offset });

    const locationResult = await db.query(
      "SELECT geom FROM locations WHERE user_id = $1",
      [userId]
    );
    if (locationResult.rowCount === 0) {
      return badRequest("Your location is not set. Call POST /location first.");
    }

    // Discovery query:
    // 1. CTE `me` loads the caller's profile fields needed for scoring / filtering.
    // 2. Inner subquery applies:
    //    - PostGIS radius filter
    //    - orientation compatibility (hard filter, both directions)
    //    - standard exclusions (self, already-liked, liked-me, matched)
    //    - computes interest, introversion, and distance scores via LATERAL
    // 3. Outer SELECT adds final_score and orders results.
    const nearbyResult = await db.query(
      `WITH me AS (
         SELECT u.id,
                u.gender,
                u.sexual_orientation,
                COALESCE(u.interests, '{}') AS interests,
                u.introversion_score,
                l.geom
         FROM users u
         JOIN locations l ON l.user_id = u.id
         WHERE u.id = $1
       )
       SELECT
         sub.id,
         sub.name,
         sub.age,
         sub.bio,
         sub.gender,
         sub.sexual_orientation,
         sub.interests,
         sub.introversion_score,
         sub.latitude,
         sub.longitude,
         sub.profile_photo_url,
         sub.distance_m,
         sub.common_interests_count,
         sub.total_unique_interests_count,
         ROUND(sub.interest_score::numeric,          4)::float AS interest_score,
         ROUND(sub.introversion_similarity::numeric, 4)::float AS introversion_similarity,
         ROUND(sub.distance_score::numeric,          4)::float AS distance_score,
         ROUND(
           (0.50 * sub.interest_score +
            0.30 * sub.distance_score +
            0.20 * sub.introversion_similarity)::numeric,
           4
         )::float AS final_score
       FROM (
         SELECT
           u.id,
           u.name,
           u.age,
           u.bio,
           u.gender,
           u.sexual_orientation,
           u.interests,
           u.introversion_score,
           l.latitude,
           l.longitude,
           p.image_url AS profile_photo_url,
           ROUND(ST_Distance(l.geom, me.geom)::numeric) AS distance_m,

           istat.common_count                          AS common_interests_count,
           istat.union_count                           AS total_unique_interests_count,

           CASE
             WHEN istat.union_count = 0 THEN 0.0
             ELSE istat.common_count::float / istat.union_count::float
           END AS interest_score,

           CASE
             WHEN me.introversion_score IS NULL OR u.introversion_score IS NULL THEN 0.0
             ELSE GREATEST(0.0, LEAST(1.0,
               1.0 - ABS(me.introversion_score - u.introversion_score) / 100.0
             ))
           END AS introversion_similarity,

           GREATEST(0.0, LEAST(1.0,
             1.0 - ST_Distance(l.geom, me.geom) / $2::float
           )) AS distance_score

         FROM locations l
         JOIN users u ON u.id = l.user_id
         CROSS JOIN me
         LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_photo = TRUE

         -- Interest stats computed once per row via LATERAL
         CROSS JOIN LATERAL (
           SELECT
             COALESCE(CARDINALITY(ARRAY(
               SELECT UNNEST(COALESCE(u.interests, '{}'))
               INTERSECT
               SELECT UNNEST(me.interests)
             )), 0) AS common_count,
             COALESCE(CARDINALITY(ARRAY(
               SELECT UNNEST(COALESCE(u.interests, '{}'))
               UNION
               SELECT UNNEST(me.interests)
             )), 0) AS union_count
         ) istat

         WHERE l.user_id <> $1
           AND ST_DWithin(l.geom, me.geom, $2)

           -- ── Orientation compatibility (hard filter, both directions) ──────
           -- All four fields must be present; missing data means excluded.
           AND u.gender              IS NOT NULL
           AND u.sexual_orientation  IS NOT NULL
           AND me.gender             IS NOT NULL
           AND me.sexual_orientation IS NOT NULL

           -- I am interested in their gender
           AND (
             (me.sexual_orientation = 'male'   AND u.gender = 'male'  ) OR
             (me.sexual_orientation = 'female' AND u.gender = 'female') OR
              me.sexual_orientation = 'both'
           )

           -- They are interested in my gender
           AND (
             (u.sexual_orientation = 'male'   AND me.gender = 'male'  ) OR
             (u.sexual_orientation = 'female' AND me.gender = 'female') OR
              u.sexual_orientation = 'both'
           )

           -- ── Standard exclusions ───────────────────────────────────────────
           AND l.user_id NOT IN (
             SELECT liked_user_id FROM likes WHERE user_id = $1
           )
           AND l.user_id NOT IN (
             SELECT user_id FROM likes WHERE liked_user_id = $1
           )
           AND l.user_id NOT IN (
             SELECT CASE WHEN user_a = $1 THEN user_b ELSE user_a END
             FROM matches WHERE user_a = $1 OR user_b = $1
           )
       ) sub
       ORDER BY final_score DESC, distance_m ASC
       LIMIT $3 OFFSET $4`,
      [userId, radius, limit, offset]
    );

    return ok({
      radius_m: radius,
      limit,
      offset,
      count: nearbyResult.rows.length,
      users: nearbyResult.rows,
    });
  } catch (err) {
    logError("/nearby", err, { sub: claims.sub });
    return internalError();
  }
}
