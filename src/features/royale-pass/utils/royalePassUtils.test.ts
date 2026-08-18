import { describe, expect, it } from "vitest";

import type { RoyalePassDetail } from "@/services/api/royalePassApi";

import { buildRewardLevels, groupQuestsByScope } from "./royalePassUtils";

describe("royalePassUtils", () => {
  it("builds reward rows from flat rewards", () => {
    const detail = {
      pass_id: 1,
      name: "Test",
      is_preorder_period: false,
      is_started: true,
      levels: [],
      quests: [],
      rewards: [
        { level: 2, track: "free", reward_type: "coin", amount: 10, is_claimable: true, is_claimed: false },
        { level: 2, track: "premium", reward_type: "user_coupon", amount: 1, is_claimable: false, is_claimed: false },
      ],
    } as unknown as RoyalePassDetail;

    const levels = buildRewardLevels(detail);

    expect(levels).toHaveLength(1);
    expect(levels[0].level).toBe(2);
    expect(levels[0].freeRewards).toHaveLength(1);
    expect(levels[0].premiumRewards).toHaveLength(1);
  });

  it("builds reward rows from backend track items", () => {
    const detail = {
      pass_id: 1,
      name: "Track Payload",
      is_preorder_period: false,
      is_started: false,
      levels: [
        {
          level: 1,
          required_exp: 0,
          tracks: {
            free: {
              level: 1,
              track: "free",
              is_unlocked: false,
              is_claimed: false,
              items: [
                {
                  reward_id: 1,
                  reward_type: "coin",
                  amount: 100,
                  reward_display_text: "เหรียญ",
                  reward_image_url: "https://image.enjoybook.co/coin.png",
                },
              ],
            },
            premium: {
              level: 1,
              track: "premium",
              is_unlocked: false,
              is_claimed: false,
              items: [
                { reward_id: 2, reward_type: "freecoin", amount: 10, reward_display_text: "ถุงเงิน" },
                { reward_id: 3, reward_type: "user_coupon", amount: 1, reward_display_text: "คูปอง" },
              ],
            },
          },
        },
      ],
      quests: [],
      rewards: [],
    } as unknown as RoyalePassDetail;

    const levels = buildRewardLevels(detail);

    expect(levels[0].freeRewards).toHaveLength(1);
    expect(levels[0].freeRewards[0]).toMatchObject({ level: 1, track: "free", reward_type: "coin" });
    expect(levels[0].premiumRewards).toHaveLength(2);
    expect(levels[0].premiumRewards[0]).toMatchObject({ level: 1, track: "premium", reward_type: "freecoin" });
  });

  it("groups quests by active scope", () => {
    const groups = groupQuestsByScope([
      { name: "Daily", scope: "daily", track: "free", target_value: 1, progress_value: 0, exp_reward: 10, is_completed: false, is_exp_granted: false },
      { name: "Season", scope: "season", track: "premium", target_value: 1, progress_value: 1, exp_reward: 50, is_completed: true, is_exp_granted: false },
    ]);

    expect(groups.daily).toHaveLength(1);
    expect(groups.weekly).toHaveLength(0);
    expect(groups.season).toHaveLength(1);
  });
});
