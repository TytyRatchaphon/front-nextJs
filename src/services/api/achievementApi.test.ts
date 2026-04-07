import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  claimAchievement,
  fetchAchievementDetail,
  fetchAchievements,
  fetchAchievementShowcase,
  fetchCompletedAchievements,
  updateAchievementShowcase,
} from "./achievementApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

describe("achievementApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetch functions", () => {
    it("fetchAchievements returns data or null fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ achievement_id: 1 }] } });
      await expect(fetchAchievements()).resolves.toEqual([{ achievement_id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/achievement");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchAchievements()).resolves.toBeNull();
    });

    it("fetchAchievementDetail returns data or null fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { achievement_id: 99 } } });
      await expect(fetchAchievementDetail(99)).resolves.toEqual({ achievement_id: 99 });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/achievement/99");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchAchievementDetail("99")).resolves.toBeNull();
    });

    it("fetchCompletedAchievements and fetchAchievementShowcase return [] fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
      await expect(fetchCompletedAchievements()).resolves.toEqual([{ id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/achievement/completed");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchCompletedAchievements()).resolves.toEqual([]);

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 2 }] } });
      await expect(fetchAchievementShowcase()).resolves.toEqual([{ id: 2 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/achievement/showcase");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchAchievementShowcase()).resolves.toEqual([]);
    });

    it("logs and returns fallback on get request failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockedApiClient.get.mockRejectedValueOnce(new Error("fetch-failed"));
      await expect(fetchAchievements()).resolves.toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      mockedApiClient.get.mockRejectedValueOnce(new Error("detail-failed"));
      await expect(fetchAchievementDetail(1)).resolves.toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      mockedApiClient.get.mockRejectedValueOnce(new Error("completed-failed"));
      await expect(fetchCompletedAchievements()).resolves.toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      mockedApiClient.get.mockRejectedValueOnce(new Error("showcase-failed"));
      await expect(fetchAchievementShowcase()).resolves.toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("mutation functions", () => {
    it("claimAchievement posts correct endpoint and returns data", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(claimAchievement(77)).resolves.toEqual({ code: 200 });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/achievement/77/claim");
    });

    it("updateAchievementShowcase posts payload and returns data", async () => {
      mockedApiClient.put.mockResolvedValueOnce({ data: { code: 200 } });
      await expect(updateAchievementShowcase([1, 2, 3])).resolves.toEqual({ code: 200 });
      expect(mockedApiClient.put).toHaveBeenCalledWith("/achievement/showcase", {
        showcase_ids: [1, 2, 3],
      });
    });

    it("logs and rethrows for mutation errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockedApiClient.post.mockRejectedValueOnce(new Error("claim-failed"));
      await expect(claimAchievement(1)).rejects.toThrow("claim-failed");
      expect(consoleErrorSpy).toHaveBeenCalled();

      mockedApiClient.put.mockRejectedValueOnce(new Error("update-failed"));
      await expect(updateAchievementShowcase([1])).rejects.toThrow("update-failed");
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
