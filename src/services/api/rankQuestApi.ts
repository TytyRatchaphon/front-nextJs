import apiClient from '../apiClient';

export interface RankQuestBook {
  book_id: number;
  name: string;
  img: string | null;
}

export interface RankQuestProgress {
  progress_id: number | null;
  progress_value: number;
  target_value: number;
  is_completed: boolean;
  completed_at: string | null;
  percent: number;
}

export interface RankQuestClaim {
  is_claimed: boolean;
  claim_id: number | null;
  rp_tx_id: number | null;
  claimed_at: string | null;
}

export interface RankQuest {
  rp_quest_id: number;
  name: string;
  description: string | null;
  quest_type: string;
  target_ref_id: number | null;
  rp_reward: number;
  publish: string;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  book: RankQuestBook | null;
  progress: RankQuestProgress;
  claim: RankQuestClaim;
  is_claimable: boolean;
  item_count: number | null;
}

export interface RankQuestEpisodeItem {
  is_purchased: boolean;
  ep: {
    ep_id: number;
    book_id: number;
    name: string;
  };
}

export interface RankQuestDetail {
  item_count: number | null;
  items: RankQuestEpisodeItem[] | null;
}

interface RankQuestListResponse {
  code: number;
  status: string;
  message: string;
  data: RankQuest[];
}

interface RankQuestDetailResponse {
  code: number;
  status: string;
  message: string;
  data: RankQuestDetail;
}

export const fetchRankQuests = async (): Promise<RankQuest[]> => {
  try {
    const response = await apiClient.get<RankQuestListResponse>('/rank/quest/list');
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch {
    return [];
  }
};

export const fetchRankQuestDetail = async (
  questId: number | string,
): Promise<RankQuestDetail | null> => {
  try {
    const response = await apiClient.get<RankQuestDetailResponse>(`/rank/quest/${questId}`);
    return response.data?.data ?? null;
  } catch {
    return null;
  }
};

export const claimRankQuest = async (questId: number | string) => {
  const response = await apiClient.post(`/rank/quest/${questId}/claim`);
  return response.data;
};
