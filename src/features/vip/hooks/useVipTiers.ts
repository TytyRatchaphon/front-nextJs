import { useState, useCallback, useEffect } from 'react';
import { vipApi } from '@/services/api/vipApi';
import type { VipTierConfig } from '@/types/vip';

export function useVipTiers() {
  const [data, setData] = useState<VipTierConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await vipApi.getTiers();
      setData(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  return { data, loading, error, refresh: fetchTiers };
}
