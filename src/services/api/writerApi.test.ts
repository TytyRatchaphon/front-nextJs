import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  fetchWriterWithdrawHistory,
  fetchWriterWithdrawSetting,
  getBankIdCardAccount,
  getBankList,
  postWriterWithdraw,
  updateBankIdCardAccount,
} from "./writerApi";

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

describe("writerApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("bank and id-card endpoints", () => {
    it("getBankList returns data array or [] fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ bank_id: 1 }] } });
      await expect(getBankList()).resolves.toEqual([{ bank_id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/writer/bank_list");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(getBankList()).resolves.toEqual([]);
    });

    it("getBankList rethrows on error", async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error("bank-failed"));
      await expect(getBankList()).rejects.toThrow("bank-failed");
    });

    it("updateBankIdCardAccount posts multipart form data and rethrows errors", async () => {
      const formData = {} as FormData;
      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200 } });

      await expect(updateBankIdCardAccount(formData)).resolves.toEqual({ code: 200 });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/writer/bank_idcard_account",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      mockedApiClient.post.mockRejectedValueOnce(new Error("multipart-failed"));
      await expect(updateBankIdCardAccount(formData)).rejects.toThrow("multipart-failed");
    });

    it("getBankIdCardAccount returns data and rethrows on errors", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { account: "1234" } });
      await expect(getBankIdCardAccount()).resolves.toEqual({ account: "1234" });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/writer/bank_idcard_account");

      mockedApiClient.get.mockRejectedValueOnce(new Error("account-failed"));
      await expect(getBankIdCardAccount()).rejects.toThrow("account-failed");
    });
  });

  describe("withdraw endpoints", () => {
    it("postWriterWithdraw returns raw axios response", async () => {
      const rawResponse = { data: { code: 200 } };
      mockedApiClient.post.mockResolvedValueOnce(rawResponse);

      await expect(postWriterWithdraw(500)).resolves.toBe(rawResponse);
      expect(mockedApiClient.post).toHaveBeenCalledWith("/writer/withdraw", {
        amount: 500,
      });
    });

    it("fetchWriterWithdrawHistory returns data or [] fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 9 }] } });
      await expect(fetchWriterWithdrawHistory()).resolves.toEqual([{ id: 9 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/writer/withdraw");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchWriterWithdrawHistory()).resolves.toEqual([]);
    });

    it("fetchWriterWithdrawSetting returns data or null fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { tax: 3 } } });
      await expect(fetchWriterWithdrawSetting()).resolves.toEqual({ tax: 3 });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/writer/withdraw/setting");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchWriterWithdrawSetting()).resolves.toBeNull();
    });
  });
});
