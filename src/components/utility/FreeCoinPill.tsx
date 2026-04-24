"use client";
import Image from 'next/image';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import '@/utils/imageUtils';

interface FreeCoinPillProps {
    amount: number;
    className?: string;
}


function FreeCoinPill({ amount, className = "" }: FreeCoinPillProps) {
    const { settings } = useWebsiteSettings();
    const iconSrc = settings?.freecoin || "/images/money-bag.png";

    return (
        <div
            className={`freecoin-pill relative min-w-[80px] h-[32px] bg-white rounded-full flex items-center justify-center pl-8 pr-3 shadow-sm border border-gray-100 select-none ${className}`}
        >
            <div className="freecoin-pill-icon absolute left-1 top-1/2 w-5 h-5 -translate-y-1/2">
                <Image
                    src={iconSrc}
                    alt="FreeCoin"
                    fill
                    className="object-contain"
                    unoptimized
                />
            </div>
            <span className="freecoin-pill-text w-full text-center text-gray-800 font-medium text-sm leading-none pt-[1px]">
                {amount.toLocaleString()}
            </span>
        </div>
    );
}

export default FreeCoinPill;

