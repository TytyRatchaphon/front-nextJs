import * as React from "react";
import { useState } from 'react';

interface SpoilerCardWrapperProps {
  children: React.ReactNode;
  isSpoiler: boolean;
  onClick: () => void;
  variant?: 'default' | 'home';
  cardClassName?: string;
  spoilerClassName?: string;
  revealTitle?: string;
  revealSubtitle?: string;
}

export default function SpoilerCardWrapper({
  children,
  isSpoiler,
  onClick,
  variant = 'default',
  cardClassName = '',
  spoilerClassName = '',
  revealTitle = 'รีวิวนี้มีสปอยล์',
  revealSubtitle = 'คลิกเพื่ออ่าน',
}: SpoilerCardWrapperProps) {
  const [isRevealed, setIsRevealed] = useState(!isSpoiler);
  const isHomeVariant = variant === 'home';

  const visibleCardClass = isHomeVariant
    ? 'bg-white rounded-2xl border border-[#f5cac6] p-3.5 sm:p-4 h-[236px] sm:h-[248px] md:h-[258px] flex flex-col cursor-pointer relative shadow-[0_10px_30px_rgba(227,53,39,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(227,53,39,0.14)] hover:border-[#efb8b2]'
    : 'bg-white rounded-xl shadow-sm border border-red-200 p-4 min-h-[240px] flex flex-col hover:shadow-md transition-shadow cursor-pointer relative';

  const spoilerCardClass = isHomeVariant
    ? 'bg-white/85 rounded-2xl border border-[#f0c5bf] h-[236px] sm:h-[248px] md:h-[258px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group p-3.5 sm:p-4 shadow-[0_10px_28px_rgba(227,53,39,0.10)] backdrop-blur-[2px]'
    : 'bg-[#FFE5E5] rounded-xl shadow-sm border border-[#E33527]/30 min-h-[240px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group p-4';

  if (!isSpoiler || isRevealed) {
    return (
      <div
        onClick={onClick}
        className={`${visibleCardClass} ${cardClassName}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`${spoilerCardClass} ${spoilerClassName}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsRevealed(true);
      }}
    >
      <div className="absolute inset-0 opacity-15 blur-sm pointer-events-none p-4 flex flex-col border border-[#FEE8D6]">
        {children}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#fff4f2]/80 via-[#ffeceb]/90 to-[#ffe4e1]/95" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-3 rounded-full border border-[#efb8b2] bg-white/85 p-3 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-8 w-8 text-[#E33527]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-[#E33527] font-bold text-center px-4 leading-snug drop-shadow-sm">
          {revealTitle}
          <br />
          {revealSubtitle}
        </span>
        <span className="mt-3 rounded-full border border-[#efb8b2] bg-white px-3 py-1 text-[11px] font-semibold tracking-wide text-[#be2e20]">
          แตะเพื่อแสดงข้อความ
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/55 to-transparent" />
    </div>
  );
}
