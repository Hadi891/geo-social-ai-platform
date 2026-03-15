export type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export function ok(data: unknown): LambdaResponse {
  return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data) };
}

export function created(data: unknown): LambdaResponse {
  return { statusCode: 201, headers: HEADERS, body: JSON.stringify(data) };
}

export function badRequest(message: string): LambdaResponse {
  return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: message }) };
}

export function unauthorized(): LambdaResponse {
  return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: "Unauthorized" }) };
}

export function forbidden(message = "Forbidden"): LambdaResponse {
  return { statusCode: 403, headers: HEADERS, body: JSON.stringify({ error: message }) };
}

export function notFound(message = "Not found"): LambdaResponse {
  return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: message }) };
}

export function internalError(): LambdaResponse {
  return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Internal server error" }) };
}
