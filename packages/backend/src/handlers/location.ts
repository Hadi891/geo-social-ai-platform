import type { APIGatewayProxyEvent } from "aws-lambda";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody } from "../utils/validation";
import { ok, badRequest, unauthorized, notFound, internalError } from "../utils/response";

type UpdateLocationBody = {
  latitude: number;
  longitude: number;
};

function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" && typeof lng === "number" &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

export async function handleUpdateLocation(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<UpdateLocationBody>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { latitude, longitude } = body;

  if (!isValidLatLng(latitude, longitude)) {
    return badRequest("latitude must be between -90 and 90, longitude between -180 and 180");
  }

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );

    if (userResult.rowCount === 0) {
      return notFound("User profile not found. Call POST /users first.");
    }

    const userId = userResult.rows[0].id;

    await db.query(
      `INSERT INTO locations (user_id, latitude, longitude, geom, updated_at)
       VALUES ($1, $2, $3, ST_MakePoint($3, $2)::geography, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         geom = EXCLUDED.geom,
         updated_at = NOW()`,
      [userId, latitude, longitude]
    );

    return ok({ user_id: userId, latitude, longitude });
  } catch (err) {
    console.error("handleUpdateLocation error:", err);
    return internalError();
  }
}
