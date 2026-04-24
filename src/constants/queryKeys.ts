/**
 * React Query configuration constants
 * Centralized query keys and configuration values
 */

/**
 * Query keys for React Query
 * Keep these as string literals to support legacy + new factory usage.
 */
export const QUERY_KEYS = {
  // User & Auth
  USER_EVENT_SUMMARY: "user-event-summary",
  USER_PROFILE: "user-profile",
  USER_SHELF: "userShelf",

  // Books
  BOOK_DETAIL: "bookDetail",
  BOOK_EPISODES: "bookEpisodes",
  BOOK_GROUPS: "bookGroups",
  BOOK_PURCHASE_DETAILS: "bookPurchaseDetails",
  BOOK_REVIEWS: "book-reviews",
  NOVEL_PACK_CHECK: "novelPackCheck",
  GROUP_EPISODES: "groupEps",

  // Navbar
  NAVBAR_NOTIFICATIONS: "navbarNotifications",
  PROMOTING_GROUPS: "promotingGroups",
  ACTIVE_TYPES: "activeTypes",
  ACTIVE_CATEGORIES: "activeCategories",
  MOBILE_CATEGORIES: "mobileCategories",

  // Cart & Store
  CART: "cart",
  CART_ITEMS: "cartItems",
  CART_SUMMARY: "cartSummary",
  CHECKOUT_ITEMS: "checkoutItems",
  CHECKOUT_ADDRESS: "checkoutAddress",

  // Coupons
  AVAILABLE_COUPONS: "available-coupons",
  USER_COUPONS: "user-coupons",

  // Shelves
  SHELVE_BOOKS: "shelve-books",
  CONTINUE_READING: "continue-reading",
  PURCHASED_BOOKS: "purchased-books",

  // Home
  HOME_DATA: "home-data",

  // Website
  WEBSITE_SETTINGS: "website-settings",

  // Search
  SEARCH_RESULTS: "search-results",
} as const;

const toQueryId = (value: string | number | null | undefined) => String(value ?? "");

/**
 * Query key factories
 * Use these to avoid hardcoded array keys and keep invalidation consistent.
 */
export const queryKeys = {
  user: {
    eventSummaryRoot: () => [QUERY_KEYS.USER_EVENT_SUMMARY] as const,
    eventSummary: (token: string | null) => [QUERY_KEYS.USER_EVENT_SUMMARY, token] as const,
    shelf: (token: string | null) => [QUERY_KEYS.USER_SHELF, token] as const,
  },
  book: {
    detail: (bookId: string | number | null | undefined) =>
      [QUERY_KEYS.BOOK_DETAIL, toQueryId(bookId)] as const,
    episodes: (bookId: string | number | null | undefined) =>
      [QUERY_KEYS.BOOK_EPISODES, toQueryId(bookId)] as const,
    groups: (bookId: string | number | null | undefined) =>
      [QUERY_KEYS.BOOK_GROUPS, toQueryId(bookId)] as const,
    purchaseDetails: (
      bookId: string | number | null | undefined,
      token?: string | null,
    ) =>
      token === undefined
        ? ([QUERY_KEYS.BOOK_PURCHASE_DETAILS, toQueryId(bookId)] as const)
        : ([QUERY_KEYS.BOOK_PURCHASE_DETAILS, toQueryId(bookId), token] as const),
    novelPackCheck: (bookId: string | number | null | undefined) =>
      [QUERY_KEYS.NOVEL_PACK_CHECK, toQueryId(bookId)] as const,
  },
  group: {
    episodes: (groupId: string | number | null | undefined) =>
      [QUERY_KEYS.GROUP_EPISODES, toQueryId(groupId)] as const,
  },
  navbar: {
    notifications: () => [QUERY_KEYS.NAVBAR_NOTIFICATIONS] as const,
    promotingGroups: () => [QUERY_KEYS.PROMOTING_GROUPS] as const,
    activeTypes: () => [QUERY_KEYS.ACTIVE_TYPES] as const,
    activeCategories: (type: string | null | undefined) =>
      [QUERY_KEYS.ACTIVE_CATEGORIES, type ?? "all"] as const,
    mobileCategories: (categoryId: string | null) =>
      [QUERY_KEYS.MOBILE_CATEGORIES, categoryId] as const,
    cartItems: () => [QUERY_KEYS.CART_ITEMS] as const,
  },
  cart: {
    items: () => [QUERY_KEYS.CART_ITEMS] as const,
    summary: () => [QUERY_KEYS.CART_SUMMARY] as const,
    checkoutItems: () => [QUERY_KEYS.CHECKOUT_ITEMS] as const,
    checkoutAddress: () => [QUERY_KEYS.CHECKOUT_ADDRESS] as const,
  },
  website: {
    settings: () => [QUERY_KEYS.WEBSITE_SETTINGS] as const,
  },
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

  // Cart
  CART_STALE_TIME: 60_000,
  CART_GC_TIME: 300_000,
} as const;

/**
 * Type helper for query keys
 */
export type QueryKey = typeof QUERY_KEYS[keyof typeof QUERY_KEYS];
