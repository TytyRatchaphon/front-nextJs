import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import { claimBookQuest, fetchBookQuests } from "./bookQuestApi";

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

describe("bookQuestApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns list payload fields used for quest detail and reward display", async () => {
    const quest = {
      book_quest_id: 4,
      name: "ซื้อให้ครบ",
      reward_preview: [
        {
          item_type: "user_coupon",
          item_type_display_text: "คูปอง",
          coupon_name: "ส่วนลดเล่มนี้",
          reward_image_url: null,
        },
      ],
      episodes: [{ ep_id: 8, ep_name: "บทที่ 8" }],
    };

    mockedApiClient.get.mockResolvedValueOnce({ data: { code: 200, data: [quest] } });

    await expect(fetchBookQuests(63)).resolves.toEqual([quest]);
    expect(mockedApiClient.get).toHaveBeenCalledWith("/book-quest/list", {
      params: { book_id: 63 },
    });
  });

  it("uses only the claim endpoint for claiming a quest reward", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200, data: { claim_id: 1 } } });

    await expect(claimBookQuest(4)).resolves.toEqual({ code: 200, data: { claim_id: 1 } });
    expect(mockedApiClient.post).toHaveBeenCalledWith("/book-quest/4/claim");
  });
});
