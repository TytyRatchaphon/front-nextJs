import Image from 'next/image';
import React from 'react';
import type { DailyCoinPassCalendarResponse } from '@/types/dailyCoinPass';
import { ClaimButton } from './ClaimButton';
import { Typography } from 'antd';
import { CheckCircle2, CircleDashed, CalendarX2 } from 'lucide-react';

const { Text } = Typography;

interface PassCalendarProps {
  calendar: DailyCoinPassCalendarResponse;
  onClaimSuccess?: () => void;
}

export function PassCalendar({ calendar, onClaimSuccess }: PassCalendarProps) {
  const { days, user_pass_id } = calendar;

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

  // We can group them by 7 days per row if we want, or just let CSS Grid handle it
  return (
    <div className="space-y-8">
      <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            ปฏิทินรางวัล
            {(calendar.summary?.missed_days || 0) > 0 && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold ml-2">
                คุณพลาดไป {calendar.summary?.missed_days || 0} วัน
              </span>
            )}
          </h4>
          <div className="text-sm font-medium text-slate-500">
            โควตาย้อนหลังคงเหลือ: <strong className="text-pink-500">{(calendar.summary?.catchup_quota || 0) - (calendar.summary?.catchup_used || 0)}</strong> ครั้ง
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
          {days?.map((day, dayIndex) => {
            // Determine UI state
            const isClaimed = day.status === 'claimed';
            const isMissed = day.status === 'expired' || day.status === 'catchup_quota_exhausted';
            const isFuture = day.status === 'future' || day.status === 'locked';
            const isClaimableToday = day.status === 'claimable_today';
            const isClaimableCatchup = day.status === 'claimable_catchup';
            
              let boxClasses = "relative flex flex-col items-center px-2 py-3 sm:p-4 h-[200px] rounded-3xl border-2 transition-all duration-300 min-w-[80px] sm:min-w-[90px] ";
              
              if (isClaimed) {
                boxClasses += "bg-slate-50 border-emerald-100 opacity-90";
              } else if (isClaimableToday) {
                boxClasses += "bg-white border-pink-400 shadow-lg shadow-pink-200/50 transform hover:-translate-y-1 z-10";
              } else if (isClaimableCatchup) {
                boxClasses += "bg-white border-orange-300 shadow-md hover:border-orange-400";
              } else if (isMissed) {
                boxClasses += "bg-slate-50 border-slate-200 opacity-60";
              } else {
                boxClasses += "bg-white border-slate-100 shadow-sm";
              }

            return (
              <div key={dayIndex} className={boxClasses}>
                {/* Day Number */}
                <div className="absolute top-2 left-3 text-xs font-bold opacity-50">
                  D{day.day_no}
                </div>
                
                {/* Icon Area */}
                <div className="flex-1 flex flex-col items-center justify-center mt-4 mb-2">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${isClaimableToday || isClaimableCatchup ? 'bg-pink-50 ring-4 ring-pink-50' : 'bg-slate-50 border border-slate-100'}`}>
                    <Image src={getRewardImage(day.reward_type) || ''} alt={day.reward_type || ''} width={40} height={40} className="w-10 h-10 object-contain drop-shadow-md hover:scale-110 transition-transform" unoptimized />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {day.amount && day.amount > 0 && (
                      <span className="font-black text-xl text-slate-800">{day.amount.toLocaleString()}</span>
                    )}
                    <span className="text-[11px] font-bold text-slate-500">{getRewardName(day.reward_type)}</span>
                  </div>
                </div>

                {/* Status / Action Area */}
                <div className="w-full shrink-0 flex flex-col justify-end">
                  {isClaimed && (
                    <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-100/80 px-2 h-10 rounded-xl w-full whitespace-nowrap">
                      <CheckCircle2 size={16} /> รับแล้ว
                    </div>
                  )}
                  
                  {isMissed && (
                    <div className="flex items-center justify-center gap-1 text-slate-400 font-bold text-sm bg-slate-200/50 px-2 h-10 rounded-xl w-full whitespace-nowrap">
                      <CalendarX2 size={16} /> พลาด
                    </div>
                  )}
                  
                  {isFuture && (
                    <div className="flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-100/50 px-2 h-10 rounded-xl w-full whitespace-nowrap">
                      {formatDate(day.service_date)}
                    </div>
                  )}

                  {isClaimableToday && (
                    <div className="w-full h-10">
                      <ClaimButton 
                        request={{
                          user_pass_id: user_pass_id,
                          claim_scope: 'today',
                          day_no: day.day_no
                        }} 
                        label="รับเลย" 
                        onSuccess={onClaimSuccess} 
                        variant="primary"
                        fullWidth
                      />
                    </div>
                  )}

                  {isClaimableCatchup && (
                    <div className="w-full h-10">
                      <ClaimButton 
                        request={{
                          user_pass_id: user_pass_id,
                          claim_scope: 'catchup',
                          day_no: day.day_no
                        }} 
                        label="ย้อนหลัง" 
                        onSuccess={onClaimSuccess} 
                        variant="catchup"
                        fullWidth
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
