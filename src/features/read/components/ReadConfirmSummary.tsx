import Image from "next/image";
import {
  getReadEpisodePurchaseState,
  getRegularEpisodePrices,
  type ReadFastPayMethod,
  type ReadPayMethod,
} from "../purchaseUtils";

type ReadConfirmSummaryProps = {
  episode: unknown;
  settings: any;
  confirmMethod: ReadPayMethod | null;
  confirmFastMethod: ReadFastPayMethod;
  confirmAmount: number | null;
  purchaseState: ReturnType<typeof getReadEpisodePurchaseState>;
};

export function ReadConfirmSummary({
  episode,
  settings,
  confirmMethod,
  confirmFastMethod,
  confirmAmount,
  purchaseState,
}: ReadConfirmSummaryProps) {
  const ep = episode as any;
  const { coinPrice, freecoinPrice } = getRegularEpisodePrices(ep);
  const { isEarlyAccess, fastTicketPrice, fastCoinPrice } = purchaseState;

  if (isEarlyAccess) {
    const regularPaymentIcon = confirmMethod === "freecoin"
      ? (settings?.freecoin || "/images/money-bag.png")
      : (settings?.coin || "/images/e-coin.png");
    const regularPaymentAmount = confirmMethod === "freecoin" ? freecoinPrice : coinPrice;
    const isCombinedCoinSummary = confirmFastMethod === "coin" && confirmMethod === "coin";
    const combinedCoinAmount = Number(fastCoinPrice ?? 0) + Number(regularPaymentAmount ?? 0);

    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
        <div className="text-xs font-medium text-gray-500 mb-2">สรุปราคา</div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-base font-semibold text-red-600">
          {isCombinedCoinSummary ? (
            <div className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-white px-4 py-1.5 text-amber-700 shadow-sm">
              <Image src={settings?.coin || "/images/e-coin.png"} alt="combined coin payment" width={16} height={16} unoptimized />
              <span>{combinedCoinAmount}</span>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-amber-100 text-amber-700">
                <Image src={confirmFastMethod === "fast_ticket" ? (settings?.fast_ticket || "/images/fast_ticket.png") : (settings?.coin || "/images/e-coin.png")} alt="early payment" width={16} height={16} unoptimized />
                <span>{confirmFastMethod === "fast_ticket" ? fastTicketPrice : fastCoinPrice}</span>
              </div>
              <span className="text-gray-400">+</span>
              <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-orange-100 text-orange-600">
                <Image src={regularPaymentIcon} alt="regular payment" width={16} height={16} unoptimized />
                <span>{regularPaymentAmount}</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm text-red-600 font-medium flex items-center justify-center gap-2">
      {confirmMethod === "freecoin" ? (
        <Image src={settings?.freecoin || "/images/money-bag.png"} alt="ถุงเงิน" width={18} height={18} unoptimized />
      ) : (
        <Image src={settings?.coin || "/images/e-coin.png"} alt="เหรียญ" width={18} height={18} unoptimized />
      )}
      <span>{confirmAmount != null ? confirmAmount : "---"}</span>
    </div>
  );
}
