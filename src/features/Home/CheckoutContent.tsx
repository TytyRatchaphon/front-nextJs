"use client";
import * as React from "react";
import { useState, useEffect } from 'react';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { App, Empty, Spin, Form, Input, Button, Typography, Tag } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCheckoutItems, fetchCheckoutAddress, fetchCheckoutSummary, confirmCheckout } from '@/services/cartService';
import { updateUserAddress } from '@/services/apiServices';
import { 
    HomeOutlined, 
    CheckCircleOutlined, 
    LeftOutlined, 
    CloseCircleOutlined,
    ArrowRightOutlined,
    ShoppingCartOutlined,
    CreditCardOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import SuccessAnimation from '@/components/utility/SuccessAnimation';
import { resolveStoreImageSrc } from '@/utils/imageUtils';

const { Title, Text } = Typography;
const DEFAULT_STORE_IMAGE = '/images/ejb.png';

const isMissingImageSrc = (src: string | null | undefined) => {
    if (typeof src !== 'string') return true;
    const trimmed = src.trim();
    return !trimmed || trimmed === 'null' || trimmed === 'undefined';
};

// --- Custom Components for Redesign ---

const CustomStepIndicator = ({ current, total, steps }: { current: number, total: number, steps: any[] }) => {
    return (
        <div className="flex items-center justify-between mb-10 px-2 lg:px-0">
            {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center flex-1 relative">
                    {/* Line connector */}
                    {idx < total - 1 && (
                        <div className={`absolute left-[50%] right-[-50%] top-5 h-[2px] z-0 transition-colors duration-500 ${idx < current ? 'bg-red-500' : 'bg-gray-200'}`} />
                    )}
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 transform ${idx === current ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-200' : idx < current ? 'bg-red-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
                        {idx < current ? <CheckCircleOutlined /> : step.icon}
                    </div>
                    <span className={`mt-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${idx === current ? 'text-red-600' : 'text-gray-400'}`}>
                        {step.title}
                    </span>
                </div>
            ))}
        </div>
    );
};

const CustomCard = ({ children, title, icon, className = "" }: { children: React.ReactNode, title?: string, icon?: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
        {title && (
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
                {icon && <span className="text-red-500">{icon}</span>}
                <Text strong className="text-gray-800">{title}</Text>
            </div>
        )}
        <div className="p-6">
            {children}
        </div>
    </div>
);

const AddressForm = ({ user, token, onSuccess }: { user: any, token: string | null, onSuccess: () => void }) => {
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const [loading, setLoading] = useState(false);
    const { updateUserBalance } = useAuthStore();

    const onFinish = async (values: any) => {
        if (!token) return;
        
        const phoneInput = values.phone;
        const validPrefixes = ['06', '08', '09'];
        const hasValidPrefix = validPrefixes.some(prefix => phoneInput.startsWith(prefix));

        if (!hasValidPrefix || !isValidPhoneNumber(phoneInput, 'TH')) {
            notification.warning({
                message: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
                description: 'กรุณากรอกเบอร์โทรศัพท์มือถือที่ขึ้นต้นด้วย 06, 08 หรือ 09 เท่านั้น',
                placement: 'topRight',
            });
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            if (user?.fullname) formData.append('fullname', user.fullname);
            formData.append('address_main', values.address);
            formData.append('phone', values.phone);
            if (user?.user_id) formData.append('user_id', String(user.user_id));

            await updateUserAddress(formData, token);
            notification.success({ message: 'บันทึกที่อยู่เรียบร้อยแล้ว' });
            
            updateUserBalance({ address_main: values.address, phone: values.phone });
            onSuccess();
        } catch (error: any) {
            notification.error({
                message: 'บันทึกไม่สำเร็จ',
                description: error?.response?.data?.message || 'เกิดข้อผิดพลาด',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ address: user?.address_main || '', phone: user?.phone || '' }}
            className="space-y-4"
        >
            <Form.Item
                label={<span className="text-xs font-bold uppercase text-gray-400 tracking-wider">ที่อยู่จัดส่ง</span>}
                name="address"
                rules={[{ required: true, message: 'กรุณากรอกที่อยู่' }]}
            >
                <Input.TextArea rows={4} placeholder="บ้านเลขที่, ถนน, แขวง, เขต, จังหวัด, รหัสไปรษณีย์" className="rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-100" />
            </Form.Item>

            <Form.Item
                label={<span className="text-xs font-bold uppercase text-gray-400 tracking-wider">เบอร์โทรศัพท์</span>}
                name="phone"
                rules={[{ required: true, message: 'กรุณากรอกเบอร์โทร' }]}
            >
                <Input placeholder="08xxxxxxxx" maxLength={10} className="rounded-xl border-gray-200 h-12 focus:border-red-500 focus:ring-red-100" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} size="large" block className="h-12 rounded-xl bg-red-500 hover:bg-red-600 border-none shadow-md shadow-red-100">
                บันทึกและใช้ที่อยู่นี้
            </Button>
        </Form>
    );
};

export default function CheckoutContent() {
    const [currentStep, setCurrentStep] = useState(0);
    const { settings } = useWebsiteSettings();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { notification } = App.useApp();
    const { user, token, updateToken } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPostSuccessActions, setShowPostSuccessActions] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    const { data: checkoutItemsData, isLoading: isLoadingItems } = useQuery({
        queryKey: ['checkoutItems'],
        queryFn: fetchCheckoutItems,
        enabled: currentStep === 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    const { data: checkoutAddressData, isLoading: isLoadingAddress, refetch: refetchAddress } = useQuery({
        queryKey: ['checkoutAddress'],
        queryFn: fetchCheckoutAddress,
        enabled: currentStep <= 1,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    const { data: checkoutSummaryData, isLoading: isLoadingSummary } = useQuery({
        queryKey: ['checkoutSummary'],
        queryFn: fetchCheckoutSummary,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ['checkoutItems'] });
        queryClient.invalidateQueries({ queryKey: ['checkoutAddress'] });
        queryClient.invalidateQueries({ queryKey: ['checkoutSummary'] });
    }, [queryClient]);

    const steps = [
        { id: 'items', title: 'รายการสินค้า', icon: <ShoppingCartOutlined /> },
        ...(checkoutAddressData?.has_physical_items !== false ? [{ id: 'address', title: 'ที่อยู่', icon: <EnvironmentOutlined /> }] : []),
        { id: 'summary', title: 'ชำระเงิน', icon: <CreditCardOutlined /> },
    ];

    const currentStepId = steps[currentStep]?.id || 'items';

    const nextStep = () => {
        setCurrentStep(prev => prev + 1);
    };

    const renderCurrencyIcon = (currency: string, size = 18) => {
        const cur = (currency || '').toLowerCase();
        const map: any = {
            coin: settings?.coin || "/images/e-coin.png",
            freecoin: settings?.freecoin || "/images/money-bag.png",
            stamp: settings?.stamp || "/images/stamp.png",
            current_rp: settings?.rp || "/images/rp.png",
            rp: settings?.rp || "/images/rp.png"
        };
        const src = map[cur] || map.coin;
        return <Image src={src} alt={currency} width={size} height={size} className="object-contain inline-block" unoptimized />;
    };

    const renderStepContent = () => {
        if (currentStepId === 'items') {
            if (isLoadingItems) return <div className="py-20 flex justify-center"><Spin size="large" /></div>;
            return (
                <div className="space-y-4 animate-in fade-in duration-500">
                    {checkoutItemsData?.items?.map((item: any, idx: number) => {
                        const isDefaultCover = isMissingImageSrc(item.img);
                        const itemImageSrc = isDefaultCover
                            ? DEFAULT_STORE_IMAGE
                            : resolveStoreImageSrc(item.img, DEFAULT_STORE_IMAGE);

                        return (
                            <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center group transition-all hover:border-red-100 hover:shadow-md" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className={`relative w-20 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 shadow-inner ${isDefaultCover ? 'bg-white p-2' : 'bg-gray-50'}`}>
                                    <Image
                                        src={itemImageSrc}
                                        alt={item.name || 'สินค้า'}
                                        fill
                                        unoptimized
                                        className={`${isDefaultCover ? 'object-contain' : 'object-cover group-hover:scale-105'} transition-transform duration-500`}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Text strong className="text-base block truncate text-gray-800">{item.name}</Text>
                                    <Text type="secondary" className="text-xs block truncate mb-2">{item.description}</Text>
                                    <div className="flex items-center justify-between">
                                        <Tag className="rounded-full bg-gray-50 border-gray-100 text-gray-500 px-3">จำนวน: x{item.quantity}</Tag>
                                        <div className="flex items-center gap-1.5">
                                            <Text strong className="text-lg text-red-500">{item.total_price.toLocaleString()}</Text>
                                            {renderCurrencyIcon(item.currency)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {(!checkoutItemsData?.items || checkoutItemsData.items.length === 0) && <Empty description="ไม่มีสินค้าในรายการ" />}
                </div>
            );
        }

        if (currentStepId === 'address') {
            if (isLoadingAddress) return <div className="py-20 flex justify-center"><Spin size="large" /></div>;
            const { has_physical_items, address, phone } = checkoutAddressData || {};
            
            if (!has_physical_items) {
                return (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl">
                            <CheckCircleOutlined />
                        </div>
                        <Title level={4} className="!m-0">ไม่ต้องใช้ที่อยู่จัดส่ง</Title>
                        <Text type="secondary">รายการของคุณเป็นสินค้าดิจิทัลทั้งหมด</Text>
                    </div>
                );
            }

            const hasAddress = address && address.trim() !== "" && phone && phone.trim() !== "";

            return (
                <div className="animate-in slide-in-from-right duration-500">
                    <CustomCard title="รายละเอียดการจัดส่ง" icon={<EnvironmentOutlined />}>
                        {hasAddress && !isEditingAddress ? (
                            <div className="space-y-4">
                                <div className="p-5 bg-red-50/30 rounded-2xl border border-red-50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <HomeOutlined style={{ fontSize: '60px' }} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="mb-4">
                                            <span className="text-[10px] font-bold uppercase text-red-400 tracking-widest block mb-1">ที่อยู่ผู้รับ</span>
                                            <Text className="text-base text-gray-700 leading-relaxed block">{address}</Text>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-red-400 tracking-widest block mb-1">เบอร์โทรศัพท์ติดต่อ</span>
                                            <Text strong className="text-lg text-gray-800 tracking-wider">{phone}</Text>
                                        </div>
                                    </div>
                                </div>
                                <Button 
                                    block 
                                    size="large" 
                                    onClick={() => setIsEditingAddress(true)} 
                                    className="rounded-xl border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 h-12"
                                >
                                    ใช้ที่อยู่อื่น / แก้ไขข้อมูล
                                </Button>
                            </div>
                        ) : (
                            <AddressForm 
                                user={user} 
                                token={token} 
                                onSuccess={() => {
                                    setIsEditingAddress(false);
                                    refetchAddress();
                                }} 
                            />
                        )}
                    </CustomCard>
                </div>
            );
        }

        if (currentStepId === 'summary') {
            if (isLoadingSummary) return <div className="py-20 flex justify-center"><Spin size="large" /></div>;
            const { total_cost, wallet_before, wallet_after, can_purchase, limit_error } = checkoutSummaryData || {};

            return (
                <div className="space-y-6 animate-in slide-in-from-right duration-500">
                    <CustomCard title="กระเป๋าเงินของคุณ" icon={<CreditCardOutlined />}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest block mb-2">ยอดเงินปัจจุบัน</span>
                                    <div className="space-y-2">
                                        {Object.entries(total_cost || {}).map(([cur]) => (
                                            <div key={cur} className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">{renderCurrencyIcon(cur, 16)}</div>
                                                <Text strong className="text-gray-700">{(wallet_before as any)?.[cur]?.toLocaleString() || 0}</Text>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className={`p-4 rounded-2xl border transition-colors ${can_purchase ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${can_purchase ? 'text-green-500' : 'text-red-400'}`}>คงเหลือหลังชำระ</span>
                                    <div className="space-y-2">
                                        {Object.entries(total_cost || {}).map(([cur]) => {
                                            const remain = (wallet_after as any)?.[cur] ?? 0;
                                            return (
                                                <div key={cur} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">{renderCurrencyIcon(cur, 16)}</div>
                                                    <Text strong className={remain < 0 ? 'text-red-500' : 'text-green-600'}>{remain.toLocaleString()}</Text>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {!can_purchase && (
                                <div className="p-4 bg-red-500 text-white rounded-2xl flex items-center gap-3 shadow-lg shadow-red-100">
                                    <CloseCircleOutlined className="text-xl" />
                                    <Text className="text-white font-medium">{limit_error || "ยอดเงินคงเหลือไม่เพียงพอ"}</Text>
                                </div>
                            )}
                        </div>
                    </CustomCard>
                </div>
            );
        }
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        try {
            const data = await confirmCheckout();
            if (data?.success) {
                if (data.token) updateToken(data.token);
                queryClient.invalidateQueries({ queryKey: ['cartItems'] });
                setShowSuccess(true);
                setShowPostSuccessActions(false);
            } else {
                notification.error({ message: data?.message || 'ชำระเงินล้มเหลว' });
            }
        } catch (error: any) {
             notification.error({ message: error?.response?.data?.message || 'เกิดข้อผิดพลาด' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-10 px-4">
            <div className="max-w-[1200px] mx-auto">
                {showSuccess && (
                    <SuccessAnimation
                        onComplete={() => {
                            setShowSuccess(false);
                            setShowPostSuccessActions(true);
                        }}
                        duration={1400}
                    />
                )}

                {showPostSuccessActions && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[1px]">
                        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl">
                            <div className="mb-5 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-xl text-green-600">
                                    <CheckCircleOutlined />
                                </div>
                                <Title level={4} className="!mb-1 !text-gray-800">ชำระเงินสำเร็จ</Title>
                                <Text type="secondary">เลือกปลายทางที่ต้องการไปต่อได้เลย</Text>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button
                                    type="primary"
                                    size="large"
                                    className="h-12 rounded-xl border-none bg-red-500 hover:bg-red-600"
                                    onClick={() => router.push('/')}
                                >
                                    กลับหน้าหลัก
                                </Button>
                                <Button
                                    size="large"
                                    className="h-12 rounded-xl border-red-200 text-red-600 hover:border-red-300 hover:text-red-700"
                                    onClick={() => router.push('/store')}
                                >
                                    เลือกสินค้าต่อ
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Section */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/cart">
                            <Button icon={<LeftOutlined />} shape="circle" size="large" className="border-none shadow-sm hover:text-red-500" />
                        </Link>
                        <div>
                            <Title level={2} className="!m-0 text-gray-800">Checkout</Title>
                            <Text type="secondary" className="text-sm">ยืนยันรายการและที่อยู่จัดส่งของคุณ</Text>
                        </div>
                    </div>
                </div>

                {/* Custom Step Indicator */}
                <CustomStepIndicator current={currentStep} total={steps.length} steps={steps} />

                {/* Main 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Flow Content */}
                    <div className="lg:col-span-8 space-y-6">
                        {renderStepContent()}
                    </div>

                    {/* Right Column: Sticky Summary */}
                    <div className="lg:col-span-4 sticky top-6">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative backdrop-blur-md bg-white/90">
                            <div className="p-6">
                                <Title level={4} className="!mb-6 text-gray-800 border-b border-gray-50 pb-4">สรุปยอดคำสั่งซื้อ</Title>
                                
                                <div className="space-y-4 mb-8">
                                    {checkoutSummaryData && Object.entries(checkoutSummaryData.total_cost || {}).map(([cur, amount]) => (
                                        <div key={cur} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                                            <div className="flex items-center gap-2">
                                                {renderCurrencyIcon(cur, 24)}
                                                <span className="text-gray-500 font-medium">ยอดรวม</span>
                                            </div>
                                            <Text strong className="text-2xl text-red-500">{(amount as number).toLocaleString()}</Text>
                                        </div>
                                    ))}
                                    {(!checkoutSummaryData || Object.keys(checkoutSummaryData.total_cost || {}).length === 0) && (
                                        <div className="flex flex-col items-center py-6 text-gray-300">
                                            <ShoppingCartOutlined className="text-4xl mb-2 opacity-20" />
                                            <Text className="text-xs italic">กำลังรอสรุปรายการข้อมูล...</Text>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4">
                                    {currentStepId !== 'summary' ? (
                                        <Button 
                                            type="primary" 
                                            size="large" 
                                            block 
                                            onClick={steps[currentStep+1]?.id === 'summary' && !checkoutSummaryData ? () => setCurrentStep(prev => prev + 1) : nextStep}
                                            className="h-14 rounded-2xl bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-100 flex items-center justify-center gap-2 group p-0 overflow-hidden"
                                            disabled={
                                                (currentStepId === 'address' && checkoutAddressData?.has_physical_items && (!checkoutAddressData?.address?.trim() || !checkoutAddressData?.phone?.trim())) ||
                                                isLoadingItems || isLoadingAddress
                                            }
                                        >
                                            <span className="relative z-10 font-bold tracking-wide">ขั้นตอนถัดไป</span>
                                            <ArrowRightOutlined className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    ) : (
                                        <Button 
                                            type="primary" 
                                            danger 
                                            size="large" 
                                            block 
                                            onClick={handleConfirmPayment}
                                            loading={isProcessing}
                                            disabled={!checkoutSummaryData?.can_purchase}
                                            className="h-14 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 border-none shadow-lg shadow-red-200 font-bold text-lg "
                                        >
                                            ยืนยันการชำระเงิน
                                        </Button>
                                    )}
                                    
                                    {currentStep > 0 && (
                                        <Button block size="large" onClick={() => setCurrentStep(prev => prev - 1)} className="rounded-2xl border-none text-gray-400 hover:text-gray-600 h-10 font-medium tracking-wide">
                                            ย้อนกลับ
                                        </Button>
                                    )}
                                </div>
                            </div>
                            
                            {/* <div className="bg-gray-50/80 px-6 py-4 flex items-center gap-3 border-t border-gray-50">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Secure 256-bit SSL encrypted payment</span>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in {
                    animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                .slide-in-from-right {
                    animation: slide-right 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                @keyframes slide-right {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

