import Image from 'next/image';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DailyCoinPassActivePass } from '@/types/dailyCoinPass';
import { ClaimButton } from './ClaimButton';
import { LockKeyhole, Ticket, CheckCircle2, CalendarX2, ChevronRight } from 'lucide-react';
import { useDailyCoinPassCalendar } from '@/features/daily-coin-pass/hooks/useDailyCoinPassCalendar';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Modal } from 'antd';
import { PassCalendar } from './PassCalendar';
import 'swiper/css';
import 'swiper/css/navigation';

interface PassCardProps {
  pass: DailyCoinPassActivePass;
  onClaimSuccess?: () => void;
}

const getRewardImage = (type?: string) => {
  const t = (type || '').toUpperCase();
  if (t === 'FREECOIN') return '/images/money-bag.png';
  if (t === 'COIN') return '/images/coin.png';
  if (t === 'STAMP') return '/images/stamp.png';
  if (t === 'FAST_TICKET' || t === 'TICKET') return '/images/fast_ticket.png';
  if (t === 'COUPON') return '/images/coupon.png';
  return '/images/gift_box.png';
};

const getRewardName = (type?: string) => {
  const t = (type || '').toUpperCase();
  if (t === 'FREECOIN') return 'ถุงเงิน';
  if (t === 'COIN') return 'เหรียญ';
  if (t === 'STAMP') return 'แสตมป์';
  if (t === 'FAST_TICKET' || t === 'TICKET') return 'ตั๋วอ่านล่วงหน้า';
  if (t === 'COUPON') return 'คูปอง';
  return type;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

export function PassCard({ pass, onClaimSuccess }: PassCardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isLocked = pass.claim_state === 'locked_by_previous_stack';
  const isActive = pass.pass_state === 'active';
  const [localClaimedDays, setLocalClaimedDays] = useState<number[]>([]);
  
  // Fetch calendar data for this pass
  const { data: calendar, loading } = useDailyCoinPassCalendar(pass.user_pass_id);

  const handleClaimSuccess = (dayNo?: number) => {
    if (dayNo !== undefined) {
      setLocalClaimedDays(prev => [...prev, dayNo]);
    }
    if (onClaimSuccess) onClaimSuccess();
  };

  const handleCardClick = () => {
    if (calendar) {
      setIsModalOpen(true);
    } else {
      router.push(`/daily-coin-pass/${pass.user_pass_id}`);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent routing when clicking buttons or swiper
  };
  
  const renderDayBlock = (day: any, index: number) => {
    const isClaimedLocally = localClaimedDays.includes(day.day_no);
    const isClaimed = isClaimedLocally || day.status === 'claimed';
    const isMissed = !isClaimedLocally && (day.status === 'expired' || day.status === 'catchup_quota_exhausted');
    const isFuture = !isClaimedLocally && (day.status === 'future' || day.status === 'locked');
    const isClaimableToday = !isClaimedLocally && day.status === 'claimable_today';
    const isClaimableCatchup = !isClaimedLocally && day.status === 'claimable_catchup';
    
    let boxClasses = "relative flex flex-col items-center p-3 h-[180px] rounded-2xl border-2 transition-all duration-300 w-full max-w-[110px] mx-auto ";
    
    if (isClaimed) {
      boxClasses += "bg-slate-50 border-emerald-100 opacity-90";
    } else if (isClaimableToday) {
      boxClasses += "bg-white border-pink-400 shadow-md shadow-pink-200/50 z-10 hover:-translate-y-1";
    } else if (isClaimableCatchup) {
      boxClasses += "bg-white border-orange-300 shadow-sm";
    } else if (isMissed) {
      boxClasses += "bg-slate-50 border-slate-200 opacity-60";
    } else {
      boxClasses += "bg-white border-slate-100";
    }

    return (
      <div key={index} className={boxClasses}>
        {/* Day Number */}
        <div className="absolute top-2 left-3 text-[10px] font-bold opacity-50">
          D{day.day_no}
        </div>
        
        {/* Icon Area */}
        <div className="flex-1 flex flex-col items-center justify-center mt-3 mb-1">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isClaimableToday || isClaimableCatchup ? 'bg-pink-50 ring-2 ring-pink-50' : 'bg-slate-50 border border-slate-100'}`}>
            <Image src={getRewardImage(day.reward_type) || ''} alt={day.reward_type || ''} width={32} height={32} className="w-8 h-8 object-contain drop-shadow-sm hover:scale-110 transition-transform" unoptimized />
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-center leading-none">
            {day.amount && day.amount > 0 && (
              <span className="font-black text-sm text-slate-800">{day.amount.toLocaleString()}</span>
            )}
            <span className="text-[10px] font-bold text-slate-500">{getRewardName(day.reward_type)}</span>
          </div>
        </div>

        {/* Status / Action Area */}
        <div className="w-full shrink-0 flex flex-col justify-end mt-1 h-8" onClick={handleActionClick}>
          {isClaimed && (
            <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-100/80 rounded-lg w-full h-full">
              <CheckCircle2 size={12} /> รับแล้ว
            </div>
          )}
          {isMissed && (
            <div className="flex items-center justify-center gap-1 text-slate-400 font-bold text-[10px] bg-slate-200/50 rounded-lg w-full h-full">
              <CalendarX2 size={12} /> พลาด
            </div>
          )}
          {isFuture && (
            <div className="flex items-center justify-center text-slate-400 font-bold text-[10px] bg-slate-100/50 rounded-lg w-full h-full">
              {formatDate(day.service_date)}
            </div>
          )}
          {isClaimableToday && (
            <ClaimButton 
              request={{ user_pass_id: pass.user_pass_id, claim_scope: 'today', day_no: day.day_no }} 
              label="รับเลย" 
              onSuccess={() => handleClaimSuccess(day.day_no)} 
              variant="primary"
              fullWidth
            />
          )}
          {isClaimableCatchup && (
            <ClaimButton 
              request={{ user_pass_id: pass.user_pass_id, claim_scope: 'catchup', day_no: day.day_no }} 
              label="ย้อนหลัง" 
              onSuccess={() => handleClaimSuccess(day.day_no)} 
              variant="catchup"
              fullWidth
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      onClick={handleCardClick}
      className="relative cursor-pointer group rounded-3xl transition-all duration-300 hover:shadow-xl shadow-sm border border-slate-100 bg-white p-5 sm:p-6 overflow-hidden"
    >
      {/* Background Watermark (Concentric Circles) */}
      {isActive && (
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-20 z-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full border-[1px] border-pink-300" />
          <div className="absolute -top-5 -right-5 w-52 h-52 rounded-full border-[2px] border-pink-400" />
        </div>
      )}

      {/* Locked overlay effect */}
      {isLocked && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-30 flex items-center justify-center p-4">
          <div className="bg-white px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-lg flex items-center gap-2 text-slate-700 font-bold border border-slate-200 text-sm sm:text-base text-center">
            <LockKeyhole size={18} className="text-red-500 shrink-0" />
            <span>ต้องรับรางวัลพาสใบก่อนหน้าให้ครบก่อน</span>
          </div>
        </div>
      )}

      {/* Top Section: Pass Info */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border bg-white shadow-sm z-10
            ${isActive ? 'border-pink-200 text-pink-500' : 'border-slate-200 text-slate-400'}
          `}>
            {pass.assets?.icon?.url ? (
              <Image src={pass.assets?.icon?.url || ''} alt="icon" width={48} height={48} className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm" unoptimized />
            ) : (
              <Ticket size={32} strokeWidth={1.5} />
            )}
          </div>
          
          <div className="flex-1 min-w-0 z-10">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-1 leading-tight" title={pass.name}>
              {pass.name}
            </h3>
            <p className="text-sm text-slate-500 font-medium">รับรางวัลสุดพิเศษประจำวัน</p>
          </div>
        </div>

        {/* Tags (Top Right) */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 z-10">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${isActive ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
            {isActive ? 'กำลังใช้งาน' : 'หมดอายุ'}
          </span>
          {pass.effective_end_date && (
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium whitespace-nowrap">
              หมดอายุ: {pass.effective_end_date}
            </span>
          )}
        </div>
      </div>

      {/* Middle Section: Calendar Rewards */}
      <div className="relative z-10 bg-slate-50/50 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-5 sm:p-6 border-t border-slate-100" onClick={handleActionClick}>
        {loading && !calendar ? (
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="w-[110px] shrink-0 h-[180px] bg-slate-200/50 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : calendar && calendar.days.length > 0 ? (
          <div>
            {(() => {
              let activeSlideIndex = 0;
                if (calendar?.days?.length) {
                  let idx = calendar.days.findIndex(d => d.status === 'claimable_today');
                  if (idx === -1) idx = calendar.days.findIndex(d => d.status === 'claimable_catchup');
                  if (idx === -1) idx = calendar.days.findIndex(d => d.status === 'future' || d.status === 'locked');
                  if (idx !== -1) activeSlideIndex = idx;
                }
                
                return (
                  <div className="relative -mx-2 px-2">
                    <Swiper
                      modules={[Navigation]}
                      spaceBetween={12}
                      slidesPerView="auto"
                      navigation={false}
                      initialSlide={activeSlideIndex}
                      className="w-full !pt-2 !pb-4"
                    >
                  {calendar.days.map((day, idx) => (
                    <SwiperSlide key={idx} style={{ width: '110px' }}>
                      {renderDayBlock(day, idx)}
                    </SwiperSlide>
                  ))}
                </Swiper>
                  </div>
                );
            })()}
            
            <div className="flex justify-center sm:justify-end mt-4 px-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                className="flex items-center gap-1 text-sm font-bold text-pink-500 hover:text-pink-600 transition-colors bg-white px-4 py-2 rounded-full border border-pink-100 shadow-sm"
              >
                ดูรายละเอียดทั้งหมด <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 font-medium text-sm bg-white rounded-2xl border border-dashed border-slate-200">
            ไม่พบข้อมูลรางวัล
          </div>
        )}
      </div>

      {/* Full Calendar Modal */}
      <Modal
        title={<span className="text-xl font-bold text-slate-800">{pass.name}</span>}
        open={isModalOpen}
        onCancel={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
        footer={null}
        width={900}
        centered
        className="daily-coin-pass-modal"
      >
        <div className="pt-4 max-h-[70vh] overflow-y-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
          {calendar ? (
            <PassCalendar calendar={calendar} onClaimSuccess={() => handleClaimSuccess()} />
          ) : (
            <div className="text-center py-10 text-slate-500">ไม่พบข้อมูลปฏิทิน</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
