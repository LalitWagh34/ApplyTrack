/**
 * Client API Configuration
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: `${API_BASE_URL}/auth/google`,
    ME: `${API_BASE_URL}/auth/me`,
    LOGOUT: `${API_BASE_URL}/auth/logout`
  },
  APPLICATIONS: `${API_BASE_URL}/applications`,
  FOLLOWUPS: `${API_BASE_URL}/followups`,
  NOTIFICATIONS: `${API_BASE_URL}/notifications`
};
