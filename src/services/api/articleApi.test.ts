import { beforeEach, describe, expect, it, vi } from "vitest";

import { logApiError } from "@/utils/apiErrorLogger";

import apiClient from "../apiClient";
import {
  fetchArticleDetail,
  fetchLatestArticles,
  fetchLatestArticlesPage,
  fetchPopularArticles,
} from "./articleApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("@/utils/apiErrorLogger", () => ({
  logApiError: vi.fn(),
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe("articleApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchPopularArticles", () => {
    it("maps list and fallback correctly", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { list: [{ id: 2, name: "B" }] } },
      });
      await expect(fetchPopularArticles()).resolves.toEqual([{ id: 2, name: "B" }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/articles/popular");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchPopularArticles()).resolves.toEqual([]);
    });

    it("returns [] when request throws", async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchPopularArticles()).resolves.toEqual([]);
    });
  });

  describe("fetchLatestArticles", () => {
    it("exposes a strict page fetcher for complete inventory consumers", async () => {
      const error = new Error("page unavailable");
      mockedApiClient.get.mockRejectedValueOnce(error);

      await expect(fetchLatestArticlesPage(2, 100)).rejects.toBe(error);
      expect(logApiError).not.toHaveBeenCalled();
    });

    it("maps payload and fallback shape correctly", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            list: [{ id: 11 }],
            pagination: {
              page: 1,
              limit: 8,
              total: 1,
              totalPages: 1,
              nextPage: null,
              prevPage: null,
            },
          },
        },
      });
      await expect(fetchLatestArticles()).resolves.toEqual({
        list: [{ id: 11 }],
        pagination: {
          page: 1,
          limit: 8,
          total: 1,
          totalPages: 1,
          nextPage: null,
          prevPage: null,
        },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/articles?limit=8&page=1");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchLatestArticles(2, 6)).resolves.toEqual({
        list: [],
        pagination: {
          page: 1,
          limit: 6,
          total: 0,
          totalPages: 0,
          nextPage: null,
          prevPage: null,
        },
      });
    });

    it("returns fallback shape when request throws", async () => {
      const error = new Error("network");
      mockedApiClient.get.mockRejectedValueOnce(error);
      await expect(fetchLatestArticles(4, 9)).resolves.toEqual({
        list: [],
        pagination: {
          page: 1,
          limit: 9,
          total: 0,
          totalPages: 0,
          nextPage: null,
          prevPage: null,
        },
      });
      expect(logApiError).toHaveBeenCalledWith(
        "fetchLatestArticles(page=4, limit=9)",
        error,
      );
    });
  });

  describe("fetchArticleDetail", () => {
    it("maps response.data and null fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { code: 200, data: { id: 100 } },
      });
      await expect(fetchArticleDetail("100")).resolves.toEqual({
        code: 200,
        data: { id: 100 },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/articles/100");

      mockedApiClient.get.mockResolvedValueOnce({ data: null });
      await expect(fetchArticleDetail("100")).resolves.toBeNull();
    });

    it("returns null when request throws", async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchArticleDetail(1)).resolves.toBeNull();
    });
  });
});
