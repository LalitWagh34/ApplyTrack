/**
 * useApplications Hook - Fetches, filters, and mutates job applications
 */

export function useApplications() {
  // Applications query & mutations hook
  return {
    applications: [],
    isLoading: true
  };
}
