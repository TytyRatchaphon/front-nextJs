import { Button, Modal, Radio } from "antd";
import { EpisodePurchaseRewardPreviewNotice } from "@/components/common/EpisodePurchaseRewardPreviewNotice";
import type { EpisodePurchaseRewardPreviewResult } from "@/services/api/episodePurchaseRewardApi";
import type { FastPaymentMethod, PaymentMethod } from "./BookInfoCard.types";
import {
  ConfirmSummary,
  CurrencyIcon,
  PaymentMethodSelector,
  type PurchaseModalSettings,
  type PurchaseSelectedSummary,
} from "./BookInfoCardPurchaseModalShared";

type BookInfoCardManualConfirmModalProps = {
  open: boolean;
  settings: PurchaseModalSettings;
  selectedSummary: PurchaseSelectedSummary;
  payWith: PaymentMethod;
  fastPayWith: FastPaymentMethod;
  buyLoading: boolean;
  rewardPreviewLoading: boolean;
  rewardPreview: EpisodePurchaseRewardPreviewResult | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  onPayWithChange: (value: PaymentMethod) => void;
  onFastPayWithChange: (value: FastPaymentMethod) => void;
};

export default function BookInfoCardManualConfirmModal({
  open,
  settings,
  selectedSummary,
  payWith,
  fastPayWith,
  buyLoading,
  rewardPreviewLoading,
  rewardPreview,
  onClose,
  onConfirm,
  onPayWithChange,
  onFastPayWithChange,
}: BookInfoCardManualConfirmModalProps) {
  return (
    <Modal
      title="ยืนยันการซื้อ"
      open={open}
      onCancel={onClose}
      zIndex={2100}
      centered
      footer={null}
      width={400}
    >
      <div className="flex flex-col gap-4 py-4">
        <div className="text-center text-base text-gray-800">
          คุณต้องการซื้อตอนที่เลือกไว้หรือไม่?
        </div>
        <div className="text-center">
          ตอนที่เลือก: <b>{selectedSummary.count} ตอน</b>
        </div>
        <ConfirmSummary
          selectedSummary={selectedSummary}
          payWith={payWith}
          fastPayWith={fastPayWith}
          settings={settings}
        />
        <EpisodePurchaseRewardPreviewNotice loading={rewardPreviewLoading} preview={rewardPreview} />

        {selectedSummary.hasEarlyAccess ? (
          <div className="space-y-3">
            <div>
              <div className="mb-2 text-center text-xs font-medium text-gray-500">ชำระราคาตอนปกติ</div>
              <div className="flex justify-center">
                <PaymentMethodSelector
                  payWith={payWith}
                  settings={settings}
                  canUseCoin={selectedSummary.canUseCoin}
                  canUseFreecoin={selectedSummary.canUseFreecoin}
                  onChange={onPayWithChange}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 text-center text-xs font-medium text-gray-500">ชำระส่วนตอนล่วงหน้า</div>
              <div className="flex justify-center">
                <Radio.Group value={fastPayWith} onChange={(event) => onFastPayWithChange(event.target.value)} buttonStyle="solid">
                  <Radio.Button value="coin" disabled={!selectedSummary.canUseFastCoin}>
                    <div className="flex items-center gap-1">
                      เหรียญ
                      <CurrencyIcon src={settings?.coin || "/images/e-coin.png"} alt="coin" />
                    </div>
                  </Radio.Button>
                  <Radio.Button value="fast_ticket" disabled={!selectedSummary.canUseFastTicket}>
                    <div className="flex items-center gap-1">
                      FastTicket
                      <CurrencyIcon src={settings?.fast_ticket || "/images/fast_ticket.png"} alt="fast" />
                    </div>
                  </Radio.Button>
                </Radio.Group>
              </div>
            </div>
          </div>
        ) : (selectedSummary.canUseCoin || selectedSummary.canUseFreecoin) && (
          <div className="mt-2 flex justify-center">
            <PaymentMethodSelector
              payWith={payWith}
              settings={settings}
              canUseCoin={selectedSummary.canUseCoin}
              canUseFreecoin={selectedSummary.canUseFreecoin}
              onChange={onPayWithChange}
            />
          </div>
        )}

        <div className="mt-4 flex justify-center gap-3">
          <Button onClick={onClose} className="w-1/2 !bg-white !text-red-600 hover:!border-red-600">
            ยกเลิก
          </Button>
          <Button
            type="primary"
            danger
            loading={buyLoading || rewardPreviewLoading}
            disabled={rewardPreviewLoading}
            className="w-1/2 !bg-red-600"
            onClick={onConfirm}
          >
            ยืนยัน
          </Button>
        </div>
      </div>
    </Modal>
  );
}
