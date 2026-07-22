import apiClient from '../apiClient';
import type { 
  VipTierConfig, 
  VipMeResponse, 
  VipPurchaseOption, 
  VipClaimableReward,
  VipClaimRewardResponse,
  VipHistoryLog
} from '@/types/vip';

// Base API endpoints path (using vip structure)
const VIP_BASE = '/vip';

export const vipApi = {
  getTiers: async (): Promise<VipTierConfig[]> => {
    const res = await apiClient.get(`${VIP_BASE}/tiers`);
    const tiers = res.data?.data || [];
    return tiers.map((tier: any) => {
      if (typeof tier.color_config === 'string') {
        try { tier.color_config = JSON.parse(tier.color_config); } catch (e) {}
      }
      return tier;
    });
  },

  getMe: async (): Promise<VipMeResponse> => {
    const res = await apiClient.get(`${VIP_BASE}/me`);
    const data = res.data?.data;
    if (data?.current_tier && typeof data.current_tier.color_config === 'string') {
      try { data.current_tier.color_config = JSON.parse(data.current_tier.color_config); } catch (e) {}
    }
    return data;
  },

  getPurchaseOptions: async (): Promise<VipPurchaseOption[]> => {
    const res = await apiClient.get(`${VIP_BASE}/purchase-options`);
    return res.data?.data || [];
  },

  purchaseVip: async (targetTierCode: string, idempotencyKey: string): Promise<any> => {
    const res = await apiClient.post(`${VIP_BASE}/purchase`, {
      target_tier_code: targetTierCode,
      currency_type: 'coin',
      idempotency_key: idempotencyKey
    });
    return res.data;
  },

  getClaimableRewards: async (status: string = 'open', page: number = 1, limit: number = 20): Promise<{ items: VipClaimableReward[], total: number }> => {
    const res = await apiClient.get(`${VIP_BASE}/rewards/claimable`, {
      params: { status, page, limit }
    });
    return res.data?.data || { items: [], total: 0 };
  },

  claimReward: async (claimableId: string): Promise<VipClaimRewardResponse> => {
    const res = await apiClient.post(`${VIP_BASE}/rewards/${claimableId}/claim`);
    return res.data?.data;
  },

  getHistory: async (page: number = 1, limit: number = 20): Promise<{ items: VipHistoryLog[], total: number }> => {
    const res = await apiClient.get(`${VIP_BASE}/history`, {
      params: { page, limit }
    });
    return res.data?.data || { items: [], total: 0 };
  }
};
