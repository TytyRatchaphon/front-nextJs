"use client";

import React from 'react';
import Image from 'next/image';
import { useWebsiteStore } from '@/stores/websiteStore';
import '@/utils/imageUtils';

interface StampPillProps {
    amount: number;
    className?: string;
}


function StampPill({ amount, className = "" }: StampPillProps) {
    const { settings } = useWebsiteStore();
    const iconSrc = settings?.stamp || "/images/stamp.png";

    return (
        <div
            className={`stamp-pill min-w-[80px] h-[32px] bg-white rounded-full flex items-center justify-center px-3 gap-2 shadow-sm border border-gray-100 select-none ${className}`}
        >
            <div className="stamp-pill-icon w-5 h-5 relative flex-shrink-0">
                <Image
                    src={iconSrc}
                    alt="Stamp"
                    fill
                    className="object-contain"
                    unoptimized
                />
            </div>
            <span className="stamp-pill-text text-gray-800 font-medium text-sm leading-none pt-[1px]">
                {amount.toLocaleString()}
            </span>
        </div>
    );
}

export default StampPill;
