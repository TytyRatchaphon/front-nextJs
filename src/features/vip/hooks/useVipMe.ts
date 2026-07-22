import { useState, useCallback, useEffect } from 'react';
import { vipApi } from '@/services/api/vipApi';
import type { VipMeResponse } from '@/types/vip';

export function useVipMe() {
  const [data, setData] = useState<VipMeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVipMe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await vipApi.getMe();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVipMe();
  }, [fetchVipMe]);

  return { data, loading, error, refresh: fetchVipMe };
}
