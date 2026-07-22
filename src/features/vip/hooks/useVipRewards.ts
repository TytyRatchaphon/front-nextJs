import { useState, useCallback, useEffect } from 'react';
import { vipApi } from '@/services/api/vipApi';
import type { VipClaimableReward, VipClaimRewardResponse } from '@/types/vip';

export function useVipRewards(status: string = 'open', page: number = 1) {
  const [rewards, setRewards] = useState<VipClaimableReward[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isClaiming, setIsClaiming] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Error | null>(null);

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await vipApi.getClaimableRewards(status, page);
      setRewards(Array.isArray(res.items) ? res.items : []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const claimReward = async (claimableId: string): Promise<VipClaimRewardResponse> => {
    try {
      setIsClaiming(prev => ({ ...prev, [claimableId]: true }));
      setError(null);
      
      const result = await vipApi.claimReward(claimableId);
      
      // Auto refresh list on success
      await fetchRewards();
      
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsClaiming(prev => ({ ...prev, [claimableId]: false }));
    }
  };

  return { 
    rewards, 
    total,
    loading, 
    isClaiming, 
    error, 
    refreshRewards: fetchRewards,
    claimReward
  };
}
