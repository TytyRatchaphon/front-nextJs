import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  createGroup,
  createGroupEpisodePromotion,
  createPromotion,
  deleteGroup,
  deleteGroupEpisode,
  deleteGroupEpisodePromotion,
  deletePromotion,
  fetchBookAnalytics,
  fetchBookEpisodesStats,
  fetchBookGroups,
  fetchBookStats,
  fetchGroupEpisodes,
  fetchUserMyBookPermissions,
  fetchUserMyBookInfo,
  fetchUserMyBookListNames,
  fetchUserMyBooks,
  updateEpisodesFastAccessPrice,
  updateEpisodesPrice,
  updateGroup,
  updatePromotion,
} from "./bookManageApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("bookManageApi", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  describe("stats and analytics", () => {
    it("fetchBookStats/fetchBookAnalytics return payload with fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { book_id: 1 } } });
      await expect(fetchBookStats(1)).resolves.toEqual({ book_id: 1 });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/managebook/1/stats");

      mockedApiClient.get.mockRejectedValueOnce(new Error("stats-failed"));
      await expect(fetchBookStats(1)).resolves.toBeNull();

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ date: "2026-01-01" }] } });
      await expect(fetchBookAnalytics(1, "2026-01-01", "2026-01-31")).resolves.toEqual([
        { date: "2026-01-01" },
      ]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/managebook/1/analytics", {
        params: { start: "2026-01-01", end: "2026-01-31" },
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("analytics-failed"));
      await expect(fetchBookAnalytics(1, "a", "b")).resolves.toEqual([]);
    });

    it("fetchBookEpisodesStats maps safe arrays and null fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            total_data: [{ ep_id: "1" }],
            total_purchase_list: [{ id: 1 }],
          },
        },
      });
      await expect(fetchBookEpisodesStats(2, "s", "e")).resolves.toEqual({
        total_data: [{ ep_id: "1" }],
        total_purchase_list: [{ id: 1 }],
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/managebook/2/episodes/stats", {
        params: { start: "s", end: "e" },
      });

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: {} } });
      await expect(fetchBookEpisodesStats(2, "s", "e")).resolves.toEqual({
        total_data: [],
        total_purchase_list: [],
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("episodes-stats-failed"));
      await expect(fetchBookEpisodesStats(2, "s", "e")).resolves.toBeNull();
    });
  });

  describe("groups and episodes", () => {
    it("fetchBookGroups maps multiple payload shapes", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
      await expect(fetchBookGroups(9)).resolves.toEqual([{ id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/managebook/9/groups");

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { groups: [{ id: 2 }] } } });
      await expect(fetchBookGroups(9)).resolves.toEqual([{ id: 2 }]);

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { data: [{ id: 3 }] } } });
      await expect(fetchBookGroups(9)).resolves.toEqual([{ id: 3 }]);

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: {} } });
      await expect(fetchBookGroups(9)).resolves.toEqual([]);

      mockedApiClient.get.mockRejectedValueOnce(new Error("groups-failed"));
      await expect(fetchBookGroups(9)).rejects.toThrow("groups-failed");
    });

    it("fetchGroupEpisodes maps payload shapes and rethrows errors", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ ep_id: 1 }] } });
      await expect(fetchGroupEpisodes(1)).resolves.toEqual({ episodes: [{ ep_id: 1 }] });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/managebook/group/1/eps");

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { episodes: [{ ep_id: 2 }] } } });
      await expect(fetchGroupEpisodes(1)).resolves.toEqual({ episodes: [{ ep_id: 2 }] });

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { list: [{ ep_id: 3 }] } } });
      await expect(fetchGroupEpisodes(1)).resolves.toEqual({ episodes: [{ ep_id: 3 }] });

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: {} } });
      await expect(fetchGroupEpisodes(1)).resolves.toEqual({ episodes: [] });

      mockedApiClient.get.mockRejectedValueOnce(new Error("group-eps-failed"));
      await expect(fetchGroupEpisodes(1)).rejects.toThrow("group-eps-failed");
    });

    it("createGroup and deleteGroup call expected payloads", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(createGroup(20, "Group A")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/managebook/group", {
        book_id: "20",
        name: "Group A",
      });

      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
      await expect(deleteGroup("99")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/user/managebook/group", {
        data: { group_id: "99" },
      });
    });

    it("updateGroup uses apiClient so auth/device interceptors stay consistent", async () => {
      mockedApiClient.put.mockResolvedValueOnce({ data: { ok: true } });

      await expect(updateGroup(10, "name")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.put).toHaveBeenCalledWith("/user/managebook/group/update", {
        group_id: 10,
        name: "name",
      });
    });

    it("updateEpisodesPrice supports array and csv ids", async () => {
      mockedApiClient.put.mockResolvedValueOnce({ data: { ok: true } });
      await expect(updateEpisodesPrice([1, 2], 9)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.put).toHaveBeenCalledWith("/user/managebook/eps/price", {
        ep_ids: "1,2",
        coin: 9,
      });

      mockedApiClient.put.mockResolvedValueOnce({ data: { ok: true } });
      await expect(updateEpisodesPrice("3,4", 5)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.put).toHaveBeenCalledWith("/user/managebook/eps/price", {
        ep_ids: "3,4",
        coin: 5,
      });
    });

    it("fetchUserMyBookPermissions returns permission payload or null fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            set_fast_ticket: true,
            set_fast_coin: false,
            suggest_configs: [],
          },
        },
      });

      await expect(fetchUserMyBookPermissions()).resolves.toEqual({
        set_content_type: false,
        set_fast_ticket: true,
        set_fast_coin: false,
        set_fast_ticket_daily_increase: false,
        set_fast_coin_daily_increase: false,
        set_fast_ep_days: false,
        suggest_configs: [],
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/mybook-permissions");

      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            set_content_type: 1,
            set_fast_ticket: "true",
            set_fast_coin: "0",
            set_fast_ticket_daily_increase: "yes",
            set_fast_coin_daily_increase: "Y",
            set_fast_ep_days: 1,
            suggest_configs: null,
          },
        },
      });

      await expect(fetchUserMyBookPermissions()).resolves.toEqual({
        set_content_type: true,
        set_fast_ticket: true,
        set_fast_coin: false,
        set_fast_ticket_daily_increase: true,
        set_fast_coin_daily_increase: true,
        set_fast_ep_days: true,
        suggest_configs: [],
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("permissions-failed"));
      await expect(fetchUserMyBookPermissions()).resolves.toBeNull();
    });

    it("updateEpisodesFastAccessPrice sends csv ids and fast access payload", async () => {
      mockedApiClient.put.mockResolvedValueOnce({ data: { ok: true } });

      await expect(
        updateEpisodesFastAccessPrice([99999999, 100000000], {
          fast_ticket: 0,
          fast_ticket_daily_increase: 1,
          fast_coin: 2,
          fast_coin_daily_increase: 3,
        })
      ).resolves.toEqual({ ok: true });

      expect(mockedApiClient.put).toHaveBeenCalledWith(
        "/user/managebook/eps/fast-access-price",
        {
          ep_ids: "99999999,100000000",
          fast_ticket: 0,
          fast_ticket_daily_increase: 1,
          fast_coin: 2,
          fast_coin_daily_increase: 3,
        }
      );
    });

    it("deleteGroupEpisode succeeds from first delete endpoint", async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
      await expect(deleteGroupEpisode(7, 3)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/user/managebook/group/3/eps/7");
    });

    it("deleteGroupEpisode falls back to bulk delete endpoint", async () => {
      for (let i = 0; i < 8; i += 1) {
        mockedApiClient.delete.mockRejectedValueOnce(new Error(`delete-${i}-failed`));
      }
      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: "bulk" } });

      await expect(deleteGroupEpisode(11, 4)).resolves.toEqual({ ok: "bulk" });
      expect(mockedApiClient.delete).toHaveBeenLastCalledWith("/user/managebook/eps", {
        data: { episodeId: 11, groupId: 4 },
      });
    });

    it("deleteGroupEpisode falls back to post variant and then put variant", async () => {
      for (let i = 0; i < 10; i += 1) {
        mockedApiClient.delete.mockRejectedValueOnce(new Error(`delete-${i}-failed`));
      }
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: "post" } });
      await expect(deleteGroupEpisode(12)).resolves.toEqual({ ok: "post" });

      for (let i = 0; i < 10; i += 1) {
        mockedApiClient.delete.mockRejectedValueOnce(new Error(`delete2-${i}-failed`));
      }
      for (let i = 0; i < 8; i += 1) {
        mockedApiClient.post.mockRejectedValueOnce(new Error(`post-${i}-failed`));
      }
      mockedApiClient.put.mockResolvedValueOnce({ data: { ok: "put" } });
      await expect(deleteGroupEpisode(13, 5)).resolves.toEqual({ ok: "put" });
    });

    it("deleteGroupEpisode throws when all fallback strategies fail", async () => {
      for (let i = 0; i < 10; i += 1) {
        mockedApiClient.delete.mockRejectedValueOnce(new Error(`delete-${i}-failed`));
      }
      for (let i = 0; i < 8; i += 1) {
        mockedApiClient.post.mockRejectedValueOnce(new Error(`post-${i}-failed`));
      }
      for (let i = 0; i < 4; i += 1) {
        mockedApiClient.put.mockRejectedValueOnce(new Error(`put-${i}-failed`));
      }

      await expect(deleteGroupEpisode(14, 6)).rejects.toThrow("put-3-failed");
    });
  });

  describe("promotion management", () => {
    it("create/update/delete group promotion endpoints", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(
        createPromotion({
          group_ids: ["1", 2],
          subject: "promo",
          start_date: "2026-01-01",
          end_date: "2026-01-31",
          discount_percent: 20,
          book_id: "5051",
        })
      ).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/user/managebook/groups/promotion",
        expect.objectContaining({
          book_id: 5051,
          group_ids: [1, 2],
          discount_percent: "20",
        })
      );

      mockedApiClient.put.mockResolvedValueOnce({ data: { ok: true } });
      await expect(
        updatePromotion({
          dfb_id: 1,
          groupIDs: ["1", 2],
          subject: "promo2",
          start_date: "2026-02-01",
          end_date: "2026-02-28",
          discount_percent: 15,
          book_id: "5051",
        })
      ).resolves.toEqual({ ok: true });
      expect(mockedApiClient.put).toHaveBeenCalledWith(
        "/user/managebook/groups/promotion",
        expect.objectContaining({
          book_id: 5051,
          dfb_id: 1,
          groupIDs: [1, 2],
          discount_percent: "15",
        })
      );

      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
      await expect(deletePromotion("99")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        "/user/managebook/groups/promotion",
        { data: { dfb_id: 99 } }
      );
    });

    it("createPromotion sends group_ids as array for backend map compatibility", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });

      await expect(
        createPromotion({
          group_ids: "11680",
          subject: "promo",
          start_date: "2026/05/11 00:00:00",
          end_date: "2026/05/12 23:59:00",
          discount_percent: "30",
          book_id: 5051,
        })
      ).resolves.toEqual({ ok: true });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/user/managebook/groups/promotion",
        expect.objectContaining({ group_ids: [11680] })
      );
    });

    it("episode promotion create/delete endpoints", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(
        createGroupEpisodePromotion({
          ep_ids: "1,2",
          start_date: "2026-03-01",
          end_date: "2026-03-10",
          discount_price: 0,
        })
      ).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/user/managebook/eps/promotion",
        expect.objectContaining({ ep_ids: "1,2" })
      );

      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
      await expect(deleteGroupEpisodePromotion("1,2")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        "/user/managebook/eps/promotion",
        { data: { ids: "1,2" } }
      );
    });
  });

  describe("my books search", () => {
    it("fetchUserMyBooks uses defaults and custom params", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { list: [] } });
      await expect(fetchUserMyBooks()).resolves.toEqual({ list: [] });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/mybook/search", {
        params: { page: 1, limit: 10 },
      });

      mockedApiClient.get.mockResolvedValueOnce({ data: { list: [1] } });
      await expect(fetchUserMyBooks({ page: 2, limit: 5, status: "wait" })).resolves.toEqual({
        list: [1],
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/mybook/search", {
        params: { page: 2, limit: 5, status: "wait" },
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("mybook-failed"));
      await expect(fetchUserMyBooks()).resolves.toBeNull();
    });

    it("fetchUserMyBookListNames and fetchUserMyBookInfo return fallback values", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ book_id: 1 }] } });
      await expect(fetchUserMyBookListNames()).resolves.toEqual({ data: [{ book_id: 1 }] });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/mybook/list-names");

      mockedApiClient.get.mockRejectedValueOnce(new Error("list-names-failed"));
      await expect(fetchUserMyBookListNames()).resolves.toBeNull();

      mockedApiClient.get.mockResolvedValueOnce({ data: { fullname: "writer" } });
      await expect(fetchUserMyBookInfo("Bearer x")).resolves.toEqual({ fullname: "writer" });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/writer/info", {
        headers: { Authorization: "Bearer x" },
      });

      mockedApiClient.get.mockResolvedValueOnce({ data: { fullname: "writer2" } });
      await expect(fetchUserMyBookInfo()).resolves.toEqual({ fullname: "writer2" });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/writer/info", {});

      mockedApiClient.get.mockRejectedValueOnce(new Error("writer-info-failed"));
      await expect(fetchUserMyBookInfo()).resolves.toBeNull();
    });
  });
});
