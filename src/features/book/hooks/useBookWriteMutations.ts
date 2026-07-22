import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  addBookToShelf,
  buyFullBook,
  buyEpisodes,
  buyGroupPromotion,
  removeBookFromShelf,
  saveBookShare,
  type BuyEpisodesPayload,
  type FullBookPurchasePayload,
} from "@/services/api/bookApi";
import { queryKeys } from "@/constants/query";

const removeReadEpisodeContentCache = (
  queryClient: QueryClient,
  episodeIds?: readonly (number | string | null | undefined)[],
) => {
  const normalizedIds = (episodeIds ?? [])
    .map((episodeId) => String(episodeId ?? "").trim())
    .filter(Boolean);

  if (normalizedIds.length === 0) {
    queryClient.removeQueries({ queryKey: queryKeys.read.episodeContentRoot() });
    return;
  }

  for (const episodeId of normalizedIds) {
    queryClient.removeQueries({
      queryKey: queryKeys.read.episodeContent(episodeId),
      exact: true,
    });
  }
};

export const useBuyGroupPromotionMutation = (bookId?: string | number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { dfb_id: number; payWith: string }) => buyGroupPromotion(payload),
    onSuccess: () => {
      removeReadEpisodeContentCache(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookQuest.list(bookId) });
    },
  });
};

export const useBuyEpisodesMutation = (bookId?: string | number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BuyEpisodesPayload) => buyEpisodes(payload),
    onSuccess: (_data, variables) => {
      removeReadEpisodeContentCache(queryClient, variables.eps);
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.episodes(bookId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookQuest.list(bookId) });
    },
  });
};

export const useBuyFullBookMutation = (bookId?: string | number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FullBookPurchasePayload) => buyFullBook(payload),
    onSuccess: () => {
      removeReadEpisodeContentCache(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.episodes(bookId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.purchaseDetails(bookId, null) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookQuest.list(bookId) });
    },
  });
};

export const useAddBookToShelfMutation = (bookId?: string | number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => addBookToShelf(String(bookId ?? "")),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.shelfRoot() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.shelveRoot() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
    },
    onError: (error: any) => {
      console.error("Failed to add book to shelf:", error);
    },
  });
};

export const useRemoveBookFromShelfMutation = (bookId?: string | number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeBookFromShelf(String(bookId ?? "")),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.shelfRoot() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.shelveRoot() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
    },
    onError: (error: any) => {
      console.error("Failed to remove book from shelf:", error);
    },
  });
};

export const useSaveBookShareMutation = () => (
  useMutation({
    mutationFn: saveBookShare,
  })
);
