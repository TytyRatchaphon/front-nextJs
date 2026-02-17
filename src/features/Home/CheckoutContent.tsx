"use client";

import React, { useState } from 'react';
import { Steps, Button, Typography, App, List, Avatar, Empty, Spin, Card } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { fetchCheckoutItems, fetchCheckoutAddress, fetchCheckoutSummary } from '@/services/cartService';
import { UnorderedListOutlined, HomeOutlined, FileTextOutlined, CheckCircleOutlined, LeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useWebsiteStore } from '@/stores/websiteStore';
import Image from 'next/image';

const { Title, Text } = Typography;

export default function CheckoutContent() {
    const [currentStep, setCurrentStep] = useState(0);
    const { settings } = useWebsiteStore();
    const router = useRouter();
    const { message } = App.useApp();

    // --- Queries ---

    // Step 1: Items
    const { data: checkoutItemsData, isLoading: isLoadingItems, isError: isErrorItems } = useQuery({
        queryKey: ['checkoutItems'],
        queryFn: fetchCheckoutItems,
        enabled: currentStep === 0,
    });

    // Step 2: Address
    const { data: checkoutAddressData, isLoading: isLoadingAddress, refetch: refetchAddress } = useQuery({
        queryKey: ['checkoutAddress'],
        queryFn: fetchCheckoutAddress,
        enabled: currentStep === 1,
    });

    // Step 3: Summary
    const { data: checkoutSummaryData, isLoading: isLoadingSummary } = useQuery({
        queryKey: ['checkoutSummary'],
        queryFn: fetchCheckoutSummary,
        enabled: currentStep === 2,
    });

    // --- Handlers ---

    const nextStep = () => {
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    // --- Render Steps ---

    const renderStepContent = () => {
        if (currentStep === 0) {
            // ITEMS
            if (isLoadingItems) return <div className="py-20 flex justify-center"><Spin size="large" /></div>;
            if (isErrorItems || !checkoutItemsData?.items) return <Empty description="ไม่พบข้อมูลสินค้า" />;

            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[400px]">
                    <List
                        itemLayout="horizontal"
                        dataSource={checkoutItemsData.items}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar shape="square" size={80} src={item.img} className="border border-gray-200" />}
                                    title={<Text strong className="text-lg">{item.name}</Text>}
                                    description={
                                        <div className="flex flex-col gap-1">
                                            <Text type="secondary">{item.description}</Text>
                                            <div className="flex justify-between items-center mt-2 max-w-[300px]">
                                                <Text>จำนวน: x{item.quantity}</Text>
                                                <div className="flex items-center gap-1">
                                                    <Text type="danger" strong className="text-base">{item.total_price.toLocaleString()}</Text>
                                                    {(() => {
                                                        const currencyInfo = {
                                                            coin: { icon: settings?.coin || "/images/e-coin.png", width: 20 },
                                                            freecoin: { icon: settings?.freecoin || "/images/money-bag.png", width: 20 },
                                                            stamp: { icon: settings?.stamp || "/images/stamp.png", width: 20 }
                                                        }[item.currency.toLowerCase()];
                                                        
                                                        return currencyInfo ? (
                                                            <div className="relative w-5 h-5">
                                                                <Image 
                                                                    src={currencyInfo.icon} 
                                                                    alt={item.currency}
                                                                    fill
                                                                    className="object-contain"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <Text type="danger">{item.currency}</Text>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </div>
            );
        }

        if (currentStep === 1) {
            // ADDRESS
            if (isLoadingAddress) return <div className="py-20 flex justify-center"><Spin size="large" /></div>;
            if (!checkoutAddressData) return <Empty description="ไม่พบข้อมูลที่อยู่" />;

            const { has_physical_items, address, phone, shipping_items } = checkoutAddressData;

            if (!has_physical_items) {
                 return (
                     <div className="py-20 text-center flex flex-col items-center gap-6 bg-white rounded-lg border border-gray-100 min-h-[400px] justify-center">
                         <CheckCircleOutlined className="text-8xl text-green-500" />
                         <div>
                            <Title level={3}>ไม่ต้องใช้ที่อยู่ในการจัดส่ง</Title>
                            <Text type="secondary" className="text-lg">รายการสินค้าของคุณเป็นสินค้าดิจิทัลทั้งหมด</Text>
                         </div>
                     </div>
                 );
            }

            const hasAddress = address && address.trim() !== "" && phone && phone.trim() !== "";

            return (
                <div className="flex flex-col gap-6 min-h-[400px]">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <Title level={4} className="flex items-center gap-2 !mb-4">
                            <HomeOutlined /> ที่อยู่จัดส่ง
                        </Title>
                        
                        {hasAddress ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <Text strong className="text-lg block mb-2 text-gray-600">ที่อยู่จัดส่ง: <span className='text-gray-800'>{address}</span></Text>
                                <Text strong className="text-lg block mb-2 text-gray-600">เบอร์โทรติดต่อ: <span className='text-gray-800'>{phone}</span></Text>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-red-50 rounded-lg border border-red-100">
                                <Text type="danger" className="text-lg block mb-4">กรุณากรอกที่อยู่จัดส่งก่อนดำเนินการต่อ</Text>
                                <Button type="primary" href="/profile" target="_blank" size="large" className="!text-white">
                                    แก้ไขที่อยู่ (ไปที่หน้าโปรไฟล์)
                                </Button>
                                <Text type="secondary" className="text-sm mt-3 block">
                                    เมื่อแก้ไขแล้ว กดปุ่ม "รีเฟรชข้อมูล" ด้านล่าง
                                </Text>
                            </div>
                        )}
                        
                        {!hasAddress && (
                             <Button onClick={() => refetchAddress()} className="mt-4" block size="large">
                                 รีเฟรชข้อมูล
                             </Button>
                        )}
                    </div>

                    {shipping_items && shipping_items.length > 0 && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <Text strong className="text-lg mb-4 block">สินค้าที่ต้องจัดส่ง ({shipping_items.length} รายการ)</Text>
                            <List
                                size="small"
                                dataSource={shipping_items}
                                renderItem={item => (
                                    <List.Item>
                                       <Text>{item.name} x{item.quantity}</Text>
                                    </List.Item>
                                )}
                            />
                        </div>
                    )}
                </div>
            );
        }

        if (currentStep === 2) {
            // SUMMARY
            if (isLoadingSummary) return <div className="py-20 flex justify-center"><Spin size="large" /></div>;
            if (!checkoutSummaryData) return <Empty description="ไม่พบข้อมูลสรุป" />;

            const { total_cost, wallet_before, wallet_after, can_purchase, limit_error } = checkoutSummaryData;

            const renderCurrencyWithIcon = (currency: string, amount: number, isDanger = false, showSign = false) => {
                 const currencyKey = currency.toLowerCase();
                 const currencyInfo = {
                    coin: { icon: settings?.coin || "/images/e-coin.png", name: 'เหรียญ' },
                    freecoin: { icon: settings?.freecoin || "/images/money-bag.png", name: 'ถุงเงิน' },
                    stamp: { icon: settings?.stamp || "/images/stamp.png", name: 'แสตมป์' }
                }[currencyKey];

                if (!currencyInfo) return (
                    <div className="flex justify-between items-center mb-2 last:mb-0 text-lg">
                         <Text>{currency}</Text>
                         <Text strong type={isDanger ? "danger" : undefined} className="text-xl">{amount.toLocaleString()}</Text>
                    </div>
                );

                return (
                    <div key={currency} className="flex justify-between items-center mb-2 last:mb-0 text-lg">
                        <div className="flex items-center gap-2">
                             <div className="relative w-6 h-6">
                                <Image src={currencyInfo.icon} alt={currencyInfo.name} fill className="object-contain" />
                             </div>
                             <Text type="secondary" className="text-base">{currencyInfo.name}</Text>
                        </div>
                        <Text strong type={isDanger ? "danger" : undefined} className="text-xl">
                            {showSign && amount > 0 ? '+' : ''}{amount.toLocaleString()}
                        </Text>
                    </div>
                );
            };

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
                    {/* Total Cost */}
                    <Card title="ยอดที่ต้องชำระ" className="h-fit">
                        {Object.entries(total_cost).map(([currency, amount]) => renderCurrencyWithIcon(currency, amount, true))}
                    </Card>

                    <div className="flex flex-col gap-6">
                        {/* Wallets */}
                        <Card title="กระเป๋าเงินของคุณ" className="h-fit">
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Text strong className="block mb-3 text-gray-500">ก่อนชำระ</Text>
                                    <div className="space-y-2">
                                        {renderCurrencyWithIcon('coin', wallet_before.coin)}
                                        {renderCurrencyWithIcon('freecoin', wallet_before.freecoin)}
                                        {renderCurrencyWithIcon('stamp', wallet_before.stamp)}
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                     <Text strong className="block mb-3 text-green-700">หลังชำระ</Text>
                                     <div className="space-y-2">
                                        {renderCurrencyWithIcon('coin', wallet_after.coin, wallet_after.coin < 0)}
                                        {renderCurrencyWithIcon('freecoin', wallet_after.freecoin, wallet_after.freecoin < 0)}
                                        {renderCurrencyWithIcon('stamp', wallet_after.stamp, wallet_after.stamp < 0)}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Error / Warning */}
                        {!can_purchase && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-center font-bold">
                                {limit_error || "ยอดเงินไม่เพียงพอ กรุณาเติมเงิน"}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
    };

    const items = [
        { title: 'ตรวจสอบรายการ', icon: <UnorderedListOutlined /> },
        { title: 'ที่อยู่จัดส่ง', icon: <HomeOutlined /> },
        { title: 'สรุปยอดและชำระ', icon: <FileTextOutlined /> },
    ];

    return (
        <div className="max-w-[1000px] mx-auto px-4 py-8">
            <div className="mb-8 flex items-center gap-4">
                <Link href="/cart">
                    <Button icon={<LeftOutlined />} size="large">กลับไปตะกร้า</Button>
                </Link>
                <Title level={2} className="!m-0">ชำระเงิน</Title>
            </div>

            <div className="mb-8">
                <Steps current={currentStep} items={items} />
            </div>

            <div className="mb-8">
                {renderStepContent()}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center bg-white p-4 sticky bottom-0 border-t border-gray-200 shadow-lg md:static md:shadow-none md:border-t-0 md:bg-transparent md:p-0">
                <Button 
                    size="large"
                    onClick={currentStep === 0 ? () => router.push('/cart') : prevStep} 
                    disabled={isLoadingItems || isLoadingAddress || isLoadingSummary}
                >
                    {currentStep === 0 ? 'ยกเลิก' : 'ย้อนกลับ'}
                </Button>
                
                {currentStep < 2 ? (
                    <Button 
                        type="primary" 
                        size="large"
                        onClick={nextStep} 
                        className="min-w-[120px]"
                        disabled={
                            (currentStep === 1 && checkoutAddressData?.has_physical_items && (!checkoutAddressData?.address?.trim() || !checkoutAddressData?.phone?.trim())) ||
                            isLoadingItems || isLoadingAddress
                        }
                    >
                        ถัดไป
                    </Button>
                ) : (
                    <Button 
                        type="primary" 
                        danger 
                        size="large"
                        onClick={() => {
                            message.success('Payment feature coming soon!'); // Placeholder
                        }}
                        loading={false}
                        disabled={!checkoutSummaryData?.can_purchase}
                        className="min-w-[150px]"
                    >
                        ยืนยันการชำระเงิน
                    </Button>
                )}
            </div>
        </div>
    );
}
