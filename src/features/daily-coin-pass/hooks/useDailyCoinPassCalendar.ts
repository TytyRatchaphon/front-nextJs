import { useState, useCallback, useEffect } from 'react';
import { getDailyCoinPassCalendar } from '@/services/api/dailyCoinPassApi';
import type { DailyCoinPassCalendarResponse } from '@/types/dailyCoinPass';
import { useAuthStore } from '@/stores/authStore';

export function useDailyCoinPassCalendar(userPassId: number | null) {
  const [data, setData] = useState<DailyCoinPassCalendarResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const { isLoggedIn } = useAuthStore();

  const fetchCalendar = useCallback(async () => {
    if (!isLoggedIn || !userPassId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getDailyCoinPassCalendar(userPassId);
      setData(response);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, userPassId]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  return {
    data,
    loading,
    error,
    refresh: fetchCalendar,
  };
}
