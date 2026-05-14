import Image from "next/image";
import { Button, Checkbox, Modal } from "antd";
import GifLoader from "@/components/utility/GifLoader";
import { CountdownTimer as CommonCountdownTimer } from "@/components/common/CountdownTimer";
import type { EpisodeGroup } from "@/types/api";
import { MixedPriceSummary } from "./BookInfoCardPriceSummary";
import { getEarlyAccess, resolveEpisodePrice } from "./bookInfoCardPurchaseUtils";
import type { PaymentMethod } from "./BookInfoCard.types";
import {
  CurrencyIcon,
  type PurchaseModalSettings,
  type PurchaseSelectedSummary,
} from "./BookInfoCardPurchaseModalShared";

type BookInfoCardEpisodeSelectionModalProps = {
  open: boolean;
  settings: PurchaseModalSettings;
  isFetchingEpisodes: boolean;
  selectionModalMode: "all" | "early";
  episodesData?: { groups: EpisodeGroup[] };
  expandedGroups: Record<string, boolean>;
  selectedEpisodeIds: number[];
  selectedSummary: PurchaseSelectedSummary;
  allSelectableIds: number[];
  allSelected: boolean;
  payWith: PaymentMethod;
  onClose: () => void;
  onToggleSelectAll: () => void;
  onOpenManualConfirm: () => void;
  onToggleGroup: (groupId: string | number) => void;
  onToggleGroupSelect: (group: EpisodeGroup) => void;
  onToggleEpisode: (episodeId: number | string) => void;
  getEpisodesForSelectionMode: (group: EpisodeGroup) => any[];
  getProgressiveSelectableIds: (episodes: any[], seedSelection?: readonly number[]) => number[];
  canEpisodePayWithFreecoin: (episode: any) => boolean;
  isEpisodeSequentiallyUnlocked: (episode: any) => boolean;
  isEpisodeBaseSelectable: (episode: any) => boolean;
  formatFreeUntil: (endDate?: string | null) => string | null;
};

const SelectionTotal = ({
  selectedSummary,
  payWith,
  settings,
}: {
  selectedSummary: PurchaseSelectedSummary;
  payWith: PaymentMethod;
  settings: PurchaseModalSettings;
}) => {
  if (selectedSummary.fastTicketCount > 0) {
    return <MixedPriceSummary summary={selectedSummary} settings={settings} />;
  }

  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
      รวม {selectedSummary.total}
      <CurrencyIcon
        src={payWith === "freecoin" ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")}
        alt="currency"
        size={16}
      />
    </div>
  );
};

export default function BookInfoCardEpisodeSelectionModal({
  open,
  settings,
  isFetchingEpisodes,
  selectionModalMode,
  episodesData,
  expandedGroups,
  selectedEpisodeIds,
  selectedSummary,
  allSelectableIds,
  allSelected,
  payWith,
  onClose,
  onToggleSelectAll,
  onOpenManualConfirm,
  onToggleGroup,
  onToggleGroupSelect,
  onToggleEpisode,
  getEpisodesForSelectionMode,
  getProgressiveSelectableIds,
  canEpisodePayWithFreecoin,
  isEpisodeSequentiallyUnlocked,
  isEpisodeBaseSelectable,
  formatFreeUntil,
}: BookInfoCardEpisodeSelectionModalProps) {
  return (
    <Modal
      wrapClassName="book-select-modal"
      title={null}
      open={open}
      onCancel={onClose}
      zIndex={2000}
      footer={
        <div className="w-full">
          <div className="flex items-center justify-between">
            <Button onClick={onClose} className="border border-red-200 bg-white text-red-600 !hover:bg-red-50">
              ยกเลิก
            </Button>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="text-sm text-gray-700">เลือก {selectedSummary.count} ตอน</div>
              <SelectionTotal selectedSummary={selectedSummary} payWith={payWith} settings={settings} />
              <Button type="primary" danger disabled={selectedSummary.count === 0} onClick={onOpenManualConfirm}>
                ยืนยัน
              </Button>
            </div>
          </div>
        </div>
      }
      width={760}
      style={{ top: 24 }}
      centered
    >
      {isFetchingEpisodes ? (
        <GifLoader className="py-12" />
      ) : (
        <div>
          {selectionModalMode === "early" && (
            <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2 text-sm text-amber-700">
              เลือกซื้อเฉพาะตอนล่วงหน้า
            </div>
          )}

          <div className="mb-4 flex items-center justify-between rounded border border-pink-100 bg-pink-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Checkbox checked={allSelected} indeterminate={!allSelected && selectedSummary.count > 0} onChange={onToggleSelectAll} />
              <div className="text-sm">
                {selectionModalMode === "early" ? "เลือกตอนล่วงหน้าทั้งหมด" : "เลือกตอนทั้งหมด"} ({allSelectableIds.length} ตอน)
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-gray-700">
              <div>เลือก {selectedSummary.count} ตอน</div>
              <SelectionTotal selectedSummary={selectedSummary} payWith={payWith} settings={settings} />
            </div>
          </div>

          <div className="max-h-[60vh] space-y-4 overflow-auto">
            {episodesData?.groups?.map((group) => {
              const visibleEpisodes = getEpisodesForSelectionMode(group);
              if (visibleEpisodes.length === 0) return null;

              const groupId = String(group.group_id);
              const isExpanded = expandedGroups[groupId] ?? false;
              const selectableIds = getProgressiveSelectableIds(visibleEpisodes, selectedEpisodeIds);
              const selectedCountInGroup = selectableIds.filter((id) => selectedEpisodeIds.includes(Number(id))).length;
              const allSelectedInGroup = selectableIds.length > 0 && selectedCountInGroup === selectableIds.length;

              return (
                <div key={group.group_id} className="rounded border border-gray-100 bg-white">
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={allSelectedInGroup}
                        indeterminate={selectedCountInGroup > 0 && !allSelectedInGroup}
                        disabled={selectableIds.length === 0}
                        onChange={() => onToggleGroupSelect(group)}
                      />
                      <button onClick={() => onToggleGroup(group.group_id)} className="flex items-center gap-3">
                        <svg className={`h-4 w-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <div className="font-semibold">{group.name}</div>
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">{visibleEpisodes.length} ตอน</div>
                  </div>

                  {isExpanded && (
                    <div className="divide-y">
                      {visibleEpisodes.map((episode) => {
                        const early = getEarlyAccess(episode);
                        const canUseFreecoin = canEpisodePayWithFreecoin(episode);
                        const sequentialUnlocked = isEpisodeSequentiallyUnlocked(episode);
                        const isFastEpisode = early.isEarlyAccess;
                        const fastLocked = isFastEpisode && !sequentialUnlocked && !episode?.isBuy;
                        const fastBuyable = isFastEpisode && sequentialUnlocked && !episode?.isBuy;
                        const disabled = !isEpisodeBaseSelectable(episode) || !sequentialUnlocked;
                        const checked = selectedEpisodeIds.includes(Number(episode.ep_id));
                        const { regularPrice, promoPrice, hasPromo, finalPrice, activePromo, promoEndDate } = resolveEpisodePrice(episode);
                        const isDiscountFree = hasPromo && Number(finalPrice) === 0 && regularPrice > 0 && !fastBuyable;
                        const freeUntilLabel = isDiscountFree ? formatFreeUntil(promoEndDate) : null;
                        const rpEarn = Number(episode?.rp_campaign?.rp_earn ?? 0);
                        const rpCampaignEnd = episode?.rp_campaign?.end_date ? Date.parse(episode.rp_campaign.end_date) : null;
                        const isRpCampaignActive = !episode.isBuy
                          && regularPrice > 0
                          && rpEarn > 0
                          && (rpCampaignEnd === null || (Number.isFinite(rpCampaignEnd) && rpCampaignEnd > Date.now()));

                        return (
                          <div key={episode.ep_id} className={`flex items-center justify-between px-4 py-3 ${disabled ? "opacity-60" : ""}`}>
                            <div className="flex items-center gap-3">
                              <Checkbox checked={checked} disabled={disabled} onChange={() => onToggleEpisode(episode.ep_id)} />
                              <div className="min-w-0">
                                <div className={`line-clamp-2 text-sm font-medium ${disabled ? "text-gray-500" : "text-gray-900"}`}>
                                  {episode.name}
                                </div>
                                {fastLocked && (
                                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                                    <CurrencyIcon src={settings?.fast_ticket || "/images/fast_ticket.png"} alt="fast ticket" size={12} />
                                    ตอนล่วงหน้า (ซื้อตอนก่อนหน้า)
                                  </div>
                                )}
                                {fastBuyable && (
                                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                                    ตอนล่วงหน้า
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">
                                  {episode.view} • {new Date(episode.publish_datetime).toLocaleDateString("th-TH")}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {(regularPrice > 0 || hasPromo) && !isDiscountFree ? (
                                <div className="flex flex-col items-end gap-1">
                                  {isRpCampaignActive && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                                        +{rpEarn}
                                        {settings?.rp ? <CurrencyIcon src={settings.rp} alt="rank point" size={12} /> : <span>RP</span>}
                                      </span>
                                      {episode?.rp_campaign?.end_date && (
                                        <CommonCountdownTimer targetDate={episode.rp_campaign.end_date} variant="violet" label="RP" />
                                      )}
                                    </div>
                                  )}
                                  {hasPromo && activePromo?.end_date && (
                                    <CommonCountdownTimer targetDate={activePromo.end_date} variant="rose" label="ลดอีก" />
                                  )}
                                  <div className="flex items-center justify-end gap-1.5">
                                    {fastBuyable && (
                                      <>
                                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                                          <span>(</span>
                                          {early.fastTicket && (
                                            <>
                                              <CurrencyIcon src={settings?.fast_ticket || "/images/fast_ticket.png"} alt="fast ticket" />
                                              <span className="text-sm font-semibold">{early.fastTicketPrice ?? 1}</span>
                                            </>
                                          )}
                                          {early.fastTicket && early.fastCoin && <span className="text-gray-400">/</span>}
                                          {early.fastCoin && (
                                            <>
                                              <CurrencyIcon src={settings?.coin || "/images/e-coin.png"} alt="fast coin" />
                                              <span className="text-sm font-semibold">{early.fastCoinPrice}</span>
                                            </>
                                          )}
                                          <span>)</span>
                                        </div>
                                        <span className="text-gray-400">+</span>
                                      </>
                                    )}
                                    {canUseFreecoin && (
                                      <CurrencyIcon src={settings?.freecoin || "/images/money-bag.png"} alt="freecoin" size={16} />
                                    )}
                                    <CurrencyIcon src={settings?.coin || "/images/e-coin.png"} alt="coin" size={16} />
                                    <span className={`text-sm font-semibold ${hasPromo ? "text-rose-600" : "text-orange-600"}`}>
                                      {hasPromo ? promoPrice : regularPrice}
                                    </span>
                                    {hasPromo && (
                                      <span className="text-xs text-gray-400 line-through decoration-gray-300">{regularPrice}</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="text-sm font-semibold text-emerald-600">ตอนฟรี</span>
                                  {freeUntilLabel && (
                                    <span className="text-[11px] text-emerald-700">{`อ่านฟรีถึง ${freeUntilLabel}`}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
