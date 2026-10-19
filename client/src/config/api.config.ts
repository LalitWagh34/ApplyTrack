/**
 * Client API Configuration
 */

const backendUrl = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE_URL = backendUrl ? `${backendUrl}/api/v1` : '/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: `${API_BASE_URL}/auth/google`,
    GITHUB: `${API_BASE_URL}/auth/github`,
    ME: `${API_BASE_URL}/auth/me`,
    LOGOUT: `${API_BASE_URL}/auth/logout`
  },
  APPLICATIONS: `${API_BASE_URL}/applications`,
  FOLLOWUPS: `${API_BASE_URL}/followups`,
  PROFILE: `${API_BASE_URL}/profile`,
  NOTIFICATIONS: `${API_BASE_URL}/notifications`
};

