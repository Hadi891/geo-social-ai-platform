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

// ── GET /users ────────────────────────────────────────────────────────────────

export type UserProfile = {
  id: string;
  cognito_sub: string;
  email: string;
  name: string | null;
  age: number | null;
  bio: string | null;
  gender: string | null;
  sexual_orientation: string | null;
  interests: string[] | null;
  introversion_score: number;
  created_at: string;
  updated_at: string;
};

export async function getMyProfile(token: string): Promise<UserProfile> {
  const res = await apiFetch(token, "/users", { method: "GET" });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `GET /users failed (${res.status})`);
  return body as UserProfile;
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

// ── POST /upload-url ──────────────────────────────────────────────────────────

export async function getUploadUrl(token: string, folder: string, file_type: string): Promise<{ upload_url: string; key: string }> {
  const res = await apiFetch(token, "/upload-url", {
    method: "POST",
    body: JSON.stringify({ folder, file_type }),
  });
  const body = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error((body as any).message ?? `POST /upload-url failed (${res.status})`);
  return body as { upload_url: string; key: string };
}

export async function uploadToS3(uploadUrl: string, imageUri: string, contentType: string): Promise<void> {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!upload.ok) throw new Error(`S3 upload failed (${upload.status})`);
}

// ── GET /nearby ───────────────────────────────────────────────────────────────

export async function getNearby(token: string) {
  const res = await apiFetch(token, "/nearby", { method: "GET" });
  const body = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error(body.message ?? `GET /nearby failed (${res.status})`);
  return body;
}
