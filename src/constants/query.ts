/**
 * React Query configuration constants
 * Centralized query keys and configuration values
 */

/**
 * Query key factories
 * Use these when a query key is shared between hooks, prefetching, and invalidation.
 */
export const queryKeys = {
  story: {
    bar: () => ["storyBar"] as const,
    manageRoot: () => ["story-manage"] as const,
    groupItems: (
      groupType: string,
      groupId: string,
      startRefId?: number | null,
    ) => [
      "story-group-items",
      String(groupType),
      String(groupId),
      String(startRefId ?? ""),
    ] as const,
  },
  book: {
    detailRoot: () => ["bookDetail"] as const,
    detail: (bookId: number | string | null | undefined) =>
      ["bookDetail", String(bookId ?? "")] as const,
    episodesRoot: () => ["bookEpisodes"] as const,
    episodes: (bookId: number | string | null | undefined) =>
      ["bookEpisodes", String(bookId ?? "")] as const,
    episodesForUser: (
      bookId: number | string | null | undefined,
      authScope?: string | null,
    ) => ["bookEpisodes", String(bookId ?? ""), authScope ?? null] as const,
    purchaseDetails: (
      bookId: number | string | null | undefined,
      authScope?: string | null,
    ) => ["bookPurchaseDetails", String(bookId ?? ""), authScope ?? null] as const,
    novelPackCheck: (bookId: number | string | null | undefined) =>
      ["novelPackCheck", String(bookId ?? "")] as const,
  },
  bookQuest: {
    listRoot: () => ["book-quest-list"] as const,
    list: (bookId?: number | string | null) =>
      ["book-quest-list", String(bookId ?? "")] as const,
  },
  user: {
    eventSummaryRoot: () => ["user-event-summary"] as const,
    eventSummary: (authScope?: string | null) =>
      ["user-event-summary", authScope ?? null] as const,
    shelfRoot: () => ["userShelf"] as const,
    shelf: (authScope?: string | null) => ["userShelf", authScope ?? null] as const,
    shelveRoot: () => ["userShelve"] as const,
    shelve: (page?: number | string | null) => ["userShelve", page ?? null] as const,
    shelveContinueRoot: () => ["userShelveContinue"] as const,
    shelveContinue: (
      userId: number | string | null | undefined,
      page?: number | string | null,
    ) => ["userShelveContinue", userId ?? null, page ?? null] as const,
    shelveBuyRoot: () => ["userShelveBuy"] as const,
    shelveBuy: (
      userId: number | string | null | undefined,
      page?: number | string | null,
    ) => ["userShelveBuy", userId ?? null, page ?? null] as const,
    hasPaymentHistory: (userId: number | string | null | undefined) =>
      ["hasPaymentHistory", String(userId ?? "")] as const,
  },
  cart: {
    items: () => ["cartItems"] as const,
    summary: () => ["cartSummary"] as const,
    checkoutItems: () => ["checkoutItems"] as const,
    checkoutAddress: () => ["checkoutAddress"] as const,
    checkoutSummary: () => ["checkoutSummary"] as const,
  },
  notifications: {
    navbar: () => ["navbarNotifications"] as const,
    allRoot: () => ["allNotifications"] as const,
    all: (tab?: string | null, page?: number | string | null) =>
      ["allNotifications", tab ?? null, page ?? null] as const,
  },
  read: {
    episodeContentRoot: () => ["episodeContent"] as const,
    episodeContent: (episodeId: number | string | null | undefined) =>
      ["episodeContent", String(episodeId ?? "")] as const,
    episodeBookmarks: (episodeId: number | string | null | undefined) =>
      ["episodeBookmarks", String(episodeId ?? "")] as const,
  },
  website: {
    settings: () => ["website-settings"] as const,
  },
  rank: {
    navbarProfileRoot: () => ["navbarRankProfile"] as const,
    navbarProfile: (userId?: number | string | null) =>
      ["navbarRankProfile", userId ?? "anonymous"] as const,
    quests: () => ["rank-quests"] as const,
    questDetails: () => ["rank-quest-detail"] as const,
    questDetail: (questId: number | string | null | undefined) =>
      ["rank-quest-detail", String(questId ?? '')] as const,
  },
  royalePass: {
    list: () => ["royale-pass"] as const,
    detail: (passId: number | string | null | undefined) =>
      ["royale-pass", String(passId ?? "")] as const,
  },
  home: {
    dataRoot: () => ["homeData"] as const,
    data: (contentType?: string | null, audienceKey?: string | null) =>
      ["homeData", contentType || "default", audienceKey ?? "guest"] as const,
    bookUpdatesRoot: () => ["bookUpdates"] as const,
    bookUpdates: (tab?: string | null) =>
      ["bookUpdates", tab ?? "novel"] as const,
    activeCategoriesRoot: () => ["activeCategories"] as const,
    activeCategories: (categoryType?: string | null) =>
      ["activeCategories", categoryType ?? "all"] as const,
    rankingCategoriesRoot: () => ["rankingCategories"] as const,
    rankingCategories: (tab?: string | null) =>
      ["rankingCategories", tab ?? "novel"] as const,
    continueBooks: () => ["continueBooks"] as const,
    pinnedReviews: (sort?: string | null, limit?: number, page?: number) =>
      ["pinnedReviews", sort ?? "latest", limit ?? 10, page ?? 1] as const,
  },
  bookUpdates: {
    calendar: (scope?: string | null, contentType?: string | null) =>
      ["book-update-calendar", scope ?? "all", contentType ?? "all"] as const,
    daily: (
      date?: string | null,
      scope?: string | null,
      contentType?: string | null,
      page?: number | string | null,
      limit?: number | string | null,
      sort?: string | null,
    ) =>
      [
        "book-update-daily",
        date ?? "",
        scope ?? "all",
        contentType ?? "all",
        page ?? 1,
        limit ?? 20,
        sort ?? "publish_time",
      ] as const,
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
type QueryKeyFactory = (...args: any[]) => readonly unknown[];
type ExtractQueryKeys<T> = T extends QueryKeyFactory
  ? ReturnType<T>
  : T extends Record<string, unknown>
    ? { [K in keyof T]: ExtractQueryKeys<T[K]> }[keyof T]
    : never;

export type QueryKey = ExtractQueryKeys<typeof queryKeys>;
