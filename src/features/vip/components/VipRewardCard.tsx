import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import type { VipClaimableReward } from '@/types/vip';
import { Button, message } from 'antd';
import { Gift, Clock, CheckCircle } from 'lucide-react';

interface VipRewardCardProps {
  reward: VipClaimableReward;
  onClaim: (id: string) => Promise<any>;
  isClaiming: boolean;
}

const getRewardImage = (type: string) => {
  const t = (type || '').toUpperCase();
  if (t === 'FREECOIN') return '/images/freecoin.png';
  if (t === 'COIN') return '/images/coin.png';
  if (t === 'STAMP') return '/images/stamp.png';
  if (t === 'FAST_TICKET' || t === 'TICKET') return '/images/fast_ticket.png';
  if (t === 'COUPON') return '/images/coupon.png';
  return '/images/gift_box.png';
};

export function VipRewardCard({ reward, onClaim, isClaiming }: VipRewardCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (reward.status !== 'pending' || !reward.claimable_at) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const claimDate = new Date(reward.claimable_at).getTime();
      const distance = claimDate - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft('พร้อมรับแล้ว (รอรีเฟรช)');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [reward]);

  const handleClaim = async () => {
    try {
      await onClaim(reward.claimable_id);
      message.success('รับรางวัลสำเร็จ!');
    } catch (error: any) {
      message.error(error?.message || 'ไม่สามารถรับรางวัลได้');
    }
  };

  const isPending = reward.status === 'pending';
  const isClaimable = reward.status === 'claimable';
  const isClaimed = reward.status === 'claimed';
  const isExpired = reward.status === 'expired';

  return (
    <div className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all
      ${isClaimable ? 'bg-white border-pink-200 shadow-sm' : 'bg-slate-50 border-slate-200'}
      ${isClaimed ? 'opacity-60' : ''}
    `}>
      <div className={`w-16 h-16 shrink-0 rounded-xl flex items-center justify-center text-3xl
        ${isClaimable ? 'bg-pink-50' : 'bg-white border border-slate-100'}
      `}>
        <Image src={getRewardImage(reward.reward_type) || ''} alt={reward.display_label || ''} width={40} height={40} className="w-10 h-10 object-contain drop-shadow-sm" unoptimized />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-800 truncate mb-1">{reward.display_label}</h4>
        
        {isPending && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-orange-500">
            <Clock size={14} />
            เปิดให้รับในอีก {timeLeft}
          </div>
        )}
        
        {isClaimed && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-green-500">
            <CheckCircle size={14} />
            รับแล้วเมื่อ {reward.claimed_at ? new Date(reward.claimed_at).toLocaleDateString('th-TH') : ''}
          </div>
        )}

        {isExpired && (
          <div className="text-xs font-medium text-slate-400">
            หมดเวลาการรับรางวัล
          </div>
        )}
      </div>

      <div className="shrink-0">
        {isClaimable && (
          <Button 
            type="primary"
            shape="round"
            loading={isClaiming}
            onClick={handleClaim}
            className="bg-gradient-to-r from-pink-500 to-rose-500 border-0 font-bold shadow-sm"
          >
            กดรับเลย
          </Button>
        )}
      </div>
    </div>
  );
}
