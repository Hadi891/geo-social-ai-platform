import type { APIGatewayProxyEvent } from "aws-lambda";

export type CognitoClaims = {
  sub: string;
  email: string;
};

const COGNITO_POOL_ID = "eu-north-1_2dYWQqgpa";
const EXPECTED_ISS = `https://cognito-idp.eu-north-1.amazonaws.com/${COGNITO_POOL_ID}`;

/**
 * Extracts Cognito claims from:
 * 1. API Gateway authorizer context (if a Cognito authorizer is configured), or
 * 2. The raw JWT in the Authorization header (decoded without signature verification).
 */
export function getClaims(event: APIGatewayProxyEvent): CognitoClaims | null {
  // 1. REST API authorizer (v1)
  const v1Claims = event.requestContext?.authorizer?.claims as Record<string, string> | undefined;
  if (v1Claims?.["sub"] && v1Claims?.["email"]) {
    return { sub: v1Claims["sub"], email: v1Claims["email"] };
  }

  // 2. HTTP API JWT authorizer (v2)
  const v2Claims = (event as any).requestContext?.authorizer?.jwt?.claims as Record<string, string> | undefined;
  if (v2Claims?.["sub"] && v2Claims?.["email"]) {
    return { sub: v2Claims["sub"], email: v2Claims["email"] };
  }

  // 3. Parse JWT from Authorization header directly
  try {
    const authHeader = event.headers?.["Authorization"] ?? event.headers?.["authorization"] ?? "";
    if (!authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as Record<string, string>;
    if (payload["iss"] !== EXPECTED_ISS) return null;
    if (!payload["sub"] || !payload["email"]) return null;
    return { sub: payload["sub"], email: payload["email"] };
  } catch {
    return null;
  }
}
