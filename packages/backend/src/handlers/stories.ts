import type { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isString, isUUID } from "../utils/validation";
import { ok, created, badRequest, unauthorized, notFound, forbidden, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

const ALLOWED_MEDIA_TYPES = ["image", "video"];

// ─── POST /stories ────────────────────────────────────────────────────────────

export async function handleCreateStory(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ media_url: string; media_type: string; caption?: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { media_url, media_type, caption } = body;

  if (!isString(media_url)) return badRequest("media_url is required");
  if (!isString(media_type)) return badRequest("media_type is required");
  if (!ALLOWED_MEDIA_TYPES.includes(media_type)) {
    return badRequest(`media_type must be one of: ${ALLOWED_MEDIA_TYPES.join(", ")}`);
  }

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const authorId: string = userResult.rows[0].id;

    logInfo("/stories", { authorId, mediaType: media_type });

    const result = await db.query(
      `INSERT INTO stories (id, author_id, media_url, media_type, caption, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')
       RETURNING id, author_id, media_url, media_type, caption, created_at, expires_at`,
      [uuidv4(), authorId, media_url.trim(), media_type, caption?.trim() ?? null]
    );

    return created(result.rows[0]);
  } catch (err) {
    logError("/stories", err, { sub: claims.sub });
    return internalError();
  }
}

// ─── GET /stories ─────────────────────────────────────────────────────────────

export async function handleGetUserStories(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const params = event.queryStringParameters ?? {};
  const user_id = params["user_id"];
  if (!isUUID(user_id)) return badRequest("user_id must be a valid UUID");

  try {
    const viewerResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (viewerResult.rowCount === 0) return notFound("User profile not found.");
    const viewerId: string = viewerResult.rows[0].id;

    logInfo("/stories GET", { viewerId, targetUserId: user_id });

    // Verify target user exists
    const targetResult = await db.query(
      "SELECT id FROM users WHERE id = $1",
      [user_id]
    );
    if (targetResult.rowCount === 0) return notFound("User not found.");

    const result = await db.query(
      `SELECT
         s.id,
         s.media_url,
         s.media_type,
         s.caption,
         s.created_at,
         s.expires_at,
         EXISTS(
           SELECT 1 FROM story_views
           WHERE story_id = s.id AND viewer_id = $2
         ) AS viewed_by_me
       FROM stories s
       WHERE s.author_id = $1
         AND s.expires_at > NOW()
       ORDER BY s.created_at ASC`,
      [user_id, viewerId]
    );

    return ok({ user_id, count: result.rows.length, stories: result.rows });
  } catch (err) {
    logError("/stories GET", err, { sub: claims.sub });
    return internalError();
  }
}

// ─── GET /stories/feed ────────────────────────────────────────────────────────

export async function handleGetStoriesFeed(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  try {
    const viewerResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (viewerResult.rowCount === 0) return notFound("User profile not found.");
    const viewerId: string = viewerResult.rows[0].id;

    logInfo("/stories/feed", { viewerId });

    // Return non-expired stories from other users, grouped by author (most recent
    // activity first), with author info and viewed_by_me flag.
    const result = await db.query(
      `SELECT
         s.id,
         s.media_url,
         s.media_type,
         s.caption,
         s.created_at,
         s.expires_at,
         EXISTS(
           SELECT 1 FROM story_views
           WHERE story_id = s.id AND viewer_id = $1
         ) AS viewed_by_me,
         json_build_object(
           'id', u.id,
           'name', u.name,
           'profile_photo_url', ph.image_url
         ) AS author
       FROM stories s
       JOIN users u ON u.id = s.author_id
       LEFT JOIN photos ph ON ph.user_id = u.id AND ph.is_profile_photo = TRUE
       WHERE s.expires_at > NOW()
         AND s.author_id <> $1
       ORDER BY u.id, s.created_at ASC`,
      [viewerId]
    );

    return ok({ count: result.rows.length, stories: result.rows });
  } catch (err) {
    logError("/stories/feed", err, { sub: claims.sub });
    return internalError();
  }
}

// ─── POST /stories/view ───────────────────────────────────────────────────────

export async function handleViewStory(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ story_id: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { story_id } = body;
  if (!isUUID(story_id)) return badRequest("story_id must be a valid UUID");

  try {
    const viewerResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (viewerResult.rowCount === 0) return notFound("User profile not found.");
    const viewerId: string = viewerResult.rows[0].id;

    logInfo("/stories/view", { viewerId, storyId: story_id });

    const storyResult = await db.query(
      "SELECT id, expires_at FROM stories WHERE id = $1",
      [story_id]
    );
    if (storyResult.rowCount === 0) return notFound("Story not found.");

    const story = storyResult.rows[0];
    if (new Date(story.expires_at) <= new Date()) {
      return badRequest("Story has expired.");
    }

    await db.query(
      `INSERT INTO story_views (story_id, viewer_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [story_id, viewerId]
    );

    return ok({ ok: true });
  } catch (err) {
    logError("/stories/view", err, { sub: claims.sub });
    return internalError();
  }
}

// ─── DELETE /stories ──────────────────────────────────────────────────────────

export async function handleDeleteStory(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ story_id: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { story_id } = body;
  if (!isUUID(story_id)) return badRequest("story_id must be a valid UUID");

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    logInfo("/stories DELETE", { userId, storyId: story_id });

    const storyResult = await db.query(
      "SELECT id, author_id FROM stories WHERE id = $1",
      [story_id]
    );
    if (storyResult.rowCount === 0) return notFound("Story not found.");
    if (storyResult.rows[0].author_id !== userId) return forbidden("You can only delete your own stories.");

    await db.query("DELETE FROM stories WHERE id = $1", [story_id]);

    return ok({ ok: true });
  } catch (err) {
    logError("/stories DELETE", err, { sub: claims.sub });
    return internalError();
  }
}
