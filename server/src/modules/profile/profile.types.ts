/**
 * Profile Module Type Definitions
 * Lightweight user context and AI Ghostwriter resume preferences
 */

export interface UserPreferences {
  targetRole?: string;
  topSkills?: string[];
  portfolioLink?: string;
  topProjects?: string[];
  followUpCadenceDays?: number;
  notificationsEnabled?: boolean;
}

export interface ProfileResponse {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  hasGoogleLinked: boolean;
  hasGithubLinked: boolean;
  preferences: UserPreferences;
}

export interface ParseResumeRequest {
  fileBase64: string;
  fileName?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string | null;
  targetRole?: string;
  topSkills?: string[];
  portfolioLink?: string;
  topProjects?: string[];
  followUpCadenceDays?: number;
  notificationsEnabled?: boolean;
}
