import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import { cachedRequest } from "../requestCache";
import {
  clearSearchHistory,
  deleteAllNotifications,
  deleteNotifications,
  deleteSearchHistory,
  fetchActiveCategories,
  fetchActiveTypes,
  fetchAllCategories,
  fetchAllNotifications,
  fetchBookCategoryAll,
  fetchCategoryBanners,
  fetchCategoryBooks,
  fetchFaqs,
  fetchPopularSearches,
  fetchRecentNotifications,
  fetchSearchSuggestions,
  followPromotion,
  getSearchHistory,
  logActivity,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  postCommentNotification,
  postCommentReplyNotification,
  postReviewNotification,
  postReviewReplyNotification,
  saveSearchHistory,
  syncReadingProgress,
  unfollowPromotion,
  updateReadingProgress,
} from "./miscApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../requestCache", () => ({
  cachedRequest: vi.fn(),
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};
const mockedCachedRequest = cachedRequest as unknown as ReturnType<typeof vi.fn>;

describe("miscApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("activity and reading progress", () => {
    it("logActivity returns response data and null fallback with console error", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(logActivity({ action: "view", path: "/home" })).resolves.toEqual({
        code: 200,
      });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/log/activity", {
        action: "view",
        path: "/home",
      });

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockedApiClient.post.mockRejectedValueOnce(new Error("log-failed"));
      await expect(logActivity({ action: "x" })).resolves.toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("syncReadingProgress and updateReadingProgress stringify ids and fallback null", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(syncReadingProgress(123)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/reading-progress/sync", {
        ep_id: "123",
      });

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(updateReadingProgress("10", 20, 77)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/reading-progress/update", {
        book_id: "10",
        ep_id: "20",
        progress: 77,
      });

      mockedApiClient.post.mockRejectedValueOnce(new Error("sync-failed"));
      await expect(syncReadingProgress(1)).resolves.toBeNull();

      mockedApiClient.post.mockRejectedValueOnce(new Error("update-failed"));
      await expect(updateReadingProgress(1, 2, 3)).resolves.toBeNull();
    });
  });

  describe("categories and active data", () => {
    it("fetchBookCategoryAll/fetchAllCategories return data or []", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
      await expect(fetchBookCategoryAll()).resolves.toEqual([{ id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/book-category/all");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchBookCategoryAll()).resolves.toEqual([]);

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 2 }] } });
      await expect(fetchAllCategories()).resolves.toEqual([{ id: 2 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/book-category/all");

      mockedApiClient.get.mockRejectedValueOnce(new Error("fetch-categories-failed"));
      await expect(fetchAllCategories()).resolves.toEqual([]);
    });

    it("fetchCategoryBooks passes params and fallback null", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(fetchCategoryBooks("write", "all", "bestseller", 2, 30, "30")).resolves.toEqual({
        code: 200,
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/book-category/list", {
        params: {
          type: "write",
          categoryId: "all",
          tab: "bestseller",
          limit: 30,
          page: 2,
          period: "30",
        },
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("category-books-failed"));
      await expect(fetchCategoryBooks("write", "all")).resolves.toBeNull();
    });

    it("fetchCategoryBanners validates array payload", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ banner_id: 1 }] } });
      await expect(fetchCategoryBanners()).resolves.toEqual([{ banner_id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/book-category/banner");

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: null } });
      await expect(fetchCategoryBanners()).resolves.toEqual([]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("banner-failed"));
      await expect(fetchCategoryBanners()).resolves.toEqual([]);
    });

    it("fetchActiveTypes/fetchActiveCategories return [] fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ type: "all" }] } });
      await expect(fetchActiveTypes()).resolves.toEqual([{ type: "all" }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/active-types");

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: "all", name: "All" }] } });
      await expect(fetchActiveCategories()).resolves.toEqual([{ id: "all", name: "All" }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/active-categories", {
        params: { type: "all" },
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("types-failed"));
      await expect(fetchActiveTypes()).resolves.toEqual([]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("active-categories-failed"));
      await expect(fetchActiveCategories("tran")).resolves.toEqual([]);
    });
  });

  describe("notifications", () => {
    it("fetchRecentNotifications maps list and [] fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { recent_notifications: [{ id: 1 }] } },
      });
      await expect(fetchRecentNotifications("comment")).resolves.toEqual([{ id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        "/user/notifications/recent/unread",
        { params: { tab: "comment" } }
      );

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { recent_notifications: null } } });
      await expect(fetchRecentNotifications()).resolves.toEqual([]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("recent-failed"));
      await expect(fetchRecentNotifications()).resolves.toEqual([]);
    });

    it("fetchAllNotifications supports array and wrapped response shapes", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: [{ id: 11 }],
          pagination: { page: 1 },
        },
      });
      await expect(fetchAllNotifications(2, 15, "all")).resolves.toEqual({
        notifications: [{ id: 11 }],
        pagination: { page: 1 },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/notifications", {
        params: { page: 2, limit: 15, tab: "all" },
      });

      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: { notifications: [{ id: 12 }], pagination: { page: 2 } },
        },
      });
      await expect(fetchAllNotifications()).resolves.toEqual({
        notifications: [{ id: 12 }],
        pagination: { page: 2 },
      });

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: null } });
      await expect(fetchAllNotifications()).resolves.toEqual({ notifications: [] });

      mockedApiClient.get.mockRejectedValueOnce(new Error("all-failed"));
      await expect(fetchAllNotifications()).resolves.toEqual({ notifications: [] });
    });

    it("mark/read/delete/follow notification helpers return data or null", async () => {
      mockedApiClient.patch.mockResolvedValueOnce({ data: { ok: true } });
      await expect(markNotificationAsRead(50)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.patch).toHaveBeenCalledWith("/user/notifications/50/read");

      mockedApiClient.patch.mockResolvedValueOnce({ data: { ok: true } });
      await expect(markAllNotificationsAsRead("system")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        "/user/notifications/read-all",
        null,
        { params: { tab: "system" } }
      );

      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
      await expect(deleteNotifications([1, 2])).resolves.toEqual({ ok: true });
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/user/notifications", {
        data: { ids: [1, 2] },
      });

      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
      await expect(deleteAllNotifications()).resolves.toEqual({ ok: true });
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/user/notifications/all");

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(followPromotion({ type: "campaign", ref_id: 1 })).resolves.toEqual({
        ok: true,
      });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/follow-promotion", {
        type: "campaign",
        ref_id: 1,
      });

      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
      await expect(unfollowPromotion({ type: "campaign", ref_id: 1 })).resolves.toEqual({
        ok: true,
      });
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/follow-promotion", {
        data: { type: "campaign", ref_id: 1 },
      });

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(postCommentNotification(1)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/notifications/comments/1", {});

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(postReviewNotification(2)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/notifications/reviews/2", {});

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(postReviewReplyNotification(3)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/user/notifications/reviews/replies/3",
        {}
      );

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(postCommentReplyNotification(4)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/user/notifications/comments/replies/4",
        {}
      );

      mockedApiClient.patch.mockRejectedValueOnce(new Error("mark-failed"));
      await expect(markNotificationAsRead(1)).resolves.toBeNull();

      mockedApiClient.patch.mockRejectedValueOnce(new Error("mark-all-failed"));
      await expect(markAllNotificationsAsRead()).resolves.toBeNull();

      mockedApiClient.delete.mockRejectedValueOnce(new Error("delete-failed"));
      await expect(deleteNotifications([1])).resolves.toBeNull();

      mockedApiClient.delete.mockRejectedValueOnce(new Error("delete-all-failed"));
      await expect(deleteAllNotifications()).resolves.toBeNull();

      mockedApiClient.post.mockRejectedValueOnce(new Error("follow-failed"));
      await expect(followPromotion({ type: "x", ref_id: 1 })).resolves.toBeNull();

      mockedApiClient.delete.mockRejectedValueOnce(new Error("unfollow-failed"));
      await expect(unfollowPromotion({ type: "x", ref_id: 1 })).resolves.toBeNull();

      mockedApiClient.post.mockRejectedValueOnce(new Error("comment-noti-failed"));
      await expect(postCommentNotification(1)).resolves.toBeNull();

      mockedApiClient.post.mockRejectedValueOnce(new Error("review-noti-failed"));
      await expect(postReviewNotification(1)).resolves.toBeNull();

      mockedApiClient.post.mockRejectedValueOnce(new Error("review-reply-noti-failed"));
      await expect(postReviewReplyNotification(1)).resolves.toBeNull();

      mockedApiClient.post.mockRejectedValueOnce(new Error("comment-reply-noti-failed"));
      await expect(postCommentReplyNotification(1)).resolves.toBeNull();
    });
  });

  describe("faq and search", () => {
    it("fetchFaqs uses cachedRequest and returns fallback []", async () => {
      mockedCachedRequest.mockResolvedValueOnce([{ id: 1, question: "Q", answer: "A" }]);
      await expect(fetchFaqs()).resolves.toEqual([{ id: 1, question: "Q", answer: "A" }]);
      const [cacheKey, fetcher, options] = mockedCachedRequest.mock.calls[0];
      expect(cacheKey).toBe("faq:list");
      expect(typeof fetcher).toBe("function");
      expect(options).toEqual({ ttlMs: 10 * 60 * 1000 });

      mockedCachedRequest.mockRejectedValueOnce(new Error("faq-cache-failed"));
      await expect(fetchFaqs()).resolves.toEqual([]);
    });

    it("search history helpers return booleans/list based on code", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 200, data: [{ id: 1 }] } });
      await expect(getSearchHistory()).resolves.toEqual([{ id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/book/search/history");

      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 500, data: [{ id: 2 }] } });
      await expect(getSearchHistory()).resolves.toEqual([]);

      mockedApiClient.delete.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(deleteSearchHistory(7)).resolves.toBe(true);
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/book/search/history/7");

      mockedApiClient.delete.mockResolvedValueOnce({ data: { code: 500 } });
      await expect(deleteSearchHistory(7)).resolves.toBe(false);

      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(saveSearchHistory("abc")).resolves.toBe(true);
      expect(mockedApiClient.post).toHaveBeenCalledWith("/book/search/history", {
        keyword: "abc",
      });

      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 500 } });
      await expect(saveSearchHistory("abc")).resolves.toBe(false);

      mockedApiClient.delete.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(clearSearchHistory()).resolves.toBe(true);
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/book/search/history");

      mockedApiClient.delete.mockResolvedValueOnce({ data: { code: 500 } });
      await expect(clearSearchHistory()).resolves.toBe(false);
    });

    it("popular and suggestion search APIs return data on code 200", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 200, data: [{ normalized_keyword: "x" }] } });
      await expect(fetchPopularSearches(9)).resolves.toEqual([{ normalized_keyword: "x" }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/book/search/popular", {
        params: { limit: 9 },
      });

      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 500, data: [{ normalized_keyword: "x" }] } });
      await expect(fetchPopularSearches()).resolves.toEqual([]);

      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 200, data: [{ normalized_keyword: "abc" }] } });
      await expect(fetchSearchSuggestions("abc")).resolves.toEqual([{ normalized_keyword: "abc" }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/book/search/suggest", {
        params: { q: "abc" },
      });

      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 500, data: [{ normalized_keyword: "abc" }] } });
      await expect(fetchSearchSuggestions("abc")).resolves.toEqual([]);
    });

    it("search helpers fallback on errors", async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error("history-failed"));
      await expect(getSearchHistory()).resolves.toEqual([]);

      mockedApiClient.delete.mockRejectedValueOnce(new Error("delete-history-failed"));
      await expect(deleteSearchHistory(1)).resolves.toBe(false);

      mockedApiClient.post.mockRejectedValueOnce(new Error("save-history-failed"));
      await expect(saveSearchHistory("x")).resolves.toBe(false);

      mockedApiClient.delete.mockRejectedValueOnce(new Error("clear-history-failed"));
      await expect(clearSearchHistory()).resolves.toBe(false);

      mockedApiClient.get.mockRejectedValueOnce(new Error("popular-failed"));
      await expect(fetchPopularSearches()).resolves.toEqual([]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("suggest-failed"));
      await expect(fetchSearchSuggestions("a")).resolves.toEqual([]);
    });
  });
});
