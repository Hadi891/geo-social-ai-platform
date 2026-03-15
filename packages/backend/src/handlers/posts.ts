import type { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection";
import { getClaims } from "../utils/auth";
import { parseBody, isString, isUUID, isValidTimestamp } from "../utils/validation";
import { ok, created, badRequest, unauthorized, notFound, internalError } from "../utils/response";
import { logInfo, logError } from "../utils/logger";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// ─── POST /posts ──────────────────────────────────────────────────────────────

export async function handleCreatePost(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ content?: string; media_url?: string; expires_at?: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { content, media_url, expires_at } = body;

  const hasContent = typeof content === "string" && content.trim().length > 0;
  const hasMedia = typeof media_url === "string" && media_url.trim().length > 0;
  if (!hasContent && !hasMedia) {
    return badRequest("Post must have content or media_url");
  }

  if (expires_at !== undefined && !isValidTimestamp(expires_at)) {
    return badRequest("expires_at must be a valid ISO timestamp");
  }

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const authorId: string = userResult.rows[0].id;

    logInfo("/posts", { authorId, hasContent, hasMedia });

    const result = await db.query(
      `INSERT INTO posts (id, author_id, content, media_url, expires_at)
       VALUES ($1, $2, $3, $4, $5::timestamp)
       RETURNING id, author_id, content, media_url, created_at, expires_at`,
      [uuidv4(), authorId, content ?? null, media_url ?? null, expires_at ?? null]
    );

    return created(result.rows[0]);
  } catch (err) {
    logError("/posts", err, { sub: claims.sub });
    return internalError();
  }
}

// ─── GET /posts ───────────────────────────────────────────────────────────────

export async function handleGetPosts(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const params = event.queryStringParameters ?? {};
  const limit = Math.min(Math.max(parseInt(params["limit"] ?? "0", 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(parseInt(params["offset"] ?? "0", 10) || 0, 0);

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    logInfo("/posts", { userId, limit, offset });

    const result = await db.query(
      `SELECT
         p.id,
         p.content,
         p.media_url,
         p.created_at,
         p.expires_at,
         json_build_object(
           'id', u.id,
           'name', u.name,
           'profile_photo_url', ph.image_url
         ) AS author,
         COUNT(DISTINCT pl.user_id)::int AS like_count,
         COUNT(DISTINCT pc.id)::int AS comment_count,
         EXISTS(
           SELECT 1 FROM post_likes
           WHERE post_id = p.id AND user_id = $1
         ) AS liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.author_id
       LEFT JOIN photos ph ON ph.user_id = u.id AND ph.is_profile_photo = TRUE
       LEFT JOIN post_likes pl ON pl.post_id = p.id
       LEFT JOIN post_comments pc ON pc.post_id = p.id
       WHERE (p.expires_at IS NULL OR p.expires_at > NOW())
       GROUP BY p.id, u.id, u.name, ph.image_url
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return ok({ count: result.rows.length, limit, offset, posts: result.rows });
  } catch (err) {
    logError("/posts", err, { sub: claims.sub });
    return internalError();
  }
}

// ─── POST /posts/comment ──────────────────────────────────────────────────────

export async function handleAddComment(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ post_id: string; content: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { post_id, content } = body;
  if (!isUUID(post_id)) return badRequest("post_id must be a valid UUID");
  if (!isString(content)) return badRequest("content is required");

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const authorId: string = userResult.rows[0].id;

    logInfo("/posts/comment", { authorId, postId: post_id });

    const postResult = await db.query(
      "SELECT id FROM posts WHERE id = $1",
      [post_id]
    );
    if (postResult.rowCount === 0) return notFound("Post not found.");

    const result = await db.query(
      `INSERT INTO post_comments (id, post_id, author_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, post_id, author_id, content, created_at`,
      [uuidv4(), post_id, authorId, content.trim()]
    );

    return created(result.rows[0]);
  } catch (err) {
    logError("/posts/comment", err, { sub: claims.sub });
    return internalError();
  }
}

// ─── GET /posts/comments ──────────────────────────────────────────────────────

export async function handleGetComments(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const params = event.queryStringParameters ?? {};
  const post_id = params["post_id"];
  if (!isUUID(post_id)) return badRequest("post_id must be a valid UUID");

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");

    logInfo("/posts/comments", { postId: post_id });

    const postResult = await db.query(
      "SELECT id FROM posts WHERE id = $1",
      [post_id]
    );
    if (postResult.rowCount === 0) return notFound("Post not found.");

    const result = await db.query(
      `SELECT
         pc.id,
         pc.content,
         pc.created_at,
         json_build_object(
           'id', u.id,
           'name', u.name,
           'profile_photo_url', ph.image_url
         ) AS author
       FROM post_comments pc
       JOIN users u ON u.id = pc.author_id
       LEFT JOIN photos ph ON ph.user_id = u.id AND ph.is_profile_photo = TRUE
       WHERE pc.post_id = $1
       ORDER BY pc.created_at ASC`,
      [post_id]
    );

    return ok({ post_id, count: result.rows.length, comments: result.rows });
  } catch (err) {
    logError("/posts/comments", err, { sub: claims.sub });
    return internalError();
  }
}

// ─── POST /posts/like ─────────────────────────────────────────────────────────

export async function handleLikePost(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ post_id: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { post_id } = body;
  if (!isUUID(post_id)) return badRequest("post_id must be a valid UUID");

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    logInfo("/posts/like", { userId, postId: post_id });

    const postResult = await db.query(
      "SELECT id FROM posts WHERE id = $1",
      [post_id]
    );
    if (postResult.rowCount === 0) return notFound("Post not found.");

    await db.query(
      `INSERT INTO post_likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [post_id, userId]
    );

    return ok({ ok: true });
  } catch (err) {
    logError("/posts/like", err, { sub: claims.sub });
    return internalError();
  }
}

// ─── DELETE /posts/like ───────────────────────────────────────────────────────

export async function handleUnlikePost(event: APIGatewayProxyEvent) {
  const claims = getClaims(event);
  if (!claims) return unauthorized();

  const body = parseBody<{ post_id: string }>(event.body);
  if (!body) return badRequest("Invalid or missing request body");

  const { post_id } = body;
  if (!isUUID(post_id)) return badRequest("post_id must be a valid UUID");

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE cognito_sub = $1",
      [claims.sub]
    );
    if (userResult.rowCount === 0) return notFound("User profile not found.");
    const userId: string = userResult.rows[0].id;

    logInfo("/posts/like DELETE", { userId, postId: post_id });

    await db.query(
      "DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [post_id, userId]
    );

    return ok({ ok: true });
  } catch (err) {
    logError("/posts/like DELETE", err, { sub: claims.sub });
    return internalError();
  }
}
