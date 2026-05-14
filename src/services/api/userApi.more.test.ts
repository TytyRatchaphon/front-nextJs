import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import Cookies from "js-cookie";
import axios from "axios";
import {
  changeUserPassword,
  checkWriterStatus,
  fetchAllRanks,
  fetchHasPaymentHistory,
  fetchProfileFrames,
  fetchPublicWriterProfile,
  fetchUserProfileCategories,
  fetchUserShelve,
  fetchUserShelveBuy,
  fetchUserShelveContinue,
  fetchWebsiteSettings,
  fetchWriterBooks,
  fetchWriterCheck,
  fetchWriterProfile,
  followWriter,
  pinBookShelve,
  redeemCode,
  refreshToken,
  registerWriter,
  saveUserProfileViaRoute,
  updateUserAddress,
  updateWriter,
} from "./userApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("js-cookie", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const mockedCookies = Cookies as unknown as {
  get: ReturnType<typeof vi.fn>;
};

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe("userApi more coverage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("writer registration/profile actions", () => {
    it("fetchUserProfileCategories normalizes category payloads", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 1, name: "Fantasy" }] } });
      await expect(fetchUserProfileCategories()).resolves.toEqual([{ id: 1, name: "Fantasy" }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/category");

      mockedApiClient.get.mockResolvedValueOnce({ data: [{ id: 2, name: "Action" }] });
      await expect(fetchUserProfileCategories()).resolves.toEqual([{ id: 2, name: "Action" }]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("category-failed"));
      await expect(fetchUserProfileCategories()).resolves.toEqual([]);
    });

    it("changeUserPassword posts payload to changepass endpoint", async () => {
      const payload = {
        oldpass: "old",
        newpass1: "new",
        newpass2: "new",
        token: "token",
      };

      mockedApiClient.post.mockResolvedValueOnce({ status: 200, data: { code: 200 } });
      await expect(changeUserPassword(payload)).resolves.toEqual({ status: 200, data: { code: 200 } });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/changepass", payload);
    });

    it("fetchProfileFrames and saveUserProfileViaRoute call Next API routes with auth", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { code: 200, data: { frames: [] } } });
      await expect(fetchProfileFrames("Bearer frame")).resolves.toEqual({ code: 200, data: { frames: [] } });
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/getframes", {
        headers: { Authorization: "Bearer frame" },
        timeout: 30000,
      });

      const formData = new FormData();
      mockedAxios.post.mockResolvedValueOnce({ data: { code: 200, data: { token: "new-token" } } });
      await expect(saveUserProfileViaRoute(formData, "Bearer save")).resolves.toEqual({
        code: 200,
        data: { token: "new-token" },
      });
      expect(mockedAxios.post).toHaveBeenCalledWith("/api/save_profile", formData, {
        headers: { Authorization: "Bearer save" },
      });
    });

    it("registerWriter and updateWriter call same endpoint with auth headers", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(
        registerWriter({ writer_name: "pen", fullname: "Pen Name" }, "Bearer A")
      ).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/user/writer",
        { writer_name: "pen", fullname: "Pen Name" },
        {
          headers: {
            Authorization: "Bearer A",
            "Content-Type": "application/json",
          },
        }
      );

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(updateWriter({ writer_name: "new-pen" }, "Bearer B")).resolves.toEqual({
        ok: true,
      });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/user/writer",
        { writer_name: "new-pen" },
        {
          headers: {
            Authorization: "Bearer B",
            "Content-Type": "application/json",
          },
        }
      );
    });

    it("register/update writer actions rethrow errors", async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error("register-failed"));
      await expect(
        registerWriter({ writer_name: "x", fullname: "y" }, "t")
      ).rejects.toThrow("register-failed");

      mockedApiClient.post.mockRejectedValueOnce(new Error("update-failed"));
      await expect(updateWriter({ writer_name: "x" }, "t")).rejects.toThrow("update-failed");
    });

    it("updateUserAddress sends multipart payload with auth", async () => {
      const fd = new FormData();
      fd.append("fullname", "A");

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(updateUserAddress(fd, "Bearer C")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/save_profile", fd, {
        headers: {
          Authorization: "Bearer C",
          "Content-Type": "multipart/form-data",
        },
      });

      mockedApiClient.post.mockRejectedValueOnce(new Error("address-failed"));
      await expect(updateUserAddress(fd, "Bearer C")).rejects.toThrow("address-failed");
    });

    it("fetchWriterCheck returns data or null fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { is_writer: true } } });
      await expect(fetchWriterCheck()).resolves.toEqual({ is_writer: true });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/writer/check");

      mockedApiClient.get.mockRejectedValueOnce(new Error("writer-check-failed"));
      await expect(fetchWriterCheck()).resolves.toBeNull();
    });

    it("fetchPublicWriterProfile and fetchWriterBooks map payload", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { writer: { user_id: 1 } } } });
      await expect(fetchPublicWriterProfile(1)).resolves.toEqual({ writer: { user_id: 1 } });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/profile/1");

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { items: [{ book_id: 2 }] } } });
      await expect(fetchWriterBooks(1, "new", 2, 30, "date_at")).resolves.toEqual({
        items: [{ book_id: 2 }],
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/profile/1/books/new/2", {
        params: { limit: 30, sortBy: "date_at" },
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("writer-profile-failed"));
      await expect(fetchPublicWriterProfile(1)).resolves.toBeNull();

      mockedApiClient.get.mockRejectedValueOnce(new Error("writer-books-failed"));
      await expect(fetchWriterBooks(1)).resolves.toBeNull();
    });

    it("followWriter posts normalized writer id and rethrows on failure", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(followWriter("42", "follow")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/profile/follow", {
        writer_id: 42,
        action: "follow",
      });

      mockedApiClient.post.mockRejectedValueOnce(new Error("follow-failed"));
      await expect(followWriter(42, "unfollow")).rejects.toThrow("follow-failed");
    });
  });

  describe("shelve APIs", () => {
    const assertShelveMapper = async (
      fn: (limit?: number, page?: number, order?: string) => Promise<any>,
      path: string,
      withOrder = false
    ) => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { books: [{ book_id: 1 }], paginate: { page: 1 } } },
      });
      if (withOrder) {
        await expect(fn(10, 2, "asc")).resolves.toEqual({
          books: [{ book_id: 1 }],
          paginate: { page: 1 },
        });
        expect(mockedApiClient.get).toHaveBeenCalledWith(path, {
          params: { limit: 10, page: 2, order: "asc" },
        });
      } else {
        await expect(fn(10, 2)).resolves.toEqual({
          books: [{ book_id: 1 }],
          paginate: { page: 1 },
        });
        expect(mockedApiClient.get).toHaveBeenCalledWith(path, {
          params: { limit: 10, page: 2 },
        });
      }

      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: [{ book_id: 2 }] },
      });
      await expect(withOrder ? fn() : fn()).resolves.toEqual({
        books: [{ book_id: 2 }],
        paginate: null,
      });

      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: {} },
      });
      await expect(withOrder ? fn() : fn()).resolves.toEqual({
        books: [],
        paginate: null,
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("shelve-failed"));
      await expect(withOrder ? fn() : fn()).rejects.toThrow("shelve-failed");
    };

    it("maps fetchUserShelve payload shapes", async () => {
      await assertShelveMapper(fetchUserShelve as any, "/user/getbookshelve");
    });

    it("maps fetchUserShelveContinue payload shapes", async () => {
      await assertShelveMapper(fetchUserShelveContinue as any, "/user/getbookshelvecontinue");
    });

    it("maps fetchUserShelveBuy payload shapes", async () => {
      await assertShelveMapper(fetchUserShelveBuy as any, "/user/getbookshelvebuy", true);
    });

    it("pinBookShelve sends payload and rethrows errors", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(pinBookShelve([1, "2"], "pin")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/pinbookshelve", {
        book_ids: [1, "2"],
        action: "pin",
      });

      mockedApiClient.post.mockRejectedValueOnce(new Error("pin-failed"));
      await expect(pinBookShelve([1], "unpin")).rejects.toThrow("pin-failed");
    });
  });

  describe("payment/redeem/refresh", () => {
    it("fetchHasPaymentHistory supports all payload variants", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
      await expect(fetchHasPaymentHistory()).resolves.toBe(true);

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { data: [] } } });
      await expect(fetchHasPaymentHistory()).resolves.toBe(false);

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { history: [1] } } });
      await expect(fetchHasPaymentHistory()).resolves.toBe(true);

      mockedApiClient.get.mockResolvedValueOnce({ data: { history: [1] } });
      await expect(fetchHasPaymentHistory()).resolves.toBe(true);

      mockedApiClient.get.mockRejectedValueOnce(new Error("payment-failed"));
      await expect(fetchHasPaymentHistory()).resolves.toBeNull();
    });

    it("redeemCode posts payload and rethrows failures", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(redeemCode("ABC123")).resolves.toEqual({ code: 200 });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/redeem", {
        redeemCode: "ABC123",
      });

      mockedApiClient.post.mockRejectedValueOnce(new Error("redeem-failed"));
      await expect(redeemCode("ABC123")).rejects.toThrow("redeem-failed");
    });

    it("refreshToken uses token override, cookie token, and throws on missing token", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { access: "new-token" } });
      await expect(refreshToken("override-token")).resolves.toEqual({ access: "new-token" });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/refresh-token",
        {},
        { headers: { Authorization: "override-token" } }
      );

      mockedCookies.get.mockReturnValueOnce("'cookie-token'");
      mockedApiClient.post.mockResolvedValueOnce({ data: { access: "cookie-refresh" } });
      await expect(refreshToken()).resolves.toEqual({ access: "cookie-refresh" });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/refresh-token",
        {},
        { headers: { Authorization: "cookie-token" } }
      );

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockedCookies.get.mockReturnValueOnce(undefined);
      await expect(refreshToken()).rejects.toThrow("No token");
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("website settings and authenticated writer APIs", () => {
    it("fetchWebsiteSettings returns response data from apiClient", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { status: "success", data: { title: "site" } } });
      await expect(fetchWebsiteSettings()).resolves.toEqual({
        status: "success",
        data: { title: "site" },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/get_website");
    });

    it("fetchWebsiteSettings returns null and logs when api request throws", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockedApiClient.get.mockRejectedValueOnce(new Error("request-failed"));
      await expect(fetchWebsiteSettings()).resolves.toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("fetchWriterProfile/checkWriterStatus support token and fallback null", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { fullname: "Writer X" } });
      await expect(fetchWriterProfile("Bearer token")).resolves.toEqual({
        fullname: "Writer X",
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/writer/info", {
        headers: { Authorization: "Bearer token" },
      });

      mockedApiClient.get.mockResolvedValueOnce({ data: { status: "success" } });
      await expect(checkWriterStatus()).resolves.toEqual({ status: "success" });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/writer/check", {});

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockedApiClient.get.mockRejectedValueOnce(new Error("writer-profile-failed"));
      await expect(fetchWriterProfile()).resolves.toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      mockedApiClient.get.mockRejectedValueOnce(new Error("writer-status-failed"));
      await expect(checkWriterStatus()).resolves.toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("rank API extras", () => {
    it("fetchAllRanks normalizes rank_img variants", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            ranks: [
              { rank_id: 1, rank_img: "img/path.png" },
              { rank_id: 2, rank_img: "/img/local.png" },
              { rank_id: 3, rank_img: "https://cdn.com/a.png" },
              { rank_id: 4, rank_img: "//cdn.com/b.png" },
              { rank_id: 5, rank_img: "" },
            ],
          },
        },
      });

      const result = await fetchAllRanks("Bearer rank");
      expect(mockedApiClient.get).toHaveBeenCalledWith("/rank/all", {
        headers: { Authorization: "Bearer rank" },
      });
      expect(result?.map((x) => x.rank_img)).toEqual([
        "https://image.enjoybook.co/img/path.png",
        "/img/local.png",
        "https://cdn.com/a.png",
        "https://cdn.com/b.png",
        "/images/user.png",
      ]);
    });

    it("fetchAllRanks maps rank-level claim fields for reward claim UI", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            ranks: [
              {
                rank_id: 4,
                rank_img: "https://cdn.com/rank.png",
                can_claim: true,
                grant_id: 5,
                reward_claimed: false,
                rewards: [
                  {
                    rank_reward_id: 5,
                    name: "Fast Ticket",
                    img: null,
                  },
                ],
              },
            ],
          },
        },
      });

      const result = await fetchAllRanks("Bearer rank");
      expect(result?.[0].can_claim).toBe(true);
      expect(result?.[0].grant_id).toBe(5);
      expect(result?.[0].reward_claimed).toBe(false);
      expect(result?.[0].rewards?.[0]?.can_claim).toBe(true);
      expect(result?.[0].rewards?.[0]?.grant_id).toBe(5);
      expect(result?.[0].rewards?.[0]?.img).toBe("/images/user.png");
    });

    it("fetchAllRanks returns null for non-array and request failure", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { ranks: null } } });
      await expect(fetchAllRanks()).resolves.toBeNull();

      mockedApiClient.get.mockRejectedValueOnce(new Error("all-ranks-failed"));
      await expect(fetchAllRanks()).resolves.toBeNull();
    });
  });
});
