"use client";
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Tooltip } from 'antd';

import { useAuthStore } from '@/stores/authStore';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import '@/utils/imageUtils';
import { buildCoinEnjoyTopupUrl, navigateSafely } from '@/utils/navigationUtils';

interface AmountPillProps {
    amount: number;
    icon?: string; // Optional override
    onAddClick?: () => void;
    className?: string; // Allow customizing position/margin
}


function AmountPill({ amount, icon, onAddClick, className = "" }: AmountPillProps) {
    const { settings } = useWebsiteSettings();
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
            const topupUrl = buildCoinEnjoyTopupUrl(token);
            navigateSafely(topupUrl, { allowExternal: true });
        }
    };

    return (
        <div
            className={`amount-pill relative w-[108px] h-[32px] bg-white rounded-full flex items-center justify-center px-8 shadow-sm border border-gray-100 select-none ${className}`}
        >
            {/* Coin Icon */}
            <div className="amount-pill-icon absolute left-1 top-1/2 w-6 h-6 -translate-y-1/2">
                <Image
                    src={iconSrc}
                    alt="coin"
                    fill
                    className="object-contain"
                    unoptimized
                />
            </div>

            {/* Amount Text */}
            <div className="w-full text-center overflow-hidden cursor-pointer">
                <Tooltip title={amount.toLocaleString()} trigger={['click', 'hover']} placement="bottom">
                    <span className="amount-pill-text text-sm font-medium text-gray-800 truncate block leading-none">
                        {formattedAmount}
                    </span>
                </Tooltip>
            </div>

            {/* Add Button */}
            <button
                onClick={handleClick}
                className="amount-pill-add absolute right-1 top-1/2 w-6 h-6 -translate-y-1/2 rounded-full bg-[#7AC142] hover:bg-[#68a635] flex items-center justify-center !text-white transition-colors active:scale-95"
            >
                <Plus size={16} strokeWidth={3} />
            </button>
        </div>
    );
}

export default AmountPill;
