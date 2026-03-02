"use client";

import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useWebsiteStore } from '@/stores/websiteStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import Image from 'next/image';
import '@/utils/imageUtils';


const fetchWeeklyLogin = async (token?: string | null) => {
    if (!token) return {};
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    const url = `${base}/user/event/login`;
    const res = await apiClient.get(url);
    return res.data?.data ?? {};
};

const FloatingGiftButton = () => {
    const { isLoggedIn, token } = useAuthStore();
    const { isCheckinModalOpen, openCheckinModal, isDailyPopupProcessComplete } = useUIStore();
    const { settings } = useWebsiteStore();

    const { data } = useQuery({
        queryKey: ['weekly-login', token],
        queryFn: () => fetchWeeklyLogin(token),
        enabled: isLoggedIn && !!token,
        staleTime: 60 * 1000,
    });

    const isCheckedInToday = data?.checked_in_today === true;

    // Show if:
    // 1. Logged in and data loaded
    // 2. Daily popup process is done
    // 3. Modal is currently closed
    const shouldShow = isLoggedIn && isDailyPopupProcessComplete && data && !isCheckinModalOpen && settings?.['7D_Checkin'] === 'active';

    if (!shouldShow) return null;

    return (
        <div 
            className={`fixed bottom-24 right-4 z-[900] cursor-pointer transition-transform hover:scale-110 active:scale-95 ${!isCheckedInToday ? 'animate-shake' : 'grayscale-[50%] hover:grayscale-0'}`}
            onClick={openCheckinModal}
        >
             <style jsx>{`
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                .animate-shake {
                    animation: shake 5s infinite;
                }
            `}</style>
            
            <div className="relative w-12 h-12 md:w-14 md:h-14 drop-shadow-xl">
                 <Image 
                    src="/images/gift_box.png"
                    alt="Claim Daily Reward"
                    fill
                    className="object-contain"
                    unoptimized
                    
                />
            </div>
             
             {/* Text Bubble/Hint - Only show if NOT checked in today */}
             {!isCheckedInToday && (
                <div className="absolute -top-2 -left-4 bg-red-600 text-white text-[8px] md:text-xs px-2 py-0.5 rounded-full shadow-md whitespace-nowrap animate-bounce">
                    ล๊อคอินรายวัน
                </div>
             )}
        </div>
    );
};

export default FloatingGiftButton;
