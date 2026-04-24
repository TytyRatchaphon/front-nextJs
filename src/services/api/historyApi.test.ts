import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  fetchGachaHistory,
  fetchGetMoreHistory,
  fetchGiftHistory,
  fetchPaymentHistory,
  fetchRedeemHistory,
  fetchStoreHistory,
  fetchUseCoinHistory,
} from "./historyApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe("historyApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests each endpoint with provided pagination params", async () => {
    mockedApiClient.get.mockResolvedValue({ data: { ok: true } });

    await expect(fetchPaymentHistory({ page: 3, limit: 40 })).resolves.toEqual({ ok: true });
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(1, "/user/his_payment", {
      params: { page: 3, limit: 40 },
    });

    await expect(fetchUseCoinHistory({ page: 2, limit: 10 })).resolves.toEqual({ ok: true });
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(2, "/user/his_usecoin", {
      params: { page: 2, limit: 10 },
    });

    await expect(fetchRedeemHistory({ page: 4, limit: 25 })).resolves.toEqual({ ok: true });
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(3, "/user/his_redeem", {
      params: { page: 4, limit: 25 },
    });

    await expect(fetchGachaHistory({ page: 5, limit: 15 })).resolves.toEqual({ ok: true });
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(4, "/user/his_gacha", {
      params: { page: 5, limit: 15 },
    });

    await expect(fetchGetMoreHistory({ page: 6, limit: 30 })).resolves.toEqual({ ok: true });
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(5, "/user/his_getmore", {
      params: { page: 6, limit: 30 },
    });

    await expect(fetchGiftHistory({ page: 7, limit: 50 })).resolves.toEqual({ ok: true });
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(6, "/user/his_gift", {
      params: { page: 7, limit: 50 },
    });

    await expect(fetchStoreHistory({ page: 8, limit: 60 })).resolves.toEqual({ ok: true });
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(7, "/user/his_store", {
      params: { page: 8, limit: 60 },
    });
  });

  it("falls back to default pagination when params are omitted or invalid", async () => {
    mockedApiClient.get.mockResolvedValue({ data: { ok: true } });

    await fetchPaymentHistory();
    expect(mockedApiClient.get).toHaveBeenCalledWith("/user/his_payment", {
      params: { page: 1, limit: 20 },
    });

    await fetchUseCoinHistory({ page: Number.NaN, limit: Number.NaN });
    expect(mockedApiClient.get).toHaveBeenCalledWith("/user/his_usecoin", {
      params: { page: 1, limit: 20 },
    });
  });

  it("rethrows api errors for query error handling", async () => {
    mockedApiClient.get.mockRejectedValueOnce(new Error("history-failed"));
    await expect(fetchPaymentHistory({ page: 1, limit: 20 })).rejects.toThrow("history-failed");
  });
});
