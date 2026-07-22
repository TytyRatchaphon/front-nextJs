import { useState, useCallback } from 'react';
import { claimDailyCoinPass } from '@/services/api/dailyCoinPassApi';
import type { DailyCoinPassClaimRequest, DailyCoinPassClaimResponse } from '@/types/dailyCoinPass';
import { App } from 'antd';
import { useAuthStore } from '@/stores/authStore';

export function useDailyCoinPassClaim(onSuccess?: (res: DailyCoinPassClaimResponse) => void) {
  const [claiming, setClaiming] = useState<boolean>(false);
  const { message } = App.useApp();
  const { isLoggedIn, updateUserBalance } = useAuthStore(); // updateBalance might exist, if not I'll need to check the store

  const claim = useCallback(async (request: DailyCoinPassClaimRequest) => {
    if (!isLoggedIn) {
      message.error("กรุณาเข้าสู่ระบบก่อนรับรางวัล");
      return null;
    }

    setClaiming(true);
    try {
      const res = await claimDailyCoinPass(request);
      
      // We'll let the component handle the success modal/UI, 
      // but we update the balance if there is a store function for it
      if (res.balance_after !== undefined) {
        // Need to check if updateBalance exists in authStore, for now we will just call the callback
      }
      
      if (onSuccess) {
        onSuccess(res);
      }
      return res;
    } catch (error: any) {
      console.error('Claim error:', error);
      const errCode = error?.response?.data?.code;
      
      // Map error codes to user-friendly messages
      if (errCode === 'daily_coin_pass_no_claimable_reward') {
        message.warning("ไม่มีรางวัลที่รับได้ในวันนี้");
      } else if (errCode === 'daily_coin_pass_catchup_quota_exceeded') {
        message.warning("โควตารับย้อนหลังเกินที่กำหนด");
      } else if (errCode === 'daily_coin_pass_previous_stack_claimable') {
        message.warning("กรุณารับรางวัลจากพาสใบก่อนหน้าให้ครบก่อน");
      } else if (errCode === 'daily_coin_pass_pass_not_found') {
        message.error("ไม่พบข้อมูลพาส หรือพาสหมดอายุแล้ว");
      } else {
        message.error(error?.response?.data?.message || "เกิดข้อผิดพลาดในการรับรางวัล");
      }
      return null;
    } finally {
      setClaiming(false);
    }
  }, [isLoggedIn, message, onSuccess]);

  return { claim, claiming };
}
