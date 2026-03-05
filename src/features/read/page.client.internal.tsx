"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Popover, Modal, Slider, Switch, Select, ConfigProvider, message, App } from "antd";
import parse from "html-react-parser";
import { BackToTopButton } from "@/components/utility/BackToTopButton";
import Link from "next/link";
import GifLoader from '@/components/utility/GifLoader';
import EpisodeCommentSection from "@/components/bookdetail/EpisodeCommentSection";
import Image from "next/image";
import { modifiedHtml } from "@/utils/htmlUtils";
import { decryptContent } from "@/utils/securityUtils";
import { useWebsiteStore } from '@/stores/websiteStore';
import { fetchBookDetail } from "@/services/apiServices";
import apiClient from '@/services/apiClient';
import { useAuthStore, AuthState } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import '@/utils/imageUtils';

// Hooks
import { useContentProtection } from "@/hooks/reader/useContentProtection";
import { useReadingProgress } from "@/hooks/reader/useReadingProgress";
import { useReadingTheme } from "@/hooks/reader/useReadingTheme";
import { useEpisodeNavigation } from "@/hooks/reader/useEpisodeNavigation";
import { useLogger } from "@/hooks/useLogger";
import { CheckCircleOutlined } from "@ant-design/icons";

type Props = {
  bookId: string;
  episodeId: string;
};

// API function
const fetchEpisodeContent = async (ep_id: string) => {
  try {
    const res = await apiClient.get(`/readep/${ep_id}`);
    const data = res.data;

    if (data?.code === 200 && data.data) {
      if (typeof data.data === 'string') {
        const decrypted = decryptContent(data.data);
        if (decrypted) return decrypted;
      }
      return data.data;
    }

    if (data?.code === 401) {
      throw new Error(data.message || "คุณไม่มีสิทธิ์อ่านตอนนี้ กรุณาซื้อตอนก่อน");
    }

    throw new Error(data?.message || "ไม่พบข้อมูลตอน");
  } catch (err: any) {
    const status = err?.response?.status;
    const errorData = err?.response?.data;
    if (errorData) {
      const msg = errorData.message || (typeof errorData === 'string' ? errorData : `ไม่สามารถดึงข้อมูลตอนได้ (${status})`);
      throw new Error(msg);
    }
    throw new Error(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
  }
};

export default function ReadEpisodePage({ bookId, episodeId }: Props) {
  const { settings } = useWebsiteStore();
  const router = useRouter();
  const { user } = useAuthStore();
  const isLoggedIn = useAuthStore((s: AuthState) => s.isLoggedIn);
  const openLoginModal = useUIStore((s: any) => s.openLoginModal);
  const updateToken = useAuthStore((s: AuthState) => s.updateToken);
  const queryClient = useQueryClient();
  const [, messageContextHolder] = message.useMessage();
  const { notification } = App.useApp();

  // --- 1. Fetch Data ---
  const {
    data: episode,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["episodeContent", episodeId],
    queryFn: () => fetchEpisodeContent(episodeId),
    enabled: !!episodeId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: bookDetail } = useQuery({
    queryKey: ["bookDetail", bookId],
    queryFn: () => fetchBookDetail(bookId),
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  // --- 2. Custom Hooks ---
  const innerContentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  const { isFocused, setIsFocused } = useContentProtection(episode, () => {
    if (innerContentRef.current) {
      setContentHeight(innerContentRef.current.clientHeight);
    }
  });

  const { contentRef, showNav, setShowNav } = useReadingProgress(bookId, episodeId, user);

  const {
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    bgColor, setBgColor,
    isBold, setIsBold,
    textAlign, setTextAlign,
    isAutoScroll, setIsAutoScroll,
    scrollSpeed, setScrollSpeed,
    currentBg, currentFontFamily,
    fontFamilies, bgColors
  } = useReadingTheme(contentRef);

  const { episodesData, displayTitle, prevEpId, nextEpId } = useEpisodeNavigation(bookId, episodeId, episode);

  // --- 2.5 Activity Logging ---
  const { log } = useLogger();

  useEffect(() => {
    if (episode && bookId && episodeId) {
      const epName = (episode as any)?.name || displayTitle || '';
      const bookTitle = (bookDetail as any)?.title || '';
      const startTime = Date.now();

      console.log('[LOG] read_page tracking started =>', { bookId, episodeId, epName });

      return () => {
        const duration = Math.round((Date.now() - startTime) / 1000 * 10) / 10;
        console.log('[LOG] read_page =>', { bookId, episodeId, epName, duration: `${duration}s` });
        log('read_page', 'book', bookId, {
          name: epName,
          book_title: bookTitle,
          episode_id: episodeId,
        }, duration);
      };
    }
  }, [episode, bookId, episodeId, bookDetail, displayTitle, log]);

  // --- 3. Local State for UI ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
  const [isListPopoverOpen, setIsListPopoverOpen] = useState(false);

  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMethod, setConfirmMethod] = useState<"coin" | "freecoin" | null>(null);
  const [confirmAmount, setConfirmAmount] = useState<number | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);

  // --- 4. Effects ---
  useEffect(() => {
    try {
      const reloadKey = "read_forced_reload_v1";
      if (typeof window === "undefined") return;
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        router.replace(window.location.pathname + window.location.search);
      }
    } catch { }
  }, [router]);

  // Effect to Auto-Expand Group containing current episode
  useEffect(() => {
    if (episodesData?.groups && episodeId) {
      const targetGroupId = episodesData.groups.find((group: any) => 
        group.list.some((ep: any) => String(ep.ep_id ?? ep.epID) === String(episodeId))
      )?.group_id;

      if (targetGroupId) {
        setExpandedGroups(prev => ({ ...prev, [targetGroupId]: true }));
      }
    }
  }, [episodesData, episodeId]);

  // Effect to Scroll to Active Episode when Popover opens
  useEffect(() => {
    if (isListPopoverOpen) {
      setTimeout(() => {
        const container = document.getElementById('episode-list-container');
        const activeItem = document.getElementById('active-episode-item');
        
        if (container && activeItem) {
          const containerHeight = container.clientHeight;
          const itemHeight = activeItem.clientHeight;
 
          const containerRect = container.getBoundingClientRect();
          const itemRect = activeItem.getBoundingClientRect();
          const relativeTop = itemRect.top - containerRect.top;
          const currentScrollTop = container.scrollTop;
          const newScrollTop = currentScrollTop + relativeTop - (containerHeight / 2) + (itemHeight / 2); 
          container.scrollTo({ top: newScrollTop, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [isListPopoverOpen]);

  useEffect(() => {
    if (bookDetail?.title) {
      document.title = displayTitle ? `${displayTitle} - ${bookDetail.title} | EnjoyBook` : `${bookDetail.title} | EnjoyBook`;
    } else {
      document.title = "EnjoyBook - อ่านนิยายออนไลน์";
    }
  }, [bookDetail, displayTitle]);

  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    const disableDevTools = (e: KeyboardEvent) => {
      // Additional key checks if needed
      if (e.keyCode === 123) { e.preventDefault(); return false; }
    };

    document.addEventListener("contextmenu", disableRightClick);
    document.addEventListener("keydown", disableDevTools);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("keydown", disableDevTools);
    }
  }, []);

  const expandAllGroups = () => {
    if (!episodesData?.groups) return;
    const map: Record<number, boolean> = {};
    episodesData.groups.forEach((g: any) => { map[g.group_id] = true; });
    setExpandedGroups(map);
  };

  const collapseAllGroups = () => {
    setExpandedGroups({});
  };

  // --- 5. Actions ---
  const openConfirm = (method: "coin" | "freecoin", amount?: number | null) => {
    setConfirmMethod(method);
    setConfirmAmount(typeof amount === 'number' ? amount : null);
    setConfirmOpen(true);
  };

  const handleBuy = async (method: "coin" | "freecoin") => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    try {
      setBuyLoading(true);
      const ep = episode as any;
      const epId = String(ep?.ep_id ?? ep?.epID ?? episodeId);
      const hasDiscount = ep?.coin_discount !== null && ep?.coin_discount !== undefined;
      const coinPrice = hasDiscount ? (ep?.coin_discount ?? 0) : (ep?.coin ?? 0);
      const freeCoinPrice = ep?.freecoin ?? 0;
      const priceToDeduct = method === 'coin' ? coinPrice : freeCoinPrice;

      const payload = { eps: [Number(epId)], payWith: method };
      const res = await apiClient.post(`/buy/eps`, payload);

      if (res?.data?.code === 200) {
        const respMsg = res.data?.message || "ซื้อสำเร็จ! กำลังอัปเดตเนื้อหา...";

        // Log buy_episode
        console.log('[LOG] buy_episode =>', { bookId, episodeId: epId, method, price: priceToDeduct });
        log('buy_episode', 'book', bookId, {
          episode_id: epId,
          method,
          price: priceToDeduct,
          name: (episode as any)?.name || displayTitle || '',
        });

        notification.success({
                message: respMsg,
                description: respMsg,
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                placement: 'topRight',
            });
        

        // Optimistic Update
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          let finalCoin = (Number(currentUser.coin) || 0);
          let finalFreeCoin = (Number(currentUser.freecoin) || 0);

          if (method === 'coin') finalCoin = Math.max(0, finalCoin - (Number(priceToDeduct) || 0));
          else if (method === 'freecoin') finalFreeCoin = Math.max(0, finalFreeCoin - (Number(priceToDeduct) || 0));

          const updatedUser = { ...currentUser, coin: finalCoin, freecoin: finalFreeCoin };

          // If backend returns token, use it to update (it will handle decoding)
          const maybeToken = res?.data?.data?.token ?? res?.data?.token;
          if (maybeToken) {
            updateToken(maybeToken);
          } else {
            // If no token, just update state loosely
            useAuthStore.getState().login(updatedUser, useAuthStore.getState().token || '');
          }
        }

        setConfirmOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["episodeContent", episodeId] });
        await queryClient.invalidateQueries({ queryKey: ["bookEpisodes", bookId] });
      } else {
        notification.error({
                message: 'ซื้อไม่สำเร็จ',
                description: res?.data?.message || "ซื้อไม่สำเร็จ",
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                placement: 'topRight',
            });
      }
    } catch {
      notification.error({
                message: 'ซื้อไม่สำเร็จ',
                description: "ยอดเหรียญไม่เพียงพอ",
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                placement: 'topRight',
            });
    } finally {
      setBuyLoading(false);
    }
  };

  // --- 6. Render Helpers ---
  function PurchaseFallback() {
    const ep = episode as any;
    const bookUseFreecoin = (bookDetail as any)?.use_freecoin;
    const epUseFreecoin = ep?.use_freecoin;
    const canUseFreecoin = epUseFreecoin !== undefined && epUseFreecoin !== null
      ? Number(epUseFreecoin) === 1
      : (bookUseFreecoin !== undefined && bookUseFreecoin !== null ? Number(bookUseFreecoin) === 1 : true);

    const hasDiscount = ep?.coin_discount !== null && ep?.coin_discount !== undefined;
    const coinPrice = hasDiscount ? ep.coin_discount : ep?.coin;

    return (
      <div className="text-center py-12">
        <Image src={settings?.img_buyep || '/images/unlock.png'} alt="No Content" width={100} height={100} unoptimized className="justify-center mx-auto" />
        <p className="text-sm text-gray-500 mb-4">ตอนนี้ยังไม่มีเนื้อหา หากต้องการอ่าน กรุณาซื้อ</p>
        <div className="flex items-center justify-center gap-3">
          {canUseFreecoin && (
            <button onClick={() => openConfirm("freecoin", ep?.freecoin ?? null)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg">
              <Image src={settings?.freecoin || '/images/money-bag.png'} alt="Coin Icon" width={20} height={20} unoptimized />
              ซื้อด้วยถุงเงิน {ep?.freecoin ? `(${ep.freecoin})` : ""}
            </button>
          )}
          <button onClick={() => openConfirm("coin", coinPrice)} className={`flex items-center gap-2 px-4 py-2 ${canUseFreecoin ? 'bg-yellow-400' : 'bg-red-600'} text-white rounded-lg`}>
            <Image src={settings?.coin || '/images/e-coin.png'} alt="Coin Icon" width={20} height={20} unoptimized />
            <div className="flex items-center gap-1 text-white">
              <span>ซื้อด้วยเหรียญ</span>
              {hasDiscount ? (
                <>
                  <span className="line-through opacity-60 text-xs text-white">({ep?.coin})</span>
                  <span className="font-bold text-white">({ep.coin_discount})</span>
                </>
              ) : (
                <span className="text-white">{ep?.coin ? `(${ep.coin})` : ""}</span>
              )}
            </div>
          </button>
        </div>
      </div>
    );
  }

  const renderEpisodesList = () => {
    if (!episodesData?.groups) return <div className="p-4">ไม่พบรายการตอน</div>;
    return (
      <div id="episode-list-container" className="max-h-64 w-72 overflow-auto">
        <div className="px-3 py-2 flex gap-2">
          <button onClick={expandAllGroups} className="text-xs px-2 py-1 bg-gray-100 rounded">แสดงทั้งหมด</button>
          <button onClick={collapseAllGroups} className="text-xs px-2 py-1 bg-gray-100 rounded">ย่อทั้งหมด</button>
        </div>
        {episodesData.groups.map((group: any, groupIndex: number) => {
          const isExpanded = expandedGroups[group.group_id] ?? groupIndex === 0;
          const toggleGroup = () => setExpandedGroups((prev) => ({ ...prev, [group.group_id]: !isExpanded }));
          return (
            <div key={group.group_id} className="border-b last:border-b-0">
              <button onClick={toggleGroup} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500">
                <span className="truncate">{group.name}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isExpanded && (
                <div>
                  {group.list.map((ep: any) => {
                    const isCurrent = String(ep.ep_id ?? ep.epID) === String(episodeId);
                    return (
                      <button
                        key={ep.ep_id ?? ep.epID}
                        id={isCurrent ? 'active-episode-item' : undefined}
                        onClick={() => {
                          setIsListPopoverOpen(false);
                          router.push(`/read/${bookId}/${String(ep.ep_id ?? ep.epID)}`);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${isCurrent ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700'}`}
                      >
                        <div className="truncate text-sm">{ep.name?.trim()}</div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${currentBg?.bg || "bg-white"}`}>
        <GifLoader />
      </div>
    );
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "ไม่สามารถโหลดเนื้อหาได้";
    const is401Error = errorMessage.includes("ไม่พบตอน") || errorMessage.includes("ไม่มีสิทธิ์");
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Alert
            message={is401Error ? "ไม่สามารถเข้าถึงตอนนี้ได้" : "เกิดข้อผิดพลาด"}
            description={
              <div>
                <p>{errorMessage}</p>
                {is401Error && (
                  <p className="mt-2 text-sm">
                    กรุณาตรวจสอบว่า:<br />• คุณได้ซื้อตอนนี้แล้วหรือไม่<br />• คุณได้เข้าสู่ระบบแล้วหรือไม่<br />• ลิงก์ที่คุณใช้ถูกต้องหรือไม่
                  </p>
                )}
              </div>
            }
            type={is401Error ? "warning" : "error"}
            showIcon
          />
          <div className="mt-6 text-center space-x-4">
            <Button type="primary" onClick={() => router.back()}>← กลับหน้าก่อนหน้า</Button>
            {is401Error && <Button onClick={() => window.location.reload()}>🔄 ลองใหม่อีกครั้ง</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${currentBg?.bg} ${currentBg?.text} transition-colors duration-300 select-none`}
      style={{ userSelect: "none", minHeight: "100vh" }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {messageContextHolder}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full sm:w-80 bg-white shadow-xl z-[70] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {episodesData?.groups?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {episodesData.groups.map((group: any, groupIndex: number) => {
                  const isExpanded = expandedGroups[group.group_id] ?? groupIndex === 0;
                  const toggleGroup = () => setExpandedGroups((prev) => ({ ...prev, [group.group_id]: !isExpanded }));
                  return (
                    <div key={group.group_id} className="bg-white">
                      <button onClick={toggleGroup} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <h3 className="text-xs font-semibold text-gray-700 text-left uppercase tracking-wide">{group.name}</h3>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="divide-y divide-gray-50">
                          {group.list.map((ep: any) => {
                            const isCurrentEpisode = String(ep.ep_id ?? ep.epID) === String(episodeId);
                            return (
                              <button
                                key={ep.ep_id}
                                onClick={() => { setIsSidebarOpen(false); router.push(`/read/${bookId}/${String(ep.ep_id ?? ep.epID)}`); }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left ${isCurrentEpisode ? "bg-red-50/50 border-l-2 border-red-500" : ""}`}>
                                <div className="flex-1 min-w-0 pr-3">
                                  <p className={`text-sm truncate ${isCurrentEpisode ? "text-red-600 font-medium" : "text-gray-700"}`}>{ep.name.trim()}</p>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                  {ep.isBuy && <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                                  {ep.coin > 0 && !ep.isBuy && <span className="text-xs text-gray-500">{ep.coin}</span>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12"><p className="text-sm text-gray-500">ไม่พบรายการตอน</p></div>
            )}
          </div>
        </>
      )}

      <main className={`${currentBg?.bg} min-h-screen pb-20`}>
        <div className="min-h-[500px] p-4 flex flex-col items-center">
          <div className={`min-h-[1000px] rounded-md w-full lg:max-w-[1000px] ${currentBg?.paper || currentBg?.bg} ${currentBg?.text} shadow-lg relative flex flex-col`}>
            {/* Header */}
            <div className={`transition-all duration-300 w-full sticky top-0 z-[1100] ${currentBg?.paper || currentBg?.bg}`}
              style={{ borderColor: currentBg?.key === "dark" ? "#333333" : "rgba(0,0,0,0.05)", borderBottomWidth: "1px" }}>
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-1">
                  <Link href={bookId ? `/book/${bookId}` : "/"} className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`} style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      <span className="hidden sm:inline">หน้าหลัก</span>
                    </div>
                  </Link>
                  <Popover placement="bottomLeft" title={<div className="text-sm font-semibold">สารบัญ</div>} content={renderEpisodesList()} trigger="click" open={isListPopoverOpen} onOpenChange={(open) => setIsListPopoverOpen(open)}>
                    <button className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`} title="สารบัญ" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                  </Popover>
                </div>

                <h1 className="text-sm font-medium truncate mx-4 flex-1 text-center opacity-80" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>{displayTitle || ""}</h1>

                <Popover
                  placement="bottomRight"
                  title={
                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                      <span className="text-base font-semibold">ตั้งค่าการอ่าน</span>
                      <button onClick={() => {
                        setFontSize(20); setFontFamily("sarabun"); setBgColor("sepia"); setIsBold(false); setTextAlign("left"); setIsAutoScroll(false); setScrollSpeed(0.3);
                      }} className="text-xs !text-red-500 !hover:text-red-700 font-medium cursor-pointer">
                        ค่าเริ่มต้น
                      </button>
                    </div>
                  }
                  content={
                    <div className="w-72 flex flex-col gap-4 p-1">
                      {/* Alignment */}
                      <div className="grid grid-cols-3 gap-2">
                        {['left', 'center', 'justify'].map((align) => (
                          <button key={align} onClick={() => setTextAlign(align as any)} className={`flex items-center justify-center p-2 rounded border transition-all ${textAlign === align ? 'border-[#E31C3D] bg-[#FFF0F2] text-[#E31C3D]' : 'border-gray-200 hover:border-gray-300 text-gray-500'}`}>
                            {align === 'left' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>}
                            {align === 'center' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>}
                            {align === 'justify' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
                          </button>
                        ))}
                      </div>
                      {/* Font Size */}
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setFontSize(prev => Math.max(12, prev - 2))} className="flex items-center justify-center p-2 rounded border border-gray-200 hover:border-gray-300 text-gray-600 active:scale-95 transition-transform"><span className="text-sm">A-</span></button>
                        <button onClick={() => setFontSize(prev => Math.min(64, prev + 2))} className="flex items-center justify-center p-2 rounded border border-gray-200 hover:border-gray-300 text-gray-600 active:scale-95 transition-transform"><span className="text-lg">A+</span></button>
                      </div>
                      {/* Auto Scroll */}
                      <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">เลื่อนอัตโนมัติ</span>
                          <Switch checked={isAutoScroll} onChange={setIsAutoScroll} size="small" className="bg-gray-300" style={{ backgroundColor: isAutoScroll ? '#E31C3D' : undefined }} />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🐢</span>
                          <div className="flex-1">
                            <ConfigProvider theme={{ components: { Slider: { colorPrimary: '#E31C3D', handleColor: '#E31C3D', trackBg: '#E31C3D', handleActiveColor: '#C41230' } } }}>
                              <Slider min={0.1} max={2.0} step={0.1} value={scrollSpeed} onChange={setScrollSpeed} tooltip={{ open: false }} />
                            </ConfigProvider>
                          </div>
                          <span className="text-lg">🐇</span>
                        </div>
                      </div>
                      {/* Font Family */}
                      <div>
                        <Select value={fontFamily} onChange={setFontFamily} style={{ width: '100%' }} options={fontFamilies.map(f => ({ value: f.key, label: <span style={{ fontFamily: f.family }}>ฟอนต์ {f.label}</span> }))} className="h-10" />
                      </div>
                      {/* Theme Colors */}
                      <div className="flex items-center justify-center gap-4 mt-1">
                        {bgColors.map((bg) => (
                          <button key={bg.key} onClick={() => setBgColor(bg.key)} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${bg.key === bgColor ? 'border-[#E31C3D] scale-110' : 'border-transparent hover:scale-105'}`} title={bg.label}>
                            <div className={`w-8 h-8 rounded-full border ${bg.bg} ${bg.border !== 'transparent' ? 'border shadow-sm' : ''}`} style={{ borderColor: bg.border }}></div>
                          </button>
                        ))}
                      </div>
                      {/* Bold Toggle */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-sm text-gray-600">ตัวหนา</span>
                        <Switch checked={isBold} onChange={setIsBold} size="small" style={{ backgroundColor: isBold ? '#E31C3D' : undefined }} />
                      </div>
                    </div>
                  }
                  trigger="click"
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <span className={`text-sm font-semibold ${currentBg?.key === "dark" ? "text-gray-300" : "text-gray-600"}`}>ตั้งค่าการอ่าน</span>
                    <button className={`p-2 rounded-full transition-colors font-serif font-bold text-lg flex items-center justify-center w-10 h-10 ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`} title="ตั้งค่าการอ่าน" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>Aa</button>
                  </div>
                </Popover>
              </div>
            </div>

            {/* Content */}
            <article
              ref={contentRef}
              className="episode-content-wrapper relative mt-5 select-none leading-loose lg:px-11 px-6 text-wrap whitespace-normal overflow-hidden main-read cursor-pointer"
              style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none" }}
              onClick={() => {
                if (!isFocused) { setIsFocused(true); return; }
                setShowNav(!showNav);
              }}
            >
              <div
                ref={innerContentRef}
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: "1.8",
                  fontFamily: currentFontFamily?.family || "var(--font-sarabun), sans-serif",
                  fontWeight: isBold ? 'bold' : 'normal',
                  textAlign: textAlign,
                  minHeight: !isFocused ? contentHeight : undefined,
                  opacity: isFocused ? 1 : 0,
                  transition: 'opacity 0.1s ease',
                  pointerEvents: isFocused ? 'auto' : 'none',
                }}>
                {isFocused ? (
                  episode?.des ? (
                    parse(modifiedHtml(episode.des, currentFontFamily?.family || "var(--font-sarabun), sans-serif", user))
                  ) : episode?.content ? (
                    parse(modifiedHtml(episode.content, currentFontFamily?.family || "var(--font-sarabun), sans-serif", user))
                  ) : (
                    <PurchaseFallback />
                  )
                ) : null}
              </div>

              {!isFocused && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                  <div className={`text-3xl font-bold p-8 text-center ${currentBg?.text} opacity-50 bg-black/5 rounded-xl backdrop-blur-sm pointer-events-auto`}>
                    คลิกที่นี่เพื่ออ่านต่อ
                  </div>
                </div>
              )}
            </article>

            {/* Sticky Navigation Footer */}
            {(showNav) && (
              <div className={`w-full cursor-pointer border-t grid grid-cols-2 items-center sticky bottom-0 z-[999] transition-all duration-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] ${currentBg?.paper || currentBg?.bg}`}
                style={{ borderColor: currentBg?.key === "dark" ? "#333333" : "rgba(0,0,0,0.05)" }}>
                <div className={`group w-full p-4 flex flex-row gap-2 items-center justify-center border-r hover:bg-black/5 transition-all ${!prevEpId ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
                  style={{ borderColor: currentBg?.key === "dark" ? "#333333" : "rgba(0,0,0,0.05)" }}
                  onClick={(e) => { e.stopPropagation(); if (prevEpId && bookId) { console.log('[LOG] prev_episode =>', { bookId, from: episodeId, to: prevEpId }); log('prev_episode', 'book', bookId, { from_episode: episodeId, to_episode: prevEpId }); router.push(`/read/${bookId}/${prevEpId}`); } }}>
                  <svg className={`w-5 h-5 transition-transform group-hover:-translate-x-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[10px] opacity-60 font-normal">ตอนก่อนหน้า</span>
                    <span className="font-semibold text-sm">ก่อนหน้า</span>
                  </div>
                </div>
                <div className={`group w-full p-4 flex flex-row gap-2 items-center justify-center hover:bg-black/5 transition-all ${!nextEpId ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
                  onClick={(e) => { e.stopPropagation(); window.scrollTo(0, 0); if (nextEpId && bookId) { console.log('[LOG] next_episode =>', { bookId, from: episodeId, to: nextEpId }); log('next_episode', 'book', bookId, { from_episode: episodeId, to_episode: nextEpId }); router.push(`/read/${bookId}/${nextEpId}`); } }}>
                  <div className="flex flex-col items-end leading-none gap-0.5">
                    <span className="text-[10px] opacity-60 font-normal">ตอนต่อไป</span>
                    <span className="font-semibold text-sm">ถัดไป</span>
                  </div>
                  <svg className={`w-5 h-5 transition-transform group-hover:translate-x-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            )}

            

            {/* Comment Section */}
            {episodeId && (
              <div className="px-4 pb-8">
                <EpisodeCommentSection episodeId={episodeId} theme={currentBg} />
              </div>
            )}
          </div>
        </div>
      </main>

      <BackToTopButton />
      <Modal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title={<div className="text-center text-lg font-medium">ยืนยันการซื้อ</div>}
        zIndex={2000}
        footer={[
          <Button key="cancel" onClick={() => setConfirmOpen(false)} disabled={buyLoading} className="transition-colors" onMouseEnter={() => setCancelHover(true)} onMouseLeave={() => setCancelHover(false)} style={{ borderColor: cancelHover ? '#dc2626' : 'transparent', color: cancelHover ? '#dc2626' : undefined }}>ยกเลิก</Button>,
          <Button key="confirm" type="primary" danger loading={buyLoading} onClick={() => { if (confirmMethod) handleBuy(confirmMethod); }}>{confirmMethod === 'coin' ? 'ยืนยันซื้อด้วยเหรียญ' : 'ยืนยันซื้อด้วยถุงเงิน'}</Button>,
        ]}
      >
        <div className="space-y-2 text-center">
          <div className="text-base font-semibold text-gray-700">{displayTitle || 'ตอนนี้'}</div>
          <div className="text-sm text-red-600 font-medium flex items-center justify-center gap-2">
            {confirmMethod === 'freecoin' ? (
              <Image src={settings?.freecoin || '/images/money-bag.png'} alt="ถุงเงิน" width={18} height={18} unoptimized />
            ) : (
              <Image src={settings?.coin || '/images/e-coin.png'} alt="เหรียญ" width={18} height={18} unoptimized />
            )}
            <span>{confirmAmount != null ? confirmAmount : '---'}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
