import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import { cachedRequest } from "../requestCache";
import { fetchBookUpdates, fetchHomeData, normalizeBookUpdateTab } from "./homeApi";
import { parseJwtToken } from "@/utils/jwtParser";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../requestCache", () => ({
  cachedRequest: vi.fn(),
}));

vi.mock("@/utils/jwtParser", () => ({
  parseJwtToken: vi.fn(),
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};

const mockedCachedRequest = cachedRequest as unknown as ReturnType<typeof vi.fn>;
const mockedParseJwtToken = parseJwtToken as unknown as ReturnType<typeof vi.fn>;

describe("homeApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchHomeData", () => {
    it("passes auth header + content_type when both values exist", async () => {
      mockedParseJwtToken.mockReturnValueOnce("Bearer cleaned-token");
      mockedApiClient.get.mockResolvedValueOnce({
        data: { code: 200, status: "success", data: { slides: [] } },
      });

      const result = await fetchHomeData("raw-token", "novel");

      expect(mockedParseJwtToken).toHaveBeenCalledWith("raw-token");
      expect(mockedApiClient.get).toHaveBeenCalledWith("/getAllBookHome", {
        headers: { Authorization: "Bearer cleaned-token" },
        params: { content_type: "novel" },
      });
      expect(result).toEqual({ code: 200, status: "success", data: { slides: [] } });
    });

    it("passes only params or empty config based on available inputs", async () => {
      mockedParseJwtToken.mockReturnValueOnce(null);
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { slides: [] } } });

      await fetchHomeData(null, "novel_pack");
      expect(mockedApiClient.get).toHaveBeenCalledWith("/getAllBookHome", {
        params: { content_type: "novel_pack" },
      });

      mockedParseJwtToken.mockReturnValueOnce(null);
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { slides: [] } } });

      await fetchHomeData();
      expect(mockedApiClient.get).toHaveBeenCalledWith("/getAllBookHome", {});
    });

    it("returns null when request fails", async () => {
      mockedParseJwtToken.mockReturnValueOnce("Bearer cleaned-token");
      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));

      await expect(fetchHomeData("raw-token", "novel")).resolves.toBeNull();
    });
  });

  describe("fetchBookUpdates", () => {
    it("normalizes supported update tabs and falls back to novel", () => {
      expect(normalizeBookUpdateTab("novel")).toBe("novel");
      expect(normalizeBookUpdateTab("novel_pack")).toBe("novel_pack");
      expect(normalizeBookUpdateTab("trancn")).toBe("trancn");
      expect(normalizeBookUpdateTab("fiction")).toBe("fiction");
      expect(normalizeBookUpdateTab("unknown")).toBe("novel");
      expect(normalizeBookUpdateTab()).toBe("novel");
    });

    it("uses cachedRequest with expected cache key and ttl", async () => {
      mockedCachedRequest.mockResolvedValueOnce([{ book_id: 100 }]);

      const result = await fetchBookUpdates("novel_pack");

      expect(mockedCachedRequest).toHaveBeenCalledTimes(1);
      const [cacheKey, fetcher, options] = mockedCachedRequest.mock.calls[0];
      expect(cacheKey).toBe("home:book-updates:novel_pack");
      expect(typeof fetcher).toBe("function");
      expect(options).toEqual({ ttlMs: 5 * 60 * 1000 });
      expect(result).toEqual([{ book_id: 100 }]);
    });

    it("normalizes fetcher data to array and falls back to [] when data shape is invalid", async () => {
      mockedCachedRequest.mockImplementationOnce(async (_key, fetcher) => fetcher());
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: [{ book_id: 101 }] },
      });

      await expect(fetchBookUpdates()).resolves.toEqual([{ book_id: 101 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/getBookUpdate", {
        params: { tab: "novel" },
      });

      mockedCachedRequest.mockImplementationOnce(async (_key, fetcher) => fetcher());
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: [{ book_id: 102 }] },
      });
      await expect(fetchBookUpdates("trancn")).resolves.toEqual([{ book_id: 102 }]);
      expect(mockedApiClient.get).toHaveBeenLastCalledWith("/getBookUpdate", {
        params: { tab: "trancn" },
      });

      mockedCachedRequest.mockImplementationOnce(async (_key, fetcher) => fetcher());
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: null },
      });
      await expect(fetchBookUpdates()).resolves.toEqual([]);
    });

    it("returns [] when cachedRequest throws", async () => {
      mockedCachedRequest.mockRejectedValueOnce(new Error("cache-miss"));
      await expect(fetchBookUpdates()).resolves.toEqual([]);
    });
  });
});
