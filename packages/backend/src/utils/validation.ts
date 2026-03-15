export function parseBody<T>(body: string | null): T | null {
  if (!body) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

export function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}
