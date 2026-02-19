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
import { useWebsiteStore } from '@/stores/websiteStore';
import { jwtDecode } from "jwt-decode";
import { imageLoader } from '@/utils/imageUtils';
import type { Episode, EpisodeGroup, BookEpisodesResponse } from '@/types/api';
import { getErrorMessage } from '@/types/errors';
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
  } catch (error) {
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
  const [heartQty, setHeartQty] = useState<number>(0);
  const [roseQty, setRoseQty] = useState<number>(0);
  const { token, isLoggedIn, updateToken, user } = useAuthStore();
  const openLoginModal = useUIStore((s) => s.openLoginModal);
  const queryClient = useQueryClient();
  const { message: messageApi, modal: modalApi, notification: notificationApi } = App.useApp();
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

  // Fetch episodes when modal opens
  const queryResult = useQuery<BookEpisodesResponse>({
    queryKey: ["bookEpisodes", String(bookId ?? ""), token],
    queryFn: () => fetchBookEpisodes(String(bookId ?? "")),
    enabled: isModalOpen && !!bookId,
    staleTime: 5 * 60 * 1000,
  });
  const episodesData = queryResult.data;
  const isFetching = queryResult.isFetching;

  const openModal = () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    setSelectedEpisodeIds([]);
    // expand first group by default when opening
    if (episodesData?.data?.groups && episodesData.data.groups.length > 0) {
      const firstId = String(episodesData.data.groups[0].group_id);
      const map: Record<string, boolean> = {};
      for (const g of episodesData.data.groups) map[String(g.group_id)] = false;
      map[firstId] = true;
      setExpandedGroups(map);
    }
    setPayWith('coin');
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
          <div>คุณต้องการซื้อโปรโมชั่น "{book.promotion.title}" หรือไม่?</div>
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
            const respMsg = res.data?.message || 'ซื้อโปรโมชั่นสำเร็จ!';

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
      let total = 0;
      for (const g of groups) {
        for (const ep of g.list) {
          if (ep.coin > 0 && !ep.isBuy) {
            selectableIds.push(Number(ep.ep_id));
            total += Number(ep.coin || 0);
          }
        }
      }

      if (selectableIds.length === 0) {
        messageApi.info('ไม่มีตอนที่ต้องชำระเงินให้ซื้อทั้งหมด');
        setBuyLoading(false);
        return;
      }

      setBuyAllIds(selectableIds);
      setBuyAllTotal(total);
      setPayWith('coin'); // Default to coin
      setBuyAllModalOpen(true);
      setBuyLoading(false);

    } catch (err) {
      messageApi.error('เกิดข้อผิดพลาด ขณะเตรียมการซื้อ');
      setBuyLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEpisodeIds([]);
  };

  const toggleEpisode = (epId: number) => {
    setSelectedEpisodeIds((prev) =>
      prev.includes(epId) ? prev.filter((id) => id !== epId) : [...prev, epId]
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
    const selectable = group.list.filter((ep: any) => ep.coin > 0 && !ep.isBuy).map((ep: any) => ep.ep_id);
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

    // Helper to safe parse price
    const getPrice = (val: any) => {
      if (val === null || val === undefined) return undefined;
      const v = Number(val);
      return isNaN(v) ? undefined : v;
    };

    // 1. Check Discount Object (Priority 1)
    if (episode.Discount) {
      const p = getPrice(episode.Discount.discount_price);
      if (p !== undefined) promoPrice = p;
    }
    // 2. Fallback: Nested promotions
    else if (Array.isArray(episode.promotions) && episode.promotions.length > 0) {
      const p = getPrice(episode.promotions[0].discount_price);
      if (p !== undefined) promoPrice = p;
    }
    // 3. Fallback: Direct property
    else if (episode.discount_price !== undefined) {
      const p = getPrice(episode.discount_price);
      if (p !== undefined) promoPrice = p;
    }

    const hasPromo = !episode.isBuy && promoPrice !== undefined && promoPrice < regularPrice && promoPrice >= 0;
    const finalPrice = hasPromo ? (promoPrice as number) : regularPrice;

    return { regularPrice, promoPrice, hasPromo, finalPrice };
  };

  const selectedSummary = useMemo(() => {
    if (!episodesData?.data?.groups) return { count: 0, total: 0 };
    let total = 0;
    for (const g of episodesData.data.groups) {
      for (const ep of g.list) {
        if (selectedEpisodeIds.includes(ep.ep_id) && ep.coin > 0) {
          const { finalPrice } = resolveEpisodePrice(ep);
          total += finalPrice;
        }
      }
    }
    return { count: selectedEpisodeIds.length, total };
  }, [selectedEpisodeIds, episodesData]);

  const allSelectableIds = useMemo(() => {
    if (!episodesData?.data?.groups) return [] as number[];
    const ids: number[] = [];
    for (const g of episodesData.data.groups) {
      for (const ep of g.list) {
        if (ep.coin > 0 && !ep.isBuy) ids.push(ep.ep_id);
      }
    }
    return ids;
  }, [episodesData]);

  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedEpisodeIds.includes(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedEpisodeIds((prev) => prev.filter((id) => !allSelectableIds.includes(id)));
    } else {
      setSelectedEpisodeIds((prev) => Array.from(new Set([...prev, ...allSelectableIds])));
    }
  };

  // useEffect for syncing local state removed - accessing user.coin directly in render

  const { settings } = useWebsiteStore()

  const handleSendGift = async (sendType: 'heart' | 'flower', amount: number) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (amount <= 0) return;

    try {
      const payload = {
        sendType,
        amount,
        book_id: bookId,
      };
      const res = await apiClient.post('/user/sendGift', payload);
      if (res?.data?.code === 200) {
        notificationApi.success({
          message: 'สำเร็จ',
          description: 'ส่งของขวัญสำเร็จแล้ว',
          placement: 'topRight',
          icon: <div className="text-green-500">🎁</div>,
        });

        // Reset quantity
        if (sendType === 'heart') setHeartQty(0);
        else setRoseQty(0);

        // Update user balance if token is returned
        const responseData = res?.data?.data;
        const maybeToken = typeof responseData === 'string' ? responseData : (responseData?.token ?? res?.data?.token);

        if (maybeToken && typeof updateToken === 'function') {
          updateToken(String(maybeToken));
        }
      } else {
        messageApi.error(res?.data?.message || 'ส่งของขวัญไม่สำเร็จ');
      }
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message || 'เกิดข้อผิดพลาดขณะส่งของขวัญ');
    }
  };

  // Helper for Stepper
  const Stepper = ({ value, onChange, min = 0 }: { value: number, onChange: (val: number) => void, min?: number }) => (
    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-8 w-fit mx-auto">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors"
        disabled={value <= min}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (!isNaN(val)) onChange(val);
          else onChange(min);
        }}
        className="w-12 h-full text-center bg-transparent border-x border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none no-spinners"
      />
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-r-lg transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <style jsx global>{`
        .no-spinners::-webkit-outer-spin-button,
        .no-spinners::-webkit-inner-spin-button {
          -webkit-appearance: none;
          appearance: none;
          margin: 0;
        }
        .no-spinners {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>
    </div>
  );

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
                <div className="flex items-center justify-between w-full">
                   <AmountPill amount={Number(user?.coin || 0)} />
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
          {isLoggedIn && Number(book.remaining_paid_count ?? 0) === 0 ? (
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
              <button
                onClick={openModal}
                className="w-full h-12 rounded-2xl border-2 border-red-600 text-red-600 text-lg font-bold hover:bg-red-50 transition-colors"
              >
                เลือกตอนเอง
              </button>

              <Modal
                wrapClassName="book-select-modal"
                title={null}
                open={isModalOpen}
                onCancel={closeModal}
                footer={
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <Button onClick={closeModal} className="border border-red-200 text-red-600 bg-white !hover:bg-red-50">ยกเลิก</Button>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-700">เลือก {selectedSummary.count} ตอน</div>
                        <div className="text-sm font-semibold text-red-600 flex items-center gap-2">
                          รวม {selectedSummary.total} ฿
                          <Image src={"/images/e-coin.png"} alt="currency" width={16} height={16} unoptimized />
                        </div>
                        <Button type="primary" danger disabled={selectedSummary.count === 0} onClick={() => {
                          if (!isLoggedIn) {
                            setIsModalOpen(false);
                            setSelectedEpisodeIds([]);
                            openLoginModal();
                            return;
                          }
                          setPayWith('coin');
                          setManualBuyConfirmModalOpen(true);
                        }}>
                          ยืนยัน
                        </Button>
                      </div>
                    </div>
                  </div>
                }
                width={760}
                centered
              >
                {isFetching ? (
                  <GifLoader className="py-12" />
                ) : (
                  <div>
                    {/* Top select-all banner */}
                    <div className="bg-pink-50 border border-pink-100 rounded px-4 py-3 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={allSelected} indeterminate={!allSelected && selectedSummary.count > 0} onChange={toggleSelectAll} />
                        <div className="text-sm">เลือกตอนทั้งหมด ({allSelectableIds.length} ตอน)</div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div>เลือก {selectedSummary.count} ตอน</div>
                        <div className="font-semibold text-red-600 flex items-center gap-1">
                          รวม {selectedSummary.total}
                          <div className="relative w-4 h-4 shrink-0">
                            <Image src={settings?.coin || "/images/e-coin.png"} alt="Coin" fill className="object-contain" unoptimized />
                          </div>
                          {book.use_freecoin === 1 && (
                            <div className="relative w-4 h-4 shrink-0">
                              <Image src={settings?.freecoin || "/images/money-bag.png"} alt="FreeCoin" fill className="object-contain" unoptimized />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-auto">
                      {episodesData?.data?.groups?.map((group: EpisodeGroup) => {
                        const gid = String(group.group_id);
                        const isExpanded = expandedGroups[gid] ?? false;
                        const selectableIds = group.list.filter((ep: any) => ep.coin > 0 && !ep.isBuy).map((ep: any) => ep.ep_id);
                        const selectedCountInGroup = selectableIds.filter((id: number) => selectedEpisodeIds.includes(id)).length;
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
                                <div className="text-sm text-gray-500">{group.list.length} ตอน</div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="divide-y">
                                {group.list.map((episode: any) => {
                                  const disabled = episode.coin <= 0 || episode.isBuy;
                                  const checked = selectedEpisodeIds.includes(episode.ep_id);
                                  const { regularPrice, promoPrice, hasPromo } = resolveEpisodePrice(episode);

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
                                          <div className="text-xs text-gray-500">{episode.view} • {new Date(episode.publish_datetime).toLocaleDateString('th-TH')}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {(regularPrice > 0 || hasPromo) ? (
                                          <div className="flex items-center gap-1.5 justify-end">
                                            <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={16} height={16} unoptimized />
                                            {book.use_freecoin === 1 && (
                                              <Image src={settings?.freecoin || "/images/money-bag.png"} alt="freecoin" width={16} height={16} unoptimized />
                                            )}
                                            {hasPromo ? (
                                              <>
                                                <span className="text-sm font-semibold text-rose-600">{promoPrice}</span>
                                                <span className="text-xs text-gray-400 line-through decoration-gray-300">{regularPrice}</span>
                                              </>
                                            ) : (
                                              <span className="text-sm font-semibold text-orange-600">
                                                {regularPrice}
                                              </span>
                                            )}
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
                  <div className="text-center flex justify-center items-center gap-2">
                    รวมยอด: <b className="text-red-600 text-xl">{selectedSummary.total}</b>
                    <Image src={payWith === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")} alt="currency" width={20} height={20} unoptimized />
                  </div>

                  {book.use_freecoin === 1 && (
                    <div className="flex justify-center mt-2">
                      <Radio.Group value={payWith} onChange={(e) => setPayWith(e.target.value)} buttonStyle="solid">
                        <Radio.Button value="coin">
                          <div className="flex items-center gap-1">เหรียญ <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={14} height={14} unoptimized /></div>
                        </Radio.Button>
                        <Radio.Button value="freecoin">
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
                        const payload = { eps: selectedEpisodeIds.map((id) => Number(id)), payWith: payWith };
                        const res = await apiClient.post(`/buy/eps`, payload);
                        if (res?.data?.code === 200) {
                          const respMsg = res.data?.message || "ซื้อสำเร็จ! กำลังอัปเดตเนื้อหา...";

                          // Log buy_episode
                          console.log('[LOG] buy_episode =>', { bookId, episodes: selectedEpisodeIds.length, payWith });
                          log('buy_episode', 'book', String(bookId), { episodes_count: selectedEpisodeIds.length, total: selectedSummary.total, method: payWith, book_title: book?.title });
                          setShowSuccess(true);

                          if (res.data?.data?.token) {
                            updateToken(res.data.data.token);
                          } else {
                            try {
                              const refreshRes = await refreshToken();
                              if (refreshRes?.data?.token) updateToken(refreshRes.data.token);
                            } catch (e) { }
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
                onCancel={() => setBuyAllModalOpen(false)}
                centered
                footer={null}
                width={400}
              >
                <div className="flex flex-col gap-4 py-4">
                  <div className="text-base text-gray-800 text-center">
                    คุณต้องการซื้อทั้งเรื่องหรือไม่?
                  </div>
                  <div className="text-center">
                    ตอนที่ต้องซื้อ: <b>{buyAllIds.length} ตอน</b>
                  </div>
                  <div className="text-center flex justify-center items-center gap-2">
                    รวมยอด: <b className="text-red-600 text-xl">{buyAllTotal.toLocaleString()}</b>
                    <Image src={payWith === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") : (settings?.coin || "/images/e-coin.png")} alt="currency" width={20} height={20} unoptimized />
                  </div>

                  {book.use_freecoin === 1 && (
                    <div className="flex justify-center mt-2">
                      <Radio.Group value={payWith} onChange={(e) => setPayWith(e.target.value)} buttonStyle="solid">
                        <Radio.Button value="coin">
                          <div className="flex items-center gap-1">เหรียญ <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={14} height={14} unoptimized /></div>
                        </Radio.Button>
                        <Radio.Button value="freecoin">
                          <div className="flex items-center gap-1">ถุงเงิน <Image src={settings?.freecoin || "/images/money-bag.png"} alt="free" width={14} height={14} unoptimized /></div>
                        </Radio.Button>
                      </Radio.Group>
                    </div>
                  )}

                  {/* หมายเหตุการซื้อ */}
                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-xs text-gray-700 mt-3">
                      {book.end === 'end' ? (
                          <p>
                              <span className="font-bold text-red-700">กรณีซื้อทั้งเรื่องที่สถานะจบ :</span> คุณจะได้รับสิทธิ์ในการเข้าถึงเนื้อหา "ทุกตอนที่ท่านยังไม่เคยทำการซื้อ" ทั้งหมด โดยราคาจะคำนวนเฉพาะตอนที่ยังไม่เคยซื้อ
                          </p>
                      ) : (
                          <p>
                              <span className="font-bold text-red-700">สำหรับผลงานที่ยังไม่จบ:</span> คุณจะได้รับสิทธิ์ในการเข้าถึงเนื้อหา "ทุกตอนที่ท่านยังไม่เคยทำการซื้อ" ราคาที่แสดงจะเป็นการคำนวณยอดรวมเฉพาะ "ตอนที่อัปเดตล่าสุด ณ วันที่ทำรายการซื้อ" เท่านั้น (ไม่รวมถึงตอนที่จะอัปเดตเพิ่มในอนาคต)
                          </p>
                      )}
                  </div>

                  <div className="flex gap-3 justify-center mt-4">
                    <Button onClick={() => setBuyAllModalOpen(false)} className="w-1/2 !bg-white !text-red-600 hover:!border-red-600">ยกเลิก</Button>
                    <Button type="primary" danger loading={buyLoading} className="w-1/2 !bg-red-600" onClick={async () => {
                      try {
                        setBuyLoading(true);
                        const payload = { eps: buyAllIds, payWith: payWith };
                        const res = await apiClient.post(`/buy/eps`, payload);
                        if (res?.data?.code === 200) {

                          // Log buy_episode (buy all)
                          console.log('[LOG] buy_episode (all) =>', { bookId, episodes: buyAllIds.length, total: buyAllTotal, payWith });
                          log('buy_episode', 'book', String(bookId), { episodes_count: buyAllIds.length, total: buyAllTotal, method: payWith, buy_all: true, book_title: book?.title });

                          setShowSuccess(true);
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
                            } catch (e) { }
                          }
                          setBuyAllModalOpen(false);
                          setBuyAllIds([]);
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
            </>
          )}

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

      <style jsx global>{`
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