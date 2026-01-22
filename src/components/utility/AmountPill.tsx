"use client";

import React from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { useWebsiteStore } from '@/stores/websiteStore';

interface AmountPillProps {
    amount: number;
    icon?: string; // Optional override
    onAddClick?: () => void;
    className?: string; // Allow customizing position/margin
}

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
    return `${src}?w=${width ?? ''}&q=${quality ?? 75}`;
};

function AmountPill({ amount, icon, onAddClick, className = "" }: AmountPillProps) {
    const { settings } = useWebsiteStore();
    const { token } = useAuthStore();
    const iconSrc = icon || settings?.coin || "/images/e-coin.png";

    // Format number (e.g., 1.5k, 1M) if very large, or just locale string
    const formattedAmount = amount > 9999
        ? Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(amount)
        : amount.toLocaleString();

    const handleClick = () => {
        if (onAddClick) {
            onAddClick();
        } else if (token) {
            window.location.href = `https://coinenjoy.enjoybook.co/?tk=${token}`;
        }
    };

    return (
        <div
            className={`w-[108px] h-[32px] bg-white rounded-full flex items-center justify-between p-1 shadow-sm border border-gray-100 select-none ${className}`}
        >
            {/* Coin Icon */}
            <div className="w-6 h-6 flex-shrink-0 relative">
                <Image
                    src={iconSrc}
                    alt="coin"
                    fill
                    className="object-contain"
                    loader={imageLoader}
                />
            </div>

            {/* Amount Text */}
            <div className="flex-1 text-center mx-1 overflow-hidden">
                <span className="text-sm font-medium text-gray-800 truncate block leading-none" title={amount.toLocaleString()}>
                    {formattedAmount}
                </span>
            </div>

            {/* Add Button */}
            <button
                onClick={handleClick}
                className="w-6 h-6 rounded-full bg-[#7AC142] hover:bg-[#68a635] flex items-center justify-center !text-white transition-colors flex-shrink-0 active:scale-95"
            >
                <Plus size={16} strokeWidth={3} />
            </button>
        </div>
    );
}

export default AmountPill;