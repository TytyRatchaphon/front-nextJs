import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys, QUERY_CONFIG } from "@/constants/query";
import {
  claimBookQuest,
  fetchBookQuests,
  type BookQuest,
} from "@/services/api/bookQuestApi";

export const useBookQuests = (
  bookId?: number | string | null,
  enabled = true,
) => (
  useQuery({
    queryKey: queryKeys.bookQuest.list(bookId),
    queryFn: () => fetchBookQuests(bookId),
    enabled: enabled && Boolean(bookId),
    staleTime: QUERY_CONFIG.STALE_TIME_SHORT,
    retry: QUERY_CONFIG.RETRY_COUNT,
  })
);

export const useClaimBookQuestMutation = (bookId?: number | string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quest: Pick<BookQuest, "book_quest_id">) => claimBookQuest(quest.book_quest_id),
    onSuccess: (_data, quest) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookQuest.list(bookId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
    },
  });
};
