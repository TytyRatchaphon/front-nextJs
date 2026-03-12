"use client";
import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useWebsiteStore } from '@/stores/websiteStore';
import Image from 'next/image';

const TopUpBanner = () => {
    const { token, isLoggedIn } = useAuthStore();
    const { openLoginModal } = useUIStore();
    const { settings } = useWebsiteStore();
    
    const coinIcon = settings?.coin || "/images/e-coin.png";

    // Split text by comma, or use default if empty
    const rawText = settings?.topup_banner_text || "เติมผ่าน QR code คุ้มกว่า ได้ Coin มากกว่า";
    const displayText = React.useMemo(() => {
        return rawText.split(',').map(s => s.trim()).filter(Boolean).join("\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0");
    }, [rawText]);

    const handleClick = () => {
        if (!isLoggedIn || !token) {
            openLoginModal();
            return;
        }
        window.location.href = `https://coinenjoy.enjoybook.co/?tk=${token}`;
    };

 // seconds

    return (
        <div 
            onClick={handleClick}
            className="w-full flex items-center gap-2 md:gap-3 cursor-pointer group overflow-hidden relative min-w-0"
        >
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                    min-width: 200%;
                }
            `}} />
            
            <div className="bg-[#fb8500] group-hover:bg-[#f3722c] text-white rounded-full py-1.5 px-3 md:px-4 flex items-center gap-1.5 md:gap-2 shadow-sm transition-all flex-shrink-0 z-20 relative bg-opacity-100 mr-1 md:mr-3">
                 <div className="w-5 h-5 md:w-6 md:h-6 bg-white/20 rounded-full flex items-center justify-center">
                     <Image 
                        src={coinIcon} 
                        width={16} 
                        height={16} 
                        alt="Coin" 
                        className="object-contain" 
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/e-coin.png'; }}
                        unoptimized
                     />
                 </div>
                 <span className="font-bold text-sm md:text-base leading-none whitespace-nowrap">เติม Coin</span>
             </div>
             
            <div className="h-7 md:h-6 flex-1 min-w-0 relative overflow-hidden mask-linear-fade flex items-center">
                 <div className="flex animate-marquee whitespace-nowrap">
                    <span className="text-gray-600 font-medium text-xs sm:text-sm md:text-base leading-tight group-hover:text-black transition-colors pr-12 md:pr-20">
                        {displayText}
                    </span>
                    <span className="text-gray-600 font-medium text-xs sm:text-sm md:text-base leading-tight group-hover:text-black transition-colors pr-12 md:pr-20">
                        {displayText}
                    </span>
                 </div>
            </div>
        </div>
    );
};

export default TopUpBanner;
