
import React from 'react';
import { Ticket, Check } from 'lucide-react';
import CouponSvg from '@/components/utility/CouponSvg';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { CouponUI } from '@/utils/couponUtils';
import CouponTimer from './CouponTimer';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface CouponCardProps {
    coupon: CouponUI;
    isUserCoupon?: boolean;
    onAction?: (coupon: CouponUI) => void; // Button action
    onClick?: (coupon: CouponUI) => void;  // Card click action
    actionLabel?: string; // "Collect", "Use Code", etc.
    actionDisabled?: boolean;
    isClaimable?: boolean; // For visual styling
    ownedCount?: number;   // For display logic like (1/3)
    holdingLimit?: number;
    showAction?: boolean; // If false, hide button
}

const CouponCard: React.FC<CouponCardProps> = ({ 
    coupon, 
    isUserCoupon = false, 
    onAction,
    onClick,
    actionLabel,
    actionDisabled = false,
    isClaimable = true,
    ownedCount = 0,
    holdingLimit = 1,
    showAction = true
}) => {
    let svgType = 'discount_percent';
    let label = 'ส่วนลด';
    let badgeClass = 'bg-gray-100 text-gray-500';

    // 1. Check for Boxset (more than 1 reward)
    if (coupon.rewards && coupon.rewards.length > 1) {
        svgType = 'boxset';
        label = 'Boxset';
        badgeClass = 'bg-purple-100 text-purple-600';
    } 
    // 2. Check for Coin/Cashback
    else if (coupon.type === 'cashback' || coupon.rewards?.[0]?.rewardType === 'COIN' || coupon.rewards?.[0]?.rewardType === 'FREECOIN') {
            svgType = 'coin_freecoin';
            label = 'รางวัล';
            badgeClass = 'bg-yellow-100 text-yellow-700';
    } 
    // 3. Check for Novel Whole / Free Read
    else if (coupon.rewards?.[0]?.rewardType === 'NOVEL_WHOLE' || coupon.name.includes('อ่านฟรี') || coupon.description.includes('อ่านฟรี') || coupon.name.includes('ฟรี')) {
            svgType = 'novel_whole';
            label = 'อ่านฟรี';
            badgeClass = 'bg-green-100 text-green-600';
    } 
    // 4. Default to Discount
    else {
            svgType = 'discount_percent';
            label = 'ส่วนลด';
            badgeClass = 'bg-gray-100 text-gray-500';
    }
    
    return (
        <div 
            onClick={() => onClick && onClick(coupon)}
            className="group relative w-full bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-auto min-h-[160px]"
        >
            {/* Top Part: Content */}
            <div className="flex p-4 gap-3 flex-1">
                {/* Icon */}
                <div className="w-12 h-12 shrink-0">
                    <CouponSvg type={svgType} className="w-full h-full drop-shadow-sm" /> 
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-800 text-lg line-clamp-1 pr-2">{coupon.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeClass}`}>
                                {label}
                            </span>
                        </div>
                        
                        <div className="text-xs text-gray-400 mb-0.5">รายละเอียด</div>
                        <p className="text-base text-gray-600 font-medium line-clamp-2 mb-2 leading-relaxed">
                            {coupon.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-2">
                            <div>
                                {coupon.acquiredAt ? (
                                    <div className="flex flex-col gap-1">
                                        <div>
                                            <div className="text-[10px] text-gray-400 leading-none mb-0.5">วันที่ได้รับ</div>
                                            <div className="font-medium text-xs text-gray-600">
                                                {dayjs(coupon.acquiredAt).format('DD/MM/YYYY HH:mm')}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 leading-none mb-0.5">หมดอายุ</div>
                                            <div className="font-medium text-xs text-red-500">
                                                {coupon.expiresAt ? dayjs(coupon.expiresAt).format('DD/MM/YYYY HH:mm') : 'ไม่จำกัดเวลา'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-0.5 text-gray-400">เงื่อนไข</div>
                                        <div className="font-medium text-sm mb-1">
                                        {coupon.usableStartAt && coupon.usableEndAt
                                            ? `ใช้ได้ในช่วง ${dayjs(coupon.usableStartAt).format('DD/MM/YYYY')} - ${dayjs(coupon.usableEndAt).format('DD/MM/YYYY')}` 
                                            : ''}
                                        </div>
                                        <div className="font-medium text-sm">
                                        {(coupon.dailyStartTime || coupon.dailyEndTime)
                                            ? `รับได้ในช่วง ${coupon.dailyStartTime ? coupon.dailyStartTime.substring(0, 5) : '00:00'} - ${coupon.dailyEndTime ? coupon.dailyEndTime.substring(0, 5) : '23:59'} น. เท่านั้น` 
                                            : ''}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="mb-0.5 text-gray-400">จำนวนการใช้</div>
                                <div className="font-medium text-sm">{coupon.holdingLimit} ครั้ง/ผู้ใช้</div>
                            </div>
                        </div>
                </div>
            </div>
            
            {/* Separator */}
                <div className="relative w-full h-[1px] my-1">
                <div className="absolute left-0 top-0 w-full border-t border-dashed border-gray-200"></div>
                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-gray-50 rounded-full"></div>
                    <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-gray-50 rounded-full"></div>
                </div>

            {/* Bottom Part: Action */}
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
                    <div className="text-xs text-gray-400">
                        {isUserCoupon || coupon.acquiredAt ? (
                            <CouponTimer targetDate={coupon.endAt} className="text-sm text-red-500 font-medium" />
                        ) : (
                            <>
                                หมดอายุ <span className="text-red-500 font-medium text-sm">{coupon.endAt ? dayjs(coupon.endAt).format('DD/MM/YYYY') : 'ไม่จำกัดเวลา'}</span>
                            </>
                        )}
                    </div>

                {showAction && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onAction && !actionDisabled) {
                                onAction(coupon);
                            }
                        }}
                        disabled={actionDisabled}
                        className={`
                            px-4 py-2 text-base rounded-full font-bold transition-all duration-300 flex items-center gap-1
                            ${!isClaimable && !isUserCoupon // Visual Disabled look
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : (
                                    isClaimable 
                                    ? 'bg-red-600 !text-white hover:bg-red-700 shadow-sm' 
                                    : (
                                        coupon.status === 'USED'
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-green-500 !text-white hover:bg-green-600 shadow-sm'
                                    )
                                )
                            }
                        `}
                    >
                        {/* Custom content handling based on label */}
                        {isClaimable ? (
                            <>
                                <Ticket size={16} strokeWidth={2.5} /> 
                                {holdingLimit > 1 ? `เก็บ (${ownedCount}/${holdingLimit})` : 'เก็บคูปอง'}
                            </>
                        ) : (isUserCoupon ? (
                            coupon.status === 'USED' ? (
                                <>
                                    <Check size={16} strokeWidth={2.5} /> ใช้งานแล้ว
                                </>
                            ) : (
                                <>
                                    <Check size={16} strokeWidth={2.5} /> ใช้คูปอง
                                </>
                            )
                        ) : 'เก็บไม่ได้')}
                    </button>
                 )}
            </div>
            
            {coupon.count && coupon.count > 1 && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-20 shadow-sm">
                    x{coupon.count}
                </div>
            )}
        </div>
    );
};

export default CouponCard;
