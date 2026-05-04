"use client";

import Image from "next/image";
import { Button, Modal, Space } from "antd";
import { EpisodePurchaseRewardPreviewNotice } from "@/components/common/EpisodePurchaseRewardPreviewNotice";
import type { EpisodePurchaseRewardPreviewResult } from "@/services/api/episodePurchaseRewardApi";

import {
  getReadConfirmButtonLabel,
  getRegularEpisodePrices,
  type ReadFastPayMethod,
  type ReadPayMethod,
} from "../purchaseUtils";
import { ReadConfirmSummary } from "./ReadConfirmSummary";

type ReadConfirmPurchaseModalProps = {
  open: boolean;
  onClose: () => void;
  displayTitle?: string | null;
  episode: unknown;
  settings: any;
  confirmMethod: ReadPayMethod | null;
  setConfirmMethod: (method: ReadPayMethod | null) => void;
  confirmFastMethod: ReadFastPayMethod;
  setConfirmFastMethod: (method: ReadFastPayMethod) => void;
  confirmAmount: number | null;
  setConfirmAmount: (amount: number | null) => void;
  purchaseState: any;
  buyLoading: boolean;
  rewardPreview?: EpisodePurchaseRewardPreviewResult | null;
  rewardPreviewLoading?: boolean;
  cancelHover: boolean;
  setCancelHover: (hover: boolean) => void;
  handleBuy: (method: ReadPayMethod, fastMethod?: ReadFastPayMethod) => void;
};

export function ReadConfirmPurchaseModal({
  open,
  onClose,
  displayTitle,
  episode,
  settings,
  confirmMethod,
  setConfirmMethod,
  confirmFastMethod,
  setConfirmFastMethod,
  confirmAmount,
  setConfirmAmount,
  purchaseState,
  buyLoading,
  rewardPreview = null,
  rewardPreviewLoading = false,
  cancelHover,
  setCancelHover,
  handleBuy,
}: ReadConfirmPurchaseModalProps) {
  const ep = episode as any;
  const regularPrices = getRegularEpisodePrices(ep);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<div className="text-center text-lg font-medium">ยืนยันการซื้อ</div>}
      zIndex={2000}
      footer={[
        <Button
          key="cancel"
          onClick={onClose}
          disabled={buyLoading}
          className="transition-colors"
          onMouseEnter={() => setCancelHover(true)}
          onMouseLeave={() => setCancelHover(false)}
          style={{ borderColor: cancelHover ? "#dc2626" : "transparent", color: cancelHover ? "#dc2626" : undefined }}
        >
          ยกเลิก
        </Button>,
        <Button
          key="confirm"
          type="primary"
          danger
          loading={buyLoading || rewardPreviewLoading}
          disabled={rewardPreviewLoading}
          onClick={() => {
            if (confirmMethod) handleBuy(confirmMethod, confirmFastMethod);
          }}
        >
          {getReadConfirmButtonLabel(confirmMethod, confirmFastMethod, purchaseState)}
        </Button>,
      ]}
    >
      <div className="space-y-2 text-center">
        <div className="text-base font-semibold text-gray-700">{displayTitle || "ตอนนี้"}</div>
        <ReadConfirmSummary
          episode={episode}
          settings={settings}
          confirmMethod={confirmMethod}
          confirmFastMethod={confirmFastMethod}
          confirmAmount={confirmAmount}
          purchaseState={purchaseState}
        />
        <EpisodePurchaseRewardPreviewNotice
          loading={rewardPreviewLoading}
          preview={rewardPreview}
        />
        {purchaseState.isEarlyAccess && (
          <div className="space-y-3 pt-2">
            <div>
              <div className="mb-2 text-center text-xs font-medium text-gray-500">ชำระส่วนตอนล่วงหน้า</div>
              <div className="flex justify-center">
                <Space.Compact>
                  <Button type={confirmFastMethod === "coin" ? "primary" : "default"} onClick={() => setConfirmFastMethod("coin")}>
                    เหรียญ <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={14} height={14} unoptimized />
                  </Button>
                  <Button
                    type={confirmFastMethod === "fast_ticket" ? "primary" : "default"}
                    onClick={() => setConfirmFastMethod("fast_ticket")}
                    disabled={!purchaseState.canFastTicket}
                  >
                    FastTicket <Image src={settings?.fast_ticket || "/images/fast_ticket.png"} alt="fast ticket" width={14} height={14} unoptimized />
                  </Button>
                </Space.Compact>
              </div>
            </div>
            <div>
              <div className="mb-2 text-center text-xs font-medium text-gray-500">ชำระราคาตอนปกติ</div>
              <div className="flex justify-center">
                <Space.Compact>
                  <Button
                    type={confirmMethod === "coin" ? "primary" : "default"}
                    onClick={() => {
                      setConfirmMethod("coin");
                      setConfirmAmount(regularPrices.coinPrice);
                    }}
                  >
                    เหรียญ <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={14} height={14} unoptimized />
                  </Button>
                  <Button
                    type={confirmMethod === "freecoin" ? "primary" : "default"}
                    onClick={() => {
                      setConfirmMethod("freecoin");
                      setConfirmAmount(regularPrices.freecoinPrice);
                    }}
                    disabled={!purchaseState.canUseFreecoin}
                  >
                    ถุงเงิน <Image src={settings?.freecoin || "/images/money-bag.png"} alt="freecoin" width={14} height={14} unoptimized />
                  </Button>
                </Space.Compact>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
