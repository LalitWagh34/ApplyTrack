/**
 * Client Auth TypeScript Type Definitions
 */

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
