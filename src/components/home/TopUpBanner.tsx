"use client";
import * as React from "react";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import Image from "next/image";
import { buildCoinEnjoyTopupUrl, navigateSafely } from "@/utils/navigationUtils";

const DEFAULT_TOPUP_TEXT =
  "เติมผ่าน QR code คุ้มกว่า ได้ Coin มากกว่า";

const TopUpBanner = () => {
  const { token, isLoggedIn } = useAuthStore();
  const { openLoginModal } = useUIStore();
  const { settings } = useWebsiteSettings();

  const coinIcon = settings?.coin || "/images/e-coin.png";
  const rawText = settings?.topup_banner_text || DEFAULT_TOPUP_TEXT;

  const displayText = React.useMemo(() => {
    const parts = rawText
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean);

    return parts.length > 0 ? parts.join(" / ") : rawText;
  }, [rawText]);

  const handleClick = () => {
    if (!isLoggedIn || !token) {
      openLoginModal();
      return;
    }

    const topupUrl = buildCoinEnjoyTopupUrl(token);
    navigateSafely(topupUrl, { allowExternal: true });
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex w-full min-w-0 cursor-pointer items-center gap-2 overflow-hidden md:gap-3"
    >
      <div className="relative z-10 mr-1 flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#fb8500] px-3 py-1.5 text-white shadow-sm transition-all group-hover:bg-[#f3722c] md:mr-3 md:h-10 md:gap-2 md:px-4">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 md:h-6 md:w-6">
          <Image
            src={coinIcon}
            width={16}
            height={16}
            alt="Coin"
            className="object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/e-coin.png";
            }}
            unoptimized
          />
        </div>
        <span className="whitespace-nowrap text-sm font-bold leading-none md:text-base">
          {"เติม Coin"}
        </span>
      </div>

      <div className="flex h-9 min-w-0 flex-1 items-center overflow-hidden md:h-10">
        <div className="flex h-full w-full items-center">
          <span className="block w-full translate-y-px truncate text-xs font-medium leading-none text-gray-600 transition-colors group-hover:text-black sm:text-sm md:translate-y-[2px] md:text-base">
            {displayText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopUpBanner;

