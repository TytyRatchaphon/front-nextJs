import { Button, Modal, Radio } from "antd";
import type { PaymentMethod } from "./BookInfoCard.types";
import { CurrencyIcon, type PurchaseModalSettings } from "./BookInfoCardPurchaseModalShared";

type BookInfoCardPromotionConfirmModalProps = {
  book: {
    use_freecoin?: number | null;
  };
  open: boolean;
  settings: PurchaseModalSettings;
  promotion: {
    title: string;
    price: number;
  } | null;
  payWith: PaymentMethod;
  buyLoading: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  onPayWithChange: (value: PaymentMethod) => void;
};

const formatAmount = (amount?: number | null) => Number(amount || 0).toLocaleString();

export default function BookInfoCardPromotionConfirmModal({
  book,
  open,
  settings,
  promotion,
  payWith,
  buyLoading,
  onClose,
  onConfirm,
  onPayWithChange,
}: BookInfoCardPromotionConfirmModalProps) {
  const canUseFreecoin = book.use_freecoin === 1;

  if (!promotion) return null;

  return (
    <>
      <Modal
        title={null}
        open={open}
        onCancel={buyLoading ? undefined : onClose}
        footer={null}
        closable={!buyLoading}
        maskClosable={!buyLoading}
        centered
        width={400}
        zIndex={2100}
      >
        <div className="pt-2">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการซื้อโปรโมชั่น</h3>
            <p className="text-gray-600">
              คุณต้องการซื้อโปรโมชั่น <br />
              <span className="font-semibold text-red-600">&quot;{promotion?.title}&quot;</span> <br />
              หรือไม่?
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">ราคาโปรโมชั่น</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-red-600">
                  {formatAmount(promotion?.price)}
                </span>
                <CurrencyIcon src={payWith === "freecoin" ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")} alt={payWith} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                เลือกช่องทางการชำระเงิน
              </div>
              <Radio.Group
                value={payWith}
                onChange={(e) => onPayWithChange(e.target.value)}
                className="book-buy-payment-methods-promo w-full"
                disabled={buyLoading}
              >
                <Radio.Button value="coin" className="flex-1">
                  <div className="flex items-center justify-center gap-1.5 w-full">
                    <CurrencyIcon src={settings?.coin || "/images/e-coin.png"} alt="coin" />
                    <span>เหรียญ</span>
                  </div>
                </Radio.Button>

                <Radio.Button value="freecoin" disabled={!canUseFreecoin} className="flex-1">
                  <div className="flex items-center justify-center gap-1.5 w-full">
                    <CurrencyIcon src={settings?.freecoin || "/images/money-bag.png"} alt="freecoin" />
                    <span>ถุงเงิน</span>
                  </div>
                </Radio.Button>
              </Radio.Group>
              {!canUseFreecoin && (
                <div className="text-[10px] text-gray-400 text-center mt-1">
                  เรื่องนี้ไม่สามารถใช้ถุงเงินได้
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-4">
            <Button onClick={onClose} disabled={buyLoading} className="w-1/2 !bg-white !text-red-600 hover:!border-red-600 h-11 rounded-xl font-medium">
              ยกเลิก
            </Button>
            <Button
              type="primary"
              danger
              loading={buyLoading}
              className="w-1/2 !bg-red-600 h-11 rounded-xl font-medium"
              onClick={onConfirm}
            >
              ยืนยัน
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .book-buy-payment-methods-promo {
          display: flex !important;
          width: 100%;
          gap: 8px;
        }

        .book-buy-payment-methods-promo .ant-radio-button-wrapper {
          display: flex !important;
          flex: 1;
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

        .book-buy-payment-methods-promo .ant-radio-button-wrapper::before {
          display: none !important;
        }

        .book-buy-payment-methods-promo .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
          border-color: #ef4444 !important;
          background-color: #fef2f2 !important;
          color: #dc2626 !important;
        }

        .book-buy-payment-methods-promo .ant-radio-button-wrapper > span:not(.ant-radio-button) {
          display: flex;
          min-width: 0;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
      `}</style>
    </>
  );
}
