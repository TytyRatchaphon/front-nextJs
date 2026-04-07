import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import { cachedRequest } from "../requestCache";
import {
  fetchArticleDetail,
  fetchLatestArticles,
  fetchPopularArticles,
} from "./articleApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../requestCache", () => ({
  cachedRequest: vi.fn(),
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};
const mockedCachedRequest = cachedRequest as unknown as ReturnType<typeof vi.fn>;

describe("articleApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchPopularArticles", () => {
    it("uses cachedRequest with expected key and ttl", async () => {
      mockedCachedRequest.mockResolvedValueOnce([{ id: 1, name: "A" }]);

      const result = await fetchPopularArticles();

      expect(result).toEqual([{ id: 1, name: "A" }]);
      expect(mockedCachedRequest).toHaveBeenCalledTimes(1);
      const [cacheKey, fetcher, options] = mockedCachedRequest.mock.calls[0];
      expect(cacheKey).toBe("articles:popular");
      expect(typeof fetcher).toBe("function");
      expect(options).toEqual({ ttlMs: 2 * 60 * 1000 });
    });

    it("fetcher maps list and fallback correctly", async () => {
      mockedCachedRequest.mockImplementationOnce(async (_k, fetcher) => fetcher());
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { list: [{ id: 2, name: "B" }] } },
      });
      await expect(fetchPopularArticles()).resolves.toEqual([{ id: 2, name: "B" }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/articles/popular");

      mockedCachedRequest.mockImplementationOnce(async (_k, fetcher) => fetcher());
      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchPopularArticles()).resolves.toEqual([]);
    });

    it("returns [] when cache wrapper throws", async () => {
      mockedCachedRequest.mockRejectedValueOnce(new Error("cache-failed"));
      await expect(fetchPopularArticles()).resolves.toEqual([]);
    });
  });

  describe("fetchLatestArticles", () => {
    it("uses page/limit cache key and ttl", async () => {
      mockedCachedRequest.mockResolvedValueOnce({
        list: [{ id: 10 }],
        pagination: { page: 3, limit: 4, total: 20, totalPages: 5, nextPage: 4, prevPage: 2 },
      });

      const result = await fetchLatestArticles(3, 4);

      expect(result.list).toEqual([{ id: 10 }]);
      const [cacheKey, fetcher, options] = mockedCachedRequest.mock.calls[0];
      expect(cacheKey).toBe("articles:latest:3:4");
      expect(typeof fetcher).toBe("function");
      expect(options).toEqual({ ttlMs: 60 * 1000 });
    });

    it("fetcher maps payload and fallback shape correctly", async () => {
      mockedCachedRequest.mockImplementationOnce(async (_k, fetcher) => fetcher());
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

      mockedCachedRequest.mockImplementationOnce(async (_k, fetcher) => fetcher());
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

    it("returns fallback shape when cache wrapper throws", async () => {
      mockedCachedRequest.mockRejectedValueOnce(new Error("cache-failed"));
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
    });
  });

  describe("fetchArticleDetail", () => {
    it("uses detail cache key and shouldCache guard", async () => {
      mockedCachedRequest.mockResolvedValueOnce({
        code: 200,
        data: { id: 99 },
      });

      const result = await fetchArticleDetail(99);
      expect(result).toEqual({ code: 200, data: { id: 99 } });

      const [cacheKey, fetcher, options] = mockedCachedRequest.mock.calls[0];
      expect(cacheKey).toBe("articles:detail:99");
      expect(typeof fetcher).toBe("function");
      expect(options).toMatchObject({
        ttlMs: 60 * 1000,
      });
      expect(typeof options.shouldCache).toBe("function");
      expect(options.shouldCache(null)).toBe(false);
      expect(options.shouldCache({ code: 200 })).toBe(true);
    });

    it("fetcher maps response.data and null fallback", async () => {
      mockedCachedRequest.mockImplementationOnce(async (_k, fetcher) => fetcher());
      mockedApiClient.get.mockResolvedValueOnce({
        data: { code: 200, data: { id: 100 } },
      });
      await expect(fetchArticleDetail("100")).resolves.toEqual({
        code: 200,
        data: { id: 100 },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/articles/100");

      mockedCachedRequest.mockImplementationOnce(async (_k, fetcher) => fetcher());
      mockedApiClient.get.mockResolvedValueOnce({ data: null });
      await expect(fetchArticleDetail("100")).resolves.toBeNull();
    });

    it("returns null when cache wrapper throws", async () => {
      mockedCachedRequest.mockRejectedValueOnce(new Error("cache-failed"));
      await expect(fetchArticleDetail(1)).resolves.toBeNull();
    });
  });
});
