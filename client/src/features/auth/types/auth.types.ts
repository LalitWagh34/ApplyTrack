/**
 * Client Auth TypeScript Type Definitions
 */

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  hasGoogleLinked?: boolean;
  hasGithubLinked?: boolean;
  googleId?: string | null;
  githubId?: string | null;
  preferences?: {
    targetRole?: string;
    topSkills?: string[];
    portfolioLink?: string;
    topProjects?: string[];
    followUpCadenceDays?: number;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
