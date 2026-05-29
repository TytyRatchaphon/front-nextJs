import apiClient from "../apiClient";

export type BookQuestConditionType =
  | "BUY_EP_COUNT"
  | "BUY_EP_RANGE_COUNT"
  | "COMPLETE_ALL_PAID_EPISODES"
  | string;

export interface BookQuestProgress {
  progress_id?: number | null;
  progress_value: number;
  target_value: number;
  percent: number;
  is_completed: boolean;
  completed_at: string | null;
  eligible_purchase_count?: number;
  eligible_paid_amount?: number;
  eligible_base_rp?: number;
}

export interface BookQuestClaim {
  is_claimed: boolean;
  claim_id?: number | null;
  claimed_at: string | null;
}

export interface BookQuestRewardPreview {
  reward_id?: number;
  item_type: string;
  item_type_display_text?: string | null;
  item_id: number | string | null;
  amount: number;
  reward_amount?: number;
  current_reward_amount?: number;
  reward_amount_source?: string;
  is_dynamic_amount?: boolean;
  coupon_id?: number | null;
  coupon_name?: string | null;
  payout_wallet_type?: string;
  reward_unit?: string;
  reward_image_url?: string | null;
  condition?: {
    type?: string;
    display_text?: string;
    percent?: number;
    max_amount?: number;
    multiplier?: number;
    [key: string]: unknown;
  };
  config?: Record<string, unknown>;
}

export interface BookQuestBook {
  book_id: number;
  bookID?: string;
  name: string;
  title?: string;
  img?: string | null;
  img_gif?: string | null;
  status?: string;
}

export interface BookQuestEpisode {
  ep_id: number;
  book_id?: number;
  name?: string;
  ep_name?: string;
  is_bought?: boolean;
}

export interface BookQuest {
  book_quest_id: number;
  name: string;
  description?: string | null;
  quest_condition_type: BookQuestConditionType;
  target_book_id: number;
  target_value?: number;
  target_episode_ids?: Array<number | string>;
  claim_mode?: string;
  book?: BookQuestBook | null;
  episodes?: BookQuestEpisode[];
  progress: BookQuestProgress;
  claim: BookQuestClaim;
  is_claimable: boolean;
  reward_preview: BookQuestRewardPreview[];
}

export interface BookQuestClaimReward {
  item_type: string;
  amount: number;
  status?: string;
  result_ref_type?: string;
}

export interface BookQuestClaimResult {
  claim_id: number;
  book_quest_id: number;
  quest?: Partial<BookQuest>;
  rewards?: BookQuestClaimReward[];
}

type ApiEnvelope<T> = {
  code?: number;
  status?: string;
  message?: string;
  data: T;
};

const unwrapList = (payload: ApiEnvelope<BookQuest[]>): BookQuest[] => (
  Array.isArray(payload?.data) ? payload.data : []
);

export const fetchBookQuests = async (
  bookId?: number | string | null,
): Promise<BookQuest[]> => {
  const response = await apiClient.get<ApiEnvelope<BookQuest[]>>("/book-quest/list", {
    params: bookId ? { book_id: bookId } : undefined,
  });
  return unwrapList(response.data);
};

export const claimBookQuest = async (
  questId: number | string,
): Promise<ApiEnvelope<BookQuestClaimResult>> => {
  const response = await apiClient.post<ApiEnvelope<BookQuestClaimResult>>(`/book-quest/${questId}/claim`);
  return response.data;
};
