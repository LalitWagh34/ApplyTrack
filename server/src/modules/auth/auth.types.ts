/**
 * Auth Module TypeScript Type Definitions
 */

export interface GoogleAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  idToken?: string;
}

export interface UserSessionPayload {
  userId: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName?: string | null;
  };
}
