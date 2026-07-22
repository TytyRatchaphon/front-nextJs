import React from 'react';
import type { VipPurchaseOption } from '@/types/vip';
import { Button, message } from 'antd';
import { Coins, ArrowUpCircle, Repeat } from 'lucide-react';
import { useVipPurchase } from '@/features/vip/hooks/useVipPurchase';

const FALLBACK_ICON_IMAGES: Record<string, string> = {
  BRONZE: 'https://image.enjoybook.co/enjoybook.image/icon-img/20260702112321mtzh.PNG',
  SILVER: 'https://image.enjoybook.co/enjoybook.image/icon-img/20260702112321mtzh.PNG',
  GOLD: 'https://image.enjoybook.co/enjoybook.image/icon-img/20260702112321mtzh.PNG',
  PLATINUM: 'https://image.enjoybook.co/enjoybook.image/icon-img/20260702112321mtzh.PNG',
  DIAMOND: 'https://image.enjoybook.co/enjoybook.image/icon-img/20260702112321mtzh.PNG',
};

const FALLBACK_CARD_IMAGES: Record<string, string> = {
  BRONZE: 'https://image.enjoybook.co/enjoybook.image/vip/card/BRONZE.png',
  SILVER: 'https://image.enjoybook.co/enjoybook.image/vip/card/SILVER.png',
  GOLD: 'https://image.enjoybook.co/enjoybook.image/vip/card/GOLD.png',
  PLATINUM: 'https://image.enjoybook.co/enjoybook.image/vip/card/PLATINUM.png',
  DIAMOND: 'https://image.enjoybook.co/enjoybook.image/vip/card/DIAMOND.png',
};

interface VipPurchasePanelProps {
  onSuccess?: () => void;
}

export function VipPurchasePanel({ onSuccess }: VipPurchasePanelProps) {
  const { options, loadingOptions, isPurchasing, purchase } = useVipPurchase();

  if (loadingOptions) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
        ))}
      </div>
    );
  }

  if (options.length === 0) {
    return null; // Or show a empty state
  }

  const handlePurchase = async (targetTier: string) => {
    try {
      await purchase(targetTier);
      message.success('ดำเนินการสำเร็จ');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      if (error?.data?.error_code === 'VIP_CURRENCY_NOT_ENOUGH') {
        message.error('Coin ของคุณไม่เพียงพอ กรุณาเติม Coin');
        // TODO: Could emit event or show a link to topup
      } else {
        message.error(error?.message || 'เกิดข้อผิดพลาดในการทำรายการ');
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        เลื่อนขั้นหรือต่ออายุ VIP
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt) => {
          const isStack = opt.purchase_kind === 'tier_extend_stack';
          const Icon = isStack ? Repeat : ArrowUpCircle;
          
          return (
            <div 
              key={`${opt.target_tier_code}-${opt.purchase_kind}`}
              className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col justify-between
                ${opt.can_purchase 
                  ? 'bg-white border-pink-200 shadow-sm hover:shadow-md transition-shadow' 
                  : 'bg-slate-50 border-slate-200 opacity-80'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                    ${isStack ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}
                  `}>
                    {opt.target_tier?.icon_url ? (
                      <img src={opt.target_tier.icon_url} alt="tier icon" className="w-8 h-8 object-contain" />
                    ) : (
                      <img src={`https://image.enjoybook.co/enjoybook.image/vip/card/${opt.target_tier_code}.png`} alt="tier icon" className="w-8 h-8 object-cover rounded-md" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-700">
                      {isStack ? 'ต่ออายุ' : 'อัปเกรดเป็น'}
                    </div>
                    <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                      {opt.target_tier ? opt.target_tier.name_en : opt.target_tier_code}
                      {opt.target_tier && (
                        <span className="text-xs font-normal text-slate-500">({opt.target_tier.name_th})</span>
                      )}
                    </div>
                  </div>
                </div>
                {isStack && opt.stack_duration_days && (
                  <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    +{opt.stack_duration_days} วัน
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-lg text-orange-500">
                  <Coins size={20} />
                  {opt.price.toLocaleString()}
                </div>
                <Button 
                  type="primary" 
                  shape="round"
                  disabled={!opt.can_purchase || isPurchasing}
                  loading={isPurchasing}
                  onClick={() => handlePurchase(opt.target_tier_code)}
                  className={`font-bold border-0 ${
                    isStack 
                      ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' 
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-pink-500/30'
                  } hover:shadow-lg`}
                >
                  {isStack ? 'ต่ออายุเลย' : 'อัปเกรดเลย'}
                </Button>
              </div>
              
              {!opt.can_purchase && opt.reason_not_purchasable && (
                <div className="text-xs text-red-500 mt-2 text-center">
                  {opt.reason_not_purchasable}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
