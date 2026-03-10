export type CreateUserProfilePayload = {
  id: string;
  email: string;
  name?: string;
  age?: number;
  bio?: string;
  introversion_score?: number;
};

export type UpdateLocationPayload = {
  user_id: string;
  latitude: number;
  longitude: number;
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "";

export async function createUserProfile(payload: CreateUserProfilePayload) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Failed to create user profile");
  }

  return response.json();
}

export async function updateLocation(payload: UpdateLocationPayload) {
  const response = await fetch(`${API_BASE_URL}/location`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Failed to update location");
  }

  return response.json();
}