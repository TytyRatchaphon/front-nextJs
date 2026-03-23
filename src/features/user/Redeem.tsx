"use client";

import React, { useState } from 'react';
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { notification, Modal } from 'antd';
import { redeemCode, refreshToken } from '@/services/apiServices'
import { useWebsiteStore } from '@/stores/websiteStore';
import { resolveSettingsImageSrc } from '@/utils/imageUtils';

function Redeem() {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [rewardData, setRewardData] = useState<any>(null)

    const [api, contextHolder] = notification.useNotification()

    const { user, login } = useAuthStore()

    // Helper to decode token manually
    const decodeToken = (t: string) => {
        try {
            const base64Url = t.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))
            return JSON.parse(jsonPayload)
        } catch {
            return null
        }
    }

    const handleRedeem = async () => {
        if (!code || code.trim().length === 0) {
            api.error({
                message: 'แจ้งเตือน',
                description: 'กรุณากรอกรหัสก่อนแลกรับ',
                placement: 'topRight',
            })
            return
        }
        try {
            setLoading(true)
            const response = await redeemCode(code.trim())

            // Try to find the data object. APIs are inconsistent.
            // Priority: response.data.data -> response.data -> response
            const data = response?.data?.data || response?.data || response;

            // If data is just a success message, data might be the object itself


            setRewardData(data || {})
            setShowSuccessModal(true)

            // FORCE REFRESH
            try {
                const refreshResp = await refreshToken();
                const newToken = refreshResp?.data;
                if (newToken) {
                    const decoded = decodeToken(String(newToken));
                    if (decoded) {
                        login(decoded, String(newToken));
                    }
                }
            } catch (refErr) {
                console.error("Failed to auto-refresh token after redeem", refErr);
            }

            setCode('')
        } catch (err: any) {
            const errMsg = err?.response?.data?.message ?? err?.message ?? 'เกิดข้อผิดพลาดในการแลกรับ'
            api.error({
                message: 'แลกรับไม่สำเร็จ',
                description: errMsg,
                placement: 'topRight',
            })
        } finally {
            setLoading(false)
        }
    }

    const { settings } = useWebsiteStore();

    // Helper to get value reliably
    const getRewardValue = (key: string) => {
        if (!rewardData) return 0;
        return Number(rewardData[key] || 0);
    }

    // Derived values based on API response structure (e.g. { type: 'getcoin', unit: 100 })
    const unitAmount = getRewardValue('unit');
    const type = rewardData?.type || '';

    // Check if we have any reward to show
    const hasCoin = (type === 'getcoin') || getRewardValue('coin') > 0 || getRewardValue('gold_coin') > 0 || getRewardValue('amount') > 0;
    const hasFreeCoin = (type === 'getfreecoin' || type === 'freecoin') || getRewardValue('freecoin') > 0 || getRewardValue('red_coin') > 0 || getRewardValue('point') > 0;

    // Calculate final amounts to display
    const coinAmount = (type === 'getcoin' ? unitAmount : 0) || getRewardValue('coin') || getRewardValue('gold_coin') || getRewardValue('amount');
    const freeCoinAmount = (type === 'getfreecoin' || type === 'freecoin' ? unitAmount : 0) || getRewardValue('freecoin') || getRewardValue('red_coin') || getRewardValue('point');

    return (
        <div className='min-h-screen' style={{ backgroundColor: '#FFF7F7' }}>
            {/* Background Section */}
            <div className='relative w-full h-[400px]'>
                <Image
                    src={resolveSettingsImageSrc(settings?.redeembg, '/images/redeembg.png')}
                    alt="Redeem Background"
                    fill
                    className='object-cover'
                    priority
                />
            </div>

            {/* Card Below Background */}
            <div className='flex justify-center px-4 mt-18'>
                <div className='bg-white rounded-2xl shadow-lg p-6 w-[320px]'>
                    {/* Header with Logo */}
                    <div className='flex items-center justify-center gap-2 mb-6'>
                        <Image
                            src={resolveSettingsImageSrc(settings?.logo, '/images/logo.png')}
                            alt="Logo"
                            width={24}
                            height={24}
                        />
                        <span className='text-gray-800 font-primary font-medium'>Enjoybook Coin</span>
                    </div>

                    {/* Coins Display */}
                    <div className='flex justify-between items-center'>
                        {/* Gold Coin */}
                        <div className='flex items-center gap-2'>
                            <Image
                                src={settings?.coin || '/images/e-coin.png'}
                                alt="Gold Coin"
                                width={20}
                                height={20}
                                unoptimized
                            />
                            <span className='text-2xl font-bold text-gray-900'>{(Number(user?.coin ?? 0)).toLocaleString()}</span>
                        </div>

                        {/* Red Coin */}
                        <div className='flex items-center gap-2'>
                            <Image
                                src={settings?.freecoin || '/images/money-bag.png'}
                                alt="Red Coin"
                                width={20}
                                height={20}
                                unoptimized

                            />
                            <span className='text-2xl font-bold text-gray-900'>{(Number(user?.freecoin ?? 0)).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Redeem Code Section */}
            <div className='flex justify-center px-4 mt-8'>
                <div className='w-[500px] max-w-full'>
                    {/* Title */}
                    <h2 className='text-2xl font-bold text-center mb-2 font-primary text-black'>รหัสแลกรับ</h2>

                    {/* Description */}
                    <p className='text-center text-sm mb-6 font-primary text-gray-700'>
                        กรอกรหัส Redeem ของคุณทางด้านล่างเพื่อรับเหรียญ
                    </p>

                    {/* Input Field */}
                    {contextHolder}
                    <div className='bg-white rounded-full shadow-md px-6 py-3 flex items-center'>
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            type='text'
                            placeholder='กรอกรหัสของคุณที่นี่'
                            className='flex-1 outline-none font-primary text-gray-700'
                        />
                    </div>

                    {/* Redeem Button (below input) */}
                    <div className='flex justify-center mt-6'>
                        <button
                            onClick={handleRedeem}
                            disabled={loading}
                            className='bg-[#E31C3D] text-white font-bold rounded-full px-12 py-3 shadow-md hover:opacity-95 transition-colors disabled:opacity-70 disabled:cursor-not-allowed'
                            style={{ color: '#ffffff' }}
                        >
                            {loading ? 'กำลังส่ง...' : 'แลกรับเลย!'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <Modal
                title={null}
                footer={null}
                open={showSuccessModal}
                onCancel={() => setShowSuccessModal(false)}
                centered
                classNames={{ content: '!rounded-[20px] !p-0 overflow-hidden' }}
                closeIcon={null}
                width={350}
            >
                <div className="flex flex-col items-center bg-white p-6 pb-8 text-center relative">
                    {/* Close Button Top Right */}
                    <button
                        onClick={() => setShowSuccessModal(false)}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 outline-none"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>

                    {/* Icon/Image */}
                    <div className="w-24 h-24 mb-4 mt-2 animate-bounce-slow">
                        <Image
                            src={(hasFreeCoin && !hasCoin) ? (settings?.freecoin || '/images/money-bag.png') : (settings?.coin || '/images/e-coin.png')}
                            width={96} height={96}
                            alt="Success"
                            className="object-contain drop-shadow-lg"
                            unoptimized
                        />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-primary">ยินดีด้วย!</h3>
                    <p className="text-gray-500 mb-6 font-primary text-sm">คุณได้รับรางวัลจากการแลกโค้ด</p>

                    {/* Reward Details */}
                    <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                        {hasCoin || hasFreeCoin ? (
                            <div className="flex flex-col gap-2">
                                {hasCoin && (
                                    <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-orange-100">
                                        <div className="flex items-center gap-2">
                                            <Image src={settings?.coin || '/images/e-coin.png'} width={24} height={24} alt="Coin" unoptimized />
                                            <span className="font-bold text-gray-700">Enjoy Coin</span>
                                        </div>
                                        <span className="font-bold text-orange-500">
                                            +{coinAmount.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                {hasFreeCoin && (
                                    <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-red-100">
                                        <div className="flex items-center gap-2">
                                            <Image src={settings?.freecoin || '/images/money-bag.png'} width={24} height={24} alt="Free Coin" unoptimized />
                                            <span className="font-bold text-gray-700">ถุงเงิน</span>
                                        </div>
                                        <span className="font-bold text-red-500">
                                            +{freeCoinAmount.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Fallback with message if available
                            <div className="p-2 text-gray-600 font-medium text-sm">
                                {rewardData?.message || "แลกรับของรางวัลสำเร็จ"}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowSuccessModal(false)}
                        className="w-full bg-[#E31C3D] hover:bg-[#c41835] !text-white font-bold py-2.5 rounded-full transition-all shadow-md active:scale-95"
                    >
                        ตกลง
                    </button>
                </div>
            </Modal>
        </div>
    )
}

export default Redeem
