import { useQuery } from "@tanstack/react-query";
import { queryKeys, QUERY_CONFIG } from "@/constants/query";
import {
  fetchActiveCategories,
  fetchBookUpdates,
  fetchHomeData,
  fetchRankingCategories,
  fetchUserShelveContinue,
  type HomeDataResponse,
} from "@/services/apiServices";
import { fetchPinnedReviews } from "@/services/api/commentApi";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const hasRenderableHomeData = (homeData: HomeDataResponse | null | undefined) => {
  const data = homeData?.data;
  if (!data) return false;
  return Boolean(
    (Array.isArray(data.slides) && data.slides.length > 0) ||
    (Array.isArray(data.groupBookHome) && data.groupBookHome.length > 0) ||
    (Array.isArray(data.spotlight) && data.spotlight.length > 0),
  );
};

// ---------------------------------------------------------------------------
// Individual query hooks
// ---------------------------------------------------------------------------

/**
 * Fetches home page data with audience-aware fallback.
 * For authenticated users, attempts an auth-scoped fetch first, falling back
 * to public data if the auth-scoped response is empty.
 */
export function useHomeData(opts: {
  contentType?: string;
  audienceKey: string;
  authToken?: string | null;
  shouldFetchAuthenticated: boolean;
  initialData: HomeDataResponse | null;
}) {
  const { contentType, audienceKey, authToken, shouldFetchAuthenticated, initialData } = opts;

  const query = useQuery({
    queryKey: queryKeys.home.data(contentType, audienceKey),
    queryFn: async () => {
      const data = await fetchHomeData(
        shouldFetchAuthenticated ? authToken : undefined,
        contentType,
        { skipAuth: !shouldFetchAuthenticated },
      );

      if (hasRenderableHomeData(data)) return data;
      if (shouldFetchAuthenticated) {
        const publicData = await fetchHomeData(undefined, contentType, { skipAuth: true });
        if (hasRenderableHomeData(publicData)) return publicData;
      }

      return data ?? initialData;
    },
    initialData,
    placeholderData: (previousData) => previousData ?? initialData,
    staleTime: shouldFetchAuthenticated ? 0 : QUERY_CONFIG.STALE_TIME_LONG,
    refetchOnMount: shouldFetchAuthenticated ? "always" : false,
    refetchOnWindowFocus: false,
  });

  // Prefer queried data, but fall back to SSR initialData when the queried
  // result has no renderable content.
  const homeData = hasRenderableHomeData(query.data) ? query.data : initialData;

  return { ...query, homeData };
}

/**
 * Fetches the latest book updates for a given tab.
 */
export function useBookUpdates(tab: string, opts: { enabled: boolean }) {
  return useQuery({
    queryKey: queryKeys.home.bookUpdates(tab),
    queryFn: () => fetchBookUpdates(tab),
    enabled: opts.enabled,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetches active categories for the category strip.
 */
export function useActiveCategories(categoryType: string, opts: { enabled: boolean }) {
  return useQuery({
    queryKey: queryKeys.home.activeCategories(categoryType),
    queryFn: () => fetchActiveCategories(categoryType),
    enabled: opts.enabled,
    staleTime: QUERY_CONFIG.STALE_TIME_VERY_LONG,
  });
}

/**
 * Fetches ranking categories for left/right ranking sections.
 */
export function useRankingCategories(tab: string, opts: { enabled: boolean }) {
  return useQuery({
    queryKey: queryKeys.home.rankingCategories(tab),
    queryFn: () => fetchRankingCategories(tab),
    enabled: opts.enabled,
  });
}

/**
 * Fetches the user's "continue reading" shelf.
 */
export function useContinueBooks(opts: { enabled: boolean }) {
  return useQuery({
    queryKey: queryKeys.home.continueBooks(),
    queryFn: () => fetchUserShelveContinue(10),
    enabled: opts.enabled,
    select: (data: any) => data?.books ?? [],
  });
}

/**
 * Fetches pinned reviews for the home page.
 */
export function usePinnedReviews(opts: { enabled: boolean }) {
  return useQuery({
    queryKey: queryKeys.home.pinnedReviews("latest", 10, 1),
    queryFn: () => fetchPinnedReviews({ sort: "latest", limit: 10, page: 1 }),
    enabled: opts.enabled,
  });
}
