import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query";

export const requestNavbarRankRefresh = (
  queryClient: QueryClient,
  userId?: number | string | null,
): Promise<void> => {
  const queryKey = userId === undefined || userId === null
    ? queryKeys.rank.navbarProfileRoot()
    : queryKeys.rank.navbarProfile(userId);

  return queryClient
    .refetchQueries({
      queryKey,
      type: "active",
    })
    .then(() => undefined);
};
