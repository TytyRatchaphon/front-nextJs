// src/components/LoggedInContent.tsx

"use client"; // <--- สำคัญที่สุด!

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';

export function LoggedInContent() {
  const { user, hasMounted } = useAuthStore();

  // Prevent hydration mismatch
  if (!hasMounted) {
    return null;
  }

  // Show content if user is logged in
  if (user) {
    return (
        <div className='my-2'>
            <div className='flex flex-row justify-between'>
                <div className='flex flex-row gap-2'>
                    <Link href="https://bit.ly/47zskk0">
                        <Image src="https://img.enjoybook.co/img/icon-img/appstore.png?w=3840&q=75" alt="" width="1500" height="1500" className='w-[100px] md:w-[120px] h-auto'/>
                    </Link>
                    <Link href="https://play.google.com/store/apps/details?id=com.enjoybook.enjoyread&hl=en">
                        <Image src="https://img.enjoybook.co/img/icon-img/googleplay.png?w=3840&q=75" alt="" width="1500" height="1500" className='w-[100px] md:w-[120px] h-auto'/>
                    </Link>
                </div>
                <div>
                    <div className='w-full'>
                        <button className='text-sm text-white bg-primary py-1 hover:border-secondary hover:bg-secondary hover:text-primary focus:outline-none w-full'>
                            <span className='font-bold font-primary'>
                                เติมเหรียญ
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // 6. ถ้า Mount แล้ว แต่ "ไม่มี" ข้อมูล (ยังไม่ Login)
  // ก็ไม่ต้องแสดงอะไรเลย
  return null;
}