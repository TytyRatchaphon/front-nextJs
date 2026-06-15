import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  buyRoyalePassPremiumWithCoin,
  claimRoyalePassReward,
  fetchRoyalePassDetail,
  fetchRoyalePassList,
  parseRoyalePassDetail,
  parseRoyalePassList,
} from "./royalePassApi";

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

describe("royalePassApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses list data from a standard API envelope", () => {
    const result = parseRoyalePassList({
      code: 200,
      data: [
        {
          pass_id: "7",
          name: "Season 7",
          is_preorder_period: "1",
          is_started: 0,
          user_state: { current_level: "3", current_exp: "250" },
        },
      ],
    });

    expect(result[0]).toMatchObject({
      pass_id: 7,
      name: "Season 7",
      is_preorder_period: true,
      is_started: false,
      user_state: { current_level: 3, current_exp: 250 },
    });
  });

  it("fetches royale pass list and detail endpoints", async () => {
    mockedApiClient.get
      .mockResolvedValueOnce({ data: { data: [{ pass_id: 1, name: "A" }] } })
      .mockResolvedValueOnce({ data: { data: { pass_id: 1, name: "A", levels: [], rewards: [], quests: [] } } });

    await expect(fetchRoyalePassList()).resolves.toHaveLength(1);
    await expect(fetchRoyalePassDetail(1)).resolves.toMatchObject({ pass_id: 1 });

    expect(mockedApiClient.get).toHaveBeenNthCalledWith(1, "/user/royale-pass");
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(2, "/user/royale-pass/1");
  });

  it("parses grouped quest objects from detail responses", () => {
    const result = parseRoyalePassDetail({
      data: {
        pass_id: 2,
        name: "Grouped Quests",
        levels: {},
        rewards: {},
        quests: {
          daily: [{ quest_id: 11, name: "Daily", scope: "daily", target_value: 1 }],
          weekly: [{ quest_id: 12, name: "Weekly", scope: "weekly", target_value: 2 }],
          season: [{ quest_id: 13, name: "Season", scope: "season", target_value: 3 }],
        },
      },
    });

    expect(result?.quests).toHaveLength(3);
    expect(result?.quests.map((quest) => quest.scope)).toEqual(["daily", "weekly", "season"]);
  });

  it("uses coin purchase and reward claim endpoints", async () => {
    mockedApiClient.post
      .mockResolvedValueOnce({ data: { code: 200 } })
      .mockResolvedValueOnce({ data: { code: 200 } });

    await buyRoyalePassPremiumWithCoin(4);
    await claimRoyalePassReward(4, 10, "premium");

    expect(mockedApiClient.post).toHaveBeenNthCalledWith(1, "/user/royale-pass/4/buy-premium/currency", {
      currency_type: "coin",
    });
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(2, "/user/royale-pass/4/reward/10/premium/claim");
  });
});
