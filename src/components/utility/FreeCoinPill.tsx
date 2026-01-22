"use client";

import React from 'react';
import Image from 'next/image';
import { useWebsiteStore } from '@/stores/websiteStore';

interface FreeCoinPillProps {
    amount: number;
    className?: string;
}

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
    return `${src}?w=${width ?? ''}&q=${quality ?? 75}`;
};

function FreeCoinPill({ amount, className = "" }: FreeCoinPillProps) {
    const { settings } = useWebsiteStore();
    const iconSrc = settings?.freecoin || "/images/money-bag.png";

    return (
        <div
            className={`min-w-[80px] h-[32px] bg-white rounded-full flex items-center justify-center px-3 gap-2 shadow-sm border border-gray-100 select-none ${className}`}
        >
            <div className="w-5 h-5 relative flex-shrink-0">
                <Image
                    src={iconSrc}
                    alt="FreeCoin"
                    fill
                    className="object-contain"
                    loader={imageLoader}
                />
            </div>
            <span className="text-gray-800 font-medium text-sm leading-none pt-[1px]">
                {amount.toLocaleString()}
            </span>
        </div>
    );
}

export default FreeCoinPill;
