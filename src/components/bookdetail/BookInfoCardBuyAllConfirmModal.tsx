import { Button, Modal, Radio } from "antd";
import { EpisodePurchaseRewardPreviewNotice } from "@/components/common/EpisodePurchaseRewardPreviewNotice";
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
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  onPayWithChange: (value: PaymentMethod) => void;
};

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
  onClose,
  onConfirm,
  onPayWithChange,
}: BookInfoCardBuyAllConfirmModalProps) {
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
          {bulkPurchaseMode === "early" ? "คุณต้องการซื้อเฉพาะตอนล่วงหน้าหรือไม่?" : "คุณต้องการซื้อทั้งเรื่องหรือไม่?"}
        </div>
        <div className="text-center">
          ตอนที่ต้องซื้อ: <b>{buyAllIds.length} ตอน</b>
        </div>
        <div className="flex items-center justify-center gap-2 text-center">
          รวมยอด: <b className="text-xl text-red-600">{buyAllTotal.toLocaleString()}</b>
          <CurrencyIcon
            src={payWith === "freecoin" ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")}
            alt="currency"
            size={20}
          />
        </div>
        <EpisodePurchaseRewardPreviewNotice loading={rewardPreviewLoading} preview={rewardPreview} />

        {buyAllFastTicketCount > 0 && (
          <div className="flex items-center justify-center gap-2 text-center text-amber-700">
            ต้องใช้ FastTicket <b>{buyAllFastTicketCount}</b>
            <CurrencyIcon src={settings?.fast_ticket || "/images/fast_ticket.png"} alt="fast ticket" size={18} />
          </div>
        )}

        {(book.use_freecoin === 1 || buyAllFastTicketCount > 0) && (
          <div className="mt-2 flex justify-center">
            <Radio.Group value={payWith} onChange={(event) => onPayWithChange(event.target.value)} buttonStyle="solid">
              <Radio.Button value="coin">
                <div className="flex items-center gap-1">
                  เหรียญ
                  <CurrencyIcon src={settings?.coin || "/images/e-coin.png"} alt="coin" />
                </div>
              </Radio.Button>
              <Radio.Button value="freecoin" disabled={buyAllFastTicketCount > 0}>
                <div className="flex items-center gap-1">
                  ถุงเงิน
                  <CurrencyIcon src={settings?.freecoin || "/images/money-bag.png"} alt="free" />
                </div>
              </Radio.Button>
              <Radio.Button value="fast_ticket" disabled={buyAllFastTicketCount === 0}>
                <div className="flex items-center gap-1">
                  FastTicket
                  <CurrencyIcon src={settings?.fast_ticket || "/images/fast_ticket.png"} alt="fast" />
                </div>
              </Radio.Button>
            </Radio.Group>
          </div>
        )}

        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-gray-700">
          {bulkPurchaseMode === "early" ? (
            <p>
              <span className="font-bold text-red-700">ซื้อตอนล่วงหน้า:</span> ระบบจะคำนวณเฉพาะตอนล่วงหน้าที่สามารถซื้อได้ในขณะนี้เท่านั้น และไม่รวมตอนปกติอื่น ๆ
            </p>
          ) : (
            <>
              {book.end === "end" ? (
                <p className="mb-1">
                  <span className="font-bold text-red-700">กรณีซื้อทั้งเรื่องที่สถานะจบ:</span> คุณจะได้รับสิทธิ์เข้าถึงทุกตอนที่ยังไม่เคยซื้อ โดยราคาจะคำนวณเฉพาะตอนที่ยังไม่เคยซื้อ
                </p>
              ) : (
                <p className="mb-1">
                  <span className="font-bold text-red-700">สำหรับผลงานที่ยังไม่จบ:</span> ราคาที่แสดงเป็นยอดรวมเฉพาะตอนล่าสุด ณ วันที่ทำรายการซื้อ ไม่รวมตอนที่จะอัปเดตเพิ่มในอนาคต
                </p>
              )}
              {hasEarlyAccessEpisodes && (
                <p className="mt-1 font-bold text-amber-700">
                  * เหมาทั้งเรื่อง ไม่ได้รวมตอนล่วงหน้า
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
