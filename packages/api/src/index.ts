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
  profile_photo_url: string | null;
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
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `POST /upload-url failed (${res.status})`);
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

// ── GET /location ─────────────────────────────────────────────────────────────

export async function getMyLocation(token: string): Promise<{ latitude: number; longitude: number } | null> {
  const res = await apiFetch(token, "/location", { method: "GET" });
  if (res.status === 404) return null;
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `GET /location failed (${res.status})`);
  return body as { latitude: number; longitude: number };
}

// ── POST /photos ──────────────────────────────────────────────────────────────

export async function saveProfilePhoto(token: string, image_url: string): Promise<void> {
  const res = await apiFetch(token, "/photos", {
    method: "POST",
    body: JSON.stringify({ image_url }),
  });
  const body = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error(body.message ?? `POST /photos failed (${res.status})`);
}

// ── POST /assistant ───────────────────────────────────────────────────────────

export async function sendAssistantMessage(token: string, message: string): Promise<string> {
  const res = await apiFetch(token, "/assistant", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `POST /assistant failed (${res.status})`);
  return body.reply as string;
}

// ── GET /posts ───────────────────────────────────────────────────────────────

export type PostAuthor = {
  id: string;
  name: string | null;
  age: number | null;
  profile_photo_url: string | null;
};

export type Post = {
  id: string;
  content: string | null;
  media_url: string | null;
  tags: string[];
  created_at: string;
  expires_at: string | null;
  author: PostAuthor;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  distance_m: number | null;
};

export type PostsResponse = {
  count: number;
  limit: number;
  offset: number;
  radius_m: number;
  posts: Post[];
};

export async function getPosts(
  token: string,
  opts: { limit?: number; offset?: number; radius?: number; author_id?: string } = {}
): Promise<PostsResponse> {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  if (opts.radius) params.set("radius", String(opts.radius));
  if (opts.author_id) params.set("author_id", opts.author_id);
  const qs = params.toString();
  const res = await apiFetch(token, `/posts${qs ? `?${qs}` : ""}`, { method: "GET" });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `GET /posts failed (${res.status})`);
  return body as PostsResponse;
}

// ── POST /posts ──────────────────────────────────────────────────────────────

export async function createPost(
  token: string,
  payload: { content?: string; media_url?: string; tags?: string[] }
): Promise<any> {
  const res = await apiFetch(token, "/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `POST /posts failed (${res.status})`);
  return body;
}

// ── POST /posts/like ─────────────────────────────────────────────────────────

export async function likePost(token: string, post_id: string): Promise<void> {
  const res = await apiFetch(token, "/posts/like", {
    method: "POST",
    body: JSON.stringify({ post_id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, any>;
    throw new Error(body.error ?? body.message ?? `POST /posts/like failed (${res.status})`);
  }
}

// ── DELETE /posts/like ───────────────────────────────────────────────────────

export async function unlikePost(token: string, post_id: string): Promise<void> {
  const res = await apiFetch(token, "/posts/like", {
    method: "DELETE",
    body: JSON.stringify({ post_id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, any>;
    throw new Error(body.error ?? body.message ?? `DELETE /posts/like failed (${res.status})`);
  }
}

// ── POST /posts/comment ──────────────────────────────────────────────────────

export type Comment = {
  id: string;
  content: string;
  created_at: string;
  author: PostAuthor;
};

export async function addComment(
  token: string,
  post_id: string,
  content: string
): Promise<any> {
  const res = await apiFetch(token, "/posts/comment", {
    method: "POST",
    body: JSON.stringify({ post_id, content }),
  });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `POST /posts/comment failed (${res.status})`);
  return body;
}

// ── GET /posts/comments ──────────────────────────────────────────────────────

export async function getComments(
  token: string,
  post_id: string
): Promise<{ post_id: string; count: number; comments: Comment[] }> {
  const res = await apiFetch(token, `/posts/comments?post_id=${post_id}`, { method: "GET" });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `GET /posts/comments failed (${res.status})`);
  return body as { post_id: string; count: number; comments: Comment[] };
}

// ── Stories ──────────────────────────────────────────────────────────────────

export type StoryAuthor = {
  id: string;
  name: string;
  profile_photo_url: string | null;
};

export type Story = {
  id: string;
  media_url: string | null;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  viewed_by_me: boolean;
  author?: StoryAuthor;
};

export type StoriesFeedResponse = {
  count: number;
  stories: Story[];
};

export type MyStoriesResponse = {
  user_id: string;
  count: number;
  stories: Story[];
};

export async function getStoriesFeed(token: string): Promise<StoriesFeedResponse> {
  const res = await apiFetch(token, "/stories/feed", { method: "GET" });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `GET /stories/feed failed (${res.status})`);
  return body as StoriesFeedResponse;
}

export async function getMyStories(token: string): Promise<MyStoriesResponse> {
  const res = await apiFetch(token, "/stories/mine", { method: "GET" });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `GET /stories/mine failed (${res.status})`);
  return body as MyStoriesResponse;
}

export async function createStory(
  token: string,
  payload: { media_url: string; media_type: string; caption?: string }
): Promise<Story> {
  const res = await apiFetch(token, "/stories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `POST /stories failed (${res.status})`);
  return body as Story;
}

export async function markStoryViewed(token: string, story_id: string): Promise<void> {
  const res = await apiFetch(token, "/stories/view", {
    method: "POST",
    body: JSON.stringify({ story_id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, any>;
    throw new Error(body.error ?? body.message ?? `POST /stories/view failed (${res.status})`);
  }
}

// ── Verification ─────────────────────────────────────────────────────────────

export type CompareResult = {
  status: "verified" | "rejected";
  similarity: number;
  reason: string | null;
};

export async function verificationCompare(
  token: string,
  profile_key: string,
  selfie_key: string,
): Promise<CompareResult> {
  const res = await apiFetch(token, "/verification/compare", {
    method: "POST",
    body: JSON.stringify({ profile_key, selfie_key }),
  });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `POST /verification/compare failed (${res.status})`);
  return body as CompareResult;
}

export type FaceCheckResult = {
  status: "verified" | "rejected";
  similarity: number;
  reason: string | null;
};

export async function verificationFaceCheck(
  token: string,
  selfie_key: string,
): Promise<FaceCheckResult> {
  const res = await apiFetch(token, "/verification/face-check", {
    method: "POST",
    body: JSON.stringify({ selfie_key }),
  });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `POST /verification/face-check failed (${res.status})`);
  return body as FaceCheckResult;
}

// ── GET /matches ──────────────────────────────────────────────────────────────

export type Match = {
  match_id: string;
  matched_at: string;
  id: string;
  name: string | null;
  age: number | null;
  bio: string | null;
  interests: string[] | null;
  profile_photo_url: string | null;
  last_message: string | null;
  last_message_time: string | null;
};

export type MatchesResponse = {
  count: number;
  matches: Match[];
};

export async function getMatches(token: string): Promise<MatchesResponse> {
  const res = await apiFetch(token, "/matches", { method: "GET" });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `GET /matches failed (${res.status})`);
  return body as MatchesResponse;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export type ChatMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  message_text: string | null;
  message_type: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  is_deleted: boolean;
  is_edited: boolean;
};

export type GetMessagesResponse = {
  match_id: string;
  count: number;
  messages: ChatMessage[];
};

export async function getMessages(
  token: string,
  match_id: string,
  opts: { limit?: number; before?: string } = {},
): Promise<GetMessagesResponse> {
  const params = new URLSearchParams({ match_id });
  if (opts.limit)  params.set("limit",  String(opts.limit));
  if (opts.before) params.set("before", opts.before);
  const res = await apiFetch(token, `/chat?${params}`, { method: "GET" });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `GET /chat failed (${res.status})`);
  return body as GetMessagesResponse;
}

export async function sendChatMessage(
  token: string,
  match_id: string,
  message_text: string,
): Promise<ChatMessage> {
  const res = await apiFetch(token, "/chat", {
    method: "POST",
    body: JSON.stringify({ match_id, message_text, message_type: "text" }),
  });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `POST /chat failed (${res.status})`);
  return body as ChatMessage;
}

export async function markChatRead(token: string, match_id: string): Promise<void> {
  const res = await apiFetch(token, "/chat/read", {
    method: "POST",
    body: JSON.stringify({ matchId: match_id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, any>;
    throw new Error(body.error ?? body.message ?? `POST /chat/read failed (${res.status})`);
  }
}

export async function editChatMessage(
  token: string,
  message_id: string,
  message_text: string,
): Promise<void> {
  const res = await apiFetch(token, "/chat/message", {
    method: "PATCH",
    body: JSON.stringify({ message_id, message_text }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, any>;
    throw new Error(body.error ?? body.message ?? `PATCH /chat/message failed (${res.status})`);
  }
}

export async function deleteChatMessage(
  token: string,
  message_id: string,
): Promise<void> {
  const res = await apiFetch(token, "/chat/message", {
    method: "DELETE",
    body: JSON.stringify({ message_id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, any>;
    throw new Error(body.error ?? body.message ?? `DELETE /chat/message failed (${res.status})`);
  }
}

export async function postTypingIndicator(token: string, match_id: string): Promise<void> {
  await apiFetch(token, "/chat/typing", {
    method: "POST",
    body: JSON.stringify({ match_id }),
  }).catch(() => {/* non-critical, swallow errors */});
}

export async function getTypingIndicator(
  token: string,
  match_id: string,
): Promise<{ match_id: string; typing_user_ids: string[] }> {
  const res = await apiFetch(token, `/chat/typing?match_id=${match_id}`, { method: "GET" });
  const body = await res.json().catch(() => ({})) as Record<string, any>;
  if (!res.ok) throw new Error(body.error ?? body.message ?? `GET /chat/typing failed (${res.status})`);
  return body as { match_id: string; typing_user_ids: string[] };
}

// ── GET /nearby ───────────────────────────────────────────────────────────────

export async function getNearby(token: string) {
  const res = await apiFetch(token, "/nearby", { method: "GET" });
  const body = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error(body.message ?? `GET /nearby failed (${res.status})`);
  return body;
}
