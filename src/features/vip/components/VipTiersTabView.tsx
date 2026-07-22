import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Crown, Clock, Shield, Ticket, Stamp, BadgePercent, MessageCircle, Lock } from 'lucide-react';
import type { VipTierConfig } from '@/types/vip';
import type { VipMeResponse } from '@/types/vip';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

interface VipTiersTabViewProps {
  tiers: VipTierConfig[];
  currentTierCode?: string;
  meData?: VipMeResponse | null;
}

const TIER_COLORS: Record<string, { gradient: string; shadow: string; icon: string }> = {
  BRONZE:   { gradient: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/30', icon: 'text-amber-500' },
  SILVER:   { gradient: 'from-slate-400 to-slate-600', shadow: 'shadow-slate-500/30', icon: 'text-slate-500' },
  GOLD:     { gradient: 'from-yellow-400 to-yellow-600', shadow: 'shadow-yellow-500/30', icon: 'text-yellow-500' },
  PLATINUM: { gradient: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-500/30', icon: 'text-indigo-500' },
  DIAMOND:  { gradient: 'from-cyan-400 to-cyan-600', shadow: 'shadow-cyan-500/30', icon: 'text-cyan-500' },
};

const FALLBACK_CARD_IMAGES: Record<string, string> = {
  BRONZE: 'https://image.enjoybook.co/enjoybook.image/vip/card/BRONZE.png',
  SILVER: 'https://image.enjoybook.co/enjoybook.image/vip/card/SILVER.png',
  GOLD: 'https://image.enjoybook.co/enjoybook.image/vip/card/GOLD.png',
  PLATINUM: 'https://image.enjoybook.co/enjoybook.image/vip/card/PLATINUM.png',
  DIAMOND: 'https://image.enjoybook.co/enjoybook.image/vip/card/DIAMOND.png',
};

const FAST_PASS_TICKET: Record<string, string> = {
  GOLD: '1 ชิ้น ทุก 5 วัน',
  PLATINUM: '1 ชิ้น ทุก 3 วัน',
  DIAMOND: '1 ชิ้น ทุก 1 วัน',
};

const STAMP_REWARD: Record<string, string> = {
  GOLD: '1 ชิ้น ทุก 5 วัน',
  PLATINUM: '1 ชิ้น ทุก 3 วัน',
  DIAMOND: '1 ชิ้น ทุก 1 วัน',
};

const COUPON_DISCOUNT: Record<string, string> = {
  GOLD: '5% (1 ใบ/เดือน)',
  PLATINUM: '10% (1 ใบ/เดือน)',
  DIAMOND: '15% (1 ใบ/เดือน)',
};

function getBenefits(tier: VipTierConfig) {
  const benefits = [];

  benefits.push({
    icon: <Clock size={24} />,
    iconColor: 'text-blue-500',
    label: 'ระยะเวลา',
    desc: tier.duration_days > 0 ? `มีอายุการใช้งาน ${tier.duration_days} วัน` : 'สถานะใช้งานได้ตลอด ไม่มีวันหมดอายุ',
    value: tier.duration_days > 0 ? `${tier.duration_days} วัน` : 'ไม่จำกัด',
    hasValue: true,
  });

  benefits.push({
    icon: <Shield size={24} />,
    iconColor: 'text-red-500',
    label: 'สิทธิ์ดูอ่านล่วงหน้า (Time Pass)',
    desc: 'เข้าถึงตอนใหม่ที่ติด Time Pass ได้รวดเร็วกว่า',
    value: tier.time_pass_discount_percent > 0 ? `+${tier.time_pass_discount_percent}%` : null,
    hasValue: tier.time_pass_discount_percent > 0,
  });

  benefits.push({
    icon: <Ticket size={24} />,
    iconColor: 'text-amber-500',
    label: 'ตั๋วฟาสต์ดูล่วงหน้าฟรี',
    desc: 'รับตั๋วอ่านล่วงหน้าฟรีตามรอบที่กำหนด',
    value: FAST_PASS_TICKET[tier.tier_code] || null,
    hasValue: !!FAST_PASS_TICKET[tier.tier_code],
  });

  benefits.push({
    icon: <Stamp size={24} />,
    iconColor: 'text-purple-500',
    label: 'แสตมป์สะสมระดับยศ',
    desc: 'รับแสตมป์พิเศษสำหรับผู้ใช้ระดับสูง',
    value: STAMP_REWARD[tier.tier_code] || null,
    hasValue: !!STAMP_REWARD[tier.tier_code],
  });

  benefits.push({
    icon: <BadgePercent size={24} />,
    iconColor: 'text-pink-500',
    label: 'คูปองส่วนลดเติมเงิน',
    desc: 'รับคูปองส่วนลดเมื่อเติมเงินรายเดือน',
    value: COUPON_DISCOUNT[tier.tier_code] || null,
    hasValue: !!COUPON_DISCOUNT[tier.tier_code],
  });

  benefits.push({
    icon: <MessageCircle size={24} />,
    iconColor: 'text-green-500',
    label: 'สิทธิ์เข้าใช้ห้องแชทพิเศษ (Live Chat)',
    desc: 'สัญลักษณ์พิเศษและสิทธิ์เข้าแชทพูดคุยกับนักเขียน',
    value: 'เข้าถึงได้',
    hasValue: tier.live_chat_access || tier.tier_code === 'DIAMOND',
  });

  return benefits;
}

export function VipTiersTabView({ tiers, currentTierCode, meData }: VipTiersTabViewProps) {
  const sortedTiers = useMemo(() => {
    return [...tiers].sort((a, b) => a.step_required_amount_baht - b.step_required_amount_baht);
  }, [tiers]);

  const defaultTier = currentTierCode ? currentTierCode : (sortedTiers[0]?.tier_code || 'BRONZE');
  const [activeTierCode, setActiveTierCode] = useState<string>(defaultTier);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  const activeTier = sortedTiers.find(t => t.tier_code === activeTierCode) || sortedTiers[0];
  const isCurrentTier = activeTierCode === currentTierCode;
  
  const currentTierIndex = sortedTiers.findIndex(t => t.tier_code === (currentTierCode || 'BRONZE'));
  const activeTierIndex = sortedTiers.findIndex(t => t.tier_code === activeTierCode);
  const isTierUnlocked = currentTierIndex >= activeTierIndex;

  const benefits = activeTier ? getBenefits(activeTier) : [];

  const tabsRef = useRef<HTMLDivElement>(null);

  // Sync Tabs Scroll
  useEffect(() => {
    if (tabsRef.current) {
      const activeTab = tabsRef.current.querySelector('[data-active="true"]');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTierCode]);

  const handleTabClick = (tierCode: string) => {
    const index = sortedTiers.findIndex(t => t.tier_code === tierCode);
    if (swiperInstance && index !== -1) {
      swiperInstance.slideTo(index);
    }
  };

  if (!activeTier) return null;

  return (
    <div className="w-full flex flex-col min-h-[500px] bg-white">
      
      {/* Tabs Header */}
      <div className="border-b border-slate-100 bg-white sticky top-0 z-10">
        <div 
          ref={tabsRef}
          className="flex overflow-x-auto scrollbar-hide snap-x"
        >
          {sortedTiers.map(tier => {
            const isActive = tier.tier_code === activeTierCode;
            return (
              <button
                key={tier.tier_code}
                data-active={isActive}
                onClick={() => handleTabClick(tier.tier_code)}
                className={`relative px-6 py-4 text-sm font-medium whitespace-nowrap transition-all snap-start flex-1 min-w-[100px] text-center
                  ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}
                `}
              >
                {tier.name_th}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-red-600 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards Carousel Area with Swiper */}
      <div className="w-full bg-slate-50/30 overflow-hidden relative border-b border-slate-100 pb-10 pt-10">
        <Swiper
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          spaceBetween={40} // Add gap between slides
          coverflowEffect={{
            rotate: 0,
            stretch: 0, // Remove overlap pull
            depth: 100, // Less depth so they don't look too far back
            modifier: 1,
            slideShadows: false,
          }}
          modules={[EffectCoverflow]}
          onSwiper={setSwiperInstance}
          onSlideChange={(swiper) => {
            const current = sortedTiers[swiper.activeIndex];
            if (current && current.tier_code !== activeTierCode) {
              setActiveTierCode(current.tier_code);
            }
          }}
          initialSlide={sortedTiers.findIndex(t => t.tier_code === defaultTier)}
          className="w-full"
        >
          {sortedTiers.map((tier, index) => {
            const isUnlocked = currentTierIndex >= index;
            const colors = TIER_COLORS[tier.tier_code] || TIER_COLORS.BRONZE;

            return (
              <SwiperSlide key={tier.tier_code} style={{ width: 280 }}>
                {({ isActive }) => {
                  const displayImageUrl = tier.card_image_url || FALLBACK_CARD_IMAGES[tier.tier_code];
                  
                  return (
                    <div 
                      className={`w-[280px] h-[170px] rounded-2xl p-6 relative overflow-hidden transition-opacity duration-300 shadow-xl mx-auto
                        ${!displayImageUrl ? `bg-gradient-to-br ${isUnlocked ? colors.gradient : 'from-slate-400 to-slate-600'}` : 'bg-slate-800'}
                      `}
                      style={{
                        opacity: isActive ? 1 : 0.4
                      }}
                    >
                      {/* Dynamic Background Image */}
                      {displayImageUrl && (
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                          style={{ backgroundImage: `url(${displayImageUrl})`, filter: isUnlocked ? 'none' : 'saturate(45%) brightness(80%)' }}
                        />
                      )}
                      
                      {/* Decorative background elements (only if no custom image) */}
                      {!displayImageUrl && (
                        <>
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
                        </>
                      )}
                    
                    {/* Card Content */}
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex items-start justify-between">
                        {!displayImageUrl ? (
                          <div>
                            <h3 className="text-white font-bold text-lg tracking-wider opacity-90 drop-shadow-md">{tier.name_en}</h3>
                            <p className="text-white/80 text-xs mt-0.5 drop-shadow-md">VIP MEMBER</p>
                          </div>
                        ) : <div />}
                        {!displayImageUrl && (
                          tier.icon_url ? (
                            <img src={tier.icon_url} alt={tier.name_en} className={`w-8 h-8 object-contain transition-all ${!isUnlocked && 'saturate-75 opacity-90'}`} />
                          ) : (
                            <Crown size={32} className="text-white opacity-90 drop-shadow-sm" />
                          )
                        )}
                      </div>

                      <div className="flex items-end justify-between">
                        <div className="text-white/90 font-medium tracking-[0.2em] text-sm drop-shadow-md">
                          {!displayImageUrl && tier.name_th}
                        </div>
                        {!isUnlocked && (
                          <div className="bg-black/30 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1">
                            <Lock size={12} className="text-white/80" />
                            <span className="text-white/80 text-xs font-medium">Locked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                }}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* Content Area */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col bg-white">
        
        {/* Tier Info */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-normal text-slate-800 mb-2">
            สิทธิประโยชน์ระดับ{activeTier.name_th}
          </h2>
          
          <p className="text-slate-500 text-sm sm:text-base">
            {isCurrentTier ? (
              <>
                ระดับในปีนี้: คุณจะอยู่ในระดับ {activeTier.name_th} {meData?.current_tier.valid_until ? `จนถึงวันที่ ${new Date(meData.current_tier.valid_until).toLocaleDateString('th-TH')}` : 'ตลอดชีพ'}
              </>
            ) : (
              <>
                {activeTier.step_required_amount_baht > 0 
                  ? `ต้องมียอดสะสม ${activeTier.step_required_amount_baht.toLocaleString()} บาท เพื่อปลดล็อก` 
                  : 'ระดับเริ่มต้นสำหรับผู้ใช้ทุกคน'}
              </>
            )}
          </p>
        </div>

        {/* Minimalist Progress Bar */}
        {isCurrentTier && meData?.progress && meData.progress.next_tier_code && meData.progress.next_tier_required_amount_baht !== undefined && (
           <div className="w-full max-w-xl mx-auto mb-10">
             <div className="flex items-center justify-between gap-4">
               <span className="text-sm font-medium text-slate-600">0</span>
               <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                 <div 
                   className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
                   style={{ width: `${Math.min(100, (meData.progress.progress_amount_baht / meData.progress.next_tier_required_amount_baht) * 100)}%` }}
                 />
               </div>
               <span className="text-sm font-medium text-slate-600">{meData.progress.next_tier_required_amount_baht.toLocaleString()}</span>
             </div>
             <p className="text-center text-sm text-slate-500 mt-4">
               คุณปลดล็อกสถานะ{activeTier.name_th}แล้ว
             </p>
           </div>
        )}

        {/* Flat Benefits List */}
        <div key={activeTierCode} className="w-full max-w-xl mx-auto space-y-6 transition-all duration-500 animate-[fadeIn_0.5s_ease-out]">
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          {benefits.map((b, i) => {
            const isItemLocked = !isTierUnlocked || !b.hasValue;
            return (
              <div 
                key={i} 
                className={`flex items-start gap-5 transition-all duration-300
                  ${isItemLocked && 'opacity-50 grayscale'}
                `}
              >
                <div className={`shrink-0 mt-0.5 ${!isItemLocked ? b.iconColor : 'text-slate-400'}`}>
                  {b.icon}
                </div>
                <div className="flex-1 min-w-0 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-medium text-slate-800">{b.label}</span>
                    {isItemLocked && (
                      <Lock size={14} className="text-slate-400" />
                    )}
                  </div>
                  
                  {b.hasValue && b.value !== 'เข้าถึงได้' && b.value !== 'ไม่จำกัด' && b.value !== `${activeTier.duration_days} วัน` && (
                    <div className={`text-sm font-bold mb-1 ${!isItemLocked ? 'text-red-600' : 'text-slate-500'}`}>
                      {b.value}
                    </div>
                  )}
                  
                  <div className="text-sm text-slate-500 leading-relaxed">{b.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
