"use client";

import type { KeyboardEvent } from "react";
import AmountPill from '@/components/utility/AmountPill';
import FreeCoinPill from '@/components/utility/FreeCoinPill';
import FastTicketPill from '@/components/utility/FastTicketPill';

type WalletUser = {
  coin?: number | null;
  freecoin?: number | null;
  fast_ticket?: number | null;
} | null | undefined;

type BookWalletConfig = {
  use_freecoin?: number | null;
};

type BookInfoCardWalletSectionProps = {
  isLoggedIn: boolean;
  user: WalletUser;
  book: BookWalletConfig;
  onLoginNeeded: () => void;
};

const LoginPromptPill = () => (
  <div className="h-10 px-6 rounded-full border border-dashed border-gray-200 bg-gray-50 shadow-sm flex items-center gap-2 justify-center cursor-pointer text-gray-600">
    <span className="text-sm font-medium">เข้าสู่ระบบ</span>
  </div>
);

const handleLoginPromptKeyDown = (
  event: KeyboardEvent<HTMLDivElement>,
  onLoginNeeded: () => void,
) => {
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
    onLoginNeeded();
  }
};

export default function BookInfoCardWalletSection({
  isLoggedIn,
  user,
  book,
  onLoginNeeded,
}: BookInfoCardWalletSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5">
      <div className="w-full">
        <div
          role="button"
          tabIndex={0}
          onClick={() => { if (!isLoggedIn) onLoginNeeded(); }}
          onKeyDown={(event) => {
            if (!isLoggedIn) handleLoginPromptKeyDown(event, onLoginNeeded);
          }}
          className="w-full"
        >
          {isLoggedIn ? (
            <div className="flex items-center gap-2 justify-between w-full flex-wrap">
              <AmountPill amount={Number(user?.coin || 0)} />
              <FastTicketPill amount={Number(user?.fast_ticket || 0)} className="bg-gray-50 !border-gray-200" />
              {book.use_freecoin === 1 && (
                <FreeCoinPill amount={Number(user?.freecoin || 0)} className="bg-gray-50 !border-gray-200" />
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <LoginPromptPill />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
