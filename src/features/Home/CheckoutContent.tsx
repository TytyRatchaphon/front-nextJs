"use client";

import React, { useState, useEffect } from 'react';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { Steps, Button, Typography, App, List, Avatar, Empty, Spin, Card, Form, Input } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCheckoutItems, fetchCheckoutAddress, fetchCheckoutSummary, confirmCheckout } from '@/services/cartService';
import { updateUserAddress } from '@/services/apiServices';
import { UnorderedListOutlined, HomeOutlined, FileTextOutlined, CheckCircleOutlined, LeftOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useWebsiteStore } from '@/stores/websiteStore';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import SuccessAnimation from '@/components/utility/SuccessAnimation';

const { Title, Text } = Typography;

const AddressForm = ({ user, token, onSuccess }: { user: any, token: string | null, onSuccess: () => void }) => {
    const [form] = Form.useForm();
    const { message, notification } = App.useApp();
    const [loading, setLoading] = useState(false);
    const { updateUserBalance } = useAuthStore();

    const onFinish = async (values: any) => {
        if (!token) return;
        
        // Strict check for Thai mobile prefixes: 06, 08, 09
        const phoneInput = values.phone;
        const validPrefixes = ['06', '08', '09'];
        const hasValidPrefix = validPrefixes.some(prefix => phoneInput.startsWith(prefix));

        if (!hasValidPrefix || !isValidPhoneNumber(phoneInput, 'TH')) {
            notification.warning({
                message: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
                description: 'กรุณากรอกเบอร์โทรศัพท์มือถือที่ขึ้นต้นด้วย 06, 08 หรือ 09 เท่านั้น หรือ เบอร์โทรคัพท์ไม่ครบ 10 หลัก',
                placement: 'topRight',
            });
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            if (user?.fullname) formData.append('fullname', user.fullname);
            if (user?.writer_name) formData.append('writer_name', user.writer_name);
            if (user?.des) formData.append('des', user.des);
            if (user?.facebook) formData.append('facebook', user.facebook);
            if (user?.twitter) formData.append('twitter', user.twitter);
            if (user?.gender) formData.append('gender', user.gender);
            if (user?.birthday) formData.append('birthday', user.birthday);

            formData.append('address_main', values.address);
            formData.append('phone', values.phone);
            if (user?.user_id) formData.append('user_id', String(user.user_id));

            await updateUserAddress(formData, token);
             notification.success({
                message: 'บันทึกข้อมูลเรียบร้อย',
                placement: 'topRight',
            });
            
            updateUserBalance({
                address_main: values.address,
                phone: values.phone
            });
            onSuccess();
        } catch (error: any) {
            notification.error({
                message: 'บันทึกไม่สำเร็จ',
                description: error?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
                icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
                placement: 'topRight',
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
            initialValues={{
                address: user?.address_main || '',
                phone: user?.phone || ''
            }}
            className="bg-gray-50 p-6 md:px-12 md:py-8 rounded-lg border border-gray-200"
        >
            <Form.Item
                label="ที่อยู่จัดส่ง"
                name="address"
                rules={[{ required: true, message: 'กรุณากรอกที่อยู่จัดส่ง' }]}
            >
                <Input.TextArea rows={3} placeholder="บ้านเลขที่, ซอย, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์" />
            </Form.Item>

            <Form.Item
                label="เบอร์โทรศัพท์"
                name="phone"
                rules={[{ required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' }]}
            >
                <Input placeholder="08xxxxxxxx" maxLength={10} />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
                <Button type="primary" htmlType="submit" loading={loading} size="large">
                    บันทึกข้อมูล
                </Button>
            </Form.Item>
        </Form>
    );
};

export default function CheckoutContent() {
    const [currentStep, setCurrentStep] = useState(0);
    const { settings } = useWebsiteStore();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { message, modal, notification } = App.useApp();
    const { user, token, updateToken } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    // Step 1: Items
    const { data: checkoutItemsData, isLoading: isLoadingItems, isError: isErrorItems } = useQuery({
        queryKey: ['checkoutItems'],
        queryFn: fetchCheckoutItems,
        enabled: currentStep === 0,
        refetchOnMount: 'always',
        staleTime: 0,
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

    const nextStep = () => {
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    const renderStepContent = () => {
        if (currentStep === 0) {
            if (isLoadingItems) return <div className="py-20 flex justify-center"><Spin size="large" /></div>;
            if (isErrorItems || !checkoutItemsData?.items) return <Empty description="ไม่พบข้อมูลสินค้า" />;

            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[400px]">
                    <List
                        itemLayout="horizontal"
                        dataSource={checkoutItemsData.items}
                        renderItem={(item: any) => (
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
                                                        }[item.currency.toLowerCase() as 'coin' | 'freecoin' | 'stamp'];
                                                        
                                                        return currencyInfo ? (
                                                            <div className="relative w-5 h-5">
                                                                <Image src={currencyInfo.icon} alt={item.currency} fill className="object-contain" />
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
            if (isLoadingAddress) return <div className="py-20 flex justify-center"><Spin size="large" /></div>;
            if (!checkoutAddressData) return <Empty description="ไม่พบข้อมูลที่อยู่" />;

            const { has_physical_items, address, phone, shipping_items } = checkoutAddressData;

            if (!has_physical_items) {
                 return (
                     <div className="py-20 text-center flex flex-col items-center gap-6 bg-white rounded-lg border border-gray-100 min-h-[400px] justify-center">
                         <CheckCircleOutlined className="text-8xl !text-green-500" />
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
                            <AddressForm 
                                user={user} 
                                token={token} 
                                onSuccess={() => refetchAddress()} 
                            />
                        )}
                        
                        {hasAddress && (
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
                                renderItem={(item: any) => (
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
            if (isLoadingSummary) return <div className="py-20 flex justify-center"><Spin size="large" /></div>;
            if (!checkoutSummaryData) return <Empty description="ไม่พบข้อมูลสรุป" />;

            const { total_cost, wallet_before, wallet_after, can_purchase, limit_error } = checkoutSummaryData;

            const renderCurrencyWithIcon = (currency: string, amount: number, isDanger = false, showSign = false) => {
                 const currencyKey = currency.toLowerCase();
                 const currencyInfo: any = {
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
                    <Card title="ยอดที่ต้องชำระ" className="h-fit">
                        {Object.entries(total_cost).map(([currency, amount]) => renderCurrencyWithIcon(currency, amount as number, true))}
                    </Card>

                    <div className="flex flex-col gap-6">
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

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        try {
            const data = await confirmCheckout();
            if (data?.success) {
                if (data.token) {
                    updateToken(data.token);
                }
                queryClient.invalidateQueries({ queryKey: ['cartItems'] });
                setShowSuccess(true);
            } else {
                notification.error({
                    message: 'การชำระเงินล้มเหลว',
                    description: data?.message || 'ไม่สามารถชำระเงินได้',
                    icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
                    placement: 'topRight',
                });
            }
        } catch (error: any) {
             notification.error({
                message: 'เกิดข้อผิดพลาด',
                description: error?.response?.data?.message || 'เกิดข้อผิดพลาดในการชำระเงิน',
                icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
                placement: 'topRight',
             });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-[1000px] mx-auto px-4 py-8">
            {showSuccess && (
                <SuccessAnimation 
                    onComplete={() => router.push('/')} 
                    duration={2000} 
                />
            )}
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
                    disabled={isLoadingItems || isLoadingAddress || isLoadingSummary || isProcessing}
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
                        onClick={handleConfirmPayment}
                        loading={isProcessing}
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
