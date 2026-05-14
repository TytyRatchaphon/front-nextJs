import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  addBookToShelf,
  buyEpisodes,
  buyGroupPromotion,
  fetchBookDetail,
  fetchBookEpisodes,
  fetchNewNovels,
  fetchBookPromotionOptions,
  fetchBookPromotions,
  fetchBookPurchaseDetails,
  fetchBookRecommendation,
  fetchBookTrans,
  fetchBookTransById,
  fetchLatestReadEpisode,
  fetchMyBookDetail,
  fetchNovelPackCheck,
  postBookClick,
  removeBookFromShelf,
  resolveBookId,
  resolveEpisodeId,
  saveBookShare,
} from "./bookApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe("bookApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchBookTrans", () => {
    it("returns [] when response.data is not an array", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ book_id: 1 }] } });
      await expect(fetchBookTrans()).resolves.toEqual([]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/getAllBookHome");
    });

    it("returns array payload directly and handles request error", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: [{ book_id: 2 }] });
      await expect(fetchBookTrans()).resolves.toEqual([{ book_id: 2 }]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("book-trans-failed"));
      await expect(fetchBookTrans()).resolves.toEqual([]);
    });
  });

  describe("fetchNewNovels", () => {
    it("uses strict /books/new contract when available", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          code: 200,
          data: {
            books: [{ book_id: 11 }],
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
              nextPage: null,
              prevPage: null,
            },
          },
        },
      });

      await expect(fetchNewNovels(1, 20, "all")).resolves.toEqual({
        books: [{ book_id: 11 }],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          nextPage: null,
          prevPage: null,
        },
        degradedMode: false,
        source: "books_new",
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/books/new", {
        params: { page: 1, limit: 20, content_type: "all" },
      });
    });

    it("falls back only when /books/new is unavailable (404/405)", async () => {
      mockedApiClient.get
        .mockRejectedValueOnce({ response: { status: 404 } })
        .mockResolvedValueOnce({
          data: {
            data: {
              books: [
                { book_id: 1, content_type: "novel" },
                { book_id: 2, content_type: "novel_pack" },
              ],
              pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
            },
          },
        });

      await expect(fetchNewNovels(1, 20, "novel_pack")).resolves.toEqual({
        books: [{ book_id: 2, content_type: "novel_pack" }],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          nextPage: null,
          prevPage: null,
        },
        degradedMode: true,
        source: "book_search_fallback",
      });
      expect(mockedApiClient.get).toHaveBeenNthCalledWith(1, "/books/new", {
        params: { page: 1, limit: 20, content_type: "novel_pack" },
      });
      expect(mockedApiClient.get).toHaveBeenNthCalledWith(2, "/book/search", {
        params: {
          page: 1,
          limit: 20,
          content_type: "novel_pack",
          sortBy: "date_at",
          order: "DESC",
        },
      });
    });

    it("does not fallback for non-404/405 errors", async () => {
      mockedApiClient.get.mockRejectedValueOnce({ response: { status: 500 } });
      await expect(fetchNewNovels(1, 20, "all")).resolves.toBeNull();
      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchBookTransById", () => {
    it("returns first element when data is array", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: [{ book_id: 10 }, { book_id: 11 }] },
      });
      await expect(fetchBookTransById("10")).resolves.toEqual({ book_id: 10 });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/book/10");
    });

    it("returns nested book when data.book exists", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { book: { book_id: 20 } } },
      });
      await expect(fetchBookTransById("20")).resolves.toEqual({ book_id: 20 });
    });

    it("returns object payload when data is object", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { book_id: 30 } },
      });
      await expect(fetchBookTransById("30")).resolves.toEqual({ book_id: 30 });
    });

    it("throws for missing response data and empty array", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: null });
      await expect(fetchBookTransById("1")).rejects.toThrow();

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [] } });
      await expect(fetchBookTransById("1")).rejects.toThrow();
    });

    it("returns primitive payload when API returns non-array primitive", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: "invalid-shape" } });
      await expect(fetchBookTransById("1")).resolves.toBe("invalid-shape");
    });

    it("rethrows request errors", async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error("detail-failed"));
      await expect(fetchBookTransById("1")).rejects.toThrow("detail-failed");
    });
  });

  describe("fetchBookDetail and fetchMyBookDetail", () => {
    it("returns book payload from the single detail request", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { book_id: 100 } },
      });
      await expect(fetchBookDetail("100")).resolves.toEqual({ book_id: 100 });
      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/bookdetail/100");

      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { book_id: 101 } },
      });
      await expect(fetchMyBookDetail("101")).resolves.toEqual({ book_id: 101 });
      expect(mockedApiClient.get).toHaveBeenCalledTimes(2);
      expect(mockedApiClient.get).toHaveBeenLastCalledWith("/bookdetail/101");
    });

    it("supports direct object payloads without retrying the same endpoint", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { book_id: 200 } });

      await expect(fetchBookDetail("200")).resolves.toEqual({ book_id: 200 });
      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/bookdetail/200");
    });

    it("throws when request fails or payload is missing", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: null });
      await expect(fetchBookDetail("300")).rejects.toThrow();
      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);

      mockedApiClient.get.mockRejectedValueOnce(new Error("detail-failed"));
      await expect(fetchMyBookDetail("301")).rejects.toThrow("detail-failed");
      expect(mockedApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe("fetchBookEpisodes", () => {
    it("returns response.data.data when code is 200", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { code: 200, data: { groups: [{ list: [{ ep_id: 1 }] }] } },
      });
      await expect(fetchBookEpisodes(500)).resolves.toEqual({
        groups: [{ list: [{ ep_id: 1 }] }],
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/bookgroup/500");
    });

    it("throws on invalid payload and rethrows request errors", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { code: 500, data: null },
      });
      await expect(fetchBookEpisodes(1)).rejects.toThrow();

      mockedApiClient.get.mockRejectedValueOnce(new Error("episodes-failed"));
      await expect(fetchBookEpisodes(1)).rejects.toThrow("episodes-failed");
    });
  });

  describe("book detail helpers", () => {
    it("fetchBookPurchaseDetails returns data or null", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { canBuy: true } } });
      await expect(fetchBookPurchaseDetails(99)).resolves.toEqual({ canBuy: true });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/bookdetail/purchase/99");

      mockedApiClient.get.mockRejectedValueOnce(new Error("purchase-failed"));
      await expect(fetchBookPurchaseDetails(99)).resolves.toBeNull();
    });

    it("fetchBookRecommendation returns array only for code 200 + array", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { code: 200, data: [{ book_id: 1 }] },
      });
      await expect(fetchBookRecommendation(1)).resolves.toEqual([{ book_id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/bookdetail/recommend/1", {
        params: { limit: 5 },
      });

      mockedApiClient.get.mockResolvedValueOnce({
        data: { code: 200, data: null },
      });
      await expect(fetchBookRecommendation(1)).resolves.toEqual([]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("recommend-failed"));
      await expect(fetchBookRecommendation(1)).resolves.toEqual([]);
    });

    it("fetchBookPromotionOptions returns array only when code 200 + array", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { code: 200, data: [{ dfb_id: 1 }] },
      });
      await expect(fetchBookPromotionOptions(5)).resolves.toEqual([{ dfb_id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/pack-campaign/buying-options/5");

      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 500, data: [{ dfb_id: 2 }] } });
      await expect(fetchBookPromotionOptions(5)).resolves.toEqual([]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("promotion-options-failed"));
      await expect(fetchBookPromotionOptions(5)).resolves.toEqual([]);
    });

    it("fetchNovelPackCheck maps payload safely and returns null fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { btn_novel: 10, btn_novel_pack: null, content_type: "novel" } },
      });
      await expect(fetchNovelPackCheck(8)).resolves.toEqual({
        btn_novel: 10,
        btn_novel_pack: null,
        btn_novel_pack_show_lead_label: false,
        content_type: "novel",
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/check-novel-pack/8");

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: {} } });
      await expect(fetchNovelPackCheck(8)).resolves.toEqual({
        btn_novel: null,
        btn_novel_pack: null,
        btn_novel_pack_show_lead_label: false,
        content_type: "novel",
      });

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: null } });
      await expect(fetchNovelPackCheck(8)).resolves.toBeNull();

      mockedApiClient.get.mockRejectedValueOnce(new Error("check-failed"));
      await expect(fetchNovelPackCheck(8)).resolves.toBeNull();
    });

    it("fetchLatestReadEpisode / resolveEpisodeId / resolveBookId return data or null", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 200, data: { ep_id: 1 } } });
      await expect(fetchLatestReadEpisode(1)).resolves.toEqual({ code: 200, data: { ep_id: 1 } });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/bookdetail/latest-read-ep/1");

      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 200, data: { ep_id: 2 } } });
      await expect(resolveEpisodeId("abc")).resolves.toEqual({ code: 200, data: { ep_id: 2 } });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/ep/resolve/abc");

      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 200, data: { book_id: 3 } } });
      await expect(resolveBookId("book-xyz")).resolves.toEqual({
        code: 200,
        data: { book_id: 3 },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/book/resolve/book-xyz");

      mockedApiClient.get.mockRejectedValueOnce(new Error("latest-failed"));
      await expect(fetchLatestReadEpisode(1)).resolves.toBeNull();

      mockedApiClient.get.mockRejectedValueOnce(new Error("resolve-ep-failed"));
      await expect(resolveEpisodeId("x")).resolves.toBeNull();

      mockedApiClient.get.mockRejectedValueOnce(new Error("resolve-book-failed"));
      await expect(resolveBookId("x")).resolves.toBeNull();
    });
  });

  describe("mutation helpers", () => {
    it("buyGroupPromotion returns data and rethrows errors", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(buyGroupPromotion({ dfb_id: 1, payWith: "coin" })).resolves.toEqual({
        ok: true,
      });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/buy/groupPromotion", {
        dfb_id: 1,
        payWith: "coin",
      });

      mockedApiClient.post.mockRejectedValueOnce(new Error("buy-group-failed"));
      await expect(buyGroupPromotion({ dfb_id: 1, payWith: "coin" })).rejects.toThrow(
        "buy-group-failed"
      );
    });

    it("buyEpisodes posts payload and returns response data", async () => {
      const payload = { eps: [1, 2], payWith: "coin" as const };
      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200, data: { token: "next" } } });

      await expect(buyEpisodes(payload)).resolves.toEqual({ code: 200, data: { token: "next" } });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/buy/eps", payload);
    });

    it("shelf helpers call add/remove endpoints", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(addBookToShelf(12)).resolves.toEqual({ code: 200 });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/savebookshelve/add/12");

      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(removeBookFromShelf("12")).resolves.toEqual({ code: 200 });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/savebookshelve/remove/12");
    });

    it("saveBookShare posts share analytics payload", async () => {
      const payload = { userID: 1, bookID: 2, type: "facebook" as const };
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });

      await expect(saveBookShare(payload)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("gift/saveshare", payload);
    });

    it("postBookClick ignores invalid ids and posts valid ones", async () => {
      await expect(postBookClick("not-number")).resolves.toBeUndefined();
      expect(mockedApiClient.post).not.toHaveBeenCalled();

      await expect(postBookClick(0)).resolves.toBeUndefined();
      expect(mockedApiClient.post).not.toHaveBeenCalled();

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(postBookClick("12")).resolves.toBeUndefined();
      expect(mockedApiClient.post).toHaveBeenCalledWith("/bookdetail/click", {
        book_id: 12,
      });

      mockedApiClient.post.mockRejectedValueOnce(new Error("click-failed"));
      await expect(postBookClick(13)).resolves.toBeUndefined();
    });

    it("fetchBookPromotions returns data and rethrows errors", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(fetchBookPromotions(3, 9)).resolves.toEqual({ code: 200 });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/books/promotions/ep", {
        params: { page: 3, limit: 9 },
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("promotions-failed"));
      await expect(fetchBookPromotions(1, 1)).rejects.toThrow("promotions-failed");
    });
  });
});
