import { useState } from "react";
import { Alert, Button, Modal, Radio, Spin } from "antd";
import { EpisodePurchaseRewardPreviewNotice } from "@/components/common/EpisodePurchaseRewardPreviewNotice";
import type {
  FullBookCouponOption,
  FullBookPurchaseOptionsData,
  FullBookPurchasePreviewData,
} from "@/services/api/bookApi";
import type { EpisodePurchaseRewardPreviewResult } from "@/services/api/episodePurchaseRewardApi";
import type { PaymentMethod } from "./BookInfoCard.types";
import { CurrencyIcon, type PurchaseModalSettings } from "./BookInfoCardPurchaseModalShared";

type BookInfoCardBuyAllConfirmModalProps = {
  book: {
    use_freecoin?: number | null;
    end?: string | null;
  };
  open: boolean;
  settings: PurchaseModalSettings;
  buyAllIds: number[];
  buyAllTotal: number;
  buyAllFastTicketCount: number;
  bulkPurchaseMode: "all" | "early";
  hasEarlyAccessEpisodes: boolean;
  payWith: PaymentMethod;
  buyLoading: boolean;
  rewardPreviewLoading: boolean;
  rewardPreview: EpisodePurchaseRewardPreviewResult | null;
  fullBookOptions: FullBookPurchaseOptionsData | null;
  fullBookPreview: FullBookPurchasePreviewData | null;
  fullBookCoupons: FullBookCouponOption[];
  selectedFullBookCouponId: number | null;
  fullBookOptionsLoading: boolean;
  fullBookPreviewLoading: boolean;
  fullBookOptionsError: string | null;
  fullBookPreviewError: string | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  onPayWithChange: (value: PaymentMethod) => void;
  onFullBookCouponChange: (value: number | null) => void;
};

const formatAmount = (amount?: number | null) => Number(amount || 0).toLocaleString();

export default function BookInfoCardBuyAllConfirmModal({
  book,
  open,
  settings,
  buyAllIds,
  buyAllTotal,
  buyAllFastTicketCount,
  bulkPurchaseMode,
  hasEarlyAccessEpisodes,
  payWith,
  buyLoading,
  rewardPreviewLoading,
  rewardPreview,
  fullBookOptions,
  fullBookPreview,
  fullBookCoupons,
  selectedFullBookCouponId,
  fullBookOptionsLoading,
  fullBookPreviewLoading,
  fullBookOptionsError,
  fullBookPreviewError,
  onClose,
  onConfirm,
  onPayWithChange,
  onFullBookCouponChange,
}: BookInfoCardBuyAllConfirmModalProps) {
  const [couponPickerOpen, setCouponPickerOpen] = useState(false);
  const isFullBookMode = bulkPurchaseMode === "all";
  const paymentMethods = fullBookOptions?.payment_methods || [];
  const canUseCoin = !isFullBookMode || paymentMethods.length === 0 || paymentMethods.includes("coin");
  const canUseFreecoin = isFullBookMode
    ? paymentMethods.includes("freecoin")
    : book.use_freecoin === 1 && buyAllFastTicketCount === 0;
  const displayedEpisodeCount = fullBookPreview?.episode_count || fullBookOptions?.episode_count || buyAllIds.length;
  const displayedTotal = fullBookPreview?.final_paid_price ?? fullBookOptions?.final_paid_price ?? buyAllTotal;
  const displayedOriginPrice = fullBookPreview?.origin_price ?? fullBookOptions?.origin_price ?? buyAllTotal;
  const selectedCoupon = fullBookPreview?.coupon
    || fullBookCoupons.find((coupon) => coupon.user_coupon_id === selectedFullBookCouponId)
    || null;
  const selectedCouponDiscountAmount = selectedCoupon
    ? fullBookPreview?.final_discount_amount ?? selectedCoupon.estimated_discount_amount ?? null
    : null;
  const selectedCouponFinalPrice = selectedCoupon
    ? fullBookPreview?.final_paid_price ?? selectedCoupon.estimated_final_price ?? null
    : null;
  const confirmDisabled = isFullBookMode
    ? Boolean(fullBookOptionsLoading || fullBookPreviewLoading || fullBookOptionsError || fullBookPreviewError || !fullBookPreview?.can_purchase)
    : rewardPreviewLoading;

  return (
    <>
    <Modal
      title="ยืนยันการซื้อ"
      open={open}
      onCancel={onClose}
      zIndex={2100}
      centered
      footer={null}
      width={440}
    >
      <div className="flex flex-col gap-4 py-4">
        <div className="text-center text-base text-gray-800">
          {bulkPurchaseMode === "early" ? "คุณต้องการซื้อเฉพาะตอนล่วงหน้าหรือไม่?" : "คุณต้องการซื้อทั้งเล่มหรือไม่?"}
        </div>

        <div className="text-center">
          ตอนที่ต้องซื้อ: <b>{displayedEpisodeCount} ตอน</b>
        </div>

        <div className="flex items-center justify-center gap-2 text-center">
          ยอดสุทธิ: <b className="text-xl text-red-600">{formatAmount(displayedTotal)}</b>
          <CurrencyIcon
            src={payWith === "freecoin" ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")}
            alt="currency"
            size={20}
          />
        </div>

        {isFullBookMode && displayedOriginPrice > displayedTotal && (
          <div className="text-center text-xs text-gray-500">
            จากราคาเต็ม <span className="line-through">{formatAmount(displayedOriginPrice)}</span>
            {selectedCoupon ? <span className="ml-1 text-red-600">ใช้คูปอง {selectedCoupon.name}</span> : null}
          </div>
        )}

        {isFullBookMode ? (
          <>
            {(fullBookOptionsLoading || fullBookPreviewLoading) && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-3 text-sm text-gray-500">
                <Spin size="small" />
                กำลังคำนวณราคา
              </div>
            )}
            {(fullBookOptionsError || fullBookPreviewError) && (
              <Alert type="error" showIcon message={fullBookOptionsError || fullBookPreviewError} />
            )}
            {fullBookPreview && !fullBookPreview.can_purchase && !fullBookPreviewError && (
              <Alert type="warning" showIcon message="ยอดเงินไม่พอ หรือยังไม่สามารถซื้อทั้งเล่มได้" />
            )}
          </>
        ) : (
          <EpisodePurchaseRewardPreviewNotice loading={rewardPreviewLoading} preview={rewardPreview} />
        )}

        {buyAllFastTicketCount > 0 && (
          <div className="flex items-center justify-center gap-2 text-center text-amber-700">
            ต้องใช้ FastTicket <b>{buyAllFastTicketCount}</b>
            <CurrencyIcon src={settings?.fast_ticket || "/images/fast_ticket.png"} alt="fast ticket" size={18} />
          </div>
        )}

        {(isFullBookMode || book.use_freecoin === 1 || buyAllFastTicketCount > 0) && (
          <div className="mt-2 flex justify-center">
            <Radio.Group
              value={payWith}
              onChange={(event) => onPayWithChange(event.target.value)}
              buttonStyle="solid"
              className="book-buy-payment-methods"
            >
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
              {!isFullBookMode && (
                <Radio.Button value="fast_ticket" disabled={buyAllFastTicketCount === 0}>
                  <div className="flex items-center gap-1">
                    FastTicket
                    <CurrencyIcon src={settings?.fast_ticket || "/images/fast_ticket.png"} alt="fast" />
                  </div>
                </Radio.Button>
              )}
            </Radio.Group>
          </div>
        )}

        {isFullBookMode && (fullBookCoupons.length > 0 || selectedCoupon) && (
          <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white via-red-50/40 to-white p-3">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-gray-900">คูปองส่วนลดทั้งเล่ม</div>
                <div className="text-xs text-gray-500">เลือกใช้คูปองได้ในหน้าถัดไป</div>
              </div>
              {fullBookCoupons.length > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
                  ใช้ได้ {fullBookCoupons.length}
                </span>
              )}
            </div>

            <div className="rounded-xl border border-white bg-white/90 p-3 shadow-sm">
              {selectedCoupon ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="line-clamp-1 text-sm font-bold text-gray-900">{selectedCoupon.name}</span>
                      {selectedCoupon.discount_percent ? (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                          -{formatAmount(selectedCoupon.discount_percent)}%
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      ลด {formatAmount(selectedCouponDiscountAmount)} เหรียญ - จ่ายสุทธิ {formatAmount(selectedCouponFinalPrice)} เหรียญ
                    </div>
                  </div>
                  <Button size="small" onClick={() => setCouponPickerOpen(true)}>
                    เปลี่ยน
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-gray-900">ยังไม่ใช้คูปอง</div>
                    <div className="text-xs text-gray-500">ราคาปกติ {formatAmount(displayedOriginPrice)} เหรียญ</div>
                  </div>
                  <Button
                    size="small"
                    type="primary"
                    danger
                    disabled={fullBookCoupons.length === 0}
                    onClick={() => setCouponPickerOpen(true)}
                  >
                    เลือกใช้คูปอง
                  </Button>
                </div>
              )}
            </div>

          </div>
        )}

        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-gray-700">
          {bulkPurchaseMode === "early" ? (
            <p>
              <span className="font-bold text-red-700">ซื้อตอนล่วงหน้า:</span> ระบบจะคำนวณเฉพาะตอนล่วงหน้าที่สามารถซื้อได้ในขณะนี้เท่านั้น
            </p>
          ) : (
            <>
              {book.end === "end" ? (
                <p className="mb-1">
                  <span className="font-bold text-red-700">ซื้อทั้งเล่ม:</span> คุณจะได้รับสิทธิ์เข้าถึงทุกตอนที่ยังไม่เคยซื้อ โดย backend เป็นผู้คำนวณราคาสุดท้าย
                </p>
              ) : (
                <p className="mb-1">
                  <span className="font-bold text-red-700">ผลงานยังไม่จบ:</span> ราคานี้รวมเฉพาะตอนที่ซื้อได้ ณ ตอนนี้ ไม่รวมตอนที่จะอัปเดตเพิ่มในอนาคต
                </p>
              )}
              {hasEarlyAccessEpisodes && (
                <p className="mt-1 font-bold text-amber-700">
                  * ซื้อทั้งเล่มไม่รวมตอนล่วงหน้า
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <Button onClick={onClose} className="w-1/2 !bg-white !text-red-600 hover:!border-red-600">
            ยกเลิก
          </Button>
          <Button
            type="primary"
            danger
            loading={buyLoading || rewardPreviewLoading || fullBookPreviewLoading}
            disabled={confirmDisabled}
            className="w-1/2 !bg-red-600"
            onClick={onConfirm}
          >
            ยืนยัน
          </Button>
        </div>
      </div>
    </Modal>

    <style jsx global>{`
      .book-buy-payment-methods {
        display: grid !important;
        width: 100%;
        max-width: 360px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .book-buy-payment-methods .ant-radio-button-wrapper {
        display: flex !important;
        height: 44px !important;
        align-items: center !important;
        justify-content: center !important;
        border: 1px solid #e5e7eb !important;
        border-inline-start-width: 1px !important;
        border-radius: 10px !important;
        padding-inline: 8px !important;
        font-size: 14px !important;
        line-height: 1.2 !important;
        white-space: nowrap !important;
      }

      .book-buy-payment-methods .ant-radio-button-wrapper::before {
        display: none !important;
      }

      .book-buy-payment-methods .ant-radio-button-wrapper > span:not(.ant-radio-button) {
        display: flex;
        min-width: 0;
        align-items: center;
        justify-content: center;
      }

      @media (max-width: 380px) {
        .book-buy-payment-methods {
          max-width: 260px;
          grid-template-columns: 1fr;
        }
      }
    `}</style>

    <Modal
      title="เลือกคูปองส่วนลด"
      open={couponPickerOpen}
      onCancel={() => setCouponPickerOpen(false)}
      footer={null}
      centered
      zIndex={2200}
      width={520}
    >
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => {
            onFullBookCouponChange(null);
            setCouponPickerOpen(false);
          }}
          className={`w-full rounded-2xl border p-3 text-left transition ${
            selectedFullBookCouponId === null
              ? "border-red-400 bg-red-50 shadow-sm"
              : "border-gray-100 bg-white hover:border-red-200 hover:bg-red-50/40"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-gray-900">ไม่ใช้คูปอง</div>
              <div className="text-xs text-gray-500">จ่ายราคาปกติ {formatAmount(displayedOriginPrice)} เหรียญ</div>
            </div>
            {selectedFullBookCouponId === null && (
              <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">กำลังใช้</span>
            )}
          </div>
        </button>

        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {fullBookCoupons.map((coupon) => {
            const isSelected = selectedFullBookCouponId === coupon.user_coupon_id;
            return (
              <button
                key={coupon.user_coupon_id}
                type="button"
                onClick={() => {
                  onFullBookCouponChange(coupon.user_coupon_id);
                  setCouponPickerOpen(false);
                }}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? "border-red-400 bg-red-50 shadow-sm ring-2 ring-red-100"
                    : "border-gray-100 bg-white hover:border-red-200 hover:bg-red-50/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="line-clamp-1 text-sm font-bold text-gray-900">{coupon.name}</span>
                      {coupon.discount_percent ? (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                          -{formatAmount(coupon.discount_percent)}%
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      ลด {formatAmount(coupon.estimated_discount_amount)} เหรียญ จากราคาเต็ม {formatAmount(displayedOriginPrice)} เหรียญ
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-[11px] text-gray-400">จ่ายสุทธิ</div>
                    <div className="text-lg font-extrabold text-red-600">
                      {formatAmount(coupon.estimated_final_price)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {fullBookCoupons.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            ไม่มีคูปองที่ใช้ได้กับเล่มนี้
          </div>
        )}
      </div>
    </Modal>
    </>
  );
}
