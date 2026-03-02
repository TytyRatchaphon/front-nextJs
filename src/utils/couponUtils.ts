
import { Coupon as ApiCoupon } from '@/services/apiServices';

export interface CouponUI extends ApiCoupon {
    color: string;
    discountAmount: string;
    type: 'discount' | 'cashback' | 'shipping';
    couponId?: number; // For user coupons
    count?: number;
    status?: string;
    acquiredAt?: string | null;
    expiresAt?: string | null;
}

export const processCoupons = (data: any[]): CouponUI[] => {
    return data.map((item, index) => {
        // Check if it's a user coupon (has nested coupon object)
        const isUserCoupon = item.coupon && typeof item.coupon === 'object';
        const source = isUserCoupon ? item.coupon : item;
        
        // Construct the canonical coupon object
        // If user coupon: use item.id (UserCoupon ID) as main ID, map item.expiresAt to endAt
        const couponData = isUserCoupon ? {
            ...source,
            id: item.id,
            couponId: source.id,
            endAt: item.expiresAt || source.endAt,
            status: item.status,
            acquiredAt: item.acquiredAt,
            expiresAt: item.expiresAt,
        } : source;

        let discountAmount = 'ส่วนลด'; // Default fallback
        let type: 'discount' | 'cashback' | 'shipping' = 'discount';
        
        if (couponData.rewards && couponData.rewards.length > 0) {
            const reward = couponData.rewards[0];
            try {
                let config: any = {};
                if (typeof reward.rewardConfig === 'string') {
                    try { config = JSON.parse(reward.rewardConfig); } catch {}
                } else if (typeof reward.rewardConfig === 'object') {
                    config = reward.rewardConfig;
                }
                
                if (reward.rewardType === 'COIN' || reward.rewardType === 'FREECOIN') {
                    discountAmount = `${config?.amount || config?.coin || 0} เหรียญ`;
                    type = 'cashback';
                } else if (reward.rewardType === 'NOVEL_WHOLE') {
                    if (reward.book) {
                        discountAmount = reward.book.title;
                    } else {
                        discountAmount = 'นิยายอ่านฟรี';
                    }
                    type = 'discount';
                } else if (reward.rewardType === 'BOXSET') {
                    discountAmount = 'Boxset';
                    type = 'discount';
                 } else {
                    discountAmount = `${config?.amount || config?.coin || 0}${config?.type === 'PERCENT' ? '%' : '฿'}`;
                    type = 'discount';
                }
            } catch {
                discountAmount = 'N/A';
            }
        }

        const colors = [
            'from-orange-400 to-red-500',
            'from-blue-400 to-indigo-500',
            'from-emerald-400 to-teal-500',
            'from-pink-400 to-rose-500',
            'from-purple-400 to-violet-500'
        ];
        const color = colors[index % colors.length];

        // Return strictly as CouponUI
        return {
            ...couponData,
            discountAmount,
            type,
            color
        } as CouponUI;
    });
};
