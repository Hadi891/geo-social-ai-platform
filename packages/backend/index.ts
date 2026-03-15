import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handleCreateUser } from "./src/handlers/users";
import { handleUpdateLocation } from "./src/handlers/location";
import { handleGetNearby } from "./src/handlers/nearby";
import { handleChat, handleMarkRead } from "./src/handlers/chat";
import { handleGetUploadUrl } from "./src/handlers/upload-url";
import { handleLike, handleGetMatches } from "./src/handlers/likes";
import { handlePostTyping, handleGetTyping } from "./src/handlers/typing";
import { handleCreatePost, handleGetPosts, handleAddComment, handleGetComments, handleLikePost, handleUnlikePost } from "./src/handlers/posts";
import { handleCreateStory, handleGetUserStories, handleGetStoriesFeed, handleViewStory, handleDeleteStory } from "./src/handlers/stories";
import { notFound, badRequest } from "./src/utils/response";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;

  if (method === "POST" && path === "/users") return handleCreateUser(event);
  if (method === "POST" && path === "/location") return handleUpdateLocation(event);
  if (method === "GET" && path === "/nearby") return handleGetNearby(event);
  if (path === "/chat") return handleChat(event);
  if (method === "POST" && path === "/upload-url") return handleGetUploadUrl(event);
  if (method === "POST" && path === "/like") return handleLike(event);
  if (method === "GET" && path === "/matches") return handleGetMatches(event);
  if (method === "POST" && path === "/chat/read") return handleMarkRead(event);
  if (method === "POST" && path === "/chat/typing") return handlePostTyping(event);
  if (method === "GET" && path === "/chat/typing") return handleGetTyping(event);
  if (method === "POST" && path === "/posts") return handleCreatePost(event);
  if (method === "GET" && path === "/posts") return handleGetPosts(event);
  if (method === "POST" && path === "/posts/comment") return handleAddComment(event);
  if (method === "GET" && path === "/posts/comments") return handleGetComments(event);
  if (method === "POST" && path === "/posts/like") return handleLikePost(event);
  if (method === "DELETE" && path === "/posts/like") return handleUnlikePost(event);
  if (method === "POST" && path === "/stories") return handleCreateStory(event);
  if (method === "GET" && path === "/stories") return handleGetUserStories(event);
  if (method === "GET" && path === "/stories/feed") return handleGetStoriesFeed(event);
  if (method === "POST" && path === "/stories/view") return handleViewStory(event);
  if (method === "DELETE" && path === "/stories") return handleDeleteStory(event);

  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: "",
    };
  }

  if (method !== "GET" && method !== "POST" && method !== "DELETE") return badRequest("Method not allowed");
  return notFound(`No route for ${method} ${path}`);
}
