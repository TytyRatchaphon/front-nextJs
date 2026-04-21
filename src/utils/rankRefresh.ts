import type { QueryClient } from "@tanstack/react-query";

export const NAVBAR_RANK_QUERY_BASE_KEY = "navbarRankProfile";

export const getNavbarRankQueryKey = (userId?: number | string | null) => (
  [NAVBAR_RANK_QUERY_BASE_KEY, userId ?? "anonymous"] as const
);

export const requestNavbarRankRefresh = (
  queryClient: QueryClient,
  userId?: number | string | null,
): Promise<void> => {
  const queryKey = userId === undefined || userId === null
    ? [NAVBAR_RANK_QUERY_BASE_KEY]
    : getNavbarRankQueryKey(userId);

  return queryClient
    .refetchQueries({
      queryKey,
      type: "active",
    })
    .then(() => undefined);
};
