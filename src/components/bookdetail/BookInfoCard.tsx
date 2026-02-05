"use client";

import Image from "next/image";
import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Modal, Checkbox, Spin, Button, App, Radio, Segmented } from "antd";
import { useQuery } from "@tanstack/react-query";
import { fetchBookEpisodes, refreshToken } from "@/services/apiServices";
import apiClient from "@/services/apiClient";
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/uiStore';
import GifLoader from '@/components/utility/GifLoader';
import SuccessAnimation from '@/components/utility/SuccessAnimation';
import AmountPill from '@/components/utility/AmountPill';
import FreeCoinPill from '@/components/utility/FreeCoinPill';
import { useWebsiteStore } from '@/stores/websiteStore';
import { jwtDecode } from "jwt-decode";

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

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
}

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

export interface BookInfoCardHandle {
  openSelectionModal: () => void;
}

interface BookInfoCardProps {
  book: Book;
  bookId?: string | number | null;
  episodesData?: any;
}

const BookInfoCard = forwardRef<BookInfoCardHandle, BookInfoCardProps>(({ book, bookId, episodesData: propEpisodesData }, ref) => {
  const [heartQty, setHeartQty] = useState<number>(0);
  const [roseQty, setRoseQty] = useState<number>(0);
  const { token, isLoggedIn, updateToken, user } = useAuthStore();
  const openLoginModal = useUIStore((s) => s.openLoginModal);
  const queryClient = useQueryClient();
  const { message: messageApi, modal: modalApi, notification: notificationApi } = App.useApp();
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
  const [buyAllModalOpen, setBuyAllModalOpen] = useState(false);
  const [manualBuyConfirmModalOpen, setManualBuyConfirmModalOpen] = useState(false);
  const [buyAllIds, setBuyAllIds] = useState<number[]>([]);
  const [buyAllTotal, setBuyAllTotal] = useState(0);
  const { settings } = useWebsiteStore();
  const episodesData = propEpisodesData;
  const isFetching = !episodesData;

  // Resolve Group Types
  const packGroups = useMemo(() => {
    return episodesData?.novel_packpack || episodesData?.novel_pack || episodesData?.pack || [];
  }, [episodesData]);

  const normalGroups = useMemo(() => {
    return episodesData?.novel || episodesData?.normal || episodesData?.groups || [];
  }, [episodesData]);

  // Combine groups for Modal and Selection Logic
  const allGroups = useMemo(() => {
      // Tag groups with their type so we can filter in the modal
      const taggedPack = packGroups.map((g: any) => ({ ...g, _type: 'มัดแพ็ค' }));
      const taggedNormal = normalGroups.map((g: any) => ({ ...g, _type: 'รายตอน' }));
      
      return [...taggedPack, ...taggedNormal];
  }, [packGroups, normalGroups]);

  // Determine availability for modal default
  const hasPackInModal = packGroups.length > 0;
  const hasNormalInModal = normalGroups.length > 0;
  
  const [modalSegment, setModalSegment] = useState<string>(hasPackInModal ? 'มัดแพ็ค' : 'รายตอน');
  const isModalInitializedRef = useRef(false);

  // Sync modal segment when data loads/changes if needed, similar to Tab
  useEffect(() => {
      // If manually changed by user (implied by interaction), we might not want to reset? 
      // But here we want to ensure default is correct on load.
      
      if (!isModalInitializedRef.current) {
          if (hasPackInModal) {
              setModalSegment('มัดแพ็ค');
              isModalInitializedRef.current = true;
          } else if (hasNormalInModal) {
              setModalSegment('รายตอน');
              isModalInitializedRef.current = true;
          }
      }
  }, [hasPackInModal, hasNormalInModal]);

  // Helper to calculate stats for a set of groups
  const calculateGroupStats = (groups: any[]) => {
    let unownedCount = 0;
    let totalPrice = 0;
    const ids: number[] = [];

    if (groups) {
      for (const g of groups) {
        if (g.list) {
          for (const ep of g.list) {
            if (ep.coin > 0 && !ep.isBuy) {
              unownedCount++;
              totalPrice += Number(ep.coin);
              ids.push(Number(ep.ep_id));
            }
          }
        }
      }
    }
    return { unownedCount, totalPrice, ids };
  };

  const packStats = useMemo(() => calculateGroupStats(packGroups), [packGroups]);
  const normalStats = useMemo(() => calculateGroupStats(normalGroups), [normalGroups]);

  const handleBuySet = async (ids: number[], total: number) => {
    if (buyLoading) return;
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (ids.length === 0) {
      messageApi.info('ไม่มีตอนที่ต้องชำระเงินในชุดนี้');
      return;
    }

    setBuyAllIds(ids);
    setBuyAllTotal(total);
    setPayWith('coin');
    setBuyAllModalOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openSelectionModal: () => {
      setIsModalOpen(true);
    },
  }));

    // ... existing handleBuyAllClick (we might repurpose or remove it, but let's keep it for now as handleBuySet replaces it for specific sets)
    // Actually, let's redefine handleBuyAllClick to be unused or remove it.
  
  // NOTE: I will replace the component body below.

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
    const selectable = group?.list?.filter((ep: any) => ep.coin > 0 && !ep.isBuy).map((ep: any) => ep.ep_id) || [];
    const allSelected = selectable.length > 0 && selectable.every((id: number) => selectedEpisodeIds.includes(id));
    if (allSelected) {
      setSelectedEpisodeIds((prev) => prev.filter((id) => !selectable.includes(id)));
    } else {
      setSelectedEpisodeIds((prev) => Array.from(new Set([...prev, ...selectable])));
    }
  };

  const resolveEpisodePrice = (episode: any) => {
    const regularPrice = Number(episode.coin ?? 0);
    let promoPrice: number | undefined = undefined;
    const getPrice = (val: any) => {
      if (val === null || val === undefined) return undefined;
      const v = Number(val);
      return isNaN(v) ? undefined : v;
    };
    if (episode.Discount) {
      const p = getPrice(episode.Discount.discount_price);
      if (p !== undefined) promoPrice = p;
    }
    else if (Array.isArray(episode.promotions) && episode.promotions.length > 0) {
      const p = getPrice(episode.promotions[0].discount_price);
      if (p !== undefined) promoPrice = p;
    }
    else if (episode.discount_price !== undefined) {
      const p = getPrice(episode.discount_price);
      if (p !== undefined) promoPrice = p;
    }
    const hasPromo = !episode.isBuy && promoPrice !== undefined && promoPrice < regularPrice && promoPrice >= 0;
    const finalPrice = hasPromo ? (promoPrice as number) : regularPrice;
    return { regularPrice, promoPrice, hasPromo, finalPrice };
  };

  const selectedSummary = useMemo(() => {
    if (!allGroups || allGroups.length === 0) return { count: 0, total: 0 };
    let total = 0;
    for (const g of allGroups) {
      if(g?.list) {
          for (const ep of g.list) {
            if (selectedEpisodeIds.includes(ep.ep_id) && ep.coin > 0) {
              const { finalPrice } = resolveEpisodePrice(ep);
              total += finalPrice;
            }
          }
      }
    }
    return { count: selectedEpisodeIds.length, total };
  }, [selectedEpisodeIds, allGroups]);

  const allSelectableIds = useMemo(() => {
    if (!allGroups || allGroups.length === 0) return [] as number[];
    const ids: number[] = [];
    const visibleGroups = allGroups.filter((g: any) => g._type === modalSegment);
    for (const g of visibleGroups) {
      if(g?.list) {
          for (const ep of g.list) {
            if (ep.coin > 0 && !ep.isBuy) ids.push(ep.ep_id);
          }
      }
    }
    return ids;
  }, [allGroups, modalSegment]);

  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedEpisodeIds.includes(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedEpisodeIds((prev) => prev.filter((id) => !allSelectableIds.includes(id)));
    } else {
      setSelectedEpisodeIds((prev) => Array.from(new Set([...prev, ...allSelectableIds])));
    }
  };
  
  return (
    <aside className="w-full sticky top-4 space-y-4">
      {/* 1. Header Card (Coins/Pills) */}
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

           {/* Pack Section */}
           {packGroups.length > 0 && (
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative group">
                {/* Red Vertical Bar */}
                {/* <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-red-600 rounded-r-full"></div> */}
                
                <div className="p-4 pl-5">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">มัดแพ็ค</h4>
                    
                    {/* Remaining Count or Owned State */}
                    {packStats.unownedCount > 0 ? (
                        <div className="text-sm text-gray-600 mb-3">
                            คุณยังไม่ได้เป็นเจ้าของอีก <span className="text-red-600 font-bold">{packStats.unownedCount.toLocaleString()} ตอน</span>
                        </div>
                    ) : null}

                    {/* Buy Button or Owned Banner */}
                    {packStats.unownedCount > 0 ? (
                        <button 
                            onClick={() => handleBuySet(packStats.ids, packStats.totalPrice)}
                            disabled={packStats.unownedCount === 0}
                            className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors rounded-lg p-2 px-3 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             <span className="text-gray-900 font-bold text-sm">เหมาทั้งเรื่อง</span>
                             <div className="flex items-center gap-2">
                                 <div className="flex items-center gap-1">
                                     <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={18} height={18} loader={imageLoader} />
                                     <span className="text-lg font-extrabold text-gray-900">{packStats.totalPrice.toLocaleString()}</span>
                                 </div>
                                 <div className="bg-blue-400 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                     มัดแพ็ค
                                 </div>
                             </div>
                        </button>
                    ) : (
                        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg py-3 flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-600">
                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                            <span className="text-emerald-700 font-bold text-sm">เป็นเจ้าของแล้ว</span>
                        </div>
                    )}
                </div>
             </div>
           )}

           {/* Normal Section */}
           {normalGroups.length > 0 && (
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative group">
                {/* Red Vertical Bar */}
                {/* <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-red-600 rounded-r-full"></div> */}
                
                <div className="p-4 pl-5">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">รายตอน</h4>
                    
                    {/* Remaining Count or Owned State */}
                    {normalStats.unownedCount > 0 ? (
                        <div className="text-sm text-gray-600 mb-3">
                            คุณยังไม่ได้เป็นเจ้าของอีก <span className="text-red-600 font-bold">{normalStats.unownedCount.toLocaleString()} ตอน</span>
                        </div>
                    ) : null}

                    {/* Buy Button or Owned Banner */}
                    {normalStats.unownedCount > 0 ? (
                        <button 
                            onClick={() => handleBuySet(normalStats.ids, normalStats.totalPrice)}
                             disabled={normalStats.unownedCount === 0}
                            className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors rounded-lg p-2 px-3 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             <span className="text-gray-900 font-bold text-sm">เหมาทั้งเรื่อง</span>
                             <div className="flex items-center gap-2">
                                 <div className="flex items-center gap-1">
                                     <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={18} height={18} loader={imageLoader} />
                                     <span className="text-lg font-extrabold text-gray-900">{normalStats.totalPrice.toLocaleString()}</span>
                                 </div>
                                 <div className="bg-orange-400 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                     รายตอน
                                 </div>
                             </div>
                        </button>
                    ) : (
                        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg py-3 flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-600">
                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                            <span className="text-emerald-700 font-bold text-sm">เป็นเจ้าของแล้ว</span>
                        </div>
                    )}
                </div>
             </div>
           )}

        {/* The Modal below remains unchanged in this replacement block, wait, line 645 is Modal start */}
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
                          <Image src={"/images/e-coin.png"} alt="currency" width={16} height={16} loader={imageLoader} />
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
                {/* ... existing modal content ... */}
                {/* Re-rendering existing content for context match if needed, but since we replace Modal block... */}
                {/* Actually I am replacing the whole Modal block? No, StartLine 626. */}
                {/* The Tool input says "Replace Modal footer logic... and append BuyAllModal". */}
                {/* I must include the children of Modal because I am replacing from line 626 (Modal start) to 813 (Modal end). */}
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
                            <Image src={settings?.coin || "/images/e-coin.png"} alt="Coin" fill className="object-contain" loader={imageLoader} />
                          </div>
                          {book.use_freecoin === 1 && (
                            <div className="relative w-4 h-4 shrink-0">
                              <Image src={settings?.freecoin || "/images/money-bag.png"} alt="FreeCoin" fill className="object-contain" loader={imageLoader} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {(hasPackInModal && hasNormalInModal) && (
                      <div className="mb-4">
                        <Segmented
                           options={['มัดแพ็ค', 'รายตอน']}
                           value={modalSegment}
                           onChange={(val) => setModalSegment(val as string)}
                           block
                           className="bg-red-50 p-1 text-red-600 font-medium"
                           size="large"
                           style={{
                                backgroundColor: '#FEF2F2',
                                borderRadius: '0.5rem',
                           }}
                         />
                      </div>
                    )}

                    <div className="space-y-4 max-h-[60vh] overflow-auto">
                      {allGroups.filter((g: any) => g._type === modalSegment).map((group: any) => {
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
                                            <Image src={settings?.coin || "/images/e-coin.png"} alt="coin" width={16} height={16} loader={imageLoader} />
                                            {book.use_freecoin === 1 && (
                                              <Image src={settings?.freecoin || "/images/money-bag.png"} alt="freecoin" width={16} height={16} loader={imageLoader} />
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
    </aside>
  );
});
export default BookInfoCard;