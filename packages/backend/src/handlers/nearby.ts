import type { APIGatewayProxyEvent } from "aws-lambda";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { ok, badRequest, unauthorized, notFound, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

const DEFAULT_RADIUS_M = 5000;
const MAX_RADIUS_M     = 50000;
const DEFAULT_LIMIT    = 20;
const MAX_LIMIT        = 100;

const VALID_GENDERS      = new Set(["male", "female"]);
const VALID_ORIENTATIONS = new Set(["male", "female", "both"]);

type OrientFilter =
  | { type: "none" }                    // no restriction
  | { type: "exact"; value: string }    // u.sexual_orientation = value
  | { type: "accepts_male" }            // u.sexual_orientation IN ('male', 'both')
  | { type: "accepts_female" };         // u.sexual_orientation IN ('female', 'both')

export async function handleGetNearby(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const params = event.queryStringParameters ?? {};

  // ── Pagination / radius ────────────────────────────────────────────────────
  const radius = Math.min(
    Math.max(parseInt(params["radius"] ?? "0", 10) || DEFAULT_RADIUS_M, 1),
    MAX_RADIUS_M
  );
  const limit = Math.min(
    Math.max(parseInt(params["limit"] ?? "0", 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const offset = Math.max(parseInt(params["offset"] ?? "0", 10) || 0, 0);

  // ── Compatibility mode (default: true) ────────────────────────────────────
  const useCompatRaw    = params["use_compatibility"];
  const useCompatibility =
    useCompatRaw === undefined
      ? true
      : useCompatRaw !== "false" && useCompatRaw !== "0";

  // ── Age filter (optional) ─────────────────────────────────────────────────
  const minAgeRaw = params["min_age"];
  const maxAgeRaw = params["max_age"];
  const minAge    = minAgeRaw !== undefined ? parseInt(minAgeRaw, 10) : null;
  const maxAge    = maxAgeRaw !== undefined ? parseInt(maxAgeRaw, 10) : null;

  if (minAge !== null && (isNaN(minAge) || minAge < 0)) {
    return badRequest("min_age must be a non-negative integer.");
  }
  if (maxAge !== null && (isNaN(maxAge) || maxAge < 0)) {
    return badRequest("max_age must be a non-negative integer.");
  }
  if (minAge !== null && maxAge !== null && minAge > maxAge) {
    return badRequest("min_age cannot be greater than max_age.");
  }

  // ── Gender / orientation raw params ───────────────────────────────────────
  // Absent  → apply default inference.
  // "none" or "" → explicitly clear the filter.
  // Valid value  → apply that exact filter.
  const genderParam = params["gender"];
  const orientParam = params["sexual_orientation"];

  if (
    genderParam !== undefined &&
    genderParam !== "" &&
    genderParam !== "none" &&
    !VALID_GENDERS.has(genderParam)
  ) {
    return badRequest('gender must be "male", "female", "none", or omitted.');
  }
  if (
    orientParam !== undefined &&
    orientParam !== "" &&
    orientParam !== "none" &&
    !VALID_ORIENTATIONS.has(orientParam)
  ) {
    return badRequest('sexual_orientation must be "male", "female", "both", "none", or omitted.');
  }

  try {
    // ── Load caller profile + location ────────────────────────────────────
    const meResult = await db.query(
      `SELECT u.id, u.gender, u.sexual_orientation,
              COALESCE(u.interests, '{}') AS interests,
              u.introversion_score, l.geom
       FROM users u
       LEFT JOIN locations l ON l.user_id = u.id
       WHERE u.cognito_sub = $1`,
      [claims.sub]
    );

    if (meResult.rowCount === 0) {
      return notFound("User profile not found. Call POST /users first.");
    }
    const me = meResult.rows[0];
    if (!me.geom) {
      return badRequest("Your location is not set. Call POST /location first.");
    }
    const userId: string = me.id;

    logInfo("/nearby", { userId, radius, limit, offset, useCompatibility });

    // ── Resolve gender filter for candidates ──────────────────────────────
    // null = no restriction; string = u.gender must equal this value
    let genderFilter: string | null;
    if (genderParam !== undefined) {
      // Explicit override (including clear)
      genderFilter = genderParam === "" || genderParam === "none" ? null : genderParam;
    } else {
      // Default: infer from my sexual_orientation
      if (me.sexual_orientation === "male") {
        genderFilter = "male";
      } else if (me.sexual_orientation === "female") {
        genderFilter = "female";
      } else {
        genderFilter = null; // 'both' or unknown → no gender restriction
      }
    }

    // ── Resolve sexual_orientation filter for candidates ──────────────────
    // Default: must be compatible with my gender (i.e., interested in me)
    let orientFilter: OrientFilter;
    if (orientParam !== undefined) {
      if (orientParam === "" || orientParam === "none") {
        orientFilter = { type: "none" };
      } else {
        orientFilter = { type: "exact", value: orientParam };
      }
    } else {
      if (me.gender === "male") {
        orientFilter = { type: "accepts_male" };
      } else if (me.gender === "female") {
        orientFilter = { type: "accepts_female" };
      } else {
        orientFilter = { type: "none" };
      }
    }

    // ── Build dynamic WHERE additions ─────────────────────────────────────
    // $1 = userId, $2 = radius, $3 = limit, $4 = offset; extras start at $5
    const extraWhere: string[] = [];
    const queryArgs: unknown[]  = [userId, radius, limit, offset];
    let p = 5;

    if (genderFilter !== null) {
      extraWhere.push(`u.gender = $${p++}`);
      queryArgs.push(genderFilter);
    }

    if (orientFilter.type === "exact") {
      extraWhere.push(`u.sexual_orientation = $${p++}`);
      queryArgs.push(orientFilter.value);
    } else if (orientFilter.type === "accepts_male") {
      extraWhere.push(`u.sexual_orientation IN ('male', 'both')`);
    } else if (orientFilter.type === "accepts_female") {
      extraWhere.push(`u.sexual_orientation IN ('female', 'both')`);
    }

    if (minAge !== null) {
      extraWhere.push(`u.age >= $${p++}`);
      queryArgs.push(minAge);
    }
    if (maxAge !== null) {
      extraWhere.push(`u.age <= $${p++}`);
      queryArgs.push(maxAge);
    }

    const extraWhereSQL = extraWhere.map(c => `AND ${c}`).join("\n          ");

    // ── Build compatibility-dependent query fragments ──────────────────────
    const compatOuterSelect = useCompatibility
      ? `,
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
        )::float AS final_score`
      : `,
        NULL::int   AS common_interests_count,
        NULL::int   AS total_unique_interests_count,
        NULL::float AS interest_score,
        NULL::float AS introversion_similarity,
        NULL::float AS distance_score,
        NULL::float AS final_score`;

    const compatInnerSelect = useCompatibility
      ? `,
          istat.common_count AS common_interests_count,
          istat.union_count  AS total_unique_interests_count,

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
          )) AS distance_score`
      : "";

    const compatLateral = useCompatibility
      ? `CROSS JOIN LATERAL (
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
         ) istat`
      : "";

    const orderBy = useCompatibility
      ? "ORDER BY final_score DESC, distance_m ASC"
      : "ORDER BY distance_m ASC";

    // ── Execute discovery query ───────────────────────────────────────────
    const sql = `
      WITH me AS (
        SELECT u.id,
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
        sub.distance_m${compatOuterSelect}
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
          ROUND(ST_Distance(l.geom, me.geom)::numeric) AS distance_m${compatInnerSelect}

        FROM locations l
        JOIN users u ON u.id = l.user_id
        CROSS JOIN me
        LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_photo = TRUE
        ${compatLateral}

        WHERE l.user_id <> $1
          AND ST_DWithin(l.geom, me.geom, $2)
          ${extraWhereSQL}

          -- ── Standard exclusions ──────────────────────────────────────────
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
      ${orderBy}
      LIMIT $3 OFFSET $4`;

    const nearbyResult = await db.query(sql, queryArgs);

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
