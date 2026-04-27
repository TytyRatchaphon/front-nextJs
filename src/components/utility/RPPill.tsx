"use client";
import Image from 'next/image';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import '@/utils/imageUtils';

interface RPPillProps {
    amount: number;
    className?: string;
}


function RPPill({ amount, className = "" }: RPPillProps) {
    const { settings } = useWebsiteSettings();
    const iconSrc = settings?.rp || "/images/rp.png";

    return (
        <div
            className={`min-w-[80px] h-[32px] bg-white rounded-full flex items-center justify-center px-3 gap-2 shadow-sm border border-gray-100 select-none ${className}`}
        >
            <div className="w-5 h-5 relative flex-shrink-0">
                <Image
                    src={iconSrc}
                    alt="RP"
                    fill
                    className="object-contain"
                    unoptimized
                />
            </div>
            <span className="text-gray-800 font-medium text-sm leading-none pt-[1px]">
                {amount.toLocaleString()}
            </span>
        </div>
    );
}

export default RPPill;
