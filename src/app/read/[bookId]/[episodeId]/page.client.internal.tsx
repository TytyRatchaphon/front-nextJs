"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Dropdown, Popover, Modal } from "antd";
import { message } from "antd";
import type { MenuProps } from "antd";
import parse from "html-react-parser";
import { BackToTopButton } from "@/components/utility/BackToTopButton";
import Link from "next/link";
import GifLoader from '@/components/utility/GifLoader';
import EpisodeCommentSection from "@/components/bookdetail/EpisodeCommentSection";
import Image from "next/image";
import { modifiedHtml } from "@/utils/htmlUtils";
import { detectExtension } from "@/utils/securityUtils";
import { useWebsiteStore } from '@/stores/websiteStore';

import {
  fetchBookDetail,
  syncReadingProgress,
  updateReadingProgress,
} from "@/services/apiServices";
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

type Props = {
  bookId: string;
  episodeId: string;
};

// API function สำหรับดึงเนื้อหาตอน
const fetchEpisodeContent = async (ep_id: string) => {
  console.log("🔍 Fetching episode:", ep_id);
  try {
    const res = await apiClient.get(`/readep/${ep_id}`);
    const data = res.data;
    console.log("📖 Episode Content Response:", data);

    if (data?.code === 200 && data.data) {
      return data.data;
    }

    if (data?.code === 401) {
      console.error("❌ 401 Error:", data.message);
      throw new Error(
        data.message || "คุณไม่มีสิทธิ์อ่านตอนนี้ กรุณาซื้อตอนก่อน"
      );
    }

    throw new Error(data?.message || "ไม่พบข้อมูลตอน");
  } catch (err: any) {
    const status = err?.response?.status;
    const errorData = err?.response?.data;

    console.error(`❌ fetchEpisodeContent error [${status}]:`, errorData || err.message || err);

    if (errorData) {
      // Handle case where errorData is an object with message
      const msg = errorData.message || (typeof errorData === 'string' ? errorData : `ไม่สามารถดึงข้อมูลตอนได้ (${status})`);
      throw new Error(msg);
    }

    throw new Error(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
  }
};

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
}

// API function สำหรับดึงรายการตอนทั้งหมด (เพื่อหา prev/next)
const fetchBookEpisodes = async (bookId: number | string) => {
  try {
    const res = await apiClient.get(`/bookgroup/${bookId}`);
    const data = res.data;

    if (data?.code === 200 && data.data?.groups) {
      const allEpisodes: any[] = [];

      const sortedGroups = [...data.data.groups].sort(
        (a, b) => (a.group_id || 0) - (b.group_id || 0)
      );

      sortedGroups.forEach((group: any, groupIndex: number) => {
        if (group.list && Array.isArray(group.list)) {
          const episodesWithGroupInfo = group.list.map((ep: any) => ({
            ...ep,
            _groupId: group.group_id,
            _groupIndex: groupIndex,
            _groupName: group.name,
          }));
          allEpisodes.push(...episodesWithGroupInfo);
        }
      });

      return allEpisodes.sort((a, b) => {
        if (a._groupIndex !== b._groupIndex) {
          return a._groupIndex - b._groupIndex;
        }
        return (a.order_by || 0) - (b.order_by || 0);
      });
    }

    return [];
  } catch (err) {
    console.error("❌ fetchBookEpisodes error:", err);
    return [];
  }
};

// ตั้งค่าฟอนต์
const fontSizes = [
  { key: "xs", label: "เล็กมาก", size: "text-xs" },
  { key: "sm", label: "เล็ก", size: "text-sm" },
  { key: "base", label: "ปกติ", size: "text-base" },
  { key: "lg", label: "ใหญ่", size: "text-lg" },
  { key: "xl", label: "ใหญ่มาก", size: "text-xl" },
  { key: "2xl", label: "ใหญ่พิเศษ", size: "text-2xl" },
];

// ตั้งค่าสีพื้นหลัง
const bgColors = [
  { key: "white", label: "ปกติ", bg: "bg-[#f1f1f1]", paper: "bg-white", text: "text-black", border: "#e5e7eb" },
  { key: "sepia", label: "สีเซเปีย", bg: "bg-[#f9f2de]", paper: "bg-[#fdfaee]", text: "text-black", border: "#e6dbc4" },
  { key: "dark", label: "มืด", bg: "bg-black", paper: "bg-[#1c1c1e]", text: "text-white", border: "#333333" },
];

// ตั้งค่าฟอนต์ (5 แบบที่แตกต่างชัดแต่อ่านง่าย)
const fontFamilies = [
  { key: "sarabun", label: "Sarabun", family: "var(--font-sarabun), sans-serif" },
  { key: "prompt", label: "Prompt", family: "var(--font-prompt), sans-serif" },
  { key: "kanit", label: "Kanit", family: "var(--font-kanit), sans-serif" },
  {
    key: "ibm-plex",
    label: "IBM Plex Sans Thai",
    family: "var(--font-ibm-plex-sans-thai), sans-serif",
  },
  { key: "mitr", label: "Mitr", family: "var(--font-mitr), sans-serif" },
];

export default function ReadEpisodePage({ bookId, episodeId }: Props) {
  const { settings } = useWebsiteStore();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isFocused, setIsFocused] = useState(true);
  const [showNav, setShowNav] = useState(false);

  console.log(
    "🎯 ReadEpisodePage render - bookId:",
    bookId,
    "episodeId:",
    episodeId
  );

  useEffect(() => {
    console.log("🎯 Page loaded with bookId:", bookId, "episodeId:", episodeId);
  }, [bookId, episodeId]);

  // Reading Progress Sync
  // Reading Progress Sync
  const isInitialSyncDone = useRef(false);
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const syncProgress = async () => {
      if (!episodeId || !user || isInitialSyncDone.current) return;

      try {
        const res = await syncReadingProgress(episodeId);
        if (res && res.status === 'success' && res.progress > 0) {
          // Small delay to ensure content layout is stable
          setTimeout(() => {
            if (contentRef.current) {
              const element = contentRef.current;
              const elementTop = element.getBoundingClientRect().top + window.scrollY;
              const elementHeight = element.scrollHeight;
              const windowHeight = window.innerHeight;

              // Calculate target scroll position relative to the element
              // Progress is 0.0 - 1.0 within the element's scrollable area
              // Scrollable area = elementHeight - windowHeight (roughly)
              // But simpler: just map progress to the element's height relative to top

              // If progress is 0, we are at elementTop.
              // If progress is 1, we are at elementTop + elementHeight - windowHeight.

              const totalScrollable = elementHeight - windowHeight;
              const targetScroll = elementTop + (res.progress * totalScrollable);

              console.log('📜 Scrolling to:', targetScroll, '(Progress:', res.progress, ')');
              window.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
          }, 500);
        }
        isInitialSyncDone.current = true;
      } catch (err) {
        console.error('Failed to sync reading progress', err);
      }
    };

    // Reset flag when episodeId changes
    if (episodeId) {
      isInitialSyncDone.current = false;
      syncProgress();
    }
  }, [episodeId, user]);

  // Scroll Update Tracking
  useEffect(() => {

    if (!episodeId || !user) {
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      //   console.log("📜 Scroll event fired"); // Very spammy, uncomment if needed
      if (timeoutId) return;

      timeoutId = setTimeout(async () => {
        if (contentRef.current) {
          const element = contentRef.current;
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY; // Absolute top position
          const elementHeight = element.scrollHeight;
          const windowHeight = window.innerHeight;
          const scrollY = window.scrollY;

          // Calculate progress
          const totalScrollable = elementHeight - windowHeight;

          // If content is shorter than window, progress is always 1 (or 0?) -> Let's say 1 if finished.
          if (totalScrollable <= 0) {
            await updateReadingProgress(bookId, episodeId, 1);
            timeoutId = null;
            return;
          }

          const relativeScroll = scrollY - elementTop;
          const progress = Math.min(Math.max(relativeScroll / totalScrollable, 0), 1);
          const formattedProgress = Number(progress.toFixed(4));

          await updateReadingProgress(bookId, episodeId, formattedProgress);
        } else {
          console.warn("⚠️ contentRef is null");
        }
        timeoutId = null;
      }, 2000); // Update every 2 seconds max
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [episodeId, user]);


  // Disable the global Navbar's sticky behavior on this page only.
  // We remove the 'sticky' class and set position to static on mount,
  // and restore previous classes/styles on unmount to avoid side effects.
  useEffect(() => {
    try {
      const styleId = "no-sticky-navbar-style";
      // Inject CSS override to force Navbar non-sticky (highest priority)
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        // Inject CSS override to force Navbar non-sticky (highest priority) and keep it at top
        styleEl.innerHTML = `
          #GlobalNavbarWrapper, #Navbar, nav, header { position: relative !important; top: auto !important; width: 100%; z-index: 40; }
          /* Ensure the reader header sticks */
          .reader-sticky-header { position: sticky !important; top: 0 !important; z-index: 100 !important; }
        `;
        document.head.appendChild(styleEl);
      }

      const nav = document.getElementById("Navbar");
      const prevClass = nav ? nav.className : null;
      const prevPosition = nav ? nav.style.position : null;
      const prevTop = nav ? nav.style.top : null;

      if (nav) {
        nav.classList.remove("sticky");
        nav.style.position = "static";
        nav.style.top = "auto";
      }

      return () => {
        // Remove injected style and restore previous inline/class state
        const s = document.getElementById(styleId);
        if (s) s.remove();
        if (nav) {
          if (prevClass !== null) nav.className = prevClass;
          if (prevPosition !== null) nav.style.position = prevPosition;
          if (prevTop !== null) nav.style.top = prevTop;
        }
      };
    } catch (err) {
      console.warn("Could not modify Navbar sticky behavior:", err);
    }
    // run only on mount/unmount
  }, []);

  const [fontSize, setFontSize] = useState("base");
  const [fontFamily, setFontFamily] = useState("sarabun");
  const [bgColor, setBgColor] = useState("white");
  // Persisted reading theme key
  // Load saved theme on mount and apply if valid; save on changes.
  useEffect(() => {
    try {
      const key = "reading_theme_v1";
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          if (parsed.bgColor && bgColors.find((b) => b.key === parsed.bgColor)) {
            setBgColor(parsed.bgColor);
          }
          if (parsed.fontSize && fontSizes.find((f) => f.key === parsed.fontSize)) {
            setFontSize(parsed.fontSize);
          }
          if (parsed.fontFamily && fontFamilies.find((ff) => ff.key === parsed.fontFamily)) {
            setFontFamily(parsed.fontFamily);
          }
          console.debug("ReadEpisodePage: loaded theme from localStorage ->", parsed);
        }
      }
    } catch (err) {
      console.warn("ReadEpisodePage: failed to load theme from localStorage", err);
    }
    // run once on mount
  }, []);

  useEffect(() => {
    try {
      const key = "reading_theme_v1";
      const payload = { bgColor, fontSize, fontFamily };
      localStorage.setItem(key, JSON.stringify(payload));
      console.debug("ReadEpisodePage: saved theme to localStorage ->", payload);
    } catch (err) {
      console.warn("ReadEpisodePage: failed to save theme to localStorage", err);
    }
  }, [bgColor, fontSize, fontFamily]);

  // Force a single reload when the user first opens the reader in this tab
  // This helps ensure `bookEpisodes` are available for Prev/Next on first render.
  useEffect(() => {
    try {
      const reloadKey = "read_forced_reload_v1";
      if (typeof window === "undefined") return;
      // Only force once per tab/session to avoid reload loops
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        console.debug("ReadEpisodePage: forcing single replace to ensure episode list is loaded");
        // Use replace to avoid adding history entries
        router.replace(window.location.pathname + window.location.search);
      }
    } catch (err) {
      console.warn("ReadEpisodePage: failed to force reload", err);
    }
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  //   const [lineHeight, setLineHeight] = useState("relaxed");
  const [prevEpisode, setPrevEpisode] = useState<string | null>(null);
  const [nextEpisode, setNextEpisode] = useState<string | null>(null);
  // Confirmation modal state for purchases
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMethod, setConfirmMethod] = useState<"coin" | "freecoin" | null>(null);
  const [confirmAmount, setConfirmAmount] = useState<number | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);

  // Auto Scroll State
  const [isAutoScroll, setIsAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0.3); // 0.3 = Very Slow (Default)

  // Accumulator for sub-pixel scrolling
  const scrollAccumulator = useRef(0);

  useEffect(() => {
    let animationFrameId: number;

    const autoScroll = () => {
      // Use contentRef for reliable content height stop (End of Story)
      if (contentRef.current) {
        const element = contentRef.current;
        // Calculate the bottom position of the content relative to the document
        // buffer of 2px to ensure it stops just right
        const contentBottom = element.getBoundingClientRect().bottom + window.scrollY;
        const stopPosition = contentBottom - window.innerHeight;

        if (window.scrollY >= stopPosition - 1) {
          setIsAutoScroll(false);
          return;
        }
      } else {
        // Fallback to document height if ref is missing
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY >= maxScroll - 1) {
          setIsAutoScroll(false);
          return;
        }
      }

      // Check if we reached the bottom by calculating progress
      // const updatedProgress = window.scrollY / maxScroll;
      // if (updatedProgress >= 1) ... (Removed old logic)

      // Accumulate scroll delta
      scrollAccumulator.current += scrollSpeed;

      // Only scroll if we have at least 1 pixel to move
      if (scrollAccumulator.current >= 1) {
        const pixelsToScroll = Math.floor(scrollAccumulator.current);
        window.scrollBy(0, pixelsToScroll);
        scrollAccumulator.current -= pixelsToScroll;
      }

      animationFrameId = requestAnimationFrame(autoScroll);
    };

    if (isAutoScroll) {
      // Reset accumulator on start
      scrollAccumulator.current = 0;
      animationFrameId = requestAnimationFrame(autoScroll);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoScroll, scrollSpeed]);
  const [, setPrevEpisodeData] = useState<any>(null);
  const isMatch = (ep: any, targetId: string) => {
    const target = String(targetId);
    return String(ep?.ep_id ?? "") === target || String(ep?.epID ?? "") === target;
  };

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
      const payload = { eps: [Number(epId)], payWith: method };
      const res = await apiClient.post(`/buy/eps`, payload);
      if (res?.data?.code === 200) {
        const respMsg = res.data?.message || "ซื้อสำเร็จ! กำลังอัปเดตเนื้อหา...";
        messageApi.success(respMsg);

        // If backend returned a token (session refresh / upgraded user), apply it
        const maybeToken = res?.data?.data?.token ?? res?.data?.token ?? res?.data?.data?.authToken ?? res?.data?.data?.accessToken;
        if (maybeToken && typeof updateToken === 'function') {
          try {
            updateToken(String(maybeToken));
            console.log('Purchase response included token — auth updated');
          } catch (e) {
            console.warn('Failed to update token from purchase response', e);
          }
        }

        setConfirmOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["episodeContent", episodeId] });
        await queryClient.invalidateQueries({ queryKey: ["bookEpisodes", bookId] });
      } else {
        messageApi.error(res?.data?.message || "ซื้อไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Buy error:", err);
      messageApi.error("ยอดเหรียญไม่เพียงพอ");
    } finally {
      setBuyLoading(false);
    }
  };
  const [, setNextEpisodeData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
  const expandAllGroups = () => {
    if (!episodesData || !episodesData.groups) return;
    const map: Record<number, boolean> = {};
    episodesData.groups.forEach((g: any) => {
      map[g.group_id] = true;
    });
    setExpandedGroups(map);
  };

  const collapseAllGroups = () => {
    setExpandedGroups({});
  };

  const {
    data: bookDetail,
    isLoading: isLoadingBookDetail,
    error: bookDetailError,
  } = useQuery({
    queryKey: ["bookDetail", bookId],
    queryFn: () => {
      console.log("🔍 Fetching bookDetail for bookId:", bookId);
      return fetchBookDetail(bookId);
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  useEffect(() => {
    console.log("📚 BookDetail State:");
    console.log("  - bookId:", bookId);
    console.log("  - isLoading:", isLoadingBookDetail);
    console.log("  - bookDetail:", bookDetail);
    console.log("  - book_id:", bookDetail?.book_id);
    console.log("  - error:", bookDetailError);
  }, [bookId, bookDetail, isLoadingBookDetail, bookDetailError]);

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



  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const openLoginModal = useUIStore((s) => s.openLoginModal);
  const updateToken = useAuthStore((s) => s.updateToken);
  const [messageApi, messageContextHolder] = message.useMessage();
  // Ensure book episodes are fetched as early as possible to allow name lookup
  useEffect(() => {
    if (!bookId) return;
    try {
      const key = ["bookEpisodes", bookId];
      const existing = queryClient.getQueryData(key);
      if (!existing) {
        queryClient.prefetchQuery({ queryKey: key, queryFn: () => fetchBookEpisodes(bookId) }).then(() => {
          console.debug('ReadEpisodePage: prefetch bookEpisodes (early) completed', bookId);
        }).catch((err) => {
          console.warn('ReadEpisodePage: prefetch bookEpisodes (early) failed', err);
        });
      }
    } catch (err) {
      console.warn('ReadEpisodePage: error during early prefetch bookEpisodes', err);
    }
  }, [bookId, queryClient]);

  function PurchaseFallback() {
    const ep = episode as any;

    // Use the outer `openConfirm` helper to show confirmation modal

    // Determine whether freecoin (ถุงเงิน) is allowed.
    // Priority: episode.use_freecoin -> bookDetail.use_freecoin -> default allow both
    const bookUseFreecoin = (bookDetail as any)?.use_freecoin;
    const epUseFreecoin = ep?.use_freecoin;
    const canUseFreecoin = epUseFreecoin !== undefined && epUseFreecoin !== null
      ? Number(epUseFreecoin) === 1
      : (bookUseFreecoin !== undefined && bookUseFreecoin !== null ? Number(bookUseFreecoin) === 1 : true);

    const hasDiscount = ep?.coin_discount !== null && ep?.coin_discount !== undefined;
    const coinPrice = hasDiscount ? ep.coin_discount : ep?.coin;

    return (
      <div className="text-center py-12">
        <Image src={settings?.img_buyep || '/images/unlock.png'} alt="No Content" width={100} height={100} loader={imageLoader} className="justify-center mx-auto" />
        <p className="text-sm text-gray-500 mb-4">ตอนนี้ยังไม่มีเนื้อหา หากต้องการอ่าน กรุณาซื้อ</p>

        <div className="flex items-center justify-center gap-3">
          {canUseFreecoin && (
            <button onClick={() => openConfirm("freecoin", ep?.freecoin ?? null)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg">
              <Image src={settings?.freecoin || '/images/money-bag.png'} alt="Coin Icon" width={20} height={20} loader={imageLoader} />
              ซื้อด้วยถุงเงิน {ep?.freecoin ? `(${ep.freecoin})` : ""}
            </button>
          )}

          <button onClick={() => openConfirm("coin", coinPrice)} className={`flex items-center gap-2 px-4 py-2 ${canUseFreecoin ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'} rounded-lg`}>
            <Image src={settings?.coin || '/images/e-coin.png'} alt="Coin Icon" width={20} height={20} loader={imageLoader} />
            <div className="flex items-center gap-1">
              <span>ซื้อด้วยเหรียญ</span>
              {hasDiscount ? (
                <>
                  <span className="line-through opacity-60 text-xs">({ep?.coin})</span>
                  <span className="font-bold">({ep.coin_discount})</span>
                </>
              ) : (
                <span>{ep?.coin ? `(${ep.coin})` : ""}</span>
              )}
            </div>
          </button>
        </div>
      </div>
    );
  }

  const {
    data: allEpisodes,
    error: episodesError,
    isLoading: isListLoading
  } = useQuery({
    queryKey: ["bookEpisodes", bookId],
    queryFn: () => {
      console.log("🔍 fetchBookEpisodes called with bookId:", bookId);
      return fetchBookEpisodes(bookId);
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
  });

  // Compute final episode title: prefer fields from `episode`, else lookup `allEpisodes` by id
  // 2. Logic การหาชื่อตอนที่ปรับปรุงแล้ว
  // --- รวม Logic การคำนวณทั้งหมดไว้ใน useMemo เดียว (เพื่อความชัวร์) ---
  const { displayTitle, prevEpId, nextEpId } = useMemo(() => {
    // ค่า Default
    const result = {
      displayTitle: "",
      prevEpId: null as string | null,
      nextEpId: null as string | null
    };

    // 1. เช็คว่ากำลังโหลด List อยู่ไหม?
    if (isListLoading) {
      result.displayTitle = "กำลังโหลด...";
      return result;
    }

    // 2. แปลง List เป็น Flat Array (เพื่อให้หาง่ายๆ)
    let flatList: any[] = [];
    if (allEpisodes) {
      if ((allEpisodes as any).groups && Array.isArray((allEpisodes as any).groups)) {
        (allEpisodes as any).groups.forEach((g: any) => {
          if (g.list) flatList.push(...g.list);
        });
      } else if (Array.isArray(allEpisodes)) {
        flatList = allEpisodes;
      }
    }

    // 3. หา Index ของตอนปัจจุบัน (Smart Match: เช็คทั้งตัวเลขและรหัส)
    // ถ้า List ยังไม่มา flatList จะว่าง -> currentIndex = -1
    let currentIndex = flatList.findIndex((ep: any) => isMatch(ep, episodeId));

    // Fallback: ถ้าหาไม่เจอ ลองใช้ ID จาก Content มาช่วยหา
    if (currentIndex === -1 && episode) {
      const ep = episode as any;
      if (ep.ep_id) currentIndex = flatList.findIndex((x: any) => isMatch(x, String(ep.ep_id)));
      if (currentIndex === -1 && ep.epID) currentIndex = flatList.findIndex((x: any) => isMatch(x, String(ep.epID)));
    }

    // 4. คำนวณข้อมูล (ถ้าเจอตำแหน่ง)
    if (currentIndex !== -1) {
      // 4.1 ชื่อตอนจาก List (แม่นยำที่สุด)
      result.displayTitle = flatList[currentIndex].name?.trim();

      // 4.2 ปุ่มก่อนหน้า
      if (currentIndex > 0) {
        const prev = flatList[currentIndex - 1];
        result.prevEpId = String(prev.ep_id || prev.epID);
      }

      // 4.3 ปุ่มถัดไป
      if (currentIndex < flatList.length - 1) {
        const next = flatList[currentIndex + 1];
        result.nextEpId = String(next.ep_id || next.epID);
      }
    } else {
      // 5. ถ้าไม่เจอใน List เลย (Fallback Title)
      const ep = episode as any;
      if (ep) {
        // พยายามหาชื่อจาก Content
        const candidates = [ep.name, ep.title];
        for (const c of candidates) {
          if (c && String(c).trim() !== "" && !String(c).startsWith("EP20")) {
            result.displayTitle = String(c).trim();
            break;
          }
        }
        // ถ้าไม่มีชื่อจริงๆ ให้โชว์ ID
        if (!result.displayTitle) {
          result.displayTitle = String(ep.ep_id ?? ep.epID ?? "");
        }
      }
    }

    return result;
  }, [allEpisodes, episode, episodeId, isListLoading]);

  useEffect(() => {
    if (episodesError) {
      console.error("❌ Episodes fetch error:", episodesError);
    }
    if (allEpisodes) {
      console.log("📦 Raw allEpisodes data:", allEpisodes);
    }
  }, [episodesError, allEpisodes]);

  // Prefetch the book's episodes list so navigation IDs are available immediately
  useEffect(() => {
    if (!bookId) return;
    const key = ["bookEpisodes", bookId];
    try {
      const existing = queryClient.getQueryData(key);
      if (!existing) {
        queryClient.prefetchQuery({ queryKey: key, queryFn: () => fetchBookEpisodes(bookId) }).then(() => {
          console.debug("ReadEpisodePage: prefetched bookEpisodes for", bookId);
        }).catch((err) => {
          console.warn("ReadEpisodePage: prefetch bookEpisodes failed", err);
        });
      }
    } catch (err) {
      console.warn("ReadEpisodePage: error during prefetch bookEpisodes", err);
    }
  }, [bookId, queryClient]);




  const { data: episodesData } = useQuery({
    queryKey: ["bookEpisodesGroups", bookId],
    queryFn: async () => {
      try {
        console.log("🔍 Fetching book groups for sidebar - bookId:", bookId);
        const res = await apiClient.get(`/bookgroup/${bookId}`);
        console.log("📦 Book groups response:", res.data);
        return res.data?.code === 200 ? res.data.data : null;
      } catch (err) {
        console.error("❌ Error fetching book groups:", err);
        return null;
      }
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (episode) {
      console.log("📚 Episode loaded!");
      console.log("📖 Full Episode data:", episode);
      console.log("� Episode fields:", {
        book_id: episode.book_id,
        bookID: episode.bookID,
        book_trans_id: episode.book_trans_id,
        ep_id: episode.ep_id,
        epID: episode.epID,
      });
    }
  }, [episode]);

  // Set Document Title
  useEffect(() => {
    if (bookDetail?.title) {
      if (displayTitle) {
        document.title = `${displayTitle} - ${bookDetail.title} | EnjoyBook`;
      } else {
        document.title = `${bookDetail.title} | EnjoyBook`;
      }
    } else {
      document.title = "EnjoyBook - อ่านนิยายออนไลน์";
    }
  }, [bookDetail, displayTitle]);

  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };
    const disableDevTools = (e: KeyboardEvent) => {
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
      }
    };

    const disableSelection = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.keyCode === 65) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.keyCode === 88) {
        e.preventDefault();
        return false;
      }
    };





    const protectContent = () => {
      const noop = () => { };
      if (typeof window !== "undefined" && process.env.NODE_ENV !== "development") {
        (window as any).console.log = noop;
        (window as any).console.info = noop;
        (window as any).console.warn = noop;
        (window as any).console.error = noop;
        (window as any).console.debug = noop;
      }

      const originalCreateElement = document.createElement.bind(document);
      document.createElement = function (tagName: string) {
        if (typeof tagName === "string" && tagName.toLowerCase() === "iframe") {
          console.warn("⚠️ iframe creation blocked for security");
          throw new Error("iframe creation is not allowed on this page");
        }
        return originalCreateElement(tagName);
      } as any;

      const blockIframeInsertion = () => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1 && (node as Element).tagName === "IFRAME") {
                console.warn("⚠️ iframe detected and removed");
                node.parentNode?.removeChild(node);
              }
            });
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        return observer;
      };

      const iframeObserver = blockIframeInsertion();

      const originalAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function (this: Node, child: any) {
        if (child?.tagName === "IFRAME") {
          console.warn("⚠️ iframe appendChild blocked");
          throw new Error("iframe insertion is not allowed");
        }
        return originalAppendChild.call(this, child);
      } as any;

      const originalInsertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function (this: Node, newNode: any, refNode: any) {
        if (newNode?.tagName === "IFRAME") {
          console.warn("⚠️ iframe insertBefore blocked");
          throw new Error("iframe insertion is not allowed");
        }
        return originalInsertBefore.call(this, newNode, refNode);
      } as any;

      const contentElements = document.querySelectorAll(".episode-content");
      contentElements.forEach((element) => {
        try {
          const innerTextDesc = Object.getOwnPropertyDescriptor(element, "innerText");
          const textContentDesc = Object.getOwnPropertyDescriptor(element, "textContent");

          if (!innerTextDesc || innerTextDesc.configurable !== false) {
            Object.defineProperty(element, "innerText", {
              get: () => "⚠️ เนื้อหาได้รับการปกป้อง",
              configurable: true,
            });
          }

          if (!textContentDesc || textContentDesc.configurable !== false) {
            Object.defineProperty(element, "textContent", {
              get: () => "⚠️ เนื้อหาได้รับการปกป้อง",
              configurable: true,
            });
          }
        } catch (error) {
          console.warn("⚠️ Cannot protect element:", error);
        }
      });

      return () => {
        iframeObserver.disconnect();
      };
    };

    const handleWindowBlur = () => {
      setIsFocused(false);
    };

    const handleWindowFocus = () => {
      setIsFocused(true);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'F12' ||
        event.ctrlKey ||
        event.metaKey ||
        event.key === 'PrintScreen' ||
        event.keyCode === 44
      ) {
        event.preventDefault();
        handleWindowBlur();
        setTimeout(() => {
          handleWindowFocus();
        }, 2000);
      }
    };

    const handleRightClick = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleRightClick);

    document.addEventListener("contextmenu", disableRightClick); // Replaced by handleRightClick
    document.addEventListener("keydown", disableDevTools); // Removed
    document.addEventListener("keydown", disableSelection); // Kept if needed, but handled by handleKeyDown above for F12 etc.

    let cleanupProtection: (() => void) | undefined;
    const timer = setTimeout(() => {
      cleanupProtection = protectContent();
    }, 1000);

    const extensionObserver = detectExtension();

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleRightClick);

      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("keydown", disableDevTools);
      document.removeEventListener("keydown", disableSelection);
      clearTimeout(timer);
      // clearInterval(devToolsInterval);

      // if (extensionObserver) extensionObserver.disconnect();
      // if (cleanupProtection) {
      //   cleanupProtection();
      // }
    };
  }, [episode]);

  const currentBg = bgColors.find((bg) => bg.key === bgColor);
  const currentFontSize = fontSizes.find((fs) => fs.key === fontSize);
  const currentFontFamily = fontFamilies.find((ff) => ff.key === fontFamily);

  // Update Navbar colors to match reading theme (restore on cleanup)
  useEffect(() => {
    try {
      const nav = document.getElementById("Navbar");
      if (!nav) return;

      const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        white: { bg: "#ffffff", text: "#000000", border: "#e5e7eb" }, // Navbar matches content (paper) bg
        sepia: { bg: "#fdfaee", text: "#000000", border: "#e6dbc4" },
        dark: { bg: "#1c1c1e", text: "#ffffff", border: "#333333" },
      };

      const colors = colorMap[bgColor] ?? colorMap.white;

      // Inject a stylesheet that enforces colors using !important so it survives React re-renders
      const styleId = "navbar-theme-override";
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      const css = `#Navbar { background-color: ${colors.bg} !important; color: ${colors.text} !important; border-bottom-color: ${colors.border} !important; }

        /* General override for Navbar content */
        #Navbar > div, 
        #Navbar a, 
        #Navbar button,
        #Navbar .text-gray-800,
        #Navbar svg,
        #Navbar span { 
            color: ${colors.text} !important; 
            border-color: ${colors.border} !important; 
        }
        
        /* Force Red Hover on Navbar Links (Top Level) */
        #Navbar a:hover,
        #Navbar button:hover,
        #Navbar .group:hover > a {
            color: #dc2626 !important;
        }

        #Navbar svg * { stroke: ${colors.text} !important; fill: none !important; }
        
        /* 0. Adjust Profile Dropdown Border for Dark Mode */
        #Navbar #UserProfileDropdown {
             border-color: ${currentBg?.key === 'dark' ? '#ffffff' : '#000000'} !important;
        }
        
        /* Mega Menu Theme Override using Structural Selectors for robustness */
        
        /* 1. Target the Root Container of NovelMenu (Child of #NovelMegaMenu) */
        #Navbar #NovelMegaMenu > div {
             background-color: ${colors.bg} !important;
             border-color: ${colors.border} !important;
        }

        /* 2. Target the Sidebar (First Child) and Content Area (Last Child/Flex-1) inside NovelMenu */
        #Navbar #NovelMegaMenu > div > div {
             background-color: ${colors.bg} !important;
             border-color: ${colors.border} !important;
        }

        /* 3. Text Colors: Override gray text to match theme text */
        #Navbar #NovelMegaMenu .text-gray-600,
        #Navbar #NovelMegaMenu .text-gray-500,
        #Navbar #NovelMegaMenu button,
        #Navbar #NovelMegaMenu a {
             color: ${colors.text} !important;
        }

        /* 4. Allow Red Text (Active/Brand) to remain visible - assume red is fine on both backgrounds */
        #Navbar #NovelMegaMenu .text-red-600 {
             color: #dc2626 !important; /* Force standard red-600 */
        }
        
        /* 5. Hover States: Use Border Color as background AND Red Text */
        #Navbar #NovelMegaMenu button:hover,
        #Navbar #NovelMegaMenu a:hover {
             background-color: ${colors.border} !important;
             color: #dc2626 !important; /* Restore red hover effect */
        }
        
        /* 6. Active Sidebar Item (has shadow and white bg usually) */
        #Navbar #NovelMegaMenu button.shadow-sm {
              background-color: ${colors.border} !important;
              color: #dc2626 !important; /* Make active item red too */
        }

        /* 7. SVGs */
        #Navbar #NovelMegaMenu svg {
             color: inherit !important;
        }
        /* Footer theme override for reader page - apply and remove only while on reader */
        footer { background-color: ${colors.bg} !important; color: ${colors.text} !important; border-top-color: ${colors.border} !important; margin-top: 0 !important; }
        footer, footer * { color: ${colors.text} !important; border-color: ${colors.border} !important; }
        footer svg, footer svg * { stroke: ${colors.text} !important; fill: none !important; }
        footer a { color: ${colors.text} !important; }
        footer .text-gray-700, footer .text-gray-500, footer .text-gray-400 { color: ${colors.text} !important; }

        /* Force Episode Content to match theme (Override inline styles from WYSIWYG/Word) */
        .episode-content, .episode-content * {
            color: ${colors.text} !important;
            background-color: transparent !important; /* Ensure text blends with page bg */
            border-color: ${colors.border} !important;
        }

        /* Force Font Family on Content Wrapper and all children */
        .episode-content-wrapper, .episode-content-wrapper * {
             font-family: ${currentFontFamily?.family || "var(--font-sarabun), sans-serif"} !important;
        }
        /* Extra specificity for prose if used */
        .prose, .prose * {
             font-family: ${currentFontFamily?.family || "var(--font-sarabun), sans-serif"} !important;
        }
      `;

      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        styleEl.innerHTML = css;
        document.head.appendChild(styleEl);
      } else {
        styleEl.innerHTML = css;
      }

      return () => {
        const s = document.getElementById(styleId);
        if (s) s.remove();
      };
    } catch (err) {
      console.warn("Could not update Navbar theme:", err);
    }
  }, [bgColor, currentFontFamily]);

  // Popover visible state for episodes list
  const [isListPopoverOpen, setIsListPopoverOpen] = useState(false);

  const renderEpisodesList = () => {
    if (!episodesData || !episodesData.groups) return <div className="p-4">ไม่พบรายการตอน</div>;

    return (
      <div className="max-h-64 w-72 overflow-auto">
        {/* Controls inside Popover */}
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
                  {group.list.map((ep: any) => (
                    <button
                      key={ep.ep_id ?? ep.epID}
                      onClick={() => {
                        setIsListPopoverOpen(false);
                        router.push(`/read/${bookId}/${String(ep.ep_id ?? ep.epID)}`);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${String(ep.epID) === String(episodeId) ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700'}`}
                    >
                      <div className="truncate text-sm">{ep.name?.trim()}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const fontSizeMenu: MenuProps["items"] = fontSizes.map((fs) => ({
    key: fs.key,
    label: fs.label,
    onClick: () => setFontSize(fs.key),
  }));

  const fontFamilyMenu: MenuProps["items"] = fontFamilies.map((ff) => ({
    key: ff.key,
    label: (
      <div style={{ fontFamily: ff.family }}>
        <span>{ff.label}</span>
      </div>
    ),
    onClick: () => setFontFamily(ff.key),
  }));

  const bgColorMenu: MenuProps["items"] = bgColors.map((bg) => ({
    key: bg.key,
    label: (
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded ${bg.bg} border`}></div>
        <span>{bg.label}</span>
      </div>
    ),
    onClick: () => setBgColor(bg.key),
  }));



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
                    กรุณาตรวจสอบว่า:
                    <br />• คุณได้ซื้อตอนนี้แล้วหรือไม่
                    (ถ้าเป็นตอนที่ต้องเสียเงิน)
                    <br />• คุณได้เข้าสู่ระบบแล้วหรือไม่
                    <br />• ลิงก์ที่คุณใช้ถูกต้องหรือไม่
                  </p>
                )}
                {process.env.NODE_ENV === "development" && (
                  <p className="mt-2 text-xs text-gray-500">Debug: episodeId = {episodeId}</p>
                )}
              </div>
            }
            type={is401Error ? "warning" : "error"}
            showIcon
          />
          <div className="mt-6 text-center space-x-4">
            <Button type="primary" onClick={() => router.back()}>
              ← กลับหน้าก่อนหน้า
            </Button>
            {is401Error && (
              <Button onClick={() => window.location.reload()}>🔄 ลองใหม่อีกครั้ง</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${currentBg?.bg} ${currentBg?.text} transition-colors duration-300 select-none`}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        minHeight: "100vh",
      }}
      onCopy={(e) => e.preventDefault()
      }
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {messageContextHolder}
      {
        isSidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]" onClick={() => setIsSidebarOpen(false)} />

            <div className="fixed top-0 right-0 h-full w-full sm:w-80 bg-white shadow-xl z-[70] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {episodesData && episodesData.groups && episodesData.groups.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  <div className="px-4 py-3 flex gap-2">
                  </div>
                  {episodesData.groups.map((group: any, groupIndex: number) => {
                    const isExpanded = expandedGroups[group.group_id] ?? groupIndex === 0;
                    const toggleGroup = () => {
                      setExpandedGroups((prev) => ({ ...prev, [group.group_id]: !isExpanded }));
                    };

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
                              const isCurrentEpisode = (ep.epID != null ? String(ep.epID) : null) === episodeId;
                              return (
                                <button
                                  key={ep.ep_id}
                                  onClick={() => {
                                    setIsSidebarOpen(false);
                                    router.push(`/read/${bookId}/${String(ep.ep_id ?? ep.epID)}`);
                                  }}
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
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">ไม่พบรายการตอน</p>
                </div>
              )}
            </div>
          </>
        )
      }



      <main className={`${currentBg?.bg} min-h-screen pb-20`}>
        <div className="min-h-[500px] p-4 flex flex-col items-center">
          <div className={`min-h-[1000px] rounded-md w-full lg:max-w-[1000px] ${currentBg?.paper || currentBg?.bg} ${currentBg?.text} shadow-lg relative flex flex-col`}>
            {/* Header inside paper */}
            {/* Header inside paper - Always Visible */}
            <div className={`transition-all duration-300 w-full sticky top-0 z-30 ${currentBg?.paper || currentBg?.bg}`}
              style={{
                borderColor: currentBg?.key === "dark" ? "#333333" : "rgba(0,0,0,0.05)",
                borderBottomWidth: "1px"
              }}
            >
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-1">
                  <Link href={bookId ? `/book/${bookId}` : "/"} className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`} style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      <span className="hidden sm:inline" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>หน้าหลัก</span>
                    </div>
                  </Link>

                  <Popover
                    placement="bottomLeft"
                    title={<div className="text-sm font-semibold">สารบัญ</div>}
                    content={renderEpisodesList()}
                    trigger="click"
                    open={isListPopoverOpen}
                    onOpenChange={(open) => setIsListPopoverOpen(open)}
                  >
                    <button className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`} title="สารบัญ" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                  </Popover>
                </div>

                <h1 className="text-sm font-medium truncate mx-4 flex-1 text-center opacity-80" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>{displayTitle || ""}</h1>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setIsAutoScroll(!isAutoScroll)}
                    className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"} ${isAutoScroll ? 'text-red-600' : ''}`}
                    title={isAutoScroll ? "หยุดเลื่อน" : "เลื่อนอัตโนมัติ"}
                    style={{ color: isAutoScroll ? '#dc2626' : (currentBg?.key === "dark" ? "white" : undefined) }}
                  >
                    {isAutoScroll ? (
                      <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                  </button>
                  <Dropdown menu={{ items: fontSizeMenu }} placement="bottomRight">
                    <button className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`} title="ขนาดตัวอักษร" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" /></svg>
                    </button>
                  </Dropdown>
                  <Dropdown menu={{ items: fontFamilyMenu }} placement="bottomRight">
                    <button className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`} title="ประเภทฟอนต์" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                    </button>
                  </Dropdown>
                  <Dropdown menu={{ items: bgColorMenu }} placement="bottomRight">
                    <button className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`} title="ธีมสี" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                    </button>
                  </Dropdown>
                </div>
              </div>
            </div>
            <article
              ref={contentRef}
              className="episode-content-wrapper mt-5 select-none leading-loose lg:px-11 px-6 text-wrap whitespace-normal overflow-hidden main-read cursor-pointer"
              style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none" }}
              onClick={() => setShowNav(!showNav)}
            >
              {isFocused ? (
                <div className={`${currentFontSize?.size || "text-base"}`} style={{ lineHeight: "1.8", fontFamily: currentFontFamily?.family || "var(--font-sarabun), sans-serif" }}>
                  {episode?.des ? (
                    parse(modifiedHtml(episode.des, currentFontFamily?.family || "var(--font-sarabun), sans-serif", user))
                  ) : episode?.content ? (
                    parse(modifiedHtml(episode.content, currentFontFamily?.family || "var(--font-sarabun), sans-serif", user))
                  ) : (
                    <PurchaseFallback />
                  )}
                </div>
              ) : (
                <div className='flex flex-col p-10 w-full min-h-[500px] justify-center text-center cursor-pointer' onClick={() => setIsFocused(true)}>
                  {Array.from({ length: Math.max(1, Math.ceil((episode?.des || episode?.content || "").length / 2000)) }, (_, i) => (
                    <div className={`text-2xl flex items-center justify-center w-full h-[600px] ${currentBg?.text}`} key={i}>คลิกที่นี่เพื่ออ่านต่อ</div>
                  ))}
                </div>
              )}

            </article>

            {/* Sticky Toggleable Footer inside paper (z-40 to be above text, similar to header) */}
            {showNav && (
              <div
                className={`w-full cursor-pointer border-t grid grid-cols-2 items-center sticky bottom-0 z-40 transition-all duration-300 shadow-lg ${currentBg?.paper || currentBg?.bg}`}
                style={{
                  // Add a subtle shadow to emphasize it's sticky
                  boxShadow: `0 -4px 6px -1px rgba(0, 0, 0, ${currentBg?.key === "dark" ? "0.3" : "0.05"})`,
                  borderColor: currentBg?.key === "dark" ? "#333333" : "rgba(0,0,0,0.05)"
                }}
              >
                <div
                  className={`group w-full p-3 flex flex-row gap-2 items-center justify-center border-r hover:bg-black/5 transition-all ${!prevEpId ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
                  style={{
                    borderColor: currentBg?.key === "dark" ? "#333333" : "rgba(0,0,0,0.05)"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (prevEpId && bookId) router.push(`/read/${bookId}/${prevEpId}`);
                  }}
                >
                  <svg className={`w-5 h-5 transition-transform group-hover:-translate-x-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[10px] opacity-60 font-normal">ตอนก่อนหน้า</span>
                    <span className="font-semibold text-sm">ก่อนหน้า</span>
                  </div>
                </div>
                <div
                  className={`group w-full p-3 flex flex-row gap-2 items-center justify-center hover:bg-black/5 transition-all ${!nextEpId ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.scrollTo(0, 0);
                    if (nextEpId && bookId) router.push(`/read/${bookId}/${nextEpId}`);
                  }}
                >
                  <div className="flex flex-col items-end leading-none gap-0.5">
                    <span className="text-[10px] opacity-60 font-normal">ตอนต่อไป</span>
                    <span className="font-semibold text-sm">ถัดไป</span>
                  </div>
                  <svg className={`w-5 h-5 transition-transform group-hover:translate-x-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            )}

            {/* Episode Comment Section - Moved inside to keep header sticky */}
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
        footer={[
          <Button
            key="cancel"
            onClick={() => setConfirmOpen(false)}
            disabled={buyLoading}
            className="transition-colors"
            onMouseEnter={() => setCancelHover(true)}
            onMouseLeave={() => setCancelHover(false)}
            style={{ borderColor: cancelHover ? '#dc2626' : 'transparent', color: cancelHover ? '#dc2626' : undefined }}
          >
            ยกเลิก
          </Button>,
          <Button key="confirm" type="primary" danger loading={buyLoading} onClick={() => { if (confirmMethod) handleBuy(confirmMethod); }}>
            {confirmMethod === 'coin' ? 'ยืนยันซื้อด้วยเหรียญ' : 'ยืนยันซื้อด้วยถุงเงิน'}
          </Button>,
        ]}
      >
        <div className="space-y-2 text-center">
          <div className="text-base font-semibold text-gray-700">{displayTitle || 'ตอนนี้'}</div>
          <div className="text-sm text-red-600 font-medium flex items-center justify-center gap-2">
            <Image src={settings?.coin || '/images/e-coin.png'} alt="เหรียญ" width={18} height={18} loader={imageLoader} />
            <span>{confirmAmount != null ? confirmAmount : '---'}</span>
          </div>
        </div>
      </Modal>
    </div >
  );
}
