"use client";

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { notification } from 'antd' 
import { redeemCode } from '@/services/apiServices'

function Redeem() {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)

    const [api, contextHolder] = notification.useNotification()
    
    const { token, updateToken } = useAuthStore()
    const [goldCoin, setGoldCoin] = React.useState<number>(0)
    const [redCoin, setRedCoin] = React.useState<number>(0)

    useEffect(() => {
        const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null)
        if (!t) {
            setGoldCoin(0)
            setRedCoin(0)
            return
        }
        try {
            const base64Url = t.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))
            const decoded = JSON.parse(jsonPayload)
            const coins = Number(decoded.coin ?? decoded.coins ?? decoded.goldCoins ?? decoded.gold_coin ?? decoded.coin_balance ?? 0)
            const freecoins = Number(decoded.freecoin ?? decoded.userFreecoin ?? decoded.free_coin ?? decoded.freeCoins ?? decoded.freeCoin ?? 0)
            setGoldCoin(Number.isNaN(coins) ? 0 : coins)
            setRedCoin(Number.isNaN(freecoins) ? 0 : freecoins)
        } catch (e) {
            console.warn('Failed to decode token for coins', e)
            setGoldCoin(0)
            setRedCoin(0)
        }
    }, [token])

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
            const resp = await redeemCode(code.trim())
            
            // 4. เปลี่ยนการแจ้งเตือน Success
            api.success({
                message: 'สำเร็จ!',
                description: resp?.message ?? 'แลกรับสำเร็จ',
                placement: 'topRight',
                duration: 3,
            })

            // If backend returns an updated token, update auth store so balances refresh
            const maybeToken = resp?.data?.data?.token ?? resp?.data?.token ?? resp?.token ?? resp?.data
            if (maybeToken && typeof updateToken === 'function') {
                try {
                    updateToken(String(maybeToken))
                } catch (e) {
                    console.warn('Failed to update token after redeem', e)
                }
            }
            // Clear input
            setCode('')
        } catch (err: any) {
            const errMsg = err?.response?.data?.message ?? err?.message ?? 'เกิดข้อผิดพลาดในการแลกรับ'
            
            // 5. เปลี่ยนการแจ้งเตือน Error API
            api.error({
                message: 'แลกรับไม่สำเร็จ',
                description: errMsg,
                placement: 'topRight',
            })
        } finally {
            setLoading(false)
        }
    }

  return (
    <div className='min-h-screen' style={{ backgroundColor: '#FFF7F7' }}>
        {/* Background Section */}
        <div className='relative w-full h-[400px]'>
            <Image 
                src="https://img.enjoybook.co/img/redeembg.png" 
                alt="Redeem Background" 
                fill
                className='object-cover'
                priority
                unoptimized
            />
        </div>
        
        {/* Card Below Background */}
        <div className='flex justify-center px-4 mt-18'>
            <div className='bg-white rounded-2xl shadow-lg p-6 w-[320px]'>
                {/* Header with Logo */}
                <div className='flex items-center justify-center gap-2 mb-6'>
                    <Image 
                        src="https://img.enjoybook.co/img/logo2025omxesk8HIC0602112905.png" 
                        alt="Logo" 
                        width={24} 
                        height={24}
                        unoptimized
                    />
                    <span className='text-gray-800 font-primary font-medium'>Enjoybook Coin</span>
                </div>
                
                {/* Coins Display */}
                <div className='flex justify-between items-center'>
                    {/* Gold Coin */}
                    <div className='flex items-center gap-2'>
                        <Image 
                            src="https://img.enjoybook.co/img/coin2025of4oReSgpR0109170013.png" 
                            alt="Gold Coin" 
                            width={20} 
                            height={20}
                            unoptimized
                        />
                        <span className='text-2xl font-bold text-gray-900'>{(goldCoin ?? 0).toLocaleString()}</span>
                    </div>
                    
                    {/* Red Coin */}
                    <div className='flex items-center gap-2'>
                        <Image 
                            src="https://img.enjoybook.co/img/freecoinEJB2024KwnlwebuY1pjqzSXy7es1224140652.png" 
                            alt="Red Coin" 
                            width={20} 
                            height={20}
                            unoptimized
                            
                        />
                        <span className='text-2xl font-bold text-gray-900'>{(redCoin ?? 0).toLocaleString()}</span>
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
    </div>
  )
}

export default Redeem