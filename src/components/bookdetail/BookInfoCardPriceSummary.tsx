"use client";

import Image from "next/image";

type PriceSummarySettings = {
  coin?: string | null;
  freecoin?: string | null;
  fast_ticket?: string | null;
} | null | undefined;

export type BookInfoCardSelectedSummary = {
  total: number;
  hasEarlyAccess: boolean;
  fastTicketRequiredTotal: number;
  earlyAccessCoinTotal: number;
  baseCoinTotal: number;
  canUseFreecoin: boolean;
  canUseFastCoin: boolean;
};

type MixedPriceSummaryProps = {
  summary: Pick<
    BookInfoCardSelectedSummary,
    "fastTicketRequiredTotal" | "earlyAccessCoinTotal" | "baseCoinTotal" | "canUseFreecoin" | "canUseFastCoin"
  >;
  settings: PriceSummarySettings;
};

export function MixedPriceSummary({ summary, settings }: MixedPriceSummaryProps) {
  const showFastTicket = summary.fastTicketRequiredTotal > 0;
  const showFastCoin = summary.canUseFastCoin && summary.earlyAccessCoinTotal > 0;

  if (!showFastTicket && !showFastCoin) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-700">
      {showFastTicket && (
        <div className="flex items-center gap-1 text-amber-700">
          <span>{summary.fastTicketRequiredTotal}</span>
          <Image src={settings?.fast_ticket || "/images/fast_ticket.png"} alt="fast ticket" width={14} height={14} unoptimized />
        </div>
      )}
      {showFastTicket && showFastCoin && <span className="text-gray-400">/</span>}
      {showFastCoin && (
        <div className="flex items-center gap-1 text-orange-600">
          <span>{summary.earlyAccessCoinTotal}</span>
          <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={14} height={14} unoptimized />
        </div>
      )}
      {summary.baseCoinTotal > 0 && (
        <>
          <span className="text-gray-400">+</span>
          <div className="flex items-center gap-1 text-red-600">
            <span>{summary.baseCoinTotal}</span>
            <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={14} height={14} unoptimized />
            {summary.canUseFreecoin && (
              <Image src={settings?.freecoin || "/images/money-bag.png"} alt="freecoin" width={14} height={14} unoptimized />
            )}
          </div>
        </>
      )}
    </div>
  );
}

type ConfirmPriceSummaryProps = {
  summary: BookInfoCardSelectedSummary;
  settings: PriceSummarySettings;
  payWith: "coin" | "freecoin";
  fastPayWith: "coin" | "fast_ticket";
};

export function ConfirmPriceSummary({
  summary,
  settings,
  payWith,
  fastPayWith,
}: ConfirmPriceSummaryProps) {
  if (!summary.hasEarlyAccess) {
    return (
      <div className="text-center flex justify-center items-center gap-2">
        รวมยอด: <b className="text-red-600 text-xl">{summary.total}</b>
        <Image
          src={payWith === "freecoin" ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")}
          alt="currency"
          width={20}
          height={20}
          unoptimized
        />
      </div>
    );
  }

  const useFastTicket = fastPayWith === "fast_ticket";
  const fastPaymentTotal = useFastTicket
    ? summary.fastTicketRequiredTotal
    : summary.earlyAccessCoinTotal;

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
      <div className="text-xs font-medium text-gray-500 mb-2">สรุปราคา</div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-base font-semibold">
        <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-orange-600 border border-orange-100">
          <Image
            src={payWith === "freecoin" ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")}
            alt="payment type"
            width={16}
            height={16}
            unoptimized
          />
          <span>{summary.baseCoinTotal}</span>
        </div>
        {summary.baseCoinTotal > 0 && fastPaymentTotal > 0 && (
          <>
            <span className="text-gray-400">+</span>
            <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-amber-700 border border-amber-100">
              <Image
                src={useFastTicket ? (settings?.fast_ticket || "/images/fast_ticket.png") : (settings?.coin || "/images/e-coin.png")}
                alt="early method"
                width={16}
                height={16}
                unoptimized
              />
              <span>{fastPaymentTotal}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
