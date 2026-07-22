import React from 'react';
import { Button } from 'antd';
import { useDailyCoinPassClaim } from '@/features/daily-coin-pass/hooks/useDailyCoinPassClaim';
import type { DailyCoinPassClaimRequest, DailyCoinPassClaimResponse } from '@/types/dailyCoinPass';
import { Sparkles } from 'lucide-react';

interface ClaimButtonProps {
  request: DailyCoinPassClaimRequest;
  label?: string;
  disabled?: boolean;
  onSuccess?: (res: DailyCoinPassClaimResponse) => void;
  variant?: 'primary' | 'secondary' | 'catchup';
  fullWidth?: boolean;
}

export function ClaimButton({ 
  request, 
  label = "รับรางวัล", 
  disabled = false, 
  onSuccess,
  variant = 'primary',
  fullWidth = false
}: ClaimButtonProps) {
  const { claim, claiming } = useDailyCoinPassClaim(onSuccess);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    claim(request);
  };

  // Base styles
  let buttonClasses = "relative overflow-hidden group font-bold transition-all duration-300 rounded-xl shadow-md border-0 ";
  let textClasses = "relative z-10 flex items-center justify-center gap-1 sm:gap-2 text-[11px] sm:text-sm whitespace-nowrap ";
  
  if (fullWidth) {
    buttonClasses += " w-full flex justify-center ";
  }

  // Variant styles
  if (variant === 'primary') {
    buttonClasses += "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-400 hover:to-rose-400 hover:shadow-[0_0_20px_rgba(244,114,182,0.6)] ";
  } else if (variant === 'catchup') {
    buttonClasses += "bg-gradient-to-r from-orange-400 to-amber-500 text-white hover:from-orange-300 hover:to-amber-400 hover:shadow-[0_0_20px_rgba(251,146,60,0.6)] ";
  } else {
    buttonClasses += "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 ";
  }

  if (disabled) {
    buttonClasses = "relative bg-slate-200 text-slate-400 cursor-not-allowed rounded-xl font-bold border-0 ";
    if (fullWidth) buttonClasses += " w-full flex justify-center ";
  }

  return (
    <Button 
      className={`${buttonClasses} h-full !px-0 sm:!px-4 !min-w-0 flex items-center justify-center`}
      onClick={handleClick} 
      loading={claiming} 
      disabled={disabled}
      style={{ paddingInline: '2px', width: fullWidth ? '100%' : undefined }}
    >
      <span className={textClasses} style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
        <span>{label}</span>
      </span>
      
      {/* Shine effect animation for primary buttons */}
      {!disabled && variant === 'primary' && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
      )}
    </Button>
  );
}
