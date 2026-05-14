import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  fetchCampaignDetail,
  fetchCampaigns,
  fetchCampaignsDiscount,
  fetchPackCampaignDetail,
  fetchPromotingBlockBooks,
  fetchPromotingGroupDetail,
  fetchPromotingGroups,
  postBannerClick,
  postCampaignClick,
} from "./campaignApi";

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

describe("campaignApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("fetchCampaigns", () => {
    it("parses successful fetch response", async () => {
      vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
      const fetchSpy = vi.spyOn(globalThis, "fetch" as never).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 200, data: [{ cp_id: 10 }] }),
      } as never);

      await expect(fetchCampaigns()).resolves.toEqual([{ cp_id: 10 }]);
      expect(fetchSpy).toHaveBeenCalledWith("https://api.example.com/campaigns");

      fetchSpy.mockRestore();
    });

    it("throws when fetch is not ok or payload invalid", async () => {
      vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
      const fetchSpy = vi.spyOn(globalThis, "fetch" as never);

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as never);
      await expect(fetchCampaigns()).rejects.toThrow("Failed to fetch campaigns");

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 500, message: "bad" }),
      } as never);
      await expect(fetchCampaigns()).rejects.toThrow("bad");

      fetchSpy.mockRestore();
    });
  });

  describe("public API fetchers", () => {
    it("fetchPackCampaignDetail maps payload and fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 200, data: { id: 2 } } });
      await expect(fetchPackCampaignDetail("2")).resolves.toEqual({ id: 2 });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/pack-campaign/2");

      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 500, data: { id: 3 } } });
      await expect(fetchPackCampaignDetail("3")).resolves.toBeNull();

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchPackCampaignDetail("4")).resolves.toBeNull();
    });

    it("fetchCampaignsDiscount maps code 200 and fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 200, data: [{ id: 11 }] } });
      await expect(fetchCampaignsDiscount()).resolves.toEqual([{ id: 11 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/campaigns-discount");

      mockedApiClient.get.mockResolvedValueOnce({ data: { code: 500, data: [{ id: 12 }] } });
      await expect(fetchCampaignsDiscount()).resolves.toEqual([]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchCampaignsDiscount()).resolves.toEqual([]);
    });

    it("fetchPromotingGroups maps response data with fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
      await expect(fetchPromotingGroups()).resolves.toEqual([{ id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/promoting-groups");

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchPromotingGroups()).resolves.toEqual([]);
    });
  });

  describe("direct fetchers", () => {
    it("fetchCampaignDetail returns data and null on errors", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { cp_id: 5 } } });
      await expect(fetchCampaignDetail(5)).resolves.toEqual({ cp_id: 5 });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/campaigns/5");

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchCampaignDetail(5)).resolves.toBeNull();
    });

    it("fetchPromotingGroupDetail returns data and null fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { id: 6 } } });
      await expect(fetchPromotingGroupDetail("6")).resolves.toEqual({ id: 6 });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/promoting-group/6");

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchPromotingGroupDetail("6")).resolves.toBeNull();
    });

    it("fetchPromotingBlockBooks passes params and returns data/null", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { block_id: 1, books: [] } } });
      await expect(fetchPromotingBlockBooks(9, 2, 30)).resolves.toEqual({
        block_id: 1,
        books: [],
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/promoting/9/books", {
        params: { page: 2, limit: 30 },
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchPromotingBlockBooks(9)).resolves.toBeNull();
    });
  });

  describe("click trackers", () => {
    it("postCampaignClick skips falsy id and posts valid id", async () => {
      await expect(postCampaignClick(0)).resolves.toBeUndefined();
      expect(mockedApiClient.post).not.toHaveBeenCalled();

      mockedApiClient.post.mockResolvedValueOnce({ data: {} });
      await expect(postCampaignClick(12)).resolves.toBeUndefined();
      expect(mockedApiClient.post).toHaveBeenCalledWith("/campaigns/12/click", { id: 12 });
    });

    it("postCampaignClick and postBannerClick swallow request errors", async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error("campaign-click-failed"));
      await expect(postCampaignClick(1)).resolves.toBeUndefined();

      mockedApiClient.post.mockRejectedValueOnce(new Error("banner-click-failed"));
      await expect(postBannerClick(99)).resolves.toBeUndefined();
      expect(mockedApiClient.post).toHaveBeenCalledWith("/banner-click", { banner_id: 99 });
    });
  });
});
