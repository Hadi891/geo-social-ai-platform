import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handleCreateUser } from "./src/handlers/users";
import { handleUpdateLocation } from "./src/handlers/location";
import { handleGetNearby } from "./src/handlers/nearby";
import { handleChat } from "./src/handlers/chat";
import { handleGetUploadUrl } from "./src/handlers/upload-url";
import { notFound, badRequest } from "./src/utils/response";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;

  if (method === "POST" && path === "/users") return handleCreateUser(event);
  if (method === "POST" && path === "/location") return handleUpdateLocation(event);
  if (method === "GET" && path === "/nearby") return handleGetNearby(event);
  if (path === "/chat") return handleChat(event);
  if (method === "POST" && path === "/upload-url") return handleGetUploadUrl(event);

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

  if (method !== "GET" && method !== "POST") return badRequest("Method not allowed");
  return notFound(`No route for ${method} ${path}`);
}
