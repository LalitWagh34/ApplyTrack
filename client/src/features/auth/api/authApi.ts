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
    if (!token) {
      localStorage.removeItem('applytrack_user');
      return null;
    }

    try {
      const res = await fetch(API_ENDPOINTS.AUTH.ME, {
        headers: getAuthHeaders()
      });

      if (res.status === 401) {
        // Token is genuinely expired or invalidated by server
        localStorage.removeItem('applytrack_token');
        localStorage.removeItem('applytrack_user');
        return null;
      }

      if (!res.ok) {
        // Server cold-start (502/503/504) or temporary failure - keep session intact
        const cached = localStorage.getItem('applytrack_user');
        return cached ? JSON.parse(cached) : null;
      }

      const json = await res.json();
      if (json.data) {
        localStorage.setItem('applytrack_user', JSON.stringify(json.data));
        return json.data;
      }
      return null;
    } catch {
      // Network drop or Render waking up - preserve cached user so user is not kicked out
      const cached = localStorage.getItem('applytrack_user');
      return cached ? JSON.parse(cached) : null;
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
      localStorage.removeItem('applytrack_user');
    }
  }
};

export default authApi;
