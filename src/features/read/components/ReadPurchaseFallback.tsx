import Image from "next/image";
import {
  getReadEpisodePurchaseState,
  getRegularEpisodePrices,
  type ReadPayMethod,
} from "../purchaseUtils";
import { formatFreeUntilLabel } from "../readerContentUtils";
import { ReadScheduledReleaseNotice } from "./ReadScheduledReleaseNotice";

type ReadPurchaseFallbackProps = {
  episode: unknown;
  settings: any;
  isQuotaHardBlocked: boolean;
  isScheduledReleasePending: boolean;
  purchaseState: ReturnType<typeof getReadEpisodePurchaseState>;
  scheduledPublishAt: Date | null;
  scheduledReleaseCountdown: string | null;
  currentBgKey?: string;
  onLogin: () => void;
  onGoStore: () => void;
  onOpenConfirm: (method: ReadPayMethod, amount?: number | null) => void;
};

export function ReadPurchaseFallback({
  episode,
  settings,
  isQuotaHardBlocked,
  isScheduledReleasePending,
  purchaseState,
  scheduledPublishAt,
  scheduledReleaseCountdown,
  currentBgKey,
  onLogin,
  onGoStore,
  onOpenConfirm,
}: ReadPurchaseFallbackProps) {
  const ep = episode as any;

  if (isScheduledReleasePending && !purchaseState.isEarlyAccess) {
    return (
      <ReadScheduledReleaseNotice
        scheduledPublishAt={scheduledPublishAt}
        scheduledReleaseCountdown={scheduledReleaseCountdown}
        currentBgKey={currentBgKey}
      />
    );
  }

  if (isQuotaHardBlocked) {
    const isGuestLimit = true;
    return (
      <div className="text-center py-12">
        <Image src={settings?.img_buyep || "/images/unlock.png"} alt="Free quota reached" width={100} height={100} unoptimized className="justify-center mx-auto" />
        <p className="mt-2 text-base font-semibold text-gray-700">
          {isGuestLimit ? "สิ้นสุดโควต้าอ่านฟรี" : "อ่านฟรีครบ 40 ตอนแล้ว"}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {isGuestLimit ? "เข้าสู่ระบบเพื่ออ่านฟรีต่ออีก 30 ตอน" : "ปลดล็อกตอนเพื่ออ่านต่อได้ทันที"}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {isGuestLimit ? (
            <button
              type="button"
              onClick={onLogin}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              เข้าสู่ระบบเพื่ออ่านต่อ
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoStore}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              เติมเหรียญเพื่ออ่านต่อ
            </button>
          )}
        </div>
      </div>
    );
  }

  const { coinPrice, freecoinPrice, hasDiscount } = getRegularEpisodePrices(ep);
  const { isEarlyAccess, canFastTicket, canFastCoin, isFastLocked, fastTicketPrice, fastCoinPrice, canUseFreecoin } = purchaseState;
  const baseRegularPrice = Number(coinPrice ?? 0);
  const isDiscountFree = Boolean(purchaseState.isDiscountFree) && !isEarlyAccess;
  const freeUntilLabel = isDiscountFree ? formatFreeUntilLabel(purchaseState.discountEndDate) : null;

  if (isDiscountFree || (!isEarlyAccess && baseRegularPrice <= 0)) {
    return (
      <div className="text-center py-12">
        <Image src={settings?.img_buyep || "/images/unlock.png"} alt="Free Episode" width={100} height={100} unoptimized className="justify-center mx-auto" />
        <p className="text-sm font-semibold text-emerald-700">ตอนนี้เปิดอ่านฟรี</p>
        {freeUntilLabel && (
          <p className="mt-1 text-xs text-emerald-700">{`อ่านฟรีถึง ${freeUntilLabel}`}</p>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      {isScheduledReleasePending && purchaseState.isEarlyAccess && (
        <div className="mb-5">
          <ReadScheduledReleaseNotice
            scheduledPublishAt={scheduledPublishAt}
            scheduledReleaseCountdown={scheduledReleaseCountdown}
            currentBgKey={currentBgKey}
            compact
          />
        </div>
      )}
      <Image src={settings?.img_buyep || "/images/unlock.png"} alt="No Content" width={100} height={100} unoptimized className="justify-center mx-auto" />
      <p className="text-sm text-gray-500 mb-4">
        {isScheduledReleasePending && purchaseState.isEarlyAccess
          ? "ตอนนี้ยังไม่ถึงเวลาเผยแพร่ แต่สามารถปลดล็อกเพื่ออ่านก่อนใครได้"
          : "ตอนนี้ยังไม่มีเนื้อหา หากต้องการอ่าน กรุณาซื้อ"}
      </p>
      {isEarlyAccess && (
        <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isFastLocked ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"}`}>
          <Image src={settings?.fast_ticket || "/images/fast_ticket.png"} alt="fast ticket" width={16} height={16} unoptimized />
          {isFastLocked ? "ซื้อตอนก่อนหน้า เพื่อปลดล็อค" : canFastTicket && canFastCoin ? "ตอนล่วงหน้า เลือกจ่าย FastTicket / เหรียญ" : canFastTicket ? "ตอนล่วงหน้า จ่ายด้วย FastTicket" : "ตอนล่วงหน้า จ่ายด้วยเหรียญ"}
        </div>
      )}
      <div className="flex items-center justify-center gap-3">
        {canUseFreecoin && !isEarlyAccess && (
          <button onClick={() => onOpenConfirm("freecoin", freecoinPrice)} className="flex items-center gap-2 px-4 py-2 bg-red-600 !text-white rounded-lg [&_*]:!text-white">
            <Image src={settings?.freecoin || "/images/money-bag.png"} alt="Coin Icon" width={20} height={20} unoptimized />
            ซื้อด้วยถุงเงิน {freecoinPrice ? `(${freecoinPrice})` : ""}
          </button>
        )}
        <button onClick={() => onOpenConfirm("coin", coinPrice)} disabled={isFastLocked || (isEarlyAccess && !canFastCoin)} className={`flex items-center gap-2 px-4 py-2 ${(canUseFreecoin && !isEarlyAccess) ? "bg-yellow-400" : "bg-red-600"} text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed`}>
          {isEarlyAccess ? (
            <div className="flex items-center gap-2 text-white font-medium">
              {canFastTicket && (
                <div className="inline-flex items-center gap-1">
                  <Image src={settings?.fast_ticket || "/images/fast_ticket.png"} alt="Fast Ticket" width={18} height={18} unoptimized />
                  <span>{fastTicketPrice}</span>
                </div>
              )}
              {canFastTicket && canFastCoin && <span className="opacity-80">/</span>}
              {canFastCoin && (
                <div className="inline-flex items-center gap-1">
                  <Image src={settings?.coin || "/images/e-coin.png"} alt="Coin Icon" width={18} height={18} unoptimized />
                  <span>{fastCoinPrice}</span>
                </div>
              )}
              {baseRegularPrice > 0 && (
                <>
                  <span className="opacity-80">+</span>
                  <div className="inline-flex items-center gap-1">
                    <Image src={settings?.coin || "/images/e-coin.png"} alt="regular coin" width={18} height={18} unoptimized />
                    {canUseFreecoin && (
                      <Image src={settings?.freecoin || "/images/money-bag.png"} alt="regular freecoin" width={18} height={18} unoptimized />
                    )}
                    <span>{baseRegularPrice}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Image src={settings?.coin || "/images/e-coin.png"} alt="Coin Icon" width={20} height={20} unoptimized />
              <div className="flex items-center gap-1 text-white">
                <span>ซื้อด้วยเหรียญ</span>
                {hasDiscount ? (
                  <>
                    <span className="line-through opacity-60 text-xs text-white">({ep?.coin})</span>
                    <span className="font-bold text-white">({coinPrice})</span>
                  </>
                ) : (
                  <span className="text-white">{ep?.coin ? `(${ep.coin})` : ""}</span>
                )}
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
