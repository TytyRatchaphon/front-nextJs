"use client"

import React, { useEffect, useState } from 'react' // เพิ่ม useEffect, useState
import Image from 'next/image'
import 'antd';
import { useAuthStore } from '@/stores/authStore'
import { useWebsiteStore } from '@/stores/websiteStore'
import '@/utils/imageUtils';


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
  coins,
  freecoins,
}: Props) {
  const { user, token, updateToken } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const { settings } = useWebsiteStore();

  // 2. เพิ่ม useEffect เพื่อ Force Update ข้อมูลจาก Token ตอนโหลดหน้า
  useEffect(() => {
    setIsMounted(true);

    // พยายามดึง Token จาก Store หรือ LocalStorage
    const currentToken = token || localStorage.getItem('authToken');

    if (currentToken) {
      // เรียก updateToken เพื่อให้มัน Decode ข้อมูลล่าสุดจาก Token ลง Store ทันที
      updateToken(currentToken);
    }
  }, [token, updateToken]);

  // 3. ป้องกัน Hydration Mismatch (Optional แต่แนะนำ)
  if (!isMounted) {
    return null; // หรือ Loading state
  }

  const finalName = user?.fullname ?? name ?? 'Enjor Book (official)';
  const finalEmail = user?.email ?? email ?? 'enjoy@gmail.com';

  const getAvatarUrl = () => {
    const src = user?.img ?? user?.profileImage ?? avatar ?? '/images/default-avatar.png';
    if (!src || src === 'null') return '/images/default-avatar.png';

    // ถ้าเป็นรูป default หรือ full url หรือ base64 ให้ใช้เลย
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('/')) {
      // If it starts with slash, it might be a local public asset or relative path
      // logic here was returning it directly
      return src.replace('http:', 'https:');
    }

    // ถ้าเป็นชื่อไฟล์จาก backend ให้ต่อ path profile/
    // Explicitly using https://img.enjoybook.co/img/profile/ as per MyBookHeader fix
    return `https://img.enjoybook.co/img/profile/${src}`;
  };

  const finalAvatar = getAvatarUrl();

  const finalStamps = user?.stamp ?? stamps ?? 0;
  const finalCoins = user?.coin ?? coins ?? 0;
  const finalFreecoins = user?.freecoin ?? freecoins ?? 0;
  return (
    <div
      className="bg-white rounded-xl flex flex-col md:flex-row items-center gap-6 w-full max-w-[1040px] mx-auto p-5 md:px-7 md:py-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.04)] h-auto min-h-[164px]"
    >
      {/* ... (ส่วนแสดงผลเหมือนเดิมทุกอย่าง) ... */}
      <div className="flex-shrink-0">
        <div className="rounded-full bg-gray-100 overflow-hidden flex items-center justify-center" style={{ width: 120, height: 120 }}>
          <Image
            src={finalAvatar}
            alt="avatar"
            width={120}
            height={120}
            unoptimized
            className="w-[120px] h-[120px] rounded-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-avatar.png'; }}
          />
        </div>
      </div>

      <div className="flex-1 w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="text-lg md:text-xl font-semibold text-gray-800">{finalName}</div>
            <div className="text-sm md:text-base text-gray-500">{finalEmail}</div>
          </div>

          <div className="grid grid-cols-3 gap-y-6 gap-x-4 md:flex md:items-center md:gap-8 lg:gap-16 place-items-center w-full md:w-auto">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <Image src={settings?.coin || '/images/coin.png'} alt="coin" width={40} height={40} sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'} unoptimized  />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalCoins.toLocaleString()}</div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <Image src={settings?.freecoin || '/images/freecoin.png'} alt="freecoin" width={40} height={40} sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'}  unoptimized />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalFreecoins.toLocaleString()}</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <Image src={settings?.stamp || '/images/userstamp.png'} alt="stamp" width={40} height={40} sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'}  unoptimized />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalStamps.toLocaleString()}</div>
            </div>

            {/* <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <Image src={settings?.flower || '/images/flower.png'} alt="flower" width={40} height={40} sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'} unoptimized unoptimized />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalFlowers}</div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <Image src={settings?.heart || '/images/heart40.png'} alt="heart" width={40} height={40} sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'} unoptimized unoptimized />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalHearts}</div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center">
                <Image src={settings?.coupon || '/images/coupon.png'} alt="coupon" width={40} height={40} sizes="(min-width: 768px) 40px, 32px" className={iconStyle + ' object-contain'} unoptimized unoptimized />
              </div>
              <div className="text-black  text-sm md:text-base mt-1">{finalCoupons}</div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}

