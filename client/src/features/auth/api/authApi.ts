/**
 * Auth API Client
 */
import { User } from '../types/auth.types.js';
import { API_ENDPOINTS } from '../../../config/api.config.js';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('applytrack_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const authApi = {
  getGoogleAuthUrl(): string {
    return API_ENDPOINTS.AUTH.GOOGLE;
  },

  getGitHubAuthUrl(): string {
    return API_ENDPOINTS.AUTH.GITHUB;
  },

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem('applytrack_token');
    if (!token) return null;

    try {
      const res = await fetch(API_ENDPOINTS.AUTH.ME, {
        headers: getAuthHeaders()
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } finally {
      localStorage.removeItem('applytrack_token');
    }
  }
};

export default authApi;
