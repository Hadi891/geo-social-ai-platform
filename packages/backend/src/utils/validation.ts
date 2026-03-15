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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function isValidTimestamp(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}
