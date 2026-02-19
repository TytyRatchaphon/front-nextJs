"use client"

import React, { useState } from 'react';
import { Ticket } from 'lucide-react';
import { message, Tabs, ConfigProvider, Button, Input, Empty, notification } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { claimCouponByCode, fetchAvailableCoupons, fetchUserCoupons } from '@/services/apiServices';
import AvailableCoupons from './AvailableCoupons';
import MyCoupons from './MyCoupons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

dayjs.extend(buddhistEra);
dayjs.locale('th');

const CouponDetail = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const queryClient = useQueryClient();
    const [couponCode, setCouponCode] = useState('');

    // Pre-fetch count available coupons for badge?
    // We can do a quick check or just remove the count if it's too much overhead 
    // or rely on AvailableCoupons to lift state up.
    // For now, let's just do a simple fetch here if we want the count, or omit it.
    // The prompt shows "มีคูปอง X ใบที่เก็บได้".
    // I Will keep it to maintain feature parity.
    const { data: availableCoupons = [] } = useQuery({
        queryKey: ['availableCouponsForCount'],
        queryFn: async () => {
             const data = await fetchAvailableCoupons();
             return data || [];
        }
    });
     const { data: userCoupons = [] } = useQuery({
        queryKey: ['userCouponsForCount'],
        queryFn: async () => {
             const data = await fetchUserCoupons();
             return data || [];
        }
    });
    

    const claimByCodeMutation = useMutation({
        mutationFn: claimCouponByCode,
        onSuccess: () => {
            notification.success({
                message: 'เก็บคูปองสำเร็จ!',
                description: 'เก็บคูปองสำเร็จ!',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                placement: 'topRight',
            });
            setCouponCode('');
            queryClient.invalidateQueries({ queryKey: ['availableCoupons'] });
            queryClient.invalidateQueries({ queryKey: ['userCoupons'] });
            queryClient.invalidateQueries({ queryKey: ['availableCouponsForCount'] });
        },
        onError: (error: any) => {
            notification.error({
                message: 'เก็บคูปองไม่สำเร็จ!',
                description: error?.response?.data?.message || 'ไม่สามารถใช้งานคูปองนี้ได้',
                icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
                placement: 'topRight',
            });
        }
    });

    const handleClaimByCode = () => {
        if (!couponCode.trim()) return;
        console.log('Claiming Coupon Code:', couponCode);
        claimByCodeMutation.mutate(couponCode);
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    fontFamily: 'inherit',
                    colorPrimary: '#ef4444',
                },
            }}
        >
            <div className="min-h-screen bg-gray-50 pb-20">
                {contextHolder}
                
                {/* Header Section */}
                <div className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100">
                    <div className="container mx-auto px-4 max-w-5xl">
                         <div className="py-4 flex items-center justify-between">
                            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                    <Ticket size={18} />
                                </span>
                                คูปองส่วนลด
                            </h1>
                            <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                มีคูปอง {availableCoupons.filter(c => c.isClaimable).length} ใบที่เก็บได้
                            </div>
                         </div>

                         <div className="bg-gray-50 p-4 rounded-xl mb-6">
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Ticket size={16} /> รหัสรับคูปอง
                            </h3>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="กรอกรหัสคูปอง" 
                                    size="large"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    className="rounded-lg border-gray-200"
                                />
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    danger 
                                    onClick={handleClaimByCode}
                                    loading={claimByCodeMutation.isPending}
                                    className="bg-red-600 hover:bg-red-700 min-w-[100px] rounded-lg font-bold shadow-sm"
                                >
                                    ยืนยัน
                                </Button>
                            </div>
                         </div>

                         <Tabs 
                            defaultActiveKey="1" 
                            centered
                            items={[
                                {
                                  key: '1',
                                  label: 'คูปองทั้งหมด',
                                  children: <AvailableCoupons />,
                                },
                                {
                                  key: '2',
                                  label: 'คูปองของฉัน',
                                  children: <MyCoupons />,
                                },
                            ]} 
                        />
                    </div>
                </div>
            </div>
        </ConfigProvider>
    );
};
export default CouponDetail;