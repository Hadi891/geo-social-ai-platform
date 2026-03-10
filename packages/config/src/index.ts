export const AWS_REGION = "eu-north-1";

export const COGNITO_USER_POOL_ID =
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ||
  process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ||
  "";

export const COGNITO_CLIENT_ID =
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ||
  process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ||
  "";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "";