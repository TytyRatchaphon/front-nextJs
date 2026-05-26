import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBookEpisodes } from "@/services/apiServices";
import {
  fetchEpisodePurchaseRewardPreview,
  type EpisodePurchaseRewardPreviewResult,
} from "@/services/api/episodePurchaseRewardApi";
import type { EpisodeGroup } from "@/types/api";
import type { BookInfoCardBook, FastPaymentMethod, PaymentMethod } from "./BookInfoCard.types";
import {
  buildOrderedEpisodeIndexMap,
  canEpisodePayWithFreecoin as canEpisodePayWithFreecoinByBookSetting,
  getEarlyAccess,
  getEpisodePriceByMethod,
  getEpisodeRegularCoinPrice,
  getEpisodesForSelectionMode as getEpisodesForSelectionModeByMode,
  getProgressiveSelectableIds as getProgressiveSelectableIdsForContext,
  getSelectedEpisodeSummary,
  isEpisodeBaseSelectable as isEpisodeBaseSelectableByRules,
  isEpisodeSequentiallyUnlocked as isEpisodeSequentiallyUnlockedForContext,
} from "./bookInfoCardPurchaseUtils";

type MessageApi = {
  error: (content: unknown) => void;
  info: (content: unknown) => void;
};

type UseBookInfoCardPurchaseStateInput = {
  book: BookInfoCardBook;
  bookId?: string | number | null;
  token: string | null;
  isLoggedIn: boolean;
  openLoginModal: () => void;
  messageApi: MessageApi;
};

const formatThaiDateTime = (value?: string | null, includeYear = false) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleString("th-TH", {
    ...(includeYear ? { year: "numeric" as const } : {}),
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const useBookInfoCardPurchaseState = ({
  book,
  bookId,
  token,
  isLoggedIn,
  openLoginModal,
  messageApi,
}: UseBookInfoCardPurchaseStateInput) => {
  const [buyLoading, setBuyLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<number[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [payWith, setPayWith] = useState<PaymentMethod>("coin");
  const [fastPayWith, setFastPayWith] = useState<FastPaymentMethod>("fast_ticket");
  const [selectionModalMode, setSelectionModalMode] = useState<"all" | "early">("all");
  const [buyAllModalOpen, setBuyAllModalOpen] = useState(false);
  const [manualBuyConfirmModalOpen, setManualBuyConfirmModalOpen] = useState(false);
  const [buyAllIds, setBuyAllIds] = useState<number[]>([]);
  const [buyAllTotal, setBuyAllTotal] = useState(0);
  const [buyAllFastTicketCount, setBuyAllFastTicketCount] = useState(0);
  const [buyAllEpisodeMap, setBuyAllEpisodeMap] = useState<Record<number, any>>({});
  const [bulkPurchaseMode, setBulkPurchaseMode] = useState<"all" | "early">("all");
  const [manualRewardPreview, setManualRewardPreview] = useState<EpisodePurchaseRewardPreviewResult | null>(null);
  const [manualRewardPreviewLoading, setManualRewardPreviewLoading] = useState(false);
  const [buyAllRewardPreview, setBuyAllRewardPreview] = useState<EpisodePurchaseRewardPreviewResult | null>(null);
  const [buyAllRewardPreviewLoading, setBuyAllRewardPreviewLoading] = useState(false);

  const queryResult = useQuery<{ groups: EpisodeGroup[] }>({
    queryKey: ["bookEpisodes", String(bookId ?? ""), token],
    queryFn: () => fetchBookEpisodes(String(bookId ?? "")),
    enabled: isModalOpen && !!bookId,
    staleTime: 5 * 60 * 1000,
  });
  const episodesData = queryResult.data;
  const isFetching = queryResult.isFetching;

  const hasEarlyAccessEpisodes = useMemo(() => {
    const fastTicketInfo = book.fastTicket;
    if (!fastTicketInfo) return false;
    const earlyCount = Number(fastTicketInfo.remaining_count ?? fastTicketInfo.ep_count ?? 0);
    return Boolean(fastTicketInfo.book_enabled && fastTicketInfo.web_enabled && earlyCount > 0);
  }, [book.fastTicket]);

  const hasEpisodePurchaseReward = book.ep_purchase_reward?.has_promotion === true;

  const loadEpisodeRewardPreview = async (
    episodeIds: number[],
    setPreview: React.Dispatch<React.SetStateAction<EpisodePurchaseRewardPreviewResult | null>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    setPreview(null);
    if (!hasEpisodePurchaseReward) return;

    const safeEpisodeIds = episodeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (safeEpisodeIds.length === 0) return;

    try {
      setLoading(true);
      const preview = await fetchEpisodePurchaseRewardPreview(
        safeEpisodeIds.length === 1 ? safeEpisodeIds[0] : safeEpisodeIds,
      );
      setPreview(preview);
    } catch (error) {
      console.warn("[episode-purchase-reward-preview] fallback to normal buy flow", error);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const getEpisodesForSelectionMode = (group: any) => {
    return getEpisodesForSelectionModeByMode(group, selectionModalMode);
  };

  const orderedEpisodesForSelectionMode = useMemo(() => {
    if (!episodesData?.groups) return [] as any[];
    const orderedEpisodes: any[] = [];
    for (const group of episodesData.groups) {
      orderedEpisodes.push(...getEpisodesForSelectionMode(group));
    }
    return orderedEpisodes;
  }, [episodesData, selectionModalMode]);

  const orderedEpisodeIndexMap = useMemo(() => {
    return buildOrderedEpisodeIndexMap(orderedEpisodesForSelectionMode);
  }, [orderedEpisodesForSelectionMode]);

  const isEpisodeSequentiallyUnlocked = (
    episode: any,
    selectionContext: ReadonlySet<number> | readonly number[] = selectedEpisodeIds,
  ) => {
    return isEpisodeSequentiallyUnlockedForContext({
      episode,
      orderedEpisodeIndexMap,
      orderedEpisodesForSelectionMode,
      selectionContext,
      includeFreecoinSelectable: false,
    });
  };

  const getProgressiveSelectableIds = (
    episodes: any[],
    seedSelection: readonly number[] = selectedEpisodeIds,
  ) => {
    return getProgressiveSelectableIdsForContext({
      episodes,
      orderedEpisodeIndexMap,
      orderedEpisodesForSelectionMode,
      seedSelection,
      includeFreecoinSelectable: false,
    });
  };

  const selectedSummary = useMemo(() => {
    return getSelectedEpisodeSummary({
      groups: episodesData?.groups ?? [],
      selectedEpisodeIds,
      payWith,
      fastPayWith,
      bookUseFreecoin: book?.use_freecoin,
    });
  }, [selectedEpisodeIds, episodesData, payWith, fastPayWith, book?.use_freecoin]);

  const allSelectableIds = useMemo(() => {
    return getProgressiveSelectableIds(orderedEpisodesForSelectionMode, selectedEpisodeIds);
  }, [orderedEpisodesForSelectionMode, selectedEpisodeIds]);

  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedEpisodeIds.includes(id));

  const getEpisodeById = (epId: number) => {
    if (episodesData?.groups) {
      for (const group of episodesData.groups) {
        const found = group.list.find((episode: any) => Number(episode.ep_id) === Number(epId));
        if (found) return found;
      }
    }
    return buyAllEpisodeMap[Number(epId)] || null;
  };

  const buildBuyEpsPayload = (epIds: number[], method: PaymentMethod, earlyMethod: FastPaymentMethod) => {
    const payload: any = {
      eps: epIds.map((id) => Number(id)),
      payWith: method,
    };

    let hasEarly = false;
    for (const id of epIds) {
      const episode = getEpisodeById(id);
      if (!episode) continue;
      const early = getEarlyAccess(episode);
      if (!early.isEarlyAccess) continue;
      hasEarly = true;
    }

    if (hasEarly) {
      payload.fastPayWith = earlyMethod === "fast_ticket" ? ["ticket"] : ["coin"];
    }

    return payload;
  };

  const getTotalForEpisodeIds = (epIds: number[], method: PaymentMethod | "fast_ticket") => {
    return epIds.reduce((sum, id) => {
      const episode = getEpisodeById(id);
      if (!episode) return sum;
      return sum + Number(getEpisodePriceByMethod(episode, method) ?? 0);
    }, 0);
  };

  const getRegularCoinTotalForEpisodeIds = (epIds: number[]) => {
    return epIds.reduce((sum, id) => sum + getEpisodeRegularCoinPrice(getEpisodeById(id)), 0);
  };

  const canEpisodePayWithFreecoin = (episode: any) => {
    return canEpisodePayWithFreecoinByBookSetting(episode, book?.use_freecoin);
  };

  const isEpisodeBaseSelectable = (episode: any) => {
    return isEpisodeBaseSelectableByRules(episode, book?.use_freecoin, false);
  };

  const openModal = (mode: "all" | "early" = "all") => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (mode === "early" && !hasEarlyAccessEpisodes) {
      messageApi.info("ไม่มีตอนล่วงหน้าให้เลือกซื้อ");
      return;
    }
    setSelectedEpisodeIds([]);
    setSelectionModalMode(mode);

    if (episodesData?.groups && episodesData.groups.length > 0) {
      const firstId = String(episodesData.groups[0].group_id);
      const map: Record<string, boolean> = {};
      for (const group of episodesData.groups) map[String(group.group_id)] = false;
      map[firstId] = true;
      setExpandedGroups(map);
    }
    setPayWith("coin");
    setFastPayWith("fast_ticket");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEpisodeIds([]);
  };

  const toggleEpisode = (epId: number | string) => {
    const normalizedId = Number(epId);
    if (!Number.isFinite(normalizedId)) return;
    setSelectedEpisodeIds((prev) =>
      prev.includes(normalizedId) ? prev.filter((id) => id !== normalizedId) : [...prev, normalizedId],
    );
  };

  const toggleGroup = (groupId: string | number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [String(groupId)]: !prev[String(groupId)],
    }));
  };

  const toggleGroupSelect = (group: any) => {
    const selectionList = getEpisodesForSelectionMode(group);
    const selectable = getProgressiveSelectableIds(selectionList, selectedEpisodeIds);
    const isAllSelected = selectable.every((id: number) => selectedEpisodeIds.includes(id));
    if (isAllSelected) {
      setSelectedEpisodeIds((prev) => prev.filter((id) => !selectable.includes(id)));
    } else {
      setSelectedEpisodeIds((prev) => Array.from(new Set([...prev, ...selectable])));
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedEpisodeIds((prev) => prev.filter((id) => !allSelectableIds.includes(id)));
    } else {
      setSelectedEpisodeIds((prev) => Array.from(new Set([...prev, ...allSelectableIds])));
    }
  };

  const closeManualBuyConfirmModal = () => {
    setManualBuyConfirmModalOpen(false);
    setManualRewardPreview(null);
    setManualRewardPreviewLoading(false);
  };

  const closeBuyAllConfirmModal = () => {
    setBuyAllModalOpen(false);
    setBuyAllFastTicketCount(0);
    setBuyAllRewardPreview(null);
    setBuyAllRewardPreviewLoading(false);
  };

  const handleBuyAllClick = async () => {
    if (buyLoading) return;
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (!bookId) {
      messageApi.error("ไม่พบข้อมูลหนังสือ");
      return;
    }

    try {
      setBuyLoading(true);
      const epsData: any = await fetchBookEpisodes(String(bookId));
      const groups = epsData?.groups ?? [];
      const selectableIds: number[] = [];
      const epMap: Record<number, any> = {};
      let total = 0;
      for (const group of groups) {
        for (let index = 0; index < group.list.length; index += 1) {
          const episode = group.list[index];
          const early = getEarlyAccess(episode);
          if (isEpisodeSequentiallyUnlocked(episode) && !early.isEarlyAccess) {
            selectableIds.push(Number(episode.ep_id));
            epMap[Number(episode.ep_id)] = episode;
            total += getEpisodeRegularCoinPrice(episode);
          }
        }
      }

      if (selectableIds.length === 0) {
        messageApi.info("ไม่มีตอนที่ต้องชำระเงินให้ซื้อทั้งหมด");
        setBuyAllFastTicketCount(0);
        setBuyLoading(false);
        return;
      }

      setBuyAllIds(selectableIds);
      setBuyAllEpisodeMap(epMap);
      const hasPurchaseDetailsTotal = book.remaining_paid_total != null;
      const purchaseDetailsTotal = Number(book.remaining_paid_total);
      setBuyAllTotal(hasPurchaseDetailsTotal && Number.isFinite(purchaseDetailsTotal) ? purchaseDetailsTotal : total);
      setBuyAllFastTicketCount(0);
      setBulkPurchaseMode("all");
      setPayWith("coin");
      setFastPayWith("coin");
      setBuyAllModalOpen(true);
      void loadEpisodeRewardPreview(selectableIds, setBuyAllRewardPreview, setBuyAllRewardPreviewLoading);
      setBuyLoading(false);
    } catch {
      messageApi.error("เกิดข้อผิดพลาด ขณะเตรียมการซื้อ");
      setBuyLoading(false);
    }
  };

  const openManualBuyConfirmModal = () => {
    if (!isLoggedIn) {
      setIsModalOpen(false);
      setSelectedEpisodeIds([]);
      openLoginModal();
      return;
    }

    setPayWith("coin");
    setFastPayWith(
      selectedSummary.hasEarlyAccess
        ? (selectedSummary.canUseFastTicket ? "fast_ticket" : "coin")
        : "coin",
    );
    setManualBuyConfirmModalOpen(true);
    void loadEpisodeRewardPreview(selectedEpisodeIds, setManualRewardPreview, setManualRewardPreviewLoading);
  };

  useEffect(() => {
    if (selectedSummary.count === 0) return;
    if (payWith === "freecoin" && !selectedSummary.canUseFreecoin) {
      if (selectedSummary.canUseCoin) setPayWith("coin");
      return;
    }
    if (fastPayWith === "fast_ticket" && !selectedSummary.canUseFastTicket) {
      if (selectedSummary.canUseFastCoin) {
        setFastPayWith("coin");
      }
      return;
    }
    if (
      fastPayWith === "coin"
      && selectedSummary.hasEarlyAccess
      && !selectedSummary.canUseFastCoin
      && selectedSummary.canUseFastTicket
    ) {
      setFastPayWith("fast_ticket");
    }
  }, [selectedSummary, payWith, fastPayWith]);

  useEffect(() => {
    if (buyAllFastTicketCount > 0 && !selectedSummary.canUseFastTicket) setFastPayWith("coin");
  }, [buyAllFastTicketCount, selectedSummary.canUseFastTicket]);

  useEffect(() => {
    if (!episodesData?.groups || selectedEpisodeIds.length === 0) return;

    const validSelected = new Set<number>();
    for (const group of episodesData.groups) {
      const visibleEpisodes = getEpisodesForSelectionMode(group);
      for (let index = 0; index < visibleEpisodes.length; index += 1) {
        const episode = visibleEpisodes[index];
        const epId = Number(episode?.ep_id);
        if (!selectedEpisodeIds.includes(epId)) continue;
        if (isEpisodeSequentiallyUnlocked(episode)) {
          validSelected.add(epId);
        }
      }
    }

    if (validSelected.size !== selectedEpisodeIds.length) {
      setSelectedEpisodeIds((prev) => prev.filter((id) => validSelected.has(id)));
    }
  }, [episodesData, selectedEpisodeIds, selectionModalMode]);

  useEffect(() => {
    if (buyAllIds.length === 0) return;
    if (bulkPurchaseMode === "all") {
      const hasPurchaseDetailsTotal = book.remaining_paid_total != null;
      const purchaseDetailsTotal = Number(book.remaining_paid_total);
      setBuyAllTotal(
        hasPurchaseDetailsTotal && Number.isFinite(purchaseDetailsTotal)
          ? purchaseDetailsTotal
          : getRegularCoinTotalForEpisodeIds(buyAllIds),
      );
      return;
    }
    setBuyAllTotal(getTotalForEpisodeIds(buyAllIds, payWith));
  }, [bulkPurchaseMode, buyAllIds, payWith, episodesData, book.remaining_paid_total]);

  const promotionRewards = useMemo(() => {
    return Array.isArray(book.promotion?.rewards) ? book.promotion.rewards.filter(Boolean) : [];
  }, [book.promotion?.rewards]);
  const previewPromotionRewards = useMemo(() => promotionRewards.slice(0, 3), [promotionRewards]);

  return {
    allSelectableIds,
    allSelected,
    buildBuyEpsPayload,
    bulkPurchaseMode,
    buyAllFastTicketCount,
    buyAllIds,
    buyAllModalOpen,
    buyAllRewardPreview,
    buyAllRewardPreviewLoading,
    buyAllTotal,
    buyLoading,
    canEpisodePayWithFreecoin,
    closeBuyAllConfirmModal,
    closeManualBuyConfirmModal,
    closeModal,
    episodesData,
    expandedGroups,
    fastPayWith,
    formatFreeUntil: (value?: string | null) => formatThaiDateTime(value, true),
    formatPromotionRewardDate: (value?: string | null) => formatThaiDateTime(value, false),
    getEpisodesForSelectionMode,
    getProgressiveSelectableIds,
    handleBuyAllClick,
    handleBuyEarlyAccessClick: () => openModal("early"),
    hasEarlyAccessEpisodes,
    isEpisodeBaseSelectable,
    isEpisodeSequentiallyUnlocked,
    isFetching,
    isModalOpen,
    manualBuyConfirmModalOpen,
    manualRewardPreview,
    manualRewardPreviewLoading,
    openManualBuyConfirmModal,
    openModal,
    payWith,
    previewPromotionRewards,
    promotionRewards,
    selectedEpisodeIds,
    selectedSummary,
    selectionModalMode,
    setBuyAllIds,
    setBuyLoading,
    setFastPayWith,
    setPayWith,
    setSelectedEpisodeIds,
    setShowSuccess,
    showSuccess,
    toggleEpisode,
    toggleGroup,
    toggleGroupSelect,
    toggleSelectAll,
  };
};
