import type { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isString, isInt } from "../utils/validation";
import { created, badRequest, unauthorized, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

type CreateUserBody = {
  name?: string;
  age?: number;
  bio?: string;
  gender?: string;
  sexual_orientation?: string;
  interests?: string[];
  introversion_score?: number;
};

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
         name = EXCLUDED.name,
         age = EXCLUDED.age,
         bio = EXCLUDED.bio,
         gender = EXCLUDED.gender,
         sexual_orientation = EXCLUDED.sexual_orientation,
         interests = EXCLUDED.interests,
         introversion_score = EXCLUDED.introversion_score,
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