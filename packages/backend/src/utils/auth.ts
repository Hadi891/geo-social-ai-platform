import type { APIGatewayProxyEvent } from "aws-lambda";

export type CognitoClaims = {
  sub: string;
  email: string;
};

/**
 * Extracts Cognito claims injected by the API Gateway Cognito authorizer.
 * Returns null if the authorizer context is missing (unauthenticated request).
 */
export function getClaims(event: APIGatewayProxyEvent): CognitoClaims | null {
  const claims = event.requestContext?.authorizer?.claims as Record<string, string> | undefined;
  if (!claims?.["sub"] || !claims?.["email"]) return null;
  return { sub: claims["sub"], email: claims["email"] };
}
