import { useState, useCallback, useEffect } from 'react';
import { vipApi } from '@/services/api/vipApi';
import type { VipPurchaseOption } from '@/types/vip';

export function useVipPurchase() {
  const [options, setOptions] = useState<VipPurchaseOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(true);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOptions = useCallback(async () => {
    try {
      setLoadingOptions(true);
      setError(null);
      const res = await vipApi.getPurchaseOptions();
      setOptions(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const purchase = async (targetTierCode: string) => {
    try {
      setIsPurchasing(true);
      setError(null);
      
      const idempotencyKey = `vip-web-${Date.now()}-${targetTierCode}`;
      
      const result = await vipApi.purchaseVip(targetTierCode, idempotencyKey);
      
      // Auto refresh options on success
      await fetchOptions();
      
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPurchasing(false);
    }
  };

  return { 
    options, 
    loadingOptions, 
    isPurchasing, 
    error, 
    refreshOptions: fetchOptions,
    purchase
  };
}
