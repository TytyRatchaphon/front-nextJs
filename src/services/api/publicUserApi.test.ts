import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  getPublicUserAchievementDetail,
  getPublicUserAchievements,
  getPublicUserCollectionDetail,
  getPublicUserCollections,
  getPublicUserProfile,
  getPublicUserRank,
} from "./publicUserApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe("publicUserApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPublicUserProfile returns response.data.data", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { user_id: 123, fullname: "Public User" } },
    });

    await expect(getPublicUserProfile("123")).resolves.toEqual({
      user_id: 123,
      fullname: "Public User",
    });
    expect(mockedApiClient.get).toHaveBeenCalledWith("/public/users/123/profile");
  });

  it("getPublicUserRank returns response.data.data", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { total_rp: 100, rp_needed: 20 } },
    });

    await expect(getPublicUserRank("123")).resolves.toEqual({
      total_rp: 100,
      rp_needed: 20,
    });
    expect(mockedApiClient.get).toHaveBeenCalledWith("/public/users/123/rank");
  });

  it("getPublicUserAchievements uses default and custom limit", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { pagination: { page: 1 }, list: [] } },
    });
    await getPublicUserAchievements("55");
    expect(mockedApiClient.get).toHaveBeenCalledWith("/public/users/55/achievements", {
      params: { limit: 3 },
    });

    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { pagination: { page: 1 }, list: [{ achievement_id: 1 }] } },
    });
    await expect(getPublicUserAchievements("55", 10)).resolves.toEqual({
      pagination: { page: 1 },
      list: [{ achievement_id: 1 }],
    });
    expect(mockedApiClient.get).toHaveBeenCalledWith("/public/users/55/achievements", {
      params: { limit: 10 },
    });
  });

  it("getPublicUserCollections uses default and custom pagination", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { pagination: { page: 1 }, list: [] } },
    });
    await getPublicUserCollections("99");
    expect(mockedApiClient.get).toHaveBeenCalledWith("/public/users/99/collections", {
      params: { page: 1, limit: 20 },
    });

    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { pagination: { page: 2 }, list: [{ collection_id: 5 }] } },
    });
    await expect(getPublicUserCollections("99", 2, 8)).resolves.toEqual({
      pagination: { page: 2 },
      list: [{ collection_id: 5 }],
    });
    expect(mockedApiClient.get).toHaveBeenCalledWith("/public/users/99/collections", {
      params: { page: 2, limit: 8 },
    });
  });

  it("getPublicUserCollectionDetail returns [] fallback when data is absent", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: [{ book_id: 1 }] },
    });
    await expect(getPublicUserCollectionDetail("7", 88)).resolves.toEqual([{ book_id: 1 }]);
    expect(mockedApiClient.get).toHaveBeenCalledWith("/public/users/7/collections/88");

    mockedApiClient.get.mockResolvedValueOnce({
      data: {},
    });
    await expect(getPublicUserCollectionDetail("7", 88)).resolves.toEqual([]);
  });

  it("getPublicUserAchievementDetail returns null fallback when data is absent", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { achievement_id: 10 } },
    });
    await expect(getPublicUserAchievementDetail("1", 10)).resolves.toEqual({
      achievement_id: 10,
    });
    expect(mockedApiClient.get).toHaveBeenCalledWith("/public/users/1/achievements/10");

    mockedApiClient.get.mockResolvedValueOnce({
      data: {},
    });
    await expect(getPublicUserAchievementDetail("1", 10)).resolves.toBeNull();
  });
});
