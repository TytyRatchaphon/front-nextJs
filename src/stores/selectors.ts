import { useAuthStore } from './authStore';

/**
 * Selector hook for checking if user is authenticated
 * Use this instead of accessing isAuthenticated from the store
 */
export const useIsAuthenticated = () => useAuthStore(
  (state) => state.isLoggedIn && state.user !== null && state.token !== null
);
