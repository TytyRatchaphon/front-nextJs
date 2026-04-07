import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAvailableCoupons, claimCoupon, fetchUserCoupons } from '@/services/apiServices';
import { App, Empty, Modal, Button, Image as AntImage } from 'antd';
import { Ticket, Percent, Coins, BookOpenCheck, AlertCircle, Clock } from 'lucide-react';
import GifLoader from '@/components/utility/GifLoader';
import CouponCard from '@/components/coupon/CouponCard';
import { processCoupons, CouponUI } from '@/utils/couponUtils';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { useWebsiteStore } from '@/stores/websiteStore';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';

const AvailableCoupons = () => {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();
    const messageApi = {
        success: (content: unknown) => notification.success({ message: String(content ?? '') }),
        error: (content: unknown) => notification.error({ message: String(content ?? '') }),
        warning: (content: unknown) => notification.warning({ message: String(content ?? '') }),
        info: (content: unknown) => notification.info({ message: String(content ?? '') }),
    };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<CouponUI | null>(null);
    const { settings } = useWebsiteStore();

    // Fetch User Coupons to calculate ownedCount
    const { data: userCoupons = [] } = useQuery({
        queryKey: ['userCoupons'],
        queryFn: async () => {
             const data = await fetchUserCoupons();
             return processCoupons(data);
        }
    });

    const { data: availableCoupons = [], isLoading, isError } = useQuery({
        queryKey: ['availableCoupons'],
        queryFn: async () => {
             const data = await fetchAvailableCoupons();
             return processCoupons(data);
        }
    });

    const claimMutation = useMutation({
        mutationFn: claimCoupon,
        onSuccess: () => {
            messageApi.success('เก็บคูปองเรียบร้อยแล้ว!');
            queryClient.invalidateQueries({ queryKey: ['availableCoupons'] });
            queryClient.invalidateQueries({ queryKey: ['userCoupons'] });
            setIsModalOpen(false); // Close modal if claimed via modal (future feature)
        },
        onError: (error: any) => {
            messageApi.error(error?.response?.data?.message || 'ไม่สามารถเก็บคูปองได้');
        }
    });

    const handleClaim = (id: number) => {
        claimMutation.mutate(id);
    };

    const showModal = (coupon: CouponUI) => {
        setSelectedCoupon(coupon);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="col-span-full">
                <GifLoader className="h-[60vh]" />
            </div>
        );
    }

    if (isError) {
        return <div className="col-span-full"><Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" /></div>;
    }

    if (availableCoupons.length === 0) {
        return <div className="col-span-full"><Empty description="ไม่มีคูปองที่สามารถรับได้ในขณะนี้" /></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 min-h-[60vh] content-start">
            {availableCoupons.map((coupon) => {
                const targetId = coupon.couponId || coupon.id;
                const ownedCount = userCoupons.filter(c => (c.couponId || c.id) === targetId).length;
                const holdingLimit = coupon.holdingLimit || 1;
                const isClaimable = coupon.isClaimable && ownedCount < holdingLimit;

                return (
                    <CouponCard 
                        key={coupon.id} 
                        coupon={coupon} 
                        isClaimable={isClaimable}
                        isUserCoupon={false} // Always false for Available tab
                        ownedCount={ownedCount}
                        holdingLimit={holdingLimit}
                        actionDisabled={!isClaimable || claimMutation.isPending}
                        onAction={() => {
                            if (isClaimable) handleClaim(coupon.id);
                        }}
                        onClick={() => showModal(coupon)}
                    />
                );
            })}

             {/* Detail Modal */}
             <Modal
                title={
                    <div className="flex items-center gap-2 text-lg font-bold">
                       <Ticket className="text-red-500" />
                       รายละเอียดคูปอง
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                zIndex={2200}
            >
                {selectedCoupon && (
                    <div className="space-y-4 pt-2">
                        {/* Summary Removed */}

                        {/* Details */}
                         <div className="space-y-3">
                             <div className="flex gap-3">
                                 <div className="min-w-[24px] pt-1"><AlertCircle size={20} className="text-gray-400" /></div>
                                 <div>
                                     <h4 className="font-semibold text-gray-700 text-sm">รายละเอียด</h4>
                                     <p className="text-sm text-gray-500">{selectedCoupon.description}</p>
                                 </div>
                             </div>
                             
                             <div className="flex gap-3">
                                 <div className="min-w-[24px] pt-1"><Clock size={20} className="text-gray-400" /></div>
                                 <div>
                                     <h4 className="font-semibold text-gray-700 text-sm">ช่วงเวลาที่ใช้ได้</h4>
                                     <p className="text-sm text-gray-500">
                                         {selectedCoupon.usableStartAt 
                                            ? `${dayjs(selectedCoupon.usableStartAt).format('DD/MM/YYYY')} - ${selectedCoupon.usableEndAt ? dayjs(selectedCoupon.usableEndAt).format('DD/MM/YYYY') : 'ไม่จำกัดเวลา'}`
                                            : 'ไม่จำกัดเวลา'
                                         }
                                     </p>
                                     {(selectedCoupon.dailyStartTime || selectedCoupon.dailyEndTime) && (
                                         <p className="text-xs text-red-500 mt-1">
                                             * รับได้เฉพาะช่วงเวลา {selectedCoupon.dailyStartTime ? selectedCoupon.dailyStartTime.substring(0, 5) : '00:00'} - {selectedCoupon.dailyEndTime ? selectedCoupon.dailyEndTime.substring(0, 5) : '23:59'} น.
                                         </p>
                                     )}
                                 </div>
                             </div>

                             {selectedCoupon.rewards && selectedCoupon.rewards.length > 0 && (
                                 <div className="mt-4 border-t border-gray-100 pt-4">
                                     <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
                                         <Coins size={16} className="text-yellow-500" /> ของรางวัลที่จะได้รับ
                                     </h4>
                                      <div className="space-y-3">
                                         {selectedCoupon.rewards.map((reward, index) => {
                                             let config: any = {};
                                             if (typeof reward.rewardConfig === 'string') {
                                                 try { config = JSON.parse(reward.rewardConfig); } catch {}
                                             } else if (typeof reward.rewardConfig === 'object') {
                                                 config = reward.rewardConfig;
                                             }
 
                                             let rewardLabel = 'ของรางวัล';
                                             let rewardValue = '';
                                             let iconColor = 'text-gray-400';
 
                                             if (reward.rewardType === 'DISCOUNT_PERCENT') {
                                                 rewardLabel = 'ส่วนลดเปอร์เซ็นต์';
                                                 rewardValue = `ลด ${config?.percent || 0}%`;
                                                 iconColor = 'text-red-500';
                                             } else if (reward.rewardType === 'COIN') {
                                                 rewardLabel = 'เหรียญ';
                                                 rewardValue = `${config?.coin || config?.amount || 0} เหรียญ`;
                                                 iconColor = 'text-yellow-500';
                                             } else if (reward.rewardType === 'FREECOIN') {
                                                 rewardLabel = 'ถุงเงิน';
                                                 rewardValue = `${config?.coin || config?.amount || 0} ถุงเงิน`;
                                                 iconColor = 'text-yellow-500';
                                             } else if (reward.rewardType === 'NOVEL_WHOLE') {
                                                 if (reward.book) {
                                                     rewardLabel = reward.book.title;
                                                     rewardValue = 'นิยายอ่านฟรี';
                                                 } else {
                                                     rewardLabel = `นิยายวรยุทธ`;
                                                     rewardValue = `เรื่อง ID: ${config?.book_id || ''}`;
                                                 }
                                                 iconColor = 'text-green-500';
                                             } else if (reward.rewardType === 'BOXSET') {
                                                 rewardLabel = 'Boxset';
                                                 rewardValue = `ชุด ID: ${config?.series_id || config?.id || ''}`;
                                                 iconColor = 'text-purple-500';
                                             }
 
                                             return (
                                                 <div 
                                                    key={index} 
                                                    className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 border-gray-100"
                                                 >
                                                     <div className={`flex-shrink-0 flex items-center justify-center border border-gray-100 shadow-sm ${iconColor} overflow-hidden ${reward.rewardType === 'NOVEL_WHOLE' && reward.book ? 'w-12 h-16 rounded-md' : 'w-8 h-8 rounded-full bg-white'}`}>
                                                        {reward.book ? (
                                                         <AntImage 
                                                                src={resolveBookCoverImageSrc(reward.book, '/images/ejb.png')} 
                                                                alt={reward.book.title} 
                                                                className="w-full h-full object-cover" 
                                                                preview={{ mask: false, zIndex: 3100 }} 
                                                                width={100}
                                                                height={100}
                                                            />
                                                        ) : (
                                                            <>
                                                                {reward.rewardType === 'DISCOUNT_PERCENT' && <Percent size={16} />}
                                                                {reward.rewardType === 'COIN' && (
                                                                    settings?.coin ? <AntImage src={settings.coin} alt="coin" width={24} height={24} preview={false} /> : <Coins size={16} />
                                                                )}
                                                                {reward.rewardType === 'FREECOIN' && (
                                                                    settings?.freecoin ? <AntImage src={settings.freecoin} alt="freecoin" width={24} height={24} preview={false} /> : <Coins size={16} />
                                                                )}
                                                                {reward.rewardType === 'NOVEL_WHOLE' && <BookOpenCheck size={16} />}
                                                                {reward.rewardType === 'BOXSET' && <Ticket size={16} />}
                                                            </>
                                                        )}
                                                     </div>
                                                     <div className="flex-1 min-w-0">
                                                         <div className="font-bold text-gray-800 text-sm truncate">{rewardLabel}</div>
                                                         <div className="text-xs text-gray-500">{rewardValue}</div>
                                                     </div>
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                             )}
                         </div>

                        {/* Claim Button in Modal? Optional. 
                            If isClaimable, we could show "Collect" here too.
                            Let's keep it read-only for now as per "Show Details" request. 
                            Or add a button if user wants to claim from modal.
                            I'll add it if it's claimable! 
                        */}
                        {(() => {
                             const targetId = selectedCoupon.couponId || selectedCoupon.id;
                             const ownedCount = userCoupons.filter(c => (c.couponId || c.id) === targetId).length;
                             const holdingLimit = selectedCoupon.holdingLimit || 1;
                             const isClaimable = selectedCoupon.isClaimable && ownedCount < holdingLimit;

                             if (isClaimable) {
                                 return (
                                    <div className="pt-4 mt-4 border-t border-gray-100">
                                        <Button 
                                            type="primary" 
                                            danger 
                                            block 
                                            size="large" 
                                            shape="round"
                                            loading={claimMutation.isPending}
                                            onClick={() => handleClaim(selectedCoupon.id)}
                                            className="bg-red-600 hover:bg-red-700 h-12 font-bold shadow-md"
                                        >
                                            เก็บคูปอง
                                        </Button>
                                    </div>
                                 )
                             }
                             return null;
                        })()}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AvailableCoupons;
