import type { APIGatewayProxyEvent } from "aws-lambda";
import {
  RekognitionClient,
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
  CompareFacesCommand,
} from "@aws-sdk/client-rekognition";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isString } from "../utils/validation";
import { ok, badRequest, unauthorized, notFound, internalError } from "../utils/response";
import { logInfo, logWarn, logError } from "../utils/logger";

// ── Config ────────────────────────────────────────────────────────────────────

const S3_BUCKET    = process.env["S3_BUCKET"]   ?? "";
const LIVENESS_THRESHOLD    = parseFloat(process.env["VERIFICATION_LIVENESS_THRESHOLD"]    ?? "80");
const FACE_MATCH_THRESHOLD  = parseFloat(process.env["VERIFICATION_FACE_MATCH_THRESHOLD"]  ?? "80");

// Rekognition Face Liveness is not available in eu-north-1.
// Use a dedicated REKOGNITION_REGION env var (set to eu-west-1 in Lambda).
const REKOGNITION_REGION = process.env["REKOGNITION_REGION"] ?? "eu-west-1";

const rekognition = new RekognitionClient({ region: REKOGNITION_REGION });
const s3 = new S3Client({});

// ── Helpers ───────────────────────────────────────────────────────────────────

// Extract S3 key from either a full https URL or a bare key
function extractS3Key(imageUrl: string): string {
  if (imageUrl.startsWith("https://")) {
    const url = new URL(imageUrl);
    return decodeURIComponent(url.pathname.slice(1)); // remove leading "/"
  }
  return imageUrl;
}

// ── POST /verification/start ──────────────────────────────────────────────────

export async function handleVerificationStart(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    // Require a profile photo to compare against
    const photoResult = await db.query(
      "SELECT image_url FROM photos WHERE user_id = $1 AND is_profile_photo = TRUE LIMIT 1",
      [userId]
    );
    if (photoResult.rowCount === 0) {
      return badRequest("You must set a profile photo before starting verification.");
    }
    const profilePhotoUrl: string = photoResult.rows[0].image_url;

    // Create Rekognition Face Liveness session.
    // No S3 OutputConfig — the reference image is returned as bytes in the
    // GetFaceLivenessSessionResults response, which avoids a cross-region
    // conflict between the Rekognition region (eu-west-1) and the S3 bucket
    // region (eu-north-1).
    const createResult = await rekognition.send(
      new CreateFaceLivenessSessionCommand({})
    );
    const sessionId = createResult.SessionId!;

    // Upsert verification row — one row per user, overwritten on each new attempt
    await db.query(
      `INSERT INTO user_verifications
         (user_id, status, profile_photo_url, liveness_session_id, updated_at)
       VALUES ($1, 'pending', $2, $3, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         status              = 'pending',
         profile_photo_url   = $2,
         liveness_session_id = $3,
         liveness_confidence = NULL,
         face_similarity     = NULL,
         reference_image_s3_key = NULL,
         verified_at         = NULL,
         rejection_reason    = NULL,
         updated_at          = NOW()`,
      [userId, profilePhotoUrl, sessionId]
    );

    logInfo("/verification/start", { userId, sessionId, status: "pending" });

    return ok({ session_id: sessionId, status: "pending" });
  } catch (err) {
    logError("/verification/start", err, { sub: claims.sub });
    return internalError();
  }
}

// ── POST /verification/complete ───────────────────────────────────────────────

export async function handleVerificationComplete(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ session_id: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { session_id } = body;
  if (!isString(session_id)) return badRequest("session_id is required");

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    // Load the user's pending verification row
    const verRow = await db.query(
      "SELECT liveness_session_id, profile_photo_url FROM user_verifications WHERE user_id = $1",
      [userId]
    );
    if (verRow.rowCount === 0) {
      return badRequest("No verification session found. Call /verification/start first.");
    }
    if (verRow.rows[0].liveness_session_id !== session_id) {
      return badRequest("session_id does not match the active verification session.");
    }
    const profilePhotoUrl: string = verRow.rows[0].profile_photo_url;

    // ── Step 1: get liveness results ──────────────────────────────────────────
    const livenessResult = await rekognition.send(
      new GetFaceLivenessSessionResultsCommand({ SessionId: session_id })
    );

    const livenessConfidence = livenessResult.Confidence ?? 0;
    const refImage = livenessResult.ReferenceImage;

    logInfo("/verification/complete", {
      userId,
      sessionId: session_id,
      livenessConfidence,
      livenessThreshold: LIVENESS_THRESHOLD,
    });

    // ── Step 2: check liveness threshold ──────────────────────────────────────
    if (livenessConfidence < LIVENESS_THRESHOLD) {
      const reason = `Liveness check failed (confidence ${livenessConfidence.toFixed(1)} < threshold ${LIVENESS_THRESHOLD})`;
      await rejectVerification(userId, livenessConfidence, null, reason);
      logWarn("/verification/complete", { userId, sessionId: session_id, status: "rejected", reason });
      return ok({ status: "rejected", liveness_confidence: livenessConfidence, face_similarity: null, reason });
    }

    if (!refImage) {
      const reason = "Liveness session completed but no reference image was produced.";
      await rejectVerification(userId, livenessConfidence, null, reason);
      return ok({ status: "rejected", liveness_confidence: livenessConfidence, face_similarity: null, reason });
    }

    // ── Step 3: CompareFaces — profile photo vs liveness reference ────────────
    // Both images are passed as raw bytes because Rekognition runs in
    // eu-west-1 while the S3 bucket is in eu-north-1 (cross-region S3
    // references are not supported by Rekognition).
    const profileKey = extractS3Key(profilePhotoUrl);

    // Download profile photo from S3 as bytes
    const profileObj = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: profileKey }));
    const profileBytes = await profileObj.Body!.transformToByteArray();

    // Build the target image from whatever Rekognition gave back
    let refImageS3Key: string | null = null;
    let targetBytes: Uint8Array;

    if (refImage.S3Object?.Name) {
      refImageS3Key = refImage.S3Object.Name;
      // Reference stored in Rekognition's own S3 — download via S3 in the Rekognition region
      const rekS3 = new S3Client({ region: REKOGNITION_REGION });
      const refObj = await rekS3.send(new GetObjectCommand({
        Bucket: refImage.S3Object.Bucket!,
        Key: refImageS3Key,
      }));
      targetBytes = await refObj.Body!.transformToByteArray();
    } else if (refImage.Bytes) {
      targetBytes = refImage.Bytes;
    } else {
      const reason = "Reference image from liveness session is not readable.";
      await rejectVerification(userId, livenessConfidence, null, reason);
      return ok({ status: "rejected", liveness_confidence: livenessConfidence, face_similarity: null, reason });
    }

    const compareResult = await rekognition.send(
      new CompareFacesCommand({
        SourceImage: { Bytes: profileBytes },
        TargetImage: { Bytes: targetBytes },
        SimilarityThreshold: 0, // fetch all matches; we apply our own threshold
      })
    );

    const faceSimilarity = compareResult.FaceMatches?.[0]?.Similarity ?? 0;

    logInfo("/verification/complete", {
      userId,
      sessionId: session_id,
      faceSimilarity,
      faceMatchThreshold: FACE_MATCH_THRESHOLD,
    });

    // ── Step 4: check face match threshold ────────────────────────────────────
    if (faceSimilarity < FACE_MATCH_THRESHOLD) {
      const reason = `Face match failed (similarity ${faceSimilarity.toFixed(1)} < threshold ${FACE_MATCH_THRESHOLD})`;
      await rejectVerification(userId, livenessConfidence, faceSimilarity, reason);
      logWarn("/verification/complete", { userId, sessionId: session_id, status: "rejected", reason });
      return ok({ status: "rejected", liveness_confidence: livenessConfidence, face_similarity: faceSimilarity, reason });
    }

    // ── Step 5: mark verified ─────────────────────────────────────────────────
    await db.query(
      `UPDATE user_verifications SET
         status               = 'verified',
         liveness_confidence  = $2,
         face_similarity      = $3,
         reference_image_s3_key = $4,
         verified_at          = NOW(),
         rejection_reason     = NULL,
         updated_at           = NOW()
       WHERE user_id = $1`,
      [userId, livenessConfidence, faceSimilarity, refImageS3Key]
    );
    await db.query(
      "UPDATE users SET is_verified = TRUE WHERE id = $1",
      [userId]
    );

    logInfo("/verification/complete", { userId, sessionId: session_id, status: "verified", livenessConfidence, faceSimilarity });

    return ok({ status: "verified", liveness_confidence: livenessConfidence, face_similarity: faceSimilarity, reason: null });
  } catch (err) {
    logError("/verification/complete", err, { sub: claims.sub });
    return internalError();
  }
}

async function rejectVerification(
  userId: string,
  livenessConfidence: number,
  faceSimilarity: number | null,
  reason: string,
) {
  await db.query(
    `UPDATE user_verifications SET
       status               = 'rejected',
       liveness_confidence  = $2,
       face_similarity      = $3,
       rejection_reason     = $4,
       updated_at           = NOW()
     WHERE user_id = $1`,
    [userId, livenessConfidence, faceSimilarity, reason]
  );
  await db.query("UPDATE users SET is_verified = FALSE WHERE id = $1", [userId]);
}

// ── GET /verification/status ──────────────────────────────────────────────────

export async function handleVerificationStatus(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  try {
    const userResult = await db.query(
      "SELECT id, is_verified FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;
    const isVerified: boolean = userResult.rows[0].is_verified ?? false;

    const verRow = await db.query(
      `SELECT status, verified_at, liveness_confidence, face_similarity, rejection_reason
       FROM user_verifications WHERE user_id = $1`,
      [userId]
    );

    logInfo("/verification/status", { userId, isVerified });

    if (verRow.rowCount === 0) {
      return ok({ status: "not_started", is_verified: false, verified_at: null, liveness_confidence: null, face_similarity: null, reason: null });
    }

    const row = verRow.rows[0];
    return ok({
      status:              row.status,
      is_verified:         isVerified,
      verified_at:         row.verified_at ?? null,
      liveness_confidence: row.liveness_confidence ?? null,
      face_similarity:     row.face_similarity ?? null,
      reason:              row.rejection_reason ?? null,
    });
  } catch (err) {
    logError("/verification/status", err, { sub: claims.sub });
    return internalError();
  }
}
