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

  const radius = Math.min(
    parseInt(params["radius"] ?? String(DEFAULT_RADIUS_M), 10) || DEFAULT_RADIUS_M,
    MAX_RADIUS_M
  );
  const limit = Math.min(
    parseInt(params["limit"] ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    MAX_LIMIT
  );
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
    const myGeom = locationResult.rows[0].geom;

    const nearbyResult = await db.query(
      `SELECT
         u.id,
         u.name,
         u.age,
         u.bio,
         u.interests,
         u.introversion_score,
         l.latitude,
         l.longitude,
         ROUND(ST_Distance(l.geom, $2::geography)::numeric) AS distance_m,
         p.image_url AS profile_photo_url
       FROM locations l
       JOIN users u ON u.id = l.user_id
       LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_photo = TRUE
       WHERE l.user_id <> $1
         AND ST_DWithin(l.geom, $2::geography, $3)
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
       ORDER BY l.geom <-> $2::geography
       LIMIT $4 OFFSET $5`,
      [userId, myGeom, radius, limit, offset]
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
