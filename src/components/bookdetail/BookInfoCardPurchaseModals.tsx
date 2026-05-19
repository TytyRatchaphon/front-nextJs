"use client";

import type { EpisodePurchaseRewardPreviewResult } from "@/services/api/episodePurchaseRewardApi";
import type {
  FullBookCouponOption,
  FullBookPurchaseOptionsData,
  FullBookPurchasePreviewData,
} from "@/services/api/bookApi";
import type { EpisodeGroup } from "@/types/api";
import type { FastPaymentMethod, PaymentMethod } from "./BookInfoCard.types";
import BookInfoCardBuyAllConfirmModal from "./BookInfoCardBuyAllConfirmModal";
import BookInfoCardEpisodeSelectionModal from "./BookInfoCardEpisodeSelectionModal";
import BookInfoCardManualConfirmModal from "./BookInfoCardManualConfirmModal";
import type {
  PurchaseModalSettings,
  PurchaseSelectedSummary,
} from "./BookInfoCardPurchaseModalShared";

type BookInfoCardPurchaseModalsProps = {
  book: {
    use_freecoin?: number | null;
    end?: string | null;
  };
  settings: PurchaseModalSettings;
  isSelectionOpen: boolean;
  isFetchingEpisodes: boolean;
  selectionModalMode: "all" | "early";
  episodesData?: { groups: EpisodeGroup[] };
  expandedGroups: Record<string, boolean>;
  selectedEpisodeIds: number[];
  selectedSummary: PurchaseSelectedSummary;
  allSelectableIds: number[];
  allSelected: boolean;
  payWith: PaymentMethod;
  fastPayWith: FastPaymentMethod;
  manualConfirmOpen: boolean;
  manualRewardPreviewLoading: boolean;
  manualRewardPreview: EpisodePurchaseRewardPreviewResult | null;
  buyAllConfirmOpen: boolean;
  buyAllIds: number[];
  buyAllTotal: number;
  buyAllFastTicketCount: number;
  buyAllRewardPreviewLoading: boolean;
  buyAllRewardPreview: EpisodePurchaseRewardPreviewResult | null;
  fullBookOptions: FullBookPurchaseOptionsData | null;
  fullBookPreview: FullBookPurchasePreviewData | null;
  fullBookCoupons: FullBookCouponOption[];
  selectedFullBookCouponId: number | null;
  fullBookOptionsLoading: boolean;
  fullBookPreviewLoading: boolean;
  fullBookOptionsError: string | null;
  fullBookPreviewError: string | null;
  bulkPurchaseMode: "all" | "early";
  buyLoading: boolean;
  hasEarlyAccessEpisodes: boolean;
  onCloseSelection: () => void;
  onToggleSelectAll: () => void;
  onOpenManualConfirm: () => void;
  onToggleGroup: (groupId: string | number) => void;
  onToggleGroupSelect: (group: EpisodeGroup) => void;
  onToggleEpisode: (episodeId: number | string) => void;
  onCloseManualConfirm: () => void;
  onConfirmManualPurchase: () => void | Promise<void>;
  onCloseBuyAllConfirm: () => void;
  onConfirmBuyAllPurchase: () => void | Promise<void>;
  onPayWithChange: (value: PaymentMethod) => void;
  onFullBookCouponChange: (value: number | null) => void;
  onFastPayWithChange: (value: FastPaymentMethod) => void;
  getEpisodesForSelectionMode: (group: EpisodeGroup) => any[];
  getProgressiveSelectableIds: (episodes: any[], seedSelection?: readonly number[]) => number[];
  canEpisodePayWithFreecoin: (episode: any) => boolean;
  isEpisodeSequentiallyUnlocked: (episode: any) => boolean;
  isEpisodeBaseSelectable: (episode: any) => boolean;
  formatFreeUntil: (endDate?: string | null) => string | null;
};

export default function BookInfoCardPurchaseModals({
  book,
  settings,
  isSelectionOpen,
  isFetchingEpisodes,
  selectionModalMode,
  episodesData,
  expandedGroups,
  selectedEpisodeIds,
  selectedSummary,
  allSelectableIds,
  allSelected,
  payWith,
  fastPayWith,
  manualConfirmOpen,
  manualRewardPreviewLoading,
  manualRewardPreview,
  buyAllConfirmOpen,
  buyAllIds,
  buyAllTotal,
  buyAllFastTicketCount,
  buyAllRewardPreviewLoading,
  buyAllRewardPreview,
  fullBookOptions,
  fullBookPreview,
  fullBookCoupons,
  selectedFullBookCouponId,
  fullBookOptionsLoading,
  fullBookPreviewLoading,
  fullBookOptionsError,
  fullBookPreviewError,
  bulkPurchaseMode,
  buyLoading,
  hasEarlyAccessEpisodes,
  onCloseSelection,
  onToggleSelectAll,
  onOpenManualConfirm,
  onToggleGroup,
  onToggleGroupSelect,
  onToggleEpisode,
  onCloseManualConfirm,
  onConfirmManualPurchase,
  onCloseBuyAllConfirm,
  onConfirmBuyAllPurchase,
  onPayWithChange,
  onFullBookCouponChange,
  onFastPayWithChange,
  getEpisodesForSelectionMode,
  getProgressiveSelectableIds,
  canEpisodePayWithFreecoin,
  isEpisodeSequentiallyUnlocked,
  isEpisodeBaseSelectable,
  formatFreeUntil,
}: BookInfoCardPurchaseModalsProps) {
  return (
    <>
      <BookInfoCardEpisodeSelectionModal
        open={isSelectionOpen}
        settings={settings}
        isFetchingEpisodes={isFetchingEpisodes}
        selectionModalMode={selectionModalMode}
        episodesData={episodesData}
        expandedGroups={expandedGroups}
        selectedEpisodeIds={selectedEpisodeIds}
        selectedSummary={selectedSummary}
        allSelectableIds={allSelectableIds}
        allSelected={allSelected}
        payWith={payWith}
        onClose={onCloseSelection}
        onToggleSelectAll={onToggleSelectAll}
        onOpenManualConfirm={onOpenManualConfirm}
        onToggleGroup={onToggleGroup}
        onToggleGroupSelect={onToggleGroupSelect}
        onToggleEpisode={onToggleEpisode}
        getEpisodesForSelectionMode={getEpisodesForSelectionMode}
        getProgressiveSelectableIds={getProgressiveSelectableIds}
        canEpisodePayWithFreecoin={canEpisodePayWithFreecoin}
        isEpisodeSequentiallyUnlocked={isEpisodeSequentiallyUnlocked}
        isEpisodeBaseSelectable={isEpisodeBaseSelectable}
        formatFreeUntil={formatFreeUntil}
      />

      <BookInfoCardManualConfirmModal
        open={manualConfirmOpen}
        settings={settings}
        selectedSummary={selectedSummary}
        payWith={payWith}
        fastPayWith={fastPayWith}
        buyLoading={buyLoading}
        rewardPreviewLoading={manualRewardPreviewLoading}
        rewardPreview={manualRewardPreview}
        onClose={onCloseManualConfirm}
        onConfirm={onConfirmManualPurchase}
        onPayWithChange={onPayWithChange}
        onFastPayWithChange={onFastPayWithChange}
      />

      <BookInfoCardBuyAllConfirmModal
        book={book}
        open={buyAllConfirmOpen}
        settings={settings}
        buyAllIds={buyAllIds}
        buyAllTotal={buyAllTotal}
        buyAllFastTicketCount={buyAllFastTicketCount}
        bulkPurchaseMode={bulkPurchaseMode}
        hasEarlyAccessEpisodes={hasEarlyAccessEpisodes}
        payWith={payWith}
        buyLoading={buyLoading}
        rewardPreviewLoading={buyAllRewardPreviewLoading}
        rewardPreview={buyAllRewardPreview}
        fullBookOptions={fullBookOptions}
        fullBookPreview={fullBookPreview}
        fullBookCoupons={fullBookCoupons}
        selectedFullBookCouponId={selectedFullBookCouponId}
        fullBookOptionsLoading={fullBookOptionsLoading}
        fullBookPreviewLoading={fullBookPreviewLoading}
        fullBookOptionsError={fullBookOptionsError}
        fullBookPreviewError={fullBookPreviewError}
        onClose={onCloseBuyAllConfirm}
        onConfirm={onConfirmBuyAllPurchase}
        onPayWithChange={onPayWithChange}
        onFullBookCouponChange={onFullBookCouponChange}
      />
    </>
  );
}
