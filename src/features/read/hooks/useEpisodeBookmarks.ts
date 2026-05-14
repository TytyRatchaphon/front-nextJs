import { useCallback, useState } from "react";
import { Modal } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query";
import apiClient from "@/services/apiClient";
import type { EpisodeBookmark } from "../readerContentUtils";

type BookmarkNotificationArgs = {
  message: string;
  description?: string;
  placement?: "topRight";
};

type BookmarkNotificationApi = {
  success: (args: BookmarkNotificationArgs) => void;
  error: (args: BookmarkNotificationArgs) => void;
  warning: (args: BookmarkNotificationArgs) => void;
};

type UseEpisodeBookmarksParams = {
  bookId: string;
  episodeId: string;
  isLoggedIn: boolean;
  notification: BookmarkNotificationApi;
};

export function useEpisodeBookmarks({
  bookId,
  episodeId,
  isLoggedIn,
  notification,
}: UseEpisodeBookmarksParams) {
  const queryClient = useQueryClient();
  const [isBookmarkPopoverOpen, setIsBookmarkPopoverOpen] = useState(false);
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [bookmarkParagraphIndex, setBookmarkParagraphIndex] = useState<number | null>(null);
  const [editingBookmarkId, setEditingBookmarkId] = useState<number | null>(null);

  const { data: bookmarks = [], isFetching: isFetchingBookmarks } = useQuery<EpisodeBookmark[]>({
    queryKey: queryKeys.read.episodeBookmarks(episodeId),
    queryFn: async () => {
      const res = await apiClient.get("/user/bookmarks", { params: { ep_id: Number(episodeId) } });
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      return list
        .map((item: any) => ({
          id: Number(item?.id),
          ep_id: Number(item?.ep_id),
          paragraph_index: Number(item?.paragraph_index),
          note: item?.note,
          created_at: item?.created_at,
        }))
        .filter((item: EpisodeBookmark) => Number.isFinite(item.paragraph_index) && item.paragraph_index > 0)
        .sort((a: EpisodeBookmark, b: EpisodeBookmark) => a.paragraph_index - b.paragraph_index);
    },
    enabled: !!episodeId && isLoggedIn,
    staleTime: 30 * 1000,
  });

  const invalidateEpisodeBookmarks = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.read.episodeBookmarks(episodeId) });
  }, [queryClient, episodeId]);

  const resetBookmarkEditorState = useCallback(() => {
    setBookmarkModalOpen(false);
    setBookmarkNote("");
    setBookmarkParagraphIndex(null);
    setEditingBookmarkId(null);
  }, []);

  const createBookmarkMutation = useMutation({
    mutationFn: async (payload: { paragraph_index: number; note: string }) => {
      return apiClient.post("/user/bookmarks", {
        book_id: Number(bookId),
        ep_id: Number(episodeId),
        paragraph_index: payload.paragraph_index,
        note: payload.note,
      });
    },
    onSuccess: () => {
      notification.success({ message: "บันทึกตำแหน่งสำเร็จ", placement: "topRight" });
      void invalidateEpisodeBookmarks();
      resetBookmarkEditorState();
    },
    onError: (err: any) => {
      notification.error({ message: err?.response?.data?.message || "บันทึกตำแหน่งไม่สำเร็จ", placement: "topRight" });
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: async (payload: { bookmark_id: number; note: string }) => {
      return apiClient.patch("/user/bookmarks", payload);
    },
    onSuccess: () => {
      notification.success({ message: "แก้ไข Bookmark สำเร็จ", placement: "topRight" });
      void invalidateEpisodeBookmarks();
      resetBookmarkEditorState();
    },
    onError: (err: any) => {
      notification.error({ message: err?.response?.data?.message || "แก้ไข Bookmark ไม่สำเร็จ", placement: "topRight" });
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: async (bookmarkId: number) => {
      return apiClient.delete("/user/bookmarks", { data: { bookmark_ids: [bookmarkId] } });
    },
    onSuccess: () => {
      notification.success({ message: "ลบ Bookmark สำเร็จ", placement: "topRight" });
      void invalidateEpisodeBookmarks();
    },
    onError: (err: any) => {
      notification.error({ message: err?.response?.data?.message || "ลบ Bookmark ไม่สำเร็จ", placement: "topRight" });
    },
  });

  const openBookmarkModalAtIndex = useCallback((paragraphIndex: number) => {
    const existing = bookmarks.find((item) => item.paragraph_index === paragraphIndex);
    if (existing) {
      setEditingBookmarkId(existing.id);
      setBookmarkParagraphIndex(existing.paragraph_index);
      setBookmarkNote(existing.note || "");
      setBookmarkModalOpen(true);
      return;
    }

    setEditingBookmarkId(null);
    setBookmarkParagraphIndex(paragraphIndex);
    setBookmarkNote("");
    setBookmarkModalOpen(true);
  }, [bookmarks]);

  const openEditBookmarkModal = useCallback((bookmark: EpisodeBookmark) => {
    setEditingBookmarkId(bookmark.id);
    setBookmarkParagraphIndex(bookmark.paragraph_index);
    setBookmarkNote(bookmark.note || "");
    setBookmarkModalOpen(true);
  }, []);

  const handleDeleteBookmark = useCallback((bookmarkId: number) => {
    Modal.confirm({
      title: "ลบ Bookmark",
      content: "ยืนยันการลบบุ๊กมาร์กนี้?",
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true, loading: deleteBookmarkMutation.isPending },
      onOk: async () => {
        await deleteBookmarkMutation.mutateAsync(bookmarkId);
      },
    });
  }, [deleteBookmarkMutation]);

  const submitBookmarkModal = useCallback(() => {
    if (!bookmarkParagraphIndex) {
      notification.warning({ message: "ไม่พบย่อหน้าที่ต้องการบันทึก", placement: "topRight" });
      return;
    }

    if (editingBookmarkId) {
      updateBookmarkMutation.mutate({
        bookmark_id: editingBookmarkId,
        note: bookmarkNote.trim() || `Bookmark ย่อหน้า ${bookmarkParagraphIndex}`,
      });
      return;
    }

    createBookmarkMutation.mutate({
      paragraph_index: bookmarkParagraphIndex,
      note: bookmarkNote.trim() || `Bookmark ย่อหน้า ${bookmarkParagraphIndex}`,
    });
  }, [
    bookmarkNote,
    bookmarkParagraphIndex,
    createBookmarkMutation,
    editingBookmarkId,
    notification,
    updateBookmarkMutation,
  ]);

  return {
    bookmarks,
    isFetchingBookmarks,
    isBookmarkPopoverOpen,
    setIsBookmarkPopoverOpen,
    bookmarkModalOpen,
    bookmarkNote,
    setBookmarkNote,
    bookmarkParagraphIndex,
    editingBookmarkId,
    isSavingBookmark: createBookmarkMutation.isPending || updateBookmarkMutation.isPending,
    resetBookmarkEditorState,
    openBookmarkModalAtIndex,
    openEditBookmarkModal,
    handleDeleteBookmark,
    submitBookmarkModal,
  };
}
