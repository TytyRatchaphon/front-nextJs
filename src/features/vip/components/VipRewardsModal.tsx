import React from 'react';
import { Modal } from 'antd';
import { Gift } from 'lucide-react';
import { VipRewardCard } from '@/features/vip/components/VipRewardCard';
import type { VipClaimableReward } from '@/types/vip';

interface VipRewardsModalProps {
  open: boolean;
  onClose: () => void;
  rewards: VipClaimableReward[];
  loading: boolean;
  isClaiming: Record<string, boolean>;
  onClaim: (id: string) => Promise<void>;
}

export function VipRewardsModal({
  open,
  onClose,
  rewards,
  loading,
  isClaiming,
  onClaim
}: VipRewardsModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
      title={
        <div className="flex items-center gap-2 pt-2">
          <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
            <Gift size={16} />
          </div>
          <span className="text-lg font-bold text-slate-800">ของรางวัลของคุณ</span>
        </div>
      }
      className="vip-rewards-modal !max-w-[95vw]"
      styles={{ body: { padding: '24px', maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <div className="pt-2">
        {loading ? (
          <div className="space-y-3">
            <div className="h-24 bg-slate-50 animate-pulse rounded-2xl" />
            <div className="h-24 bg-slate-50 animate-pulse rounded-2xl" />
          </div>
        ) : rewards.length > 0 ? (
          <div className="space-y-3">
            {rewards.map(reward => (
              <VipRewardCard 
                key={reward.claimable_id} 
                reward={reward} 
                onClaim={onClaim}
                isClaiming={!!isClaiming[reward.claimable_id]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Gift className="text-slate-300 mx-auto mb-3" size={48} />
            <div className="text-slate-600 font-bold mb-1">ไม่มีของรางวัลให้กดรับ</div>
            <div className="text-slate-400 text-sm">ตรวจสอบสิทธิประโยชน์ต่างๆ ของคุณได้ในหน้าระดับ VIP</div>
          </div>
        )}
      </div>
    </Modal>
  );
}
