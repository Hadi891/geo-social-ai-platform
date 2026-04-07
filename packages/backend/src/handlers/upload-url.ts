import type { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { getClaims } from "../utils/auth";
import { parseBody, isString } from "../utils/validation";
import { ok, badRequest, unauthorized, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

const s3 = new S3Client({ region: process.env["AWS_REGION"] ?? "eu-north-1" });
const BUCKET = process.env["S3_BUCKET"] ?? "";

const ALLOWED_FOLDERS = ["profile-images", "posts", "chat-media", "stories", "verification-selfies"] as const;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"];

type UploadUrlBody = {
  folder: string;
  file_type: string;
};

export async function handleGetUploadUrl(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<UploadUrlBody>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { folder, file_type } = body;

  if (!isString(folder) || !ALLOWED_FOLDERS.includes(folder as (typeof ALLOWED_FOLDERS)[number])) {
    return badRequest(`folder must be one of: ${ALLOWED_FOLDERS.join(", ")}`);
  }

  if (!isString(file_type) || !ALLOWED_TYPES.includes(file_type)) {
    return badRequest(`file_type must be one of: ${ALLOWED_TYPES.join(", ")}`);
  }

  const ext = file_type.split("/")[1];
  const key = `${folder}/${claims.sub}/${uuidv4()}.${ext}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: file_type,
    });

    const upload_url = await getSignedUrl(s3, command, { expiresIn: 300 });

    logInfo("/upload-url", { sub: claims.sub, folder, key });
    return ok({ upload_url, key });
  } catch (err) {
    logError("/upload-url", err, { sub: claims.sub });
    return internalError();
  }
}
