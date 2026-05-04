import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  fetchCategoryRankingBooks,
  fetchLeaderboardUserRank,
  fetchLeaderboardUsers,
  fetchRankingBooks,
  fetchRankingCategories,
  normalizeRankingContentTab,
} from "./rankingApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe("rankingApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchRankingBooks", () => {
    it("calls week endpoint by default and returns data payload", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            books: [{ rank: 1, book_id: 10, name: "A" }],
            pagination: {
              page: 1,
              limit: 10,
              total: 20,
              totalPages: 2,
              nextPage: 2,
              prevPage: null,
            },
          },
        },
      });

      const result = await fetchRankingBooks();

      expect(mockedApiClient.get).toHaveBeenCalledWith("/books/ranks/week?limit=10&page=1");
      expect(result.books).toHaveLength(1);
      expect(result.pagination.total).toBe(20);
    });

    it("includes category_id when provided", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            books: [],
            pagination: {
              page: 3,
              limit: 5,
              total: 0,
              totalPages: 0,
              nextPage: null,
              prevPage: 2,
            },
          },
        },
      });

      await fetchRankingBooks("month", 3, 5, 23);
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        "/books/ranks/month?limit=5&page=3&category_id=23"
      );
    });

    it("returns default empty shape when payload is missing or request fails", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchRankingBooks("all", 2, 7)).resolves.toEqual({
        books: [],
        pagination: {
          page: 1,
          limit: 7,
          total: 0,
          totalPages: 0,
          nextPage: null,
          prevPage: null,
        },
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchRankingBooks("year", 9, 3)).resolves.toEqual({
        books: [],
        pagination: {
          page: 1,
          limit: 3,
          total: 0,
          totalPages: 0,
          nextPage: null,
          prevPage: null,
        },
      });
    });
  });

  describe("fetchLeaderboardUsers", () => {
    it("maps payload correctly and computes totalPages", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            page: 2,
            limit: 5,
            total: 12,
            hasMore: true,
            range: "month",
            users: [{ rank: 1, totalPrice: 100, user: { user_id: 1, fullname: "A", img: null, Frame_img: null } }],
          },
        },
      });

      const result = await fetchLeaderboardUsers("month", 2, 5);

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        "/rank/leaderboard/top?range=month&limit=5&page=2"
      );
      expect(result.users).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 12,
        hasMore: true,
        totalPages: 3,
      });
      expect(result.range).toBe("month");
    });

    it("uses requested fallback page/range/limit when payload is missing", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: null } });
      await expect(fetchLeaderboardUsers("all", 4, 11)).resolves.toEqual({
        users: [],
        pagination: {
          page: 4,
          limit: 11,
          total: 0,
          hasMore: false,
          totalPages: 0,
        },
        range: "all",
      });
    });

    it("falls back to input limit when payload.limit is invalid", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            page: 1,
            limit: 0,
            total: 9,
            hasMore: false,
            range: "",
            users: [],
          },
        },
      });

      const result = await fetchLeaderboardUsers("year", 1, 4);
      expect(result.pagination.limit).toBe(4);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.range).toBe("year");
    });

    it("returns fallback empty result when request fails", async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchLeaderboardUsers("week", 6, 2)).resolves.toEqual({
        users: [],
        pagination: {
          page: 6,
          limit: 2,
          total: 0,
          hasMore: false,
          totalPages: 0,
        },
        range: "week",
      });
    });
  });

  describe("fetchLeaderboardUserRank", () => {
    it("supports with and without range query", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { rank: 3, totalPrice: 20, user: { user_id: 100, fullname: "Me", img: null, Frame_img: null } } },
      });
      await expect(fetchLeaderboardUserRank(100)).resolves.toEqual({
        rank: 3,
        totalPrice: 20,
        user: { user_id: 100, fullname: "Me", img: null, Frame_img: null },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/rank/leaderboard/user/100");

      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { rank: 1, totalPrice: 50, user: { user_id: 101, fullname: "Me2", img: null, Frame_img: null } } },
      });
      await fetchLeaderboardUserRank("101", "month");
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        "/rank/leaderboard/user/101?range=month"
      );
    });

    it("returns null on empty payload and error", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: null } });
      await expect(fetchLeaderboardUserRank(100)).resolves.toBeNull();

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchLeaderboardUserRank(100)).resolves.toBeNull();
    });
  });

  describe("fetchRankingCategories", () => {
    it("normalizes supported ranking content tabs and falls back to novel", () => {
      expect(normalizeRankingContentTab("novel")).toBe("novel");
      expect(normalizeRankingContentTab("novel_pack")).toBe("novel_pack");
      expect(normalizeRankingContentTab("trancn")).toBe("trancn");
      expect(normalizeRankingContentTab("fiction")).toBe("fiction");
      expect(normalizeRankingContentTab("unknown")).toBe("novel");
      expect(normalizeRankingContentTab()).toBe("novel");
    });

    it("returns data only when code is 200", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          code: 200,
          data: {
            left: { id: 1, name: "Novel" },
            right: { id: 2, name: "User" },
          },
        },
      });
      await expect(fetchRankingCategories("fiction")).resolves.toEqual({
        left: { id: 1, name: "Novel" },
        right: { id: 2, name: "User" },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/books/ranking/categories", {
        params: { tab: "fiction" },
      });

      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 500, data: {} } });
      await expect(fetchRankingCategories()).resolves.toBeNull();
    });

    it("returns null when request fails", async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchRankingCategories()).resolves.toBeNull();
    });
  });

  describe("fetchCategoryRankingBooks", () => {
    it("returns list when response code is 200 and list is array", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          code: 200,
          data: { list: [{ rank: 1, book_id: 9, name: "ABC" }] },
        },
      });

      const result = await fetchCategoryRankingBooks("all", "weekly", 8, "trancn");

      expect(mockedApiClient.get).toHaveBeenCalledWith("/books/ranking/all/weekly?tab=trancn&limit=8");
      expect(result).toEqual([{ rank: 1, book_id: 9, name: "ABC" }]);
    });

    it("returns [] for non-array list, non-200 response, and errors", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { code: 200, data: { list: null } },
      });
      await expect(fetchCategoryRankingBooks(4, 7)).resolves.toEqual([]);

      mockedApiClient.get.mockResolvedValueOnce({
        data: { code: 500, data: { list: [{ book_id: 1 }] } },
      });
      await expect(fetchCategoryRankingBooks(4, 7)).resolves.toEqual([]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchCategoryRankingBooks(4, 7)).resolves.toEqual([]);
    });
  });
});
