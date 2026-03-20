"use client";

import Image from "next/image";
import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Modal, Checkbox, Spin, Button, App, Radio } from "antd";
import { useQuery } from "@tanstack/react-query";
import { fetchBookEpisodes, refreshToken } from "@/services/apiServices";
import apiClient from "@/services/apiClient";
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/uiStore';
// import { Minus, Plus } from "lucide-react";
import GifLoader from '@/components/utility/GifLoader';
import SuccessAnimation from '@/components/utility/SuccessAnimation';
import AmountPill from '@/components/utility/AmountPill';
import FreeCoinPill from '@/components/utility/FreeCoinPill';
import FastTicketPill from '@/components/utility/FastTicketPill';
import { CountdownTimer as CommonCountdownTimer } from "@/components/common/CountdownTimer";
import { useWebsiteStore } from '@/stores/websiteStore';
import "jwt-decode";
import '@/utils/imageUtils';
import type { EpisodeGroup, BookEpisodesResponse } from '@/types/api';
import '@/types/errors';
import { useLogger } from '@/hooks/useLogger';


type Book = {
  cover: string;
  title: string;
  author?: string;
  writer?: {
    user_id: number;
    writer_name: string;
    img: string;
    isFollowing?: boolean;
  } | null;
  price?: number;
  remaining_paid_total?: number;
  remaining_paid_count?: number;
  total_remaining_count?: number;
  total_remaining_total?: number;
  chapters?: number;
  views?: number;
  reviews?: number;
  tag?: string;
  promotion?: {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
    percent: number;
    price: number;
  };
  fastTicket?: {
    can_buy: boolean;
    user_ticket_balance: number;
    ep_count: number;
    remaining_count: number;
    remaining_total: number;
    web_enabled: boolean;
    book_enabled: boolean;
  };
  use_freecoin?: number;
  end?: string;
  status?: string;
};

function decodeToken(token: string) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date();
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-white drop-shadow-sm">
      <div className="bg-black/20 rounded px-1.5 py-0.5 min-w-[20px] text-center backdrop-blur-sm">
        {String(timeLeft.days).padStart(2, '0')}
      </div>
      <span>:</span>
      <div className="bg-black/20 rounded px-1.5 py-0.5 min-w-[20px] text-center backdrop-blur-sm">
        {String(timeLeft.hours).padStart(2, '0')}
      </div>
      <span>:</span>
      <div className="bg-black/20 rounded px-1.5 py-0.5 min-w-[20px] text-center backdrop-blur-sm">
        {String(timeLeft.minutes).padStart(2, '0')}
      </div>
      <span>:</span>
      <div className="bg-black/20 rounded px-1.5 py-0.5 min-w-[20px] text-center backdrop-blur-sm">
        {String(timeLeft.seconds).padStart(2, '0')}
      </div>
    </div>
  );
};



interface BookInfoCardProps {
  book: Book;
  bookId?: string | number | null;
}

const Pill = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`h-10 px-3 rounded-full border border-gray-200 bg-white shadow-sm flex items-center gap-2 ${className}`}
  >
    {children}
  </div>
);

const BookInfoCard = ({ book, bookId }: BookInfoCardProps) => {
  const isDeleted = book.status?.toLowerCase().trim() === 'delete';
  const { token, isLoggedIn, updateToken, user } = useAuthStore();
  const openLoginModal = useUIStore((s) => s.openLoginModal);
  const queryClient = useQueryClient();
  const { message: messageApi, modal: modalApi, notification } = App.useApp();
  const { log } = useLogger();
  const [buyLoading, setBuyLoading] = useState(false);
  // Removed redundant local state for coins/flowers/hearts - using auth store directly
  // const [userCoinCount, setUserCoinCount] = useState<number | null>(null);
  // const [userFlowerCount, setUserFlowerCount] = useState<number | null>(null);
  // const [userHeartCount, setUserHeartCount] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<number[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [payWith, setPayWith] = useState<'coin' | 'freecoin'>('coin');
  const [fastPayWith, setFastPayWith] = useState<'coin' | 'fast_ticket'>('fast_ticket');
  const [selectionModalMode, setSelectionModalMode] = useState<'all' | 'early'>('all');

  // Fetch episodes when selection modal opens
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

  const openModal = (mode: 'all' | 'early' = 'all') => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (mode === 'early' && !hasEarlyAccessEpisodes) {
      messageApi.info('ไม่มีตอนล่วงหน้าให้เลือกซื้อ');
      return;
    }
    setSelectedEpisodeIds([]);
    setSelectionModalMode(mode);
    // expand first group by default when opening
    if (episodesData?.groups && episodesData.groups.length > 0) {
      const firstId = String(episodesData.groups[0].group_id);
      const map: Record<string, boolean> = {};
      for (const g of episodesData.groups) map[String(g.group_id)] = false;
      map[firstId] = true;
      setExpandedGroups(map);
    }
    setPayWith('coin');
    setFastPayWith('fast_ticket');
    setIsModalOpen(true);
  };

  const handleBuyPromotion = async () => {
    if (buyLoading) return;
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (!book.promotion?.id) {
      messageApi.error('ไม่พบข้อมูลโปรโมชั่น');
      return;
    }

    modalApi.confirm({
      title: 'ยืนยันการซื้อโปรโมชั่น',
      content: (
        <div>
          <div>คุณต้องการซื้อโปรโมชั่น &quot;{book.promotion.title}&quot; หรือไม่?</div>
          <div className="flex mt-2">ราคาโปรโมชั่น: <b className="text-red-600 flex mr-2">{book.promotion.price.toLocaleString()}</b><Image src="/images/e-coin.png" alt="Coin" width={24} height={24} /></div>
        </div>
      ),
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      okButtonProps: { className: '!bg-red-600 hover:!bg-red-700 !border-red-600 !text-white' },
      onOk: async () => {
        try {
          setBuyLoading(true);
          const payload = { dfb_id: book.promotion?.id, payWith: 'coin' };
          const res = await apiClient.post(`/buy/groupPromotion`, payload);
          if (res?.data?.code === 200) {

            // Log buy_promotion
            console.log('[LOG] buy_promotion =>', { bookId, promotion_id: book.promotion?.id, price: book.promotion?.price, title: book.promotion?.title });
            log('buy_promotion', 'book', String(bookId), { promotion_id: book.promotion?.id, price: book.promotion?.price, promotion_title: book.promotion?.title, book_title: book?.title });

            setShowSuccess(true);

            if (res.data?.data?.token) {
              const newToken = res.data.data.token;
              const decoded = decodeToken(newToken);
              // Force use of calculated coin if token is stale (higher than expected)
              if (user && book.promotion?.price) {
                const expectedCoin = (Number(user.coin) || 0) - (Number(book.promotion.price) || 0);
                const tokenCoin = Number(decoded.coin ?? decoded.coins ?? decoded.goldCoins ?? decoded.gold_coin ?? 0);

                // Construct merged user. If token coin is > expected, force expected.
                const finalCoin = (tokenCoin > expectedCoin) ? expectedCoin : tokenCoin;

                const mergedUser = { ...user, ...decoded, coin: finalCoin };
                useAuthStore.getState().login(mergedUser, newToken);
              } else {
                updateToken(newToken);
              }
            }
            // Temporarily disabled eager refresh to prevent stale token overwrite
            // else {
            //   try {
            //     const refreshRes = await refreshToken();
            //     const newToken = refreshRes?.data?.token || refreshRes?.token;
            //     if (newToken) updateToken(newToken);
            //   } catch (e) {}
            // }
          } else {
            const errMsg = res?.data?.message || 'ไม่สามารถทำการซื้อได้';
            messageApi.error(errMsg);
          }
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาดขณะซื้อ';
          messageApi.error(msg);
        } finally {
          setBuyLoading(false);
        }
      },
      onCancel: () => {
        setBuyLoading(false);
      },
    });
  };

  const [buyAllModalOpen, setBuyAllModalOpen] = useState(false);
  const [manualBuyConfirmModalOpen, setManualBuyConfirmModalOpen] = useState(false);
  const [buyAllIds, setBuyAllIds] = useState<number[]>([]);
  const [buyAllTotal, setBuyAllTotal] = useState(0);
  const [buyAllFastTicketCount, setBuyAllFastTicketCount] = useState(0);
  const [buyAllEpisodeMap, setBuyAllEpisodeMap] = useState<Record<number, any>>({});
  const [bulkPurchaseMode, setBulkPurchaseMode] = useState<'all' | 'early'>('all');

  const handleBuyAllClick = async () => {
    if (buyLoading) return;
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (!bookId) {
      messageApi.error('ไม่พบข้อมูลหนังสือ');
      return;
    }

    try {
      setBuyLoading(true);
      const epsData: any = await fetchBookEpisodes(String(bookId));
      const groups = epsData?.groups ?? [];
      const selectableIds: number[] = [];
      const epMap: Record<number, any> = {};
      let total = 0;
      for (const g of groups) {
        for (let index = 0; index < g.list.length; index += 1) {
          const ep = g.list[index];
          const early = getEarlyAccess(ep);
          if (isEpisodeSequentiallyUnlocked(ep, index, g.list) && !early.isEarlyAccess) {
            selectableIds.push(Number(ep.ep_id));
            epMap[Number(ep.ep_id)] = ep;
            total += getEpisodePriceByMethod(ep, 'coin');
          }
        }
      }

      if (selectableIds.length === 0) {
        messageApi.info('ไม่มีตอนที่ต้องชำระเงินให้ซื้อทั้งหมด');
        setBuyAllFastTicketCount(0);
        setBuyLoading(false);
        return;
      }

      setBuyAllIds(selectableIds);
      setBuyAllEpisodeMap(epMap);
      setBuyAllTotal(total);
      setBuyAllFastTicketCount(0);
      setBulkPurchaseMode('all');
      setPayWith('coin'); // Default to coin
      setFastPayWith('coin');
      setBuyAllModalOpen(true);
      setBuyLoading(false);

    } catch {
      messageApi.error('เกิดข้อผิดพลาด ขณะเตรียมการซื้อ');
      setBuyLoading(false);
    }
  };

  const handleBuyEarlyAccessClick = async () => {
    openModal('early');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEpisodeIds([]);
  };

  const toggleEpisode = (epId: number | string) => {
    const normalizedId = Number(epId);
    if (!Number.isFinite(normalizedId)) return;
    setSelectedEpisodeIds((prev) =>
      prev.includes(normalizedId) ? prev.filter((id) => id !== normalizedId) : [...prev, normalizedId]
    );
  };

  const toggleGroup = (groupId: string | number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [String(groupId)]: !prev[String(groupId)],
    }));
  };

  const toggleGroupSelect = (group: any) => {
    // select all selectable episodes in group, or deselect if all already selected
    const selectionList = getEpisodesForSelectionMode(group);
    const selectable = selectionList
      .filter((ep: any, index: number) => isEpisodeSequentiallyUnlocked(ep, index, selectionList))
      .map((ep: any) => Number(ep.ep_id));
    const allSelected = selectable.every((id: number) => selectedEpisodeIds.includes(id));
    if (allSelected) {
      setSelectedEpisodeIds((prev) => prev.filter((id) => !selectable.includes(id)));
    } else {
      setSelectedEpisodeIds((prev) => Array.from(new Set([...prev, ...selectable])));
    }
  };

  // Helper to resolve price (Regular vs Promo)
  const resolveEpisodePrice = (episode: any) => {
    const regularPrice = Number(episode.coin ?? 0);
    let promoPrice: number | undefined = undefined;
    let activePromo: any = null;

    // Helper to safe parse price
    const getPrice = (val: any) => {
      if (val === null || val === undefined) return undefined;
      const v = Number(val);
      return isNaN(v) ? undefined : v;
    };

    // 1. Check Discount Object (Priority 1)
    if (episode.Discount) {
      const p = getPrice(episode.Discount.discount_price);
      if (p !== undefined) {
        promoPrice = p;
        activePromo = episode.Discount;
      }
    }
    // 2. Fallback: Nested promotions
    else if (Array.isArray(episode.promotions) && episode.promotions.length > 0) {
      const p = getPrice(episode.promotions[0].discount_price);
      if (p !== undefined) {
        promoPrice = p;
        activePromo = episode.promotions[0];
      }
    }
    // 3. Fallback: Direct property
    else if (episode.discount_price !== undefined) {
      const p = getPrice(episode.discount_price);
      if (p !== undefined) promoPrice = p;
    }

    const hasPromo = !episode.isBuy && promoPrice !== undefined && promoPrice < regularPrice && promoPrice >= 0;
    const finalPrice = hasPromo ? (promoPrice as number) : regularPrice;

    return { regularPrice, promoPrice, hasPromo, finalPrice, activePromo };
  };

  const getEarlyAccess = (episode: any) => {
    const early = episode?.early_access || {};
    const fastTicket = Boolean(early?.fast_ticket ?? episode?.isFastTicket);
    const fastCoin = Boolean(early?.fast_coin);
    const isBuyable = Boolean(early?.isFast_buyable ?? episode?.isFast_buyable);
    const rawTicketPrice = Number(early?.fastTicketPrice);
    const rawCoinPrice = Number(early?.fastCoinPrice ?? episode?.coin ?? 0);
    return {
      fastTicket,
      fastCoin,
      isBuyable,
      fastTicketPrice: Number.isFinite(rawTicketPrice) && rawTicketPrice > 0 ? rawTicketPrice : null,
      fastCoinPrice: Number.isFinite(rawCoinPrice) && rawCoinPrice >= 0 ? rawCoinPrice : Number(episode?.coin ?? 0),
      isEarlyAccess: fastTicket || fastCoin,
    };
  };

  const isEpisodeFastTicket = (episode: any) => getEarlyAccess(episode).isEarlyAccess;
  const isEpisodeFastLocked = (episode: any) => {
    const early = getEarlyAccess(episode);
    return early.isEarlyAccess && !early.isBuyable && !Boolean(episode?.isBuy);
  };
  const canEpisodePayWithCoin = (_episode: any) => true;
  const canEpisodePayWithFastTicket = (episode: any) => {
    const early = getEarlyAccess(episode);
    return early.isEarlyAccess && Boolean(early.fastTicket);
  };
  const canEpisodePayWithFreecoin = (episode: any) => {
    const epUseFreecoin = episode?.use_freecoin;
    const canUseFreecoin = epUseFreecoin !== undefined && epUseFreecoin !== null
      ? Number(epUseFreecoin) === 1
      : Number(book?.use_freecoin ?? 0) === 1;
    return canUseFreecoin;
  };
  const getEpisodePriceByMethod = (episode: any, method: 'coin' | 'freecoin' | 'fast_ticket') => {
    const early = getEarlyAccess(episode);
    const { finalPrice } = resolveEpisodePrice(episode);
    if (method === 'fast_ticket') {
      if (early.fastTicket) return early.fastTicketPrice ?? 1;
      return finalPrice;
    }
    if (method === 'coin' && early.isEarlyAccess) return early.fastCoinPrice;
    if (method === 'freecoin' && early.isEarlyAccess) return early.fastCoinPrice;
    return finalPrice;
  };
  const isEpisodeBaseSelectable = (episode: any) => {
    if (episode?.isBuy) return false;
    const hasNormalCoin = Number(episode?.coin ?? 0) > 0;
    const early = getEarlyAccess(episode);
    const hasEarlyPayMethod = early.isEarlyAccess && early.isBuyable && (early.fastTicket || early.fastCoin);
    return hasNormalCoin || hasEarlyPayMethod;
  };
  const isEpisodeSelectable = (episode: any) => isEpisodeBaseSelectable(episode) && !isEpisodeFastLocked(episode);
  const isPrevEpisodeUnlocking = (prevEpisode: any) => {
    if (!prevEpisode) return false;
    return Boolean(prevEpisode?.isBuy)
      || Number(prevEpisode?.coin ?? 0) <= 0
      || selectedEpisodeIds.includes(Number(prevEpisode?.ep_id));
  };
  const isEpisodeSequentiallyUnlocked = (episode: any, index: number, groupList: any[]) => {
    if (!isEpisodeBaseSelectable(episode)) return false;
    if (!isEpisodeFastLocked(episode)) return true;
    const prevEpisode = groupList[index - 1];
    return isPrevEpisodeUnlocking(prevEpisode);
  };

  const getEpisodesForSelectionMode = (group: any) => {
    if (selectionModalMode !== 'early') return group.list;
    return group.list.filter((episode: any) => getEarlyAccess(episode).isEarlyAccess);
  };

  const selectedSummary = useMemo(() => {
    if (!episodesData?.groups) return { count: 0, total: 0, hasEarlyAccess: false, fastTicketCount: 0, fastTicketRequiredTotal: 0, earlyAccessCoinTotal: 0, baseCoinTotal: 0, coinTotal: 0, freecoinTotal: 0, fastTicketTotal: 0, canUseCoin: true, canUseFreecoin: false, canUseFastTicket: false };
    const episodeMap = new Map<number, any>();
    for (const g of episodesData.groups) {
      for (const ep of g.list) {
        episodeMap.set(Number(ep.ep_id), ep);
      }
    }
    const selectedEpisodes = selectedEpisodeIds
      .map((id) => episodeMap.get(Number(id)))
      .filter(Boolean) as any[];

    if (selectedEpisodes.length === 0) {
      return { count: 0, total: 0, hasEarlyAccess: false, fastTicketCount: 0, fastTicketRequiredTotal: 0, earlyAccessCoinTotal: 0, baseCoinTotal: 0, coinTotal: 0, freecoinTotal: 0, fastTicketTotal: 0, canUseCoin: true, canUseFreecoin: false, canUseFastTicket: false };
    }

    let coinTotal = 0;
    let freecoinTotal = 0;
    let fastTicketTotal = 0;
    let earlyAccessCoinTotal = 0;
    let baseCoinTotal = 0;
    let fastTicketCount = 0;
    let canUseCoin = true;
    let canUseFreecoin = true;
    let canUseFastTicket = true;
    let fastTicketRequiredTotal = 0;
    for (const ep of selectedEpisodes) {
      const early = getEarlyAccess(ep);
      const { finalPrice } = resolveEpisodePrice(ep);
      coinTotal += getEpisodePriceByMethod(ep, 'coin');
      freecoinTotal += getEpisodePriceByMethod(ep, 'freecoin');
      fastTicketTotal += getEpisodePriceByMethod(ep, 'fast_ticket');
      if (early.isEarlyAccess) earlyAccessCoinTotal += getEpisodePriceByMethod(ep, 'coin');
      baseCoinTotal += finalPrice;
      if (canEpisodePayWithFastTicket(ep)) {
        fastTicketCount += 1;
        fastTicketRequiredTotal += Number(getEpisodePriceByMethod(ep, 'fast_ticket') || 0);
      }
      canUseCoin = canUseCoin && canEpisodePayWithCoin(ep);
      canUseFreecoin = canUseFreecoin && canEpisodePayWithFreecoin(ep);
      canUseFastTicket = canUseFastTicket && canEpisodePayWithFastTicket(ep);
    }
    const totalByMethod = payWith === 'freecoin'
      ? freecoinTotal + (fastPayWith === 'coin' ? earlyAccessCoinTotal : 0)
      : baseCoinTotal + (fastPayWith === 'coin' ? earlyAccessCoinTotal : 0);
    return {
      count: selectedEpisodes.length,
      total: totalByMethod,
      hasEarlyAccess: fastTicketCount > 0 || earlyAccessCoinTotal > 0,
      fastTicketCount,
      fastTicketRequiredTotal,
      earlyAccessCoinTotal,
      baseCoinTotal,
      coinTotal,
      freecoinTotal,
      fastTicketTotal,
      canUseCoin,
      canUseFreecoin,
      canUseFastTicket,
    };
  }, [selectedEpisodeIds, episodesData, payWith, fastPayWith]);

  const allSelectableIds = useMemo(() => {
    if (!episodesData?.groups) return [] as number[];
    const ids: number[] = [];
    for (const g of episodesData.groups) {
      const selectableList = getEpisodesForSelectionMode(g);
      for (let index = 0; index < selectableList.length; index += 1) {
        const ep = selectableList[index];
        if (isEpisodeSequentiallyUnlocked(ep, index, selectableList)) ids.push(ep.ep_id);
      }
    }
    return ids;
  }, [episodesData, selectedEpisodeIds, selectionModalMode]);

  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedEpisodeIds.includes(id));

  const getEpisodeById = (epId: number) => {
    if (episodesData?.groups) {
      for (const g of episodesData.groups) {
        const found = g.list.find((ep: any) => Number(ep.ep_id) === Number(epId));
        if (found) return found;
      }
    }
    return buyAllEpisodeMap[Number(epId)] || null;
  };

  const buildBuyEpsPayload = (epIds: number[], method: 'coin' | 'freecoin', earlyMethod: 'coin' | 'fast_ticket') => {
    const payload: any = {
      eps: epIds.map((id) => Number(id)),
      payWith: method,
    };

    let hasEarly = false;
    for (const id of epIds) {
      const ep = getEpisodeById(id);
      if (!ep) continue;
      const early = getEarlyAccess(ep);
      if (!early.isEarlyAccess) continue;
      hasEarly = true;
    }

    if (hasEarly) {
      if (earlyMethod === 'fast_ticket') {
        payload.fastPayWith = ['ticket'];
      } else {
        payload.fastPayWith = ['coin'];
      }
    }

    return payload;
  };

  const getTotalForEpisodeIds = (epIds: number[], method: 'coin' | 'freecoin' | 'fast_ticket') => {
    return epIds.reduce((sum, id) => {
      const ep = getEpisodeById(id);
      if (!ep) return sum;
      return sum + getEpisodePriceByMethod(ep, method);
    }, 0);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedEpisodeIds((prev) => prev.filter((id) => !allSelectableIds.includes(id)));
    } else {
      setSelectedEpisodeIds((prev) => Array.from(new Set([...prev, ...allSelectableIds])));
    }
  };

  // useEffect for syncing local state removed - accessing user.coin directly in render

  const { settings } = useWebsiteStore()

  useEffect(() => {
    if (selectedSummary.count === 0) return;
    if (payWith === 'freecoin' && !selectedSummary.canUseFreecoin) {
      if (selectedSummary.canUseCoin) setPayWith('coin');
      return;
    }
    if (fastPayWith === 'fast_ticket' && !selectedSummary.canUseFastTicket) {
      setFastPayWith('coin');
    }
  }, [selectedSummary, payWith, fastPayWith]);

  useEffect(() => {
    if (buyAllFastTicketCount > 0 && !selectedSummary.canUseFastTicket) setFastPayWith('coin');
  }, [buyAllFastTicketCount, payWith]);

  useEffect(() => {
    if (!episodesData?.groups || selectedEpisodeIds.length === 0) return;

    const validSelected = new Set<number>();
    for (const group of episodesData.groups) {
      for (let index = 0; index < group.list.length; index += 1) {
        const ep = group.list[index];
        const epId = Number(ep?.ep_id);
        if (!selectedEpisodeIds.includes(epId)) continue;
        if (isEpisodeSequentiallyUnlocked(ep, index, group.list)) {
          validSelected.add(epId);
        }
      }
    }

    if (validSelected.size !== selectedEpisodeIds.length) {
      setSelectedEpisodeIds((prev) => prev.filter((id) => validSelected.has(id)));
    }
  }, [episodesData, selectedEpisodeIds]);

  useEffect(() => {
    if (buyAllIds.length === 0) return;
    setBuyAllTotal(getTotalForEpisodeIds(buyAllIds, payWith));
  }, [buyAllIds, payWith, episodesData]);

  const renderMixedPriceSummary = (summary: {
    fastTicketRequiredTotal: number;
    earlyAccessCoinTotal: number;
    baseCoinTotal: number;
    canUseFreecoin: boolean;
  }) => {
    if (summary.fastTicketRequiredTotal <= 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-700">
        <div className="flex items-center gap-1 text-amber-700">
          <span>{summary.fastTicketRequiredTotal}</span>
          <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast ticket" width={14} height={14} unoptimized />
        </div>
        <span className="text-gray-400">/</span>
        <div className="flex items-center gap-1 text-orange-600">
          <span>{summary.earlyAccessCoinTotal}</span>
          <Image src={settings?.coin || '/images/e-coin.png'} alt="coin" width={14} height={14} unoptimized />
        </div>
        {summary.baseCoinTotal > 0 && (
          <>
            <span className="text-gray-400">+</span>
            <div className="flex items-center gap-1 text-red-600">
              <span>{summary.baseCoinTotal}</span>
              <Image src={settings?.coin || '/images/e-coin.png'} alt="coin" width={14} height={14} unoptimized />
              {summary.canUseFreecoin && (
                <Image src={settings?.freecoin || '/images/money-bag.png'} alt="freecoin" width={14} height={14} unoptimized />
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCompactEarlyAccessSummary = (summary: {
    fastTicketRequiredTotal: number;
    earlyAccessCoinTotal: number;
    baseCoinTotal: number;
    canUseFreecoin: boolean;
  }) => {
    if (summary.fastTicketRequiredTotal <= 0) return null;

    return (
      <div className="flex flex-wrap items-center justify-center gap-2 text-base font-semibold">
        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
          <span>(</span>
          <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast ticket" width={16} height={16} unoptimized />
          <span>{summary.fastTicketRequiredTotal}</span>
          <span className="text-gray-400">/</span>
          <Image src={settings?.coin || '/images/e-coin.png'} alt="fast coin" width={16} height={16} unoptimized />
          <span>{summary.earlyAccessCoinTotal}</span>
          <span>)</span>
        </div>
        {summary.baseCoinTotal > 0 && (
          <>
            <span className="text-gray-400">+</span>
            <div className="inline-flex items-center gap-1 text-orange-600">
              <Image src={settings?.coin || '/images/e-coin.png'} alt="coin" width={16} height={16} unoptimized />
              {summary.canUseFreecoin && (
                <Image src={settings?.freecoin || '/images/money-bag.png'} alt="freecoin" width={16} height={16} unoptimized />
              )}
              <span>{summary.baseCoinTotal}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderConfirmSummary = () => {
    if (!selectedSummary.hasEarlyAccess) {
      return (
        <div className="text-center flex justify-center items-center gap-2">
          รวมยอด: <b className="text-red-600 text-xl">{selectedSummary.total}</b>
          <Image src={payWith === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")} alt="currency" width={20} height={20} unoptimized />
        </div>
      );
    }

    const useFastTicket = fastPayWith === 'fast_ticket';
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
        <div className="text-xs font-medium text-gray-500 mb-2">สรุปราคา</div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-base font-semibold">
          <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-orange-600 border border-orange-100">
            <Image src={payWith === 'freecoin' ? (settings?.freecoin || '/images/money-bag.png') : (settings?.coin || '/images/e-coin.png')} alt="payment type" width={16} height={16} unoptimized />
            <span>{selectedSummary.baseCoinTotal}</span>
          </div>
          {selectedSummary.baseCoinTotal > 0 && (
            <>
              <span className="text-gray-400">+</span>
              <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-amber-700 border border-amber-100">
                <Image src={useFastTicket ? (settings?.fast_ticket || '/images/fast_ticket.png') : (settings?.coin || '/images/e-coin.png')} alt="early method" width={16} height={16} unoptimized />
                <span>{selectedSummary.fastTicketRequiredTotal}</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };


  // Helper for Stepper

  return (
    <aside className="w-full">
      <div className="sticky top-4 space-y-4">
        {/* Pills Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5">
          <div className="w-full">
            <div
              role="button"
              tabIndex={0}
              onClick={() => { if (!isLoggedIn) openLoginModal(); }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') && !isLoggedIn) openLoginModal(); }}
              className="w-full"
            >
              {isLoggedIn ? (
                <div className="flex items-center gap-2 justify-between w-full flex-wrap">
                   <AmountPill amount={Number(user?.coin || 0)} />
                   <FastTicketPill amount={Number(user?.fast_ticket || 0)} className="bg-gray-50 !border-gray-200" />
                   {book.use_freecoin === 1 && (
                      <FreeCoinPill amount={Number(user?.freecoin || 0)} className="bg-gray-50 !border-gray-200" />
                   )}
                </div>
              ) : (
                <div className="flex justify-center">
                  <Pill className="px-6 bg-gray-50 border-dashed border-gray-200 text-gray-600 cursor-pointer justify-center">
                    <span className="text-sm font-medium">เข้าสู่ระบบ</span>
                  </Pill>
                </div>
              )}  
            </div>
          </div>
        </div>

        {/* Content Card */}
        {!isDeleted && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-5 py-2 border-b border-gray-100">

          </div>
          <div className="px-5 pb-5 pt-3">
          {isLoggedIn && Number(book.total_remaining_count ?? 0) === 0 && Number(book.total_remaining_total ?? 0) === 0 ? (
            <div className="mt-2 px-5 pb-5">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-green-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className=" text-green-800 text-base">คุณเป็นเจ้าของนิยายเรื่องนี้ครบทุกตอนแล้ว</div>
              </div>
            </div>
          ) : isLoggedIn && Number(book.remaining_paid_count ?? 0) === 0 && Number(book.remaining_paid_total ?? 0) === 0 && hasEarlyAccessEpisodes ? (
            <div className="mt-2 px-5 pb-5">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-amber-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-amber-800 text-base">คุณเป็นเจ้าของนิยายตอนปัจจุบันครบแล้ว</div>
                <div className="text-amber-600 text-sm">ยังมีตอนล่วงหน้าให้ซื้อเพิ่ม</div>
              </div>
              <div className="pt-4">
                <button
                  onClick={handleBuyEarlyAccessClick}
                  className="block w-full h-12 rounded-2xl border-2 border-amber-500 text-amber-600 text-lg font-bold hover:bg-amber-50 transition-colors"
                >
                  ซื้อตอนล่วงหน้า
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Ownership Status */}
              {isLoggedIn && (
                <p className="text-[14px] text-gray-800 mb-3">
                  คุณยังไม่ได้เป็นเจ้าของอีก{" "}
                  <span className="text-red-600 font-semibold">{book.remaining_paid_count ?? 0} ตอน</span>
                </p>
              )}

              {/* Promotion Banner */}
              {book.promotion && (
                <div className="mb-3 rounded-xl overflow-hidden bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md">
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs font-medium opacity-90 mb-0.5 drop-shadow-sm">โปรโมชั่นพิเศษ</div>
                        <h4 className="font-bold text-lg leading-tight drop-shadow-md">{book.promotion.title}</h4>
                      </div>
                      <div className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-lg shadow-sm whitespace-nowrap">
                        ลด {book.promotion.percent}%
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 mb-2 pt-3 border-t border-white/20">
                      <div className="text-xs opacity-90 drop-shadow-sm">เหลือเวลาอีก</div>
                      <CountdownTimer endDate={book.promotion.endDate} />
                    </div>

                    <button
                      onClick={handleBuyPromotion}
                      disabled={buyLoading}
                      className="group w-full mt-4 bg-white !text-red-600 font-bold py-3 rounded-xl text-sm hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg border-2 border-white/50"
                    >
                      {buyLoading ? <Spin size="small" /> : (
                        <>
                          <span className="text-lg !text-red-600 ">ซื้อราคาโปรโมชั่น</span>
                          <div className="flex items-center gap- bg-red-50 px-3 py-1 rounded-full border border-red-100 group-hover:bg-red-100 transition-colors">
                            <span className="!text-red-600 font-extrabold text-base">{book.promotion.price.toLocaleString()}</span>
                            <Image src="/images/e-coin.png" alt="Coin" width={18} height={18} className="drop-shadow-sm" unoptimized />
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Price box */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleBuyAllClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { handleBuyAllClick(); } }}
                className="rounded-2xl bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-200 shadow-inner px-5 py-3 mb-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-gray-800">
                      เหมาทั้งเรื่อง
                    </span>
                    <Image src={settings?.coin || '/images/e-coin.png'} alt="Coin" width={20} height={20} unoptimized />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl leading-none font-extrabold text-red-600">
                      {(book.remaining_paid_total ?? book.price ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center text-gray-500 text-xs mb-3">หรือ</div>
              {hasEarlyAccessEpisodes && Number(book.remaining_paid_count ?? 0) === 0 && Number(book.remaining_paid_total ?? 0) === 0 && (
                <button
                  onClick={handleBuyEarlyAccessClick}
                  className="w-full h-12 rounded-2xl border-2 border-amber-500 text-amber-600 text-lg font-bold hover:bg-amber-50 transition-colors mb-3"
                >
                  ซื้อตอนล่วงหน้า
                </button>
              )}
              <button
                onClick={() => openModal('all')}
                className="w-full h-12 rounded-2xl border-2 border-red-600 text-red-600 text-lg font-bold hover:bg-red-50 transition-colors"
              >
                เลือกตอนเอง
              </button>
            </>
          )}

              <Modal
                wrapClassName="book-select-modal"
                title={null}
                open={isModalOpen}
                onCancel={closeModal}
                zIndex={2000}
                footer={
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <Button onClick={closeModal} className="border border-red-200 text-red-600 bg-white !hover:bg-red-50">ยกเลิก</Button>
                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        <div className="text-sm text-gray-700">เลือก {selectedSummary.count} ตอน</div>
                        {selectedSummary.fastTicketCount > 0 ? renderMixedPriceSummary(selectedSummary) : (
                          <div className="text-sm font-semibold text-red-600 flex items-center gap-2">
                            รวม {selectedSummary.total}
                            <Image src={payWith === 'freecoin' ? (settings?.freecoin || '/images/money-bag.png') : (settings?.coin || '/images/e-coin.png')} alt="currency" width={16} height={16} unoptimized />
                          </div>
                        )}
                        <Button type="primary" danger disabled={selectedSummary.count === 0} onClick={() => {
                          if (!isLoggedIn) {
                            setIsModalOpen(false);
                            setSelectedEpisodeIds([]);
                            openLoginModal();
                            return;
                          }
                          setPayWith('coin');
                          setFastPayWith(selectedSummary.hasEarlyAccess && selectedSummary.canUseFastTicket ? 'fast_ticket' : 'coin');
                          setManualBuyConfirmModalOpen(true);
                        }}>
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
                {isFetching ? (
                  <GifLoader className="py-12" />
                ) : (
                  <div>
                    {selectionModalMode === 'early' && (
                      <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                        เลือกซื้อเฉพาะตอนล่วงหน้า
                      </div>
                    )}
                    {/* Top select-all banner */}
                    <div className="bg-pink-50 border border-pink-100 rounded px-4 py-3 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={allSelected} indeterminate={!allSelected && selectedSummary.count > 0} onChange={toggleSelectAll} />
                        <div className="text-sm">{selectionModalMode === 'early' ? 'เลือกตอนล่วงหน้าทั้งหมด' : 'เลือกตอนทั้งหมด'} ({allSelectableIds.length} ตอน)</div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700 flex-wrap justify-end">
                        <div>เลือก {selectedSummary.count} ตอน</div>
                        {selectedSummary.fastTicketCount > 0 ? renderMixedPriceSummary(selectedSummary) : (
                          <div className="font-semibold text-red-600 flex items-center gap-1">
                            รวม {selectedSummary.total}
                            <div className="relative w-4 h-4 shrink-0">
                              <Image src={payWith === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")} alt="currency" fill className="object-contain" unoptimized />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-auto">
                      {episodesData?.groups?.map((group: EpisodeGroup) => {
                        const visibleEpisodes = getEpisodesForSelectionMode(group);
                        if (visibleEpisodes.length === 0) return null;
                        const gid = String(group.group_id);
                        const isExpanded = expandedGroups[gid] ?? false;
                        const selectableIds = visibleEpisodes
                          .filter((ep: any, index: number) => isEpisodeSequentiallyUnlocked(ep, index, visibleEpisodes))
                          .map((ep: any) => ep.ep_id);
                        const selectedCountInGroup = selectableIds.filter((id: number) => selectedEpisodeIds.includes(Number(id))).length;
                        const allSelectedInGroup = selectableIds.length > 0 && selectedCountInGroup === selectableIds.length;

                        return (
                          <div key={group.group_id} className="rounded bg-white border border-gray-100">
                            <div className="px-4 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={allSelectedInGroup}
                                  indeterminate={selectedCountInGroup > 0 && !allSelectedInGroup}
                                  disabled={selectableIds.length === 0}
                                  onChange={() => toggleGroupSelect(group)}
                                />
                                <button onClick={() => toggleGroup(group.group_id)} className="flex items-center gap-3">
                                  <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  <div className="font-semibold">{group.name}</div>
                                </button>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-500">{visibleEpisodes.length} ตอน</div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="divide-y">
                                {visibleEpisodes.map((episode: any, index: number) => {
                                  const early = getEarlyAccess(episode);
                                  const fastTicketDisplayPrice = early.fastTicketPrice ?? 1;
                                  const canUseFreecoin = canEpisodePayWithFreecoin(episode);
                                  const sequentialUnlocked = isEpisodeSequentiallyUnlocked(episode, index, visibleEpisodes);
                                  const isFastEpisode = early.isEarlyAccess;
                                  const fastLocked = isFastEpisode && !sequentialUnlocked && !episode?.isBuy;
                                  const fastBuyable = isFastEpisode && sequentialUnlocked && !episode?.isBuy;
                                  const disabled = !isEpisodeBaseSelectable(episode) || !sequentialUnlocked;
                                  const checked = selectedEpisodeIds.includes(Number(episode.ep_id));
                                  const { regularPrice, promoPrice, hasPromo, finalPrice, activePromo } = resolveEpisodePrice(episode);
                                  const rpEarn = Number(episode?.rp_campaign?.rp_earn ?? 0);
                                  const rpCampaignEnd = episode?.rp_campaign?.end_date
                                    ? Date.parse(episode.rp_campaign.end_date)
                                    : null;
                                  const isRpCampaignActive = !episode.isBuy
                                    && regularPrice > 0
                                    && rpEarn > 0
                                    && (rpCampaignEnd === null || (Number.isFinite(rpCampaignEnd) && rpCampaignEnd > Date.now()));

                                  return (
                                    <div key={episode.ep_id} className={`flex items-center justify-between px-4 py-3 ${disabled ? 'opacity-60' : ''}`}>
                                      <div className="flex items-center gap-3">
                                        <Checkbox
                                          checked={checked}
                                          disabled={disabled}
                                          onChange={() => toggleEpisode(episode.ep_id)}
                                        />
                                        <div className="min-w-0">
                                          <div className={`text-sm font-medium line-clamp-2 ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>
                                            {episode.name}
                                          </div>
                                          {fastLocked && !sequentialUnlocked && (
                                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                                              <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast ticket" width={12} height={12} unoptimized />
                                              ตอนล่วงหน้า (ซื้อตอนก่อนหน้า)
                                            </div>
                                          )}
                                          {fastLocked && sequentialUnlocked && (
                                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                              <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast ticket" width={12} height={12} unoptimized />
                                              ตอนล่วงหน้า (ปลดล็อคแล้ว)
                                            </div>
                                          )}
                                              {fastBuyable && (
                                                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                                                  ตอนล่วงหน้า
                                                </div>
                                              )}
                                          <div className="text-xs text-gray-500">{episode.view} • {new Date(episode.publish_datetime).toLocaleDateString('th-TH')}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {(regularPrice > 0 || hasPromo) ? (
                                          <div className="flex flex-col items-end gap-1">
                                            {isRpCampaignActive && (
                                              <div className="flex items-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                                                  +{rpEarn}
                                                  {settings?.rp ? (
                                                    <Image
                                                      src={settings.rp}
                                                      alt="rank point"
                                                      width={12}
                                                      height={12}
                                                      className="object-contain"
                                                      unoptimized
                                                    />
                                                  ) : (
                                                    <span>RP</span>
                                                  )}
                                                </span>
                                                {episode?.rp_campaign?.end_date && (
                                                  <CommonCountdownTimer targetDate={episode.rp_campaign.end_date} variant="violet" label="RP" />
                                                )}
                                              </div>
                                            )}
                                            {hasPromo && activePromo?.end_date && (
                                              <div className="flex items-center justify-end">
                                                <CommonCountdownTimer targetDate={activePromo.end_date} variant="rose" label="ลดอีก" />
                                              </div>
                                            )}
                                            <div className="flex items-center gap-1.5 justify-end">
                                              {fastBuyable ? (
                                                <div className="flex items-center gap-2 justify-end text-xs font-medium">
                                                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                                                    <span>(</span>
                                                    {early.fastTicket && (
                                                      <>
                                                        <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast ticket" width={14} height={14} unoptimized />
                                                        <span className="text-sm font-semibold">{fastTicketDisplayPrice}</span>
                                                      </>
                                                    )}
                                                    {early.fastTicket && <span className="text-gray-400">/</span>}
                                                    <Image src={settings?.coin || '/images/e-coin.png'} alt="fast coin" width={14} height={14} unoptimized />
                                                    <span className="text-sm font-semibold">{early.fastCoinPrice}</span>
                                                    <span>)</span>
                                                  </div>
                                                  <span className="text-gray-400">+</span>
                                                  <div className="inline-flex items-center gap-1 text-orange-600">
                                                    <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={14} height={14} unoptimized />
                                                    {canUseFreecoin && (
                                                      <Image src={settings?.freecoin || "/images/money-bag.png"} alt="freecoin" width={14} height={14} unoptimized />
                                                    )}
                                                    <span className="text-sm font-semibold">{finalPrice}</span>
                                                    {hasPromo && (
                                                      <span className="text-xs text-gray-400 line-through decoration-gray-300">{regularPrice}</span>
                                                    )}
                                                  </div>
                                                </div>
                                              ) : hasPromo ? (
                                                <div className="inline-flex items-center gap-1.5 justify-end">
                                                  {canUseFreecoin && (
                                                    <Image src={settings?.freecoin || "/images/money-bag.png"} alt="freecoin" width={16} height={16} unoptimized />
                                                  )}
                                                  <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={16} height={16} unoptimized />
                                                  <span className="text-sm font-semibold text-rose-600">{promoPrice}</span>
                                                  <span className="text-xs text-gray-400 line-through decoration-gray-300">{regularPrice}</span>
                                                </div>
                                              ) : (
                                                <div className="inline-flex items-center gap-1.5 justify-end">
                                                  {canUseFreecoin && (
                                                    <Image src={settings?.freecoin || "/images/money-bag.png"} alt="freecoin" width={16} height={16} unoptimized />
                                                  )}
                                                  <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={16} height={16} unoptimized />
                                                  <span className="text-sm font-semibold text-orange-600">{regularPrice}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-sm font-semibold text-emerald-600">อ่านฟรี</span>
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

              {/* Manual Buy Confirmation Modal */}
              <Modal
                title="ยืนยันการซื้อ"
                open={manualBuyConfirmModalOpen}
                onCancel={() => setManualBuyConfirmModalOpen(false)}
                zIndex={2100}
                centered
                footer={null}
                width={400}
              >
                <div className="flex flex-col gap-4 py-4">
                  <div className="text-base text-gray-800 text-center">
                    คุณต้องการซื้อตอนที่เลือกไว้หรือไม่?
                  </div>
                  <div className="text-center">
                    ตอนที่เลือก: <b>{selectedSummary.count} ตอน</b>
                  </div>
                  {renderConfirmSummary()}

                  {selectedSummary.hasEarlyAccess ? (
                    <div className="space-y-3">
                      <div>
                        <div className="mb-2 text-center text-xs font-medium text-gray-500">ชำระราคาตอนปกติ</div>
                          <div className="flex justify-center">
                            <Radio.Group value={payWith} onChange={(e) => setPayWith(e.target.value)} buttonStyle="solid">
                              <Radio.Button value="coin" disabled={!selectedSummary.canUseCoin}>
                                <div className="flex items-center gap-1">เหรียญ <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={14} height={14} unoptimized /></div>
                              </Radio.Button>
                              <Radio.Button value="freecoin" disabled={!selectedSummary.canUseFreecoin}>
                                <div className="flex items-center gap-1">ถุงเงิน <Image src={settings?.freecoin || "/images/money-bag.png"} alt="free" width={14} height={14} unoptimized /></div>
                              </Radio.Button>
                            </Radio.Group>
                          </div>
                      </div>

                      <div>
                        <div className="mb-2 text-center text-xs font-medium text-gray-500">ชำระส่วนตอนล่วงหน้า</div>
                        <div className="flex justify-center">
                          <Radio.Group value={fastPayWith} onChange={(e) => setFastPayWith(e.target.value)} buttonStyle="solid">
                            <Radio.Button value="coin" disabled={!selectedSummary.canUseCoin}>
                              <div className="flex items-center gap-1">เหรียญ <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={14} height={14} unoptimized /></div>
                            </Radio.Button>
                            <Radio.Button value="fast_ticket" disabled={!selectedSummary.canUseFastTicket}>
                              <div className="flex items-center gap-1">FastTicket <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast" width={14} height={14} unoptimized /></div>
                            </Radio.Button>
                          </Radio.Group>
                        </div>
                      </div>

                    </div>
                  ) : (selectedSummary.canUseCoin || selectedSummary.canUseFreecoin) && (
                    <div className="flex justify-center mt-2">
                      <Radio.Group value={payWith} onChange={(e) => setPayWith(e.target.value)} buttonStyle="solid">
                        <Radio.Button value="coin" disabled={!selectedSummary.canUseCoin}>
                          <div className="flex items-center gap-1">เหรียญ <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={14} height={14} unoptimized /></div>
                        </Radio.Button>
                        <Radio.Button value="freecoin" disabled={!selectedSummary.canUseFreecoin}>
                          <div className="flex items-center gap-1">ถุงเงิน <Image src={settings?.freecoin || "/images/money-bag.png"} alt="free" width={14} height={14} unoptimized /></div>
                        </Radio.Button>
                      </Radio.Group>
                    </div>
                  )}

                  <div className="flex gap-3 justify-center mt-4">
                    <Button onClick={() => setManualBuyConfirmModalOpen(false)} className="w-1/2 !bg-white !text-red-600 hover:!border-red-600">ยกเลิก</Button>
                    <Button type="primary" danger loading={buyLoading} className="w-1/2 !bg-red-600" onClick={async () => {
                      try {
                        setBuyLoading(true);
                        const payload = buildBuyEpsPayload(selectedEpisodeIds, payWith, fastPayWith);
                        const res = await apiClient.post(`/buy/eps`, payload);
                        if (res?.data?.code === 200) {

                          // Log buy_episode
                          console.log('[LOG] buy_episode =>', { bookId, episodes: selectedEpisodeIds.length, payWith });
                          log('buy_episode', 'book', String(bookId), { episodes_count: selectedEpisodeIds.length, total: selectedSummary.total, method: payWith, book_title: book?.title });
                          setShowSuccess(true);

                          if (res.data?.data?.rp_earned && res.data.data.rp_earned > 0) {
                            notification.success({
                              message: 'ยินดีด้วย!',
                              description: (
                                <div className="flex items-center gap-1">
                                  <span>คุณได้รับ {res.data.data.rp_earned}</span>
                                  {settings?.rp ? (
                                    <Image src={settings.rp} alt="RP" width={16} height={16} unoptimized className="object-contain" />
                                  ) : (
                                    <span>RP</span>
                                  )}
                                </div>
                              ),
                              placement: 'topRight',
                            });
                          }

                          if (res.data?.data?.token) {
                            updateToken(res.data.data.token);
                          } else {
                            try {
                              const refreshRes = await refreshToken();
                              if (refreshRes?.data?.token) updateToken(refreshRes.data.token);
                            } catch { }
                          }

                          setManualBuyConfirmModalOpen(false);
                          closeModal(); // Close the main selection modal too
                          setSelectedEpisodeIds([]);
                        } else {
                          messageApi.error(res?.data?.message || 'ไม่สามารถทำการซื้อได้');
                        }
                      } catch (err: any) {
                        messageApi.error(err?.response?.data?.message || 'เกิดข้อผิดพลาดขณะซื้อ');
                      } finally {
                        setBuyLoading(false);
                      }
                    }}>ยืนยัน</Button>
                  </div>
                </div>
              </Modal>

              {/* Buy All Confirmation Modal */}
              <Modal
                title="ยืนยันการซื้อ"
                open={buyAllModalOpen}
                onCancel={() => {
                  setBuyAllModalOpen(false);
                  setBuyAllFastTicketCount(0);
                }}
                zIndex={2100}
                centered
                footer={null}
                width={400}
              >
                <div className="flex flex-col gap-4 py-4">
                  <div className="text-base text-gray-800 text-center">
                    {bulkPurchaseMode === 'early' ? 'คุณต้องการซื้อเฉพาะตอนล่วงหน้าหรือไม่?' : 'คุณต้องการซื้อทั้งเรื่องหรือไม่?'}
                  </div>
                  <div className="text-center">
                    ตอนที่ต้องซื้อ: <b>{buyAllIds.length} ตอน</b>
                  </div>
                  <div className="text-center flex justify-center items-center gap-2">
                    รวมยอด: <b className="text-red-600 text-xl">{buyAllTotal.toLocaleString()}</b>
                    <Image src={payWith === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")} alt="currency" width={20} height={20} unoptimized />
                  </div>

                  {buyAllFastTicketCount > 0 && (
                    <div className="text-center flex justify-center items-center gap-2 text-amber-700">
                      ต้องใช้ FastTicket <b>{buyAllFastTicketCount}</b>
                      <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast ticket" width={18} height={18} unoptimized />
                    </div>
                  )}

                  {(book.use_freecoin === 1 || buyAllFastTicketCount > 0) && (
                    <div className="flex justify-center mt-2">
                      <Radio.Group value={payWith} onChange={(e) => setPayWith(e.target.value)} buttonStyle="solid">
                        <Radio.Button value="coin">
                          <div className="flex items-center gap-1">เหรียญ <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={14} height={14} unoptimized /></div>
                        </Radio.Button>
                        <Radio.Button value="freecoin" disabled={buyAllFastTicketCount > 0}>
                          <div className="flex items-center gap-1">ถุงเงิน <Image src={settings?.freecoin || "/images/money-bag.png"} alt="free" width={14} height={14} unoptimized /></div>
                        </Radio.Button>
                        <Radio.Button value="fast_ticket" disabled={buyAllFastTicketCount === 0}>
                          <div className="flex items-center gap-1">FastTicket <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast" width={14} height={14} unoptimized /></div>
                        </Radio.Button>
                      </Radio.Group>
                    </div>
                  )}

                  {/* หมายเหตุการซื้อ */}
                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-xs text-gray-700 mt-3">
                      {bulkPurchaseMode === 'early' ? (
                          <p>
                              <span className="font-bold text-red-700">ซื้อตอนล่วงหน้า:</span> ระบบจะคำนวณเฉพาะตอนล่วงหน้าที่สามารถซื้อได้ในขณะนี้เท่านั้น และไม่รวมตอนปกติอื่น ๆ
                          </p>
                      ) : (
                        <>
                          {book.end === 'end' ? (
                              <p className="mb-1">
                                  <span className="font-bold text-red-700">กรณีซื้อทั้งเรื่องที่สถานะจบ :</span> คุณจะได้รับสิทธิ์ในการเข้าถึงเนื้อหา &quot;ทุกตอนที่ท่านยังไม่เคยทำการซื้อ&quot; ทั้งหมด โดยราคาจะคำนวนเฉพาะตอนที่ยังไม่เคยซื้อ
                              </p>
                          ) : (
                              <p className="mb-1">
                                  <span className="font-bold text-red-700">สำหรับผลงานที่ยังไม่จบ:</span> คุณจะได้รับสิทธิ์ในการเข้าถึงเนื้อหา &quot;ทุกตอนที่ท่านยังไม่เคยทำการซื้อ&quot; ราคาที่แสดงจะเป็นการคำนวณยอดรวมเฉพาะ &quot;ตอนที่อัปเดตล่าสุด ณ วันที่ทำรายการซื้อ&quot; เท่านั้น (ไม่รวมถึงตอนที่จะอัปเดตเพิ่มในอนาคต)
                              </p>
                          )}
                          {hasEarlyAccessEpisodes && (
                            <p className="mt-1 text-amber-700 font-bold">
                              * เหมาทั้งเรื่อง ไม่ได้รวมตอนล่วงหน้า
                            </p>
                          )}
                        </>
                      )}
                  </div>

                  <div className="flex gap-3 justify-center mt-4">
                    <Button onClick={() => setBuyAllModalOpen(false)} className="w-1/2 !bg-white !text-red-600 hover:!border-red-600">ยกเลิก</Button>
                    <Button type="primary" danger loading={buyLoading} className="w-1/2 !bg-red-600" onClick={async () => {
                      try {
                        if (buyAllFastTicketCount > 0 && payWith === 'freecoin') {
                          messageApi.error('ตอนล่วงหน้าต้องใช้ FastTicket + เหรียญ');
                          return;
                        }
                        setBuyLoading(true);
                        const payload = buildBuyEpsPayload(buyAllIds, payWith, fastPayWith);
                        const res = await apiClient.post(`/buy/eps`, payload);
                        if (res?.data?.code === 200) {

                          // Log buy_episode (buy all)
                          console.log('[LOG] buy_episode (all) =>', { bookId, episodes: buyAllIds.length, total: buyAllTotal, payWith });
                          log('buy_episode', 'book', String(bookId), { episodes_count: buyAllIds.length, total: buyAllTotal, method: payWith, buy_all: true, book_title: book?.title });

                          setShowSuccess(true);

                          if (res.data?.data?.rp_earned && res.data.data.rp_earned > 0) {
                            notification.success({
                              message: 'ยินดีด้วย!',
                              description: (
                                <div className="flex items-center gap-1">
                                  <span>คุณได้รับ {res.data.data.rp_earned}</span>
                                  {settings?.rp ? (
                                    <Image src={settings.rp} alt="RP" width={16} height={16} unoptimized className="object-contain" />
                                  ) : (
                                    <span>RP</span>
                                  )}
                                </div>
                              ),
                              placement: 'topRight',
                            });
                          }
                          if (res.data?.data?.token) {
                            const newToken = res.data.data.token;
                            const decoded = decodeToken(newToken);

                            if (user) {
                              let finalCoin = Number(decoded.coin ?? decoded.coins ?? decoded.goldCoins ?? decoded.gold_coin ?? 0);
                              let finalFreeCoin = Number(decoded.freecoin ?? 0);

                              if (payWith === 'coin') {
                                const expectedCoin = (Number(user.coin) || 0) - buyAllTotal;
                                if (finalCoin > expectedCoin) finalCoin = expectedCoin;
                              } else if (payWith === 'freecoin') {
                                const expectedFreeCoin = (Number(user.freecoin) || 0) - buyAllTotal;
                                if (finalFreeCoin > expectedFreeCoin) finalFreeCoin = expectedFreeCoin;
                              }

                              const mergedUser = { ...user, ...decoded, coin: finalCoin >= 0 ? finalCoin : 0, freecoin: finalFreeCoin >= 0 ? finalFreeCoin : 0 };
                              useAuthStore.getState().login(mergedUser, newToken);
                            } else {
                              updateToken(newToken);
                            }
                          } else {
                            // If no token returned, try refresh
                            try {
                              const refreshRes = await refreshToken();
                              if (refreshRes?.data?.token) updateToken(refreshRes.data.token);
                            } catch { }
                          }
                          setBuyAllModalOpen(false);
                          setBuyAllIds([]);
                          setBuyAllFastTicketCount(0);
                        } else {
                          messageApi.error(res?.data?.message || 'ไม่สามารถทำการซื้อได้');
                        }
                      } catch (err: any) {
                        messageApi.error(err?.response?.data?.message || 'เกิดข้อผิดพลาดขณะซื้อ');
                      } finally {
                        setBuyLoading(false);
                      }
                    }}>ยืนยัน</Button>
                  </div>
                </div>
              </Modal>


          <style>{`
            @media (max-width: 768px) {
              .book-select-modal .ant-modal {
                max-width: calc(100vw - 16px) !important;
                margin: 8px auto !important;
              }

              .book-select-modal .ant-modal-content {
                padding-inline: 10px;
              }
            }
          `}</style>

          {/* Divider */}
          <div className="hidden lg:block my-5 border-t border-gray-200" />

        </div >
      </div >
      )}
    </div >
      {showSuccess && <SuccessAnimation onComplete={async () => {
        setShowSuccess(false);
        await queryClient.invalidateQueries({ queryKey: ["bookEpisodes", String(bookId ?? "")] });
        await queryClient.invalidateQueries({ queryKey: ["bookDetail", String(bookId ?? "")] });
      }} />}

      <style>{`
          .book-select-modal .ant-checkbox-inner { border-color: #e11d48; transition: border-color .12s, background-color .12s; }
          /* Hover on wrapper or checkbox itself */
          .book-select-modal .ant-checkbox-wrapper:hover .ant-checkbox-inner,
          .book-select-modal .ant-checkbox:hover .ant-checkbox-inner {
            border-color: #e11d48 !important;
          }
          /* Focused input (keyboard) */
          .book-select-modal .ant-checkbox-input:focus + .ant-checkbox-inner {
            border-color: #e11d48 !important;
            box-shadow: none !important;
          }
          /* Checked state should use red instead of default blue */
          .book-select-modal .ant-checkbox-checked .ant-checkbox-inner {
            background-color: #e11d48 !important;
            border-color: #e11d48 !important;
          }

          /* Red Radio Buttons */
          /* Checked State */
          .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
            background-color: #e11d48 !important;
            border-color: #e11d48 !important;
            color: white !important;
          }
           /* Checked Hover */
          .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):hover {
            background-color: #be123c !important;
            border-color: #be123c !important;
            color: white !important;
          }

          /* Unchecked State - ensure text isn't blue on hover */
          .ant-radio-button-wrapper:hover {
            color: #e11d48 !important;
            border-color: #e11d48 !important;
          }

          /* Focus / Active - Remove blue shadow */
           .ant-radio-button-wrapper:focus-within {
            box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.12) !important;
           }
           
           /* Separator line when checked */
           .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)::before {
            background-color: #e11d48 !important;
           }
        `}</style>
    </aside >
  );
};
export default BookInfoCard;
