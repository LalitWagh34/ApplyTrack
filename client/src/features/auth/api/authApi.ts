/**
 * Auth API Client
 */
import { User } from '../types/auth.types.js';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('applytrack_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const authApi = {
  getGoogleAuthUrl(): string {
    return 'http://localhost:4000/api/v1/auth/google';
  },

  getGitHubAuthUrl(): string {
    return 'http://localhost:4000/api/v1/auth/github';
  },

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem('applytrack_token');
    if (!token) return null;

    try {
      const res = await fetch('/api/v1/auth/me', {
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
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } finally {
      localStorage.removeItem('applytrack_token');
    }
  }
};

export default authApi;
