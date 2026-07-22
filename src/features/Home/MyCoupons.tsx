
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserCoupons, useCoupon as applyCoupon } from '@/services/apiServices';
import { App, Empty, Modal, Checkbox, Button, Image as AntImage } from 'antd';
import { Ticket, Percent, Coins, BookOpenCheck, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import GifLoader from '@/components/utility/GifLoader';
import CouponCard from '@/features/coupon/components/CouponCard';
import { processCoupons, CouponUI } from '@/utils/couponUtils';
import CouponApplicableBooks from './CouponApplicableBooks';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { useAuthStore } from '@/stores/authStore';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';
import { queryKeys } from '@/constants/query';

const MyCoupons = () => {
    const queryClient = useQueryClient();
    const { notification, modal } = App.useApp();
    const messageApi = {
        success: (content: unknown) => notification.success({ message: String(content ?? '') }),
        error: (content: unknown) => notification.error({ message: String(content ?? '') }),
        warning: (content: unknown) => notification.warning({ message: String(content ?? '') }),
        info: (content: unknown) => notification.info({ message: String(content ?? '') }),
    };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<CouponUI | null>(null);
    const [selectedRewardIds, setSelectedRewardIds] = useState<number[]>([]);
    const { settings } = useWebsiteSettings();

    const { data: userCoupons = [], isLoading, isError } = useQuery({
        queryKey: queryKeys.coupons.user(),
        queryFn: async () => {
            const data = await fetchUserCoupons();
            // processCoupons handles the data structure provided in the prompt
            return processCoupons(data);
        }
    });

    const useCouponMutation = useMutation({
        mutationFn: (data: { userCouponId: number, selectedRewardIds: number[] }) => applyCoupon(data.userCouponId, data.selectedRewardIds),
        onSuccess: (response: any) => {
             // Close selection modal first
             setIsModalOpen(false);
             setSelectedRewardIds([]);
             
             // Invalidate queries
             queryClient.invalidateQueries({ queryKey: queryKeys.coupons.userRoot() });

             // Update token if provided (New Logic)
             const  responseData = response?.data || response; // Handle potential response wrapping
             if (responseData?.token) {
                 const { updateToken } = useAuthStore.getState();
                 updateToken(responseData.token);
             }

             // Process response for display
             const rewards = responseData?.rewards || responseData?.data || [];
             
             if (rewards.length > 0) {
                 const rewardList = rewards.map((r: any) => {
                     let label = '';
                     let subLabel = '';
                     let img = null;

                     // Parse config safely
                     let config: any = {};
                     
                     if (r.config) {
                        if (typeof r.config === 'string') {
                            try { config = JSON.parse(r.config); } catch {}
                        } else if (typeof r.config === 'object') {
                            config = r.config;
                        }
                     } else if (r.rewardConfig) {
                         if (typeof r.rewardConfig === 'string') {
                            try { config = JSON.parse(r.rewardConfig); } catch {}
                            // Handle double stringifying just in case
                            if (typeof config === 'string') {
                                try { config = JSON.parse(config); } catch {}
                            }
                         } else if (typeof r.rewardConfig === 'object') {
                            config = r.rewardConfig;
                         }
                     }

                     // Support both type and rewardType
                     const rewardType = r.type || r.rewardType;
                     const type = rewardType;

                     if (rewardType === 'COIN') {
                         // Extensive check for amount
                         const amount = config?.coin || config?.amount || config?.coins || config?.value || config?.quantity || 
                                        r?.coin || r?.amount || r?.coins || r?.value || r?.quantity || 0;
                         label = `${amount}`;
                         subLabel = 'เหรียญ';
                         img = settings?.coin;
                     } else if (rewardType === 'FREECOIN') {
                         const amount = config?.coin || config?.amount || config?.coins || config?.value || config?.quantity || 
                                        r?.coin || r?.amount || r?.coins || r?.value || r?.quantity || 0;
                         label = `${amount}`;
                         subLabel = 'ถุงเงิน'; 
                         img = settings?.freecoin;
                     } else if (rewardType === 'DISCOUNT_PERCENT') {
                         label = `ส่วนลด ${config?.percent || 0}%`;
                         subLabel = 'ส่วนลด';
                     } else if (rewardType === 'NOVEL_WHOLE') {
                          if (r.book) {
                              label = r.book.title;
                              subLabel = 'นิยายอ่านฟรี';
                              img = resolveBookCoverImageSrc(r.book, '/images/ejb.png');
                          } else {
                             // Fallback: Try to find details in selectedCoupon
                             let originalReward = selectedCoupon?.rewards?.find((or: any) => {
                                 let orConfig: any = {};
                                 try { orConfig = typeof or.rewardConfig === 'string' ? JSON.parse(or.rewardConfig) : or.rewardConfig; } catch {}
                                 // loose equality for ID
                                 return or.rewardType === 'NOVEL_WHOLE' && (String(orConfig?.book_id) == String(config?.book_id));
                             });
                             
                             // If exact match failed, try just finding *any* NOVEL_WHOLE reward from the selected coupon
                             if (!originalReward) {
                                originalReward = selectedCoupon?.rewards?.find((or: any) => or.rewardType === 'NOVEL_WHOLE');
                             }

                              if (originalReward && originalReward.book) {
                                  label = originalReward.book.title;
                                  subLabel = 'นิยายอ่านฟรี';
                                  img = resolveBookCoverImageSrc(originalReward.book, '/images/ejb.png');
                              } else {
                                 label = `นิยายวรยุทธ`;
                                 // Only show ID if present
                                 subLabel = config?.book_id ? `เรื่อง ID: ${config.book_id}` : '';
                             }
                         }
                     } else if (rewardType === 'NOVEL_CHAPTER') {
                          if (r.book) {
                              label = r.book.title;
                              subLabel = `อ่านฟรีตอนที่ ${config?.ep_start || '?'} - ${config?.ep_end || '?'}`;
                              img = resolveBookCoverImageSrc(r.book, '/images/ejb.png');
                          } else {
                             let originalReward = selectedCoupon?.rewards?.find((or: any) => {
                                 let orConfig: any = {};
                                 try { orConfig = typeof or.rewardConfig === 'string' ? JSON.parse(or.rewardConfig) : or.rewardConfig; } catch {}
                                 return or.rewardType === 'NOVEL_CHAPTER' && (String(orConfig?.book_id) == String(config?.book_id));
                             });
                             
                             if (!originalReward) {
                                originalReward = selectedCoupon?.rewards?.find((or: any) => or.rewardType === 'NOVEL_CHAPTER');
                             }

                              if (originalReward && originalReward.book) {
                                  label = originalReward.book.title;
                                  subLabel = `อ่านฟรีตอนที่ ${config?.ep_start || '?'} - ${config?.ep_end || '?'}`;
                                  img = resolveBookCoverImageSrc(originalReward.book, '/images/ejb.png');
                              } else {
                                 label = `สิทธิ์อ่านตอนที่ ${config?.ep_start || '?'} - ${config?.ep_end || '?'}`;
                                 subLabel = config?.book_id ? `เรื่อง ID: ${config.book_id}` : '';
                             }
                         }
                     } else if (rewardType === 'BOXSET') {
                         label = `Boxset ${config?.series_id || ''}`;
                         subLabel = 'Boxset';
                     } else {
                         label = 'ของรางวัล';
                     }
                     return { label, subLabel, img, type, book: r.book }; // Include book for deeper checks if needed
                 });

                 modal.success({
                    title: (
                         <div className="text-center pt-2">
                             <h3 className="text-xl font-bold text-gray-800">ยินดีด้วย!</h3>
                             <p className="text-gray-500 text-sm font-normal">คุณได้รับของรางวัลดังนี้</p>
                         </div>
                    ),
                    content: (
                        <div className="pt-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
                            {rewardList.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-start bg-gray-50 rounded-xl p-3 border border-gray-100 gap-4">
                                    <div className={`flex-shrink-0 ${(item.type === 'NOVEL_WHOLE' || item.type === 'NOVEL_CHAPTER') ? 'w-16 h-24 rounded-md shadow-sm overflow-hidden' : 'w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm p-1'}`}>
                                        {item.img ? (
                                            <AntImage 
                                                src={item.img} 
                                                alt={item.type} 
                                                className={`w-full h-full ${(item.type === 'NOVEL_WHOLE' || item.type === 'NOVEL_CHAPTER') ? 'object-cover' : 'object-contain'}`}
                                                preview={(item.type === 'NOVEL_WHOLE' || item.type === 'NOVEL_CHAPTER') ? { mask: false } : false}
                                            />
                                        ) : item.type === 'COIN' || item.type === 'FREECOIN' ? (
                                            <Coins size={24} className="text-yellow-500" />
                                        ) : (
                                            <CheckCircle2 size={24} className="text-green-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center min-h-[3rem]">
                                        <h4 className="font-bold text-gray-800 text-base leading-tight mb-1">{item.label}</h4>
                                        <p className="text-gray-500 text-xs">{item.subLabel}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ),
                    okText: 'ตกลง',
                    okButtonProps: { 
                        className: '!bg-red-600 hover:!bg-red-700 !text-white !border-none !font-bold h-10 px-6 rounded-full shadow-md',
                        style: { color: 'white', backgroundColor: '#dc2626' } 
                    },
                    centered: true,
                    icon: null,
                    width: 400
                 });
             } else {
                 messageApi.success('ใช้คูปองสำเร็จ');
             }
        },
        onError: (error: any) => {
             messageApi.error(error?.response?.data?.message || 'ไม่สามารถใช้คูปองได้');
        }
    });

    const showModal = (coupon: CouponUI) => {
        setSelectedCoupon(coupon);
        // Auto-select logic
        if (coupon.rewards) {
           const quota = coupon.selectionQuota || coupon.rewards.length;
           if (coupon.rewards.length <= quota) {
               setSelectedRewardIds(coupon.rewards.map(r => r.id));
           } else {
               setSelectedRewardIds([]);
           }
        }
        setIsModalOpen(true);
    };

    const handleOk = () => {
        if (!selectedCoupon) return;
        
        const quota = selectedCoupon.selectionQuota || selectedCoupon.rewards?.length || 0;
        const rewardCount = selectedCoupon.rewards?.length || 0;
        const needsSelection = rewardCount > quota;

        if (needsSelection) {
            if (selectedRewardIds.length !== quota) {
                messageApi.warning(`กรุณาเลือกของรางวัลให้ครบ ${quota} ชิ้น`);
                return;
            }
        } else {
             if (selectedRewardIds.length === 0 && rewardCount > 0) {
                 setSelectedRewardIds(selectedCoupon.rewards?.map(r => r.id) || []);
             }
        }
             
        useCouponMutation.mutate({
            userCouponId: selectedCoupon.id, // Using the UserCoupon ID directly
            selectedRewardIds
        });
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

    if (userCoupons.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Ticket size={48} className="mb-4 opacity-20" />
                <p>ยังไม่มีคูปองที่เก็บแล้ว</p>
            </div>
        );
    }

    const isFullBookPercentCoupon = selectedCoupon?.couponType === 'FULL_BOOK_PERCENT'
        || selectedCoupon?.applyScope === 'FULL_BOOK';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 min-h-[60vh] content-start">
            {userCoupons.map((coupon) => (
                <CouponCard 
                    key={coupon.id} 
                    coupon={coupon} 
                    isUserCoupon={true} 
                    isClaimable={false} // Owned coupons are "use code"
                    onAction={() => showModal(coupon)}
                    onClick={() => showModal(coupon)}
                />
            ))}

            {/* Modal Logic */}
            <Modal
                title={
                    <div className="flex items-center gap-2 text-lg font-bold">
                       <Ticket className="text-red-500" />
                       รายละเอียดคูปอง
                    </div>
                }
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                zIndex={3000}
                width={560}
            >
                {selectedCoupon && (
                    <div className="flex flex-col">
                        <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto pr-3 custom-scrollbar">
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
                                     {selectedCoupon.usableStartAt && selectedCoupon.usableEndAt ? (
                                         <p className="text-sm text-gray-500">
                                             {dayjs(selectedCoupon.usableStartAt).format('DD/MM/YYYY')} - {dayjs(selectedCoupon.usableEndAt).format('DD/MM/YYYY')}
                                         </p>
                                     ) : (
                                         <p className="text-sm text-gray-500">ตลอดเวลา</p>
                                     )}
                                     
                                     {(selectedCoupon.dailyStartTime || selectedCoupon.dailyEndTime) && (
                                         <p className="text-xs text-gray-500 mt-1">
                                             ช่วงเวลารับ: {selectedCoupon.dailyStartTime ? selectedCoupon.dailyStartTime.substring(0, 5) : '00:00'} - {selectedCoupon.dailyEndTime ? selectedCoupon.dailyEndTime.substring(0, 5) : '23:59'} น.
                                         </p>
                                     )}
                                     {(selectedCoupon.usableDailyStartTime || selectedCoupon.usableDailyEndTime) && (
                                         <p className="text-xs text-red-500 mt-1">
                                             * ใช้ได้เฉพาะช่วงเวลา {selectedCoupon.usableDailyStartTime ? selectedCoupon.usableDailyStartTime.substring(0, 5) : '00:00'} - {selectedCoupon.usableDailyEndTime ? selectedCoupon.usableDailyEndTime.substring(0, 5) : '23:59'} น.
                                         </p>
                                     )}
                                     
                                     <h4 className="font-semibold text-gray-700 text-sm mt-3">หมดอายุ</h4>
                                     <p className="text-sm text-gray-500">
                                         {selectedCoupon.endAt ? dayjs(selectedCoupon.endAt).format('DD/MM/YYYY HH:mm น.') : 'ไม่จำกัดเวลา'}
                                     </p>
                                 </div>
                             </div>

                             <CouponApplicableBooks books={selectedCoupon.applicable_books} />

                             {(!selectedCoupon.applicable_books || selectedCoupon.applicable_books.length === 0) && selectedCoupon.rewards && selectedCoupon.rewards.length > 0 && (
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
                                             } else if (reward.rewardType === 'NOVEL_CHAPTER') {
                                                 if (reward.book) {
                                                     rewardLabel = reward.book.title;
                                                     rewardValue = `อ่านฟรีตอนที่ ${config?.ep_start || '?'} - ${config?.ep_end || '?'}`;
                                                 } else {
                                                     rewardLabel = reward.label || `สิทธิ์อ่านตอนที่ ${config?.ep_start || '?'} - ${config?.ep_end || '?'}`;
                                                     rewardValue = `เรื่อง ID: ${config?.book_id || ''}`;
                                                 }
                                                 iconColor = 'text-blue-500';
                                             } else if (reward.rewardType === 'BOXSET') {
                                                 rewardLabel = 'Boxset';
                                                 rewardValue = `ชุด ID: ${config.series_id || config.id}`;
                                                 iconColor = 'text-purple-500';
                                             }

                                             const quota = selectedCoupon.selectionQuota || selectedCoupon.rewards?.length || 0;
                                             const needsSelection = (selectedCoupon.rewards?.length || 0) > quota;
                                             const isSelected = selectedRewardIds.includes(reward.id);

                                             return (
                                                 <div 
                                                    key={index} 
                                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isSelected ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'} ${needsSelection ? 'cursor-pointer hover:border-red-200' : ''}`}
                                                    onClick={() => {
                                                        if (!needsSelection) return;
                                                        if (isSelected) {
                                                            setSelectedRewardIds(prev => prev.filter(id => id !== reward.id));
                                                        } else {
                                                            if (selectedRewardIds.length < quota) {
                                                                setSelectedRewardIds(prev => [...prev, reward.id]);
                                                            } else {
                                                                messageApi.warning(`เลือกได้สูงสุด ${quota} ชิ้น`); 
                                                            }
                                                        }
                                                    }}
                                                 >
                                                     {/* Checkbox always visible for Owned coupons in modal if selection needed, or checked/disabled if auto-selected? 
                                                         Prompt requested selection modal. Let's make it clear.
                                                         If needsSelection, checkbox is interactive.
                                                         If not, maybe just show it checked to indicate "you get this".
                                                     */}
                                                     <Checkbox 
                                                        checked={isSelected} 
                                                        disabled={!needsSelection}
                                                        className="mr-1" 
                                                     />
                                                     <div className={`flex items-center justify-center border border-gray-100 shadow-sm ${iconColor} overflow-hidden ${(reward.rewardType === 'NOVEL_WHOLE' || reward.rewardType === 'NOVEL_CHAPTER') && reward.book ? 'w-12 h-16 rounded-md' : 'w-8 h-8 rounded-full bg-white'}`}>
                                                        {reward.book ? (
                                                            <AntImage 
                                                                src={resolveBookCoverImageSrc(reward.book, '/images/ejb.png')} 
                                                                alt={reward.book.title} 
                                                                className="w-full h-full object-cover" 
                                                                preview={{ mask: false }} // Click to preview, no mask
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
                                                                {(reward.rewardType === 'NOVEL_WHOLE' || reward.rewardType === 'NOVEL_CHAPTER') && <BookOpenCheck size={16} />}
                                                                {reward.rewardType === 'BOXSET' && <Ticket size={16} />}
                                                            </>
                                                        )}
                                                     </div>
                                                     <div>
                                                         <div className="font-bold text-gray-800 text-sm">{rewardLabel}</div>
                                                         <div className="text-xs text-gray-500">{rewardValue}</div>
                                                     </div>
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                             )}
                         </div>

                        </div>
                        {/* Buttons outside scroll container */}
                        {isFullBookPercentCoupon ? (
                            <div className="pt-4 mt-4 border-t border-gray-100 shrink-0">
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-center">
                                    <Ticket size={16} className="mr-2" />
                                    <span className='font-medium'>คูปองนี้ใช้เป็นส่วนลดตอนซื้อทั้งเรื่องในหน้าหนังสือ</span>
                                </div>
                            </div>
                        ) : (
                        <div className="pt-4 mt-4 border-t border-gray-100 shrink-0">
                             <Button 
                                type="primary" 
                                danger 
                                block 
                                size="large" 
                                shape="round"
                                loading={useCouponMutation.isPending}
                                onClick={handleOk}
                                disabled={selectedCoupon?.status === 'USED'}
                                className={`h-12 font-bold shadow-md ${selectedCoupon?.status === 'USED' ? 'bg-gray-400 border-none' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {selectedCoupon?.status === 'USED' ? 'ใช้สิทธิ์คูปองนี้แล้ว' : 'ยืนยันการใช้คูปอง'}
                            </Button>
                        </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyCoupons;
