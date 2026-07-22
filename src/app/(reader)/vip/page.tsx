"use client";

import React, { useState } from 'react';
import { useVipMe } from '@/features/vip/hooks/useVipMe';
import { useVipRewards } from '@/features/vip/hooks/useVipRewards';
import { useVipTiers } from '@/features/vip/hooks/useVipTiers';
import { VipTiersTabView } from '@/features/vip/components/VipTiersTabView';
import { VipPurchasePanel } from '@/features/vip/components/VipPurchasePanel';
import { VipRewardsModal } from '@/features/vip/components/VipRewardsModal';
import { AlertCircle, Gift, Sparkles } from 'lucide-react';
import { Button } from 'antd';
import Link from 'next/link';

export default function VipDashboardPage() {
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);
  const { data: meData, loading: meLoading, error: meError, refresh: refreshMe } = useVipMe();
  const { rewards, loading: rewardsLoading, isClaiming, claimReward, refreshRewards } = useVipRewards('open');
  const { data: tiersData } = useVipTiers();

  const handlePurchaseSuccess = () => {
    refreshMe();
    refreshRewards();
  };

  const handleClaimReward = async (id: string) => {
    await claimReward(id);
    refreshMe(); // Update summary
  };

  if (meError) {
    return (
      <div className="p-10 text-center max-w-2xl mx-auto mt-10 bg-red-50 rounded-2xl border border-red-100">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-red-600 mb-4">เกิดข้อผิดพลาดในการโหลดข้อมูล VIP</h2>
        <Button onClick={refreshMe} type="primary" danger>ลองใหม่อีกครั้ง</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 pt-10 pb-6 mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-2 sm:gap-3">
              VIP Membership <Sparkles className="text-red-500 shrink-0" />
              {meData?.current_tier?.icon_url && (
                <div 
                  className="ml-2 inline-flex items-center justify-center px-2 py-1 rounded border shadow-sm"
                  style={{
                    backgroundColor: meData.current_tier.color_config?.badge_bg || '#fffbeb',
                    borderColor: meData.current_tier.color_config?.badge_border || '#fde68a'
                  }}
                >
                  <img src={meData.current_tier.icon_url} alt="Current VIP" className="w-6 h-6 object-contain" />
                  <span 
                    className="ml-1 text-sm font-bold"
                    style={{ color: meData.current_tier.color_config?.badge_text || '#d97706' }}
                  >
                    {meData.current_tier.tier_code}
                  </span>
                </div>
              )}
            </h1>
            <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">สิทธิพิเศษระดับพรีเมียมสำหรับนักอ่านตัวจริง</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Button 
              type="primary" 
              className="rounded-full flex items-center gap-2 bg-pink-500 hover:bg-pink-600 border-none shadow-md shadow-pink-500/20"
              onClick={() => setRewardsModalOpen(true)}
            >
              <Gift size={16} /> 
              ของรางวัล
              {rewards.length > 0 && (
                <span className="flex items-center justify-center bg-white text-pink-600 text-xs font-black rounded-full h-5 min-w-[20px] px-1 ml-1">
                  {rewards.length}
                </span>
              )}
            </Button>
            <Link href="/vip/history">
              <Button type="default" className="rounded-full">ประวัติ</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Overview & Benefits */}
        <section>
          {meLoading || !tiersData ? (
            <div className="h-[500px] w-full bg-white rounded-3xl animate-pulse border border-slate-100 shadow-sm" />
          ) : (
            <VipTiersTabView tiers={tiersData} currentTierCode={meData?.current_tier?.tier_code} meData={meData} />
          )}
        </section>

        {/* Purchase Options */}
        <section>
          <VipPurchasePanel onSuccess={handlePurchaseSuccess} />
        </section>

      </div>
      <VipRewardsModal 
        open={rewardsModalOpen}
        onClose={() => setRewardsModalOpen(false)}
        rewards={rewards}
        loading={rewardsLoading}
        isClaiming={isClaiming}
        onClaim={handleClaimReward}
      />
    </div>
  );
}
