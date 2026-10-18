/**
 * useFollowUps Hook - Fetches pending followups and handles 1-click draft actions
 */

export function useFollowUps() {
  // Followups query and mutation handlers
  return {
    pending: [],
    isLoading: true
  };
}
