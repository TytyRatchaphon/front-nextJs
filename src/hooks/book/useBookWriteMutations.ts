import { useMutation, useQueryClient } from "@tanstack/react-query";
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

export const useBuyGroupPromotionMutation = (bookId?: string | number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { dfb_id: number; payWith: string }) => buyGroupPromotion(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookQuest.list(bookId) });
    },
  });
};

export const useBuyEpisodesMutation = (bookId?: string | number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BuyEpisodesPayload) => buyEpisodes(payload),
    onSuccess: () => {
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.episodes(bookId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
      void queryClient.invalidateQueries({ queryKey: ["bookPurchaseDetails", String(bookId ?? "")] });
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
  });
};

export const useSaveBookShareMutation = () => (
  useMutation({
    mutationFn: saveBookShare,
  })
);
