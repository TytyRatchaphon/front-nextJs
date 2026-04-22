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
            className={`stamp-pill relative min-w-[80px] h-[32px] bg-white rounded-full flex items-center justify-center pl-8 pr-3 shadow-sm border border-gray-100 select-none ${className}`}
        >
            <div className="stamp-pill-icon absolute left-1 top-1/2 w-5 h-5 -translate-y-1/2">
                <Image
                    src={iconSrc}
                    alt="Stamp"
                    fill
                    className="object-contain"
                    unoptimized
                />
            </div>
            <span className="stamp-pill-text w-full text-center text-gray-800 font-medium text-sm leading-none pt-[1px]">
                {amount.toLocaleString()}
            </span>
        </div>
    );
}

export default StampPill;
