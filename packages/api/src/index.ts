export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "";

/** Authenticated fetch — attaches Bearer JWT to every request. */
export async function apiFetch(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!API_BASE_URL) throw new Error("API_BASE_URL is not configured. Set EXPO_PUBLIC_API_URL in apps/mobile/.env");
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
}

// ── POST /users ───────────────────────────────────────────────────────────────

export type CreateUserPayload = {
  name?: string;
  age?: number;
  bio?: string;
  gender?: string;
  sexual_orientation?: string;
  interests?: string[];
  introversion_score?: number;
};

export async function createUserProfile(token: string, payload: CreateUserPayload) {
  const res = await apiFetch(token, "/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error(body.message ?? `POST /users failed (${res.status})`);
  return body;
}

// ── POST /location ────────────────────────────────────────────────────────────

export type LocationPayload = { latitude: number; longitude: number };

export async function updateLocation(token: string, payload: LocationPayload) {
  const res = await apiFetch(token, "/location", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error(body.message ?? `POST /location failed (${res.status})`);
  return body;
}

// ── GET /nearby ───────────────────────────────────────────────────────────────

export async function getNearby(token: string) {
  const res = await apiFetch(token, "/nearby", { method: "GET" });
  const body = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error(body.message ?? `GET /nearby failed (${res.status})`);
  return body;
}
