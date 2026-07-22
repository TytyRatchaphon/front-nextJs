import { useState, useEffect, useCallback } from 'react';
import { getDailyCoinPassMe } from '@/services/api/dailyCoinPassApi';
import type { DailyCoinPassMeResponse } from '@/types/dailyCoinPass';
import { useAuthStore } from '@/stores/authStore';

export function useDailyCoinPass() {
  const [data, setData] = useState<DailyCoinPassMeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const { isLoggedIn } = useAuthStore();

  const fetchMe = useCallback(async () => {
    if (!isLoggedIn) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getDailyCoinPassMe();
      setData(response);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return {
    data,
    loading,
    error,
    refresh: fetchMe,
  };
}
