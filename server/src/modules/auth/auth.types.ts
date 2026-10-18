/**
 * Auth Module TypeScript Type Definitions (Google + GitHub Multi-Provider)
 */

export type AuthProvider = 'google' | 'github';

export interface GoogleAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  idToken?: string;
}

export interface GitHubAuthTokens {
  accessToken: string;
  tokenType: string;
  scope: string;
}

export interface OAuthUserProfile {
  providerId: string;
  provider: AuthProvider;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface UserSessionPayload {
  userId: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    hasGoogleLinked: boolean;
    hasGithubLinked: boolean;
  };
}
