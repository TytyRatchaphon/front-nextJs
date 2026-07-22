'use client';

import React from 'react';
import { useVipTiers } from '@/features/vip/hooks/useVipTiers';
import { useVipMe } from '@/features/vip/hooks/useVipMe';
import { Crown } from 'lucide-react';
import { VipTiersTabView } from '@/features/vip/components/VipTiersTabView';

export default function VipTiersPage() {
  const { data: tiers, loading: tiersLoading } = useVipTiers();
  const { data: meData, loading: meLoading } = useVipMe();

  const loading = tiersLoading || meLoading;

  if (loading) {
    return <div className="p-20 text-center text-slate-400">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 mb-2 flex items-center justify-center gap-2">
            <Crown className="text-red-500" /> ระดับ VIP ทั้งหมด
          </h1>
          <p className="text-slate-500 font-medium">สิทธิพิเศษที่คุณจะได้รับในแต่ละระดับ</p>
        </div>

        <div className="w-full max-w-full overflow-hidden">
          <VipTiersTabView tiers={tiers} currentTierCode={meData?.current_tier?.tier_code} meData={meData} />
        </div>
      </div>
    </div>
  );
}
