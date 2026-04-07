import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  buyStorePack,
  buyStorePackNow,
  claimCoupon,
  claimCouponByCode,
  fetchAvailableCoupons,
  fetchStickers,
  fetchStoreData,
  fetchUserCoupons,
  useCoupon,
} from "./storeApi";

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

describe("storeApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("read APIs", () => {
    it("fetchStoreData returns response data or [] fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ category_id: 1 }] } });
      await expect(fetchStoreData()).resolves.toEqual([{ category_id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/store");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchStoreData()).resolves.toEqual([]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchStoreData()).resolves.toEqual([]);
    });

    it("fetchStickers returns response data or [] fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ sticker_set_id: 2 }] } });
      await expect(fetchStickers()).resolves.toEqual([{ sticker_set_id: 2 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/stickers");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchStickers()).resolves.toEqual([]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchStickers()).resolves.toEqual([]);
    });

    it("fetchAvailableCoupons and fetchUserCoupons return [] on fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 10 }] } });
      await expect(fetchAvailableCoupons()).resolves.toEqual([{ id: 10 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/coupon/available");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchAvailableCoupons()).resolves.toEqual([]);

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 20 }] } });
      await expect(fetchUserCoupons()).resolves.toEqual([{ id: 20 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/coupon/mine");

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchUserCoupons()).resolves.toEqual([]);
    });
  });

  describe("mutation APIs", () => {
    it("buyStorePack stringifies packId and returns response data", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200 } });

      const result = await buyStorePack(1234);

      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/store", {
        store_pack_id: "1234",
      });
      expect(result).toEqual({ code: 200 });
    });

    it("buyStorePackNow sends expected payload", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(buyStorePackNow("88", 3)).resolves.toEqual({ code: 200 });

      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/store/buy-now", {
        store_pack_id: "88",
        quantity: 3,
      });
    });

    it("claimCoupon and claimCouponByCode call same endpoint with different payload keys", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(claimCoupon(7)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/coupon/claim", { id: 7 });

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(claimCouponByCode("PROMO")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/coupon/claim", {
        code: "PROMO",
      });
    });

    it("useCoupon includes rewardEpSelections only when provided", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(useCoupon(12, [1, 2])).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/coupon/use", {
        userCouponId: 12,
        selectedRewardIds: [1, 2],
      });

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(useCoupon(12, [3], { 3: [1001, 1002] })).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/coupon/use", {
        userCouponId: 12,
        selectedRewardIds: [3],
        rewardEpSelections: { 3: [1001, 1002] },
      });
    });

    it("rethrows errors from mutation APIs", async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error("buy-failed"));
      await expect(buyStorePack(1)).rejects.toThrow("buy-failed");

      mockedApiClient.post.mockRejectedValueOnce(new Error("buy-now-failed"));
      await expect(buyStorePackNow(1, 1)).rejects.toThrow("buy-now-failed");

      mockedApiClient.post.mockRejectedValueOnce(new Error("claim-id-failed"));
      await expect(claimCoupon(1)).rejects.toThrow("claim-id-failed");

      mockedApiClient.post.mockRejectedValueOnce(new Error("claim-code-failed"));
      await expect(claimCouponByCode("X")).rejects.toThrow("claim-code-failed");

      mockedApiClient.post.mockRejectedValueOnce(new Error("use-coupon-failed"));
      await expect(useCoupon(1, [1])).rejects.toThrow("use-coupon-failed");
    });
  });
});
