"use client";
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Tooltip } from 'antd';

import { navigateSafely } from '@/utils/navigationUtils';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import '@/utils/imageUtils';

interface FastTicketPillProps {
  amount: number;
  onAddClick?: () => void;
  className?: string;
}

function FastTicketPill({ amount, onAddClick, className = "" }: FastTicketPillProps) {
  const { settings } = useWebsiteSettings();
  const iconSrc = settings?.fast_ticket || '/images/fast_ticket.png';
  const formattedAmount = amount > 9999
    ? Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)
    : amount.toLocaleString();

  const handleClick = () => {
    if (onAddClick) {
      onAddClick();
      return;
    }

    navigateSafely('/store');
  };

  return (
    <div
      className={`fast-ticket-pill relative w-[108px] h-[32px] bg-white rounded-full flex items-center justify-center px-8 shadow-sm border border-gray-100 select-none ${className}`}
    >
      <div className="fast-ticket-pill-icon absolute left-1 top-1/2 w-5 h-5 -translate-y-1/2">
        <Image
          src={iconSrc}
          alt="Fast Ticket"
          fill
          className="object-contain"
          unoptimized
        />
      </div>

      <div className="w-full text-center overflow-hidden cursor-pointer">
        <Tooltip title={amount.toLocaleString()} trigger={['click', 'hover']} placement="bottom">
          <span className="fast-ticket-pill-text text-sm font-medium text-gray-800 truncate block leading-none">
            {formattedAmount}
          </span>
        </Tooltip>
      </div>

      <button
        onClick={handleClick}
        className="fast-ticket-pill-add absolute right-1 top-1/2 w-6 h-6 -translate-y-1/2 rounded-full bg-[#7AC142] hover:bg-[#68a635] flex items-center justify-center !text-white transition-colors active:scale-95"
        aria-label="ไปที่ร้านค้าแต้ม"
      >
        <Plus size={16} strokeWidth={3} />
      </button>
    </div>
  );
}

export default FastTicketPill;

