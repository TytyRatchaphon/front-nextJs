"use client"

import React, { useEffect, useState } from 'react' // เพิ่ม useEffect, useState
import NextImage from 'next/image'
import { Image as AntdImage } from 'antd'
import { useAuthStore } from '@/stores/authStore'

type Props = {
  avatar?: string | null
  name?: string
  email?: string
  stamps?: number
  flowers?: number
  hearts?: number
  coupons?: number
  coins?: number
  freecoins?: number
}

const iconStyle = 'w-8 h-8 md:w-10 md:h-10'

export default function UserProfileEvent({
  avatar,
  name,
  email,
  stamps,
  flowers,
  hearts,
  coupons,
  coins,
  freecoins,
}: Props) {
  const { user, token, updateToken } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // 2. เพิ่ม useEffect เพื่อ Force Update ข้อมูลจาก Token ตอนโหลดหน้า
  useEffect(() => {
    setIsMounted(true);
    
    // พยายามดึง Token จาก Store หรือ LocalStorage
    const currentToken = token || localStorage.getItem('authToken');
    
    if (currentToken) {
      // เรียก updateToken เพื่อให้มัน Decode ข้อมูลล่าสุดจาก Token ลง Store ทันที
      updateToken(currentToken);
    }
  }, []); // [] หมายถึงทำแค่ครั้งเดียวตอน Component โหลด

  // 3. ป้องกัน Hydration Mismatch (Optional แต่แนะนำ)
  if (!isMounted) {
    return null; // หรือ Loading state
  }

  const finalName = user?.fullname ?? name ?? 'Enjor Book (official)';
  const finalEmail = user?.email ?? email ?? 'enjoy@gmail.com';
  const finalAvatar = user?.profileImage ?? avatar ?? '/images/ejb.png';

  const finalStamps = user?.stamp ?? stamps ?? 0;
  const finalFlowers = user?.flower ?? flowers ?? 0;
  const finalHearts = user?.heart ?? hearts ?? 0;
  const finalCoupons = user?.coupon ?? ((user as any)?.coupons) ?? coupons ?? 0;
  const finalCoins = user?.coin ?? coins ?? 0;
  const finalFreecoins = user?.freecoin ?? freecoins ?? 0;
  return (
    <div
      className="bg-white rounded-xl flex items-center gap-4 md:gap-6"
      style={{
        width: '1040px',
        maxWidth: '100%',
        height: '164px',
        padding: '18px 28px',
        margin: '0 auto',
        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.04)',
      }}
    >
      {/* ... (ส่วนแสดงผลเหมือนเดิมทุกอย่าง) ... */}
      <div className="flex-shrink-0">
        <div className="rounded-full bg-gray-100 overflow-hidden flex items-center justify-center" style={{ width: 120, height: 120 }}>
          <AntdImage
            src={finalAvatar}
            alt="avatar"
            width={120}
            preview={{ src: finalAvatar }}
            style={{ objectFit: 'cover', width: 120, height: 120, borderRadius: '50%' }}
          />
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg md:text-xl font-semibold text-gray-800">{finalName}</div>
            <div className="text-sm md:text-base text-gray-500">{finalEmail}</div>
          </div>

          <div className="flex items-center gap-16">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <NextImage src="/images/coin.png" alt="coin" width={40} height={40}  sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'} />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalCoins}</div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <NextImage src="/images/freecoin.png" alt="freecoin" width={40} height={40}  sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'} />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalFreecoins}</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <NextImage src="/images/userstamp.png" alt="stamp" width={40} height={40}  sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'} />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalStamps}</div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <NextImage src="/images/flower.png" alt="flower" width={40} height={40}  sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'} />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalFlowers}</div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <NextImage src="/images/heart40.png" alt="heart" width={40} height={40}  sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'} />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalHearts}</div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <NextImage src="/images/coupon.png" alt="coupon" width={40} height={40}  sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'} />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalCoupons}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}