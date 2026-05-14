import Image from "next/image";
import { Radio } from "antd";
import type { FastPaymentMethod, PaymentMethod } from "./BookInfoCard.types";

export type PurchaseModalSettings = {
  coin?: string | null;
  freecoin?: string | null;
  fast_ticket?: string | null;
  rp?: string | null;
} | null | undefined;

export type PurchaseSelectedSummary = {
  count: number;
  total: number;
  fastTicketCount: number;
  hasEarlyAccess: boolean;
  fastTicketRequiredTotal: number;
  earlyAccessCoinTotal: number;
  baseCoinTotal: number;
  canUseCoin: boolean;
  canUseFreecoin: boolean;
  canUseFastCoin: boolean;
  canUseFastTicket: boolean;
};

export const CurrencyIcon = ({
  src,
  alt,
  size = 14,
}: {
  src: string;
  alt: string;
  size?: number;
}) => (
  <Image src={src} alt={alt} width={size} height={size} unoptimized />
);

export const ConfirmSummary = ({
  selectedSummary,
  payWith,
  fastPayWith,
  settings,
}: {
  selectedSummary: PurchaseSelectedSummary;
  payWith: PaymentMethod;
  fastPayWith: FastPaymentMethod;
  settings: PurchaseModalSettings;
}) => {
  if (!selectedSummary.hasEarlyAccess) {
    return (
      <div className="flex items-center justify-center gap-2 text-center">
        รวมยอด: <b className="text-xl text-red-600">{selectedSummary.total}</b>
        <CurrencyIcon
          src={payWith === "freecoin" ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")}
          alt="currency"
          size={20}
        />
      </div>
    );
  }

  const useFastTicket = fastPayWith === "fast_ticket";
  const fastPaymentTotal = useFastTicket
    ? selectedSummary.fastTicketRequiredTotal
    : selectedSummary.earlyAccessCoinTotal;

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
      <div className="mb-2 text-xs font-medium text-gray-500">สรุปราคา</div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-base font-semibold">
        <div className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-white px-3 py-1 text-orange-600">
          <CurrencyIcon
            src={payWith === "freecoin" ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")}
            alt="payment type"
            size={16}
          />
          <span>{selectedSummary.baseCoinTotal}</span>
        </div>
        {selectedSummary.baseCoinTotal > 0 && fastPaymentTotal > 0 && (
          <>
            <span className="text-gray-400">+</span>
            <div className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-white px-3 py-1 text-amber-700">
              <CurrencyIcon
                src={useFastTicket ? (settings?.fast_ticket || "/images/fast_ticket.png") : (settings?.coin || "/images/e-coin.png")}
                alt="early method"
                size={16}
              />
              <span>{fastPaymentTotal}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const PaymentMethodSelector = ({
  payWith,
  settings,
  canUseCoin = true,
  canUseFreecoin = true,
  onChange,
}: {
  payWith: PaymentMethod;
  settings: PurchaseModalSettings;
  canUseCoin?: boolean;
  canUseFreecoin?: boolean;
  onChange: (value: PaymentMethod) => void;
}) => (
  <Radio.Group value={payWith} onChange={(event) => onChange(event.target.value)} buttonStyle="solid">
    <Radio.Button value="coin" disabled={!canUseCoin}>
      <div className="flex items-center gap-1">
        เหรียญ
        <CurrencyIcon src={settings?.coin || "/images/e-coin.png"} alt="coin" />
      </div>
    </Radio.Button>
    <Radio.Button value="freecoin" disabled={!canUseFreecoin}>
      <div className="flex items-center gap-1">
        ถุงเงิน
        <CurrencyIcon src={settings?.freecoin || "/images/money-bag.png"} alt="free" />
      </div>
    </Radio.Button>
  </Radio.Group>
);
