/**
 * React Query configuration constants
 * Centralized query keys and configuration values
 */

/**
 * Query keys for React Query
 * Use these constants instead of hardcoded strings
 */
export const QUERY_KEYS = {
  // User & Auth
  USER_EVENT_SUMMARY: 'user-event-summary',
  USER_PROFILE: 'user-profile',
  
  // Books
  BOOK_DETAIL: 'book-detail',
  BOOK_EPISODES: 'book-episodes',
  BOOK_REVIEWS: 'book-reviews',
  
  // Cart & Store
  CART: 'cart',
  CART_SUMMARY: 'cart-summary',
  
  // Coupons
  AVAILABLE_COUPONS: 'available-coupons',
  USER_COUPONS: 'user-coupons',
  
  // Shelves
  SHELVE_BOOKS: 'shelve-books',
  CONTINUE_READING: 'continue-reading',
  PURCHASED_BOOKS: 'purchased-books',
  
  // Home
  HOME_DATA: 'home-data',
  
  // Search
  SEARCH_RESULTS: 'search-results',
} as const;

/**
 * React Query configuration values
 * Standardized stale times, retry counts, etc.
 */
export const QUERY_CONFIG = {
  // Stale times (in milliseconds)
  STALE_TIME_SHORT: 10_000,      // 10 seconds
  STALE_TIME_MEDIUM: 30_000,     // 30 seconds
  STALE_TIME_LONG: 60_000,       // 1 minute
  STALE_TIME_VERY_LONG: 300_000, // 5 minutes
  
  // Retry configuration
  RETRY_COUNT: 1,
  RETRY_COUNT_IMPORTANT: 3,
  
  // Cache times
  CACHE_TIME_DEFAULT: 300_000,   // 5 minutes
  CACHE_TIME_LONG: 600_000,      // 10 minutes
} as const;

/**
 * Type helper for query keys
 */
export type QueryKey = typeof QUERY_KEYS[keyof typeof QUERY_KEYS];
