import type { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isString, isInt } from "../utils/validation";
import { ok, created, badRequest, unauthorized, notFound, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

export async function handleSavePhoto(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ image_url: string }>(event.body);
  if (!body || !isString(body.image_url)) return badRequest("image_url is required");

  try {
    const userResult = await db.query("SELECT id FROM users WHERE cognito_sub = $1", [claims.sub]);
    if (userResult.rowCount === 0) return notFound("User profile not found");
    const userId = userResult.rows[0].id;

    await db.query(
      `INSERT INTO photos (id, user_id, image_url, is_profile_photo, position)
       VALUES ($1, $2, $3, TRUE, 0)
       ON CONFLICT ON CONSTRAINT one_profile_photo_per_user
       DO NOTHING`,
      [uuidv4(), userId, body.image_url]
    );

    // Update via UPDATE in case ON CONFLICT DO NOTHING skipped the insert
    await db.query(
      `UPDATE photos SET image_url = $1 WHERE user_id = $2 AND is_profile_photo = TRUE`,
      [body.image_url, userId]
    );

    return ok({ image_url: body.image_url });
  } catch (err) {
    logError("/photos POST", err, { sub: claims.sub });
    return internalError();
  }
}

type CreateUserBody = {
  name?: string;
  age?: number;
  bio?: string;
  gender?: string;
  sexual_orientation?: string;
  interests?: string[];
  introversion_score?: number;
};

export async function handleGetUser(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  try {
    const result = await db.query(
      `SELECT u.id, u.cognito_sub, u.email, u.name, u.age, u.bio, u.gender,
              u.sexual_orientation, u.interests, u.introversion_score, u.created_at, u.updated_at,
              p.image_url AS profile_photo_url
       FROM users u
       LEFT JOIN photos p ON p.user_id = u.id AND p.is_profile_photo = TRUE
       WHERE u.cognito_sub = $1`,
      [claims.sub]
    );

    if (result.rowCount === 0) return notFound("User profile not found");
    return ok(result.rows[0]);
  } catch (err) {
    logError("/users GET", err, { sub: claims.sub });
    return internalError();
  }
}

export async function handleCreateUser(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<CreateUserBody>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { name, age, bio, gender, sexual_orientation, interests, introversion_score } = body;

  if (name !== undefined && !isString(name)) return badRequest("name must be a non-empty string");
  if (age !== undefined && (!isInt(age) || age < 18 || age > 120)) return badRequest("age must be an integer between 18 and 120");
  if (introversion_score !== undefined && (!isInt(introversion_score) || introversion_score < 0 || introversion_score > 100)) {
    return badRequest("introversion_score must be an integer between 0 and 100");
  }

  try {
    logInfo("/users", { sub: claims.sub, email: claims.email });

    const result = await db.query(
      `INSERT INTO users (id, cognito_sub, email, name, age, bio, gender, sexual_orientation, interests, introversion_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (cognito_sub) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, users.name),
         age = COALESCE(EXCLUDED.age, users.age),
         bio = COALESCE(EXCLUDED.bio, users.bio),
         gender = COALESCE(EXCLUDED.gender, users.gender),
         sexual_orientation = COALESCE(EXCLUDED.sexual_orientation, users.sexual_orientation),
         interests = COALESCE(EXCLUDED.interests, users.interests),
         introversion_score = COALESCE(EXCLUDED.introversion_score, users.introversion_score),
         updated_at = NOW()
       RETURNING id, cognito_sub, email, name, age, bio, gender, sexual_orientation, interests, introversion_score, created_at, updated_at`,
      [
        uuidv4(),
        claims.sub,
        claims.email,
        name ?? null,
        age ?? null,
        bio ?? null,
        gender ?? null,
        sexual_orientation ?? null,
        interests ?? null,
        introversion_score ?? 50,
      ]
    );

    return created(result.rows[0]);
  } catch (err) {
    logError("/users", err, { sub: claims.sub });
    return internalError();
  }
}