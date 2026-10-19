/**
 * Profile API Client
 * Manages user profile updates and PDF resume parsing for AI Context
 */
import { User } from '../../auth/types/auth.types.js';
import { API_ENDPOINTS } from '../../../config/api.config.js';

const API_BASE = API_ENDPOINTS.PROFILE;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('applytrack_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export interface ProfilePreferences {
  targetRole?: string;
  topSkills?: string[];
  portfolioLink?: string;
  topProjects?: string[];
}

export interface UpdateProfilePayload {
  fullName?: string;
  targetRole?: string;
  topSkills?: string[];
  portfolioLink?: string;
  topProjects?: string[];
}

export const profileApi = {
  async getProfile(): Promise<User | null> {
    const res = await fetch(`${API_BASE}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json.data || null;
  },

  async parseResume(fileBase64: string, fileName?: string): Promise<{ fullName?: string; preferences: ProfilePreferences }> {
    const res = await fetch(`${API_BASE}/resume`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fileBase64, fileName })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to parse resume');
    }
    return json.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await fetch(`${API_BASE}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update profile');
    }
    return json.data;
  }
};

export default profileApi;
