import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handleGetUser, handleCreateUser, handleSavePhoto } from "./src/handlers/users";
import { handleGetLocation, handleUpdateLocation } from "./src/handlers/location";
import { handleGetNearby } from "./src/handlers/nearby";
import { handleSendMessage, handleGetMessages, handleMarkRead, handleEditMessage, handleDeleteMessage } from "./src/handlers/chat";
import { handleGetUploadUrl } from "./src/handlers/upload-url";
import { handleLike, handleGetMatches } from "./src/handlers/likes";
import { handlePostTyping, handleGetTyping } from "./src/handlers/typing";
import { handleCreatePost, handleGetPosts, handleAddComment, handleGetComments, handleLikePost, handleUnlikePost } from "./src/handlers/posts";
import { handleCreateStory, handleGetUserStories, handleGetMyStories, handleGetStoriesFeed, handleViewStory, handleDeleteStory } from "./src/handlers/stories";
import { handleAiSuggestions } from "./src/handlers/aiSuggestions";
import { handleAssistant } from "./src/handlers/assistant";
import { handleVerificationStart, handleVerificationComplete, handleVerificationStatus, handleVerificationFaceCheck, handleVerificationCompare } from "./src/handlers/verification";
import { handleConversationState } from "./src/handlers/conversationState";
import { handleGetNotifications, handleGetLikerProfile } from "./src/handlers/notifications";
import { notFound, badRequest } from "./src/utils/response";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Support both REST API (v1) and HTTP API (v2 payload format)
  const method: string = event.httpMethod ?? (event as any).requestContext?.http?.method ?? "";
  const rawPath: string = event.path ?? (event as any).rawPath ?? "";
  const stage: string = (event as any).requestContext?.stage ?? "";
  const path: string = stage && rawPath.startsWith(`/${stage}/`) ? rawPath.slice(stage.length + 1) : rawPath;

  if (method === "GET"  && path === "/users") return handleGetUser(event);
  if (method === "POST" && path === "/users") return handleCreateUser(event);
  if (method === "GET"  && path === "/location") return handleGetLocation(event);
  if (method === "POST" && path === "/location") return handleUpdateLocation(event);
  if (method === "POST" && path === "/photos") return handleSavePhoto(event);
  if (method === "GET" && path === "/nearby") return handleGetNearby(event);
  if (method === "GET"  && path === "/chat") return handleGetMessages(event);
  if (method === "POST" && path === "/chat") return handleSendMessage(event);
  if (method === "POST" && path === "/upload-url") return handleGetUploadUrl(event);
  if (method === "POST" && path === "/like") return handleLike(event);
  if (method === "GET" && path === "/matches") return handleGetMatches(event);
  if (method === "POST" && path === "/chat/read") return handleMarkRead(event);
  if (method === "POST" && path === "/chat/typing") return handlePostTyping(event);
  if (method === "GET" && path === "/chat/typing") return handleGetTyping(event);
  if (method === "PATCH" && path === "/chat/message") return handleEditMessage(event);
  if (method === "DELETE" && path === "/chat/message") return handleDeleteMessage(event);
  if (method === "POST" && path === "/posts") return handleCreatePost(event);
  if (method === "GET" && path === "/posts") return handleGetPosts(event);
  if (method === "POST" && path === "/posts/comment") return handleAddComment(event);
  if (method === "GET" && path === "/posts/comments") return handleGetComments(event);
  if (method === "POST" && path === "/posts/like") return handleLikePost(event);
  if (method === "DELETE" && path === "/posts/like") return handleUnlikePost(event);
  if (method === "POST" && path === "/stories") return handleCreateStory(event);
  if (method === "GET" && path === "/stories") return handleGetUserStories(event);
  if (method === "GET" && path === "/stories/mine") return handleGetMyStories(event);
  if (method === "GET" && path === "/stories/feed") return handleGetStoriesFeed(event);
  if (method === "POST" && path === "/stories/view") return handleViewStory(event);
  if (method === "DELETE" && path === "/stories") return handleDeleteStory(event);
  if (method === "POST" && path === "/ai-suggestions") return handleAiSuggestions(event);
  if (method === "POST" && path === "/assistant") return handleAssistant(event);
  if (method === "POST" && path === "/verification/start") return handleVerificationStart(event);
  if (method === "POST" && path === "/verification/complete") return handleVerificationComplete(event);
  if (method === "POST" && path === "/verification/face-check") return handleVerificationFaceCheck(event);
  if (method === "POST" && path === "/verification/compare") return handleVerificationCompare(event);
  if (method === "GET"  && path === "/verification/status") return handleVerificationStatus(event);
  if (method === "POST" && path === "/conversation-state") return handleConversationState(event);
  if (method === "GET"  && path === "/notifications") return handleGetNotifications(event);
  if (method === "GET"  && path === "/notifications/liker-profile") return handleGetLikerProfile(event);

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

  if (method !== "GET" && method !== "POST" && method !== "DELETE" && method !== "PATCH") return badRequest("Method not allowed");
  return notFound(`No route for ${method} ${path}`);
}
