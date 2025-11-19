"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Spin, Alert, Button, Dropdown, Popover, Modal } from "antd";
import { message } from "antd";
import type { MenuProps } from "antd";
// import parse from "html-react-parser";
import { BackToTopButton } from "@/components/BackToTopButton";
import ProtectedContent from "@/components/ProtectedContent";
import Image from "next/image";

import {
  fetchBookDetail,
  fetchBookEpisodes as fetchBookEpisodesAPI,
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
    console.error("❌ fetchEpisodeContent error:", err?.response?.data || err.message || err);
    if (err?.response?.data) {
      const d = err.response.data;
      throw new Error(d.message || `ไม่สามารถดึงข้อมูลตอนได้ (${err.response.status})`);
    }
    throw err;
  }
};

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
  { key: "white", label: "สว่าง", bg: "bg-white", text: "text-gray-900" },
  { key: "sepia", label: "สีเซเปีย", bg: "bg-amber-50", text: "text-gray-900" },
  { key: "dark", label: "มืด", bg: "bg-gray-900", text: "text-gray-100" },
  { key: "black", label: "ดำ", bg: "bg-black", text: "text-white" },
];

// ตั้งค่าฟอนต์ (5 แบบที่แตกต่างชัดแต่อ่านง่าย)
const fontFamilies = [
  { key: "sarabun", label: "Sarabun", family: "'Sarabun', sans-serif" },
  { key: "prompt", label: "Prompt", family: "'Prompt', sans-serif" },
  { key: "kanit", label: "Kanit", family: "'Kanit', sans-serif" },
  {
    key: "ibm-plex",
    label: "IBM Plex Sans Thai",
    family: "'IBM Plex Sans Thai', sans-serif",
  },
  { key: "mitr", label: "Mitr", family: "'Mitr', sans-serif" },
];

export default function ReadEpisodePage({ bookId, episodeId }: Props) {
  const router = useRouter();

  console.log(
    "🎯 ReadEpisodePage render - bookId:",
    bookId,
    "episodeId:",
    episodeId
  );

  useEffect(() => {
    console.log("🎯 Page loaded with bookId:", bookId, "episodeId:", episodeId);
  }, [bookId, episodeId]);

  // Disable the global Navbar's sticky behavior on this page only.
  // We remove the 'sticky' class and set position to static on mount,
  // and restore previous classes/styles on unmount to avoid side effects.
  useEffect(() => {
    const prevChildStyles: Array<{ el: HTMLElement; color: string; borderColor: string }> = [];
    try {
      const styleId = "no-sticky-navbar-style";
      // Inject CSS override to force Navbar non-sticky (highest priority)
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        styleEl.innerHTML = `#Navbar { position: static !important; top: auto !important; }`;
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
  const [, setPrevEpisodeData] = useState<any>(null);

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
      messageApi.error("เกิดข้อผิดพลาดในการซื้อ กรุณาลองใหม่");
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

    return (
      <div className="text-center py-12">
        <Image src="/images/unlock.png" alt="No Content" width={100} height={100} className="justify-center mx-auto" />
        <p className="text-sm text-gray-500 mb-4">ตอนนี้ยังไม่มีเนื้อหา หากต้องการอ่าน กรุณาซื้อ</p>

        <div className="flex items-center justify-center gap-3">
          {canUseFreecoin && (
            <button onClick={() => openConfirm("freecoin", ep?.freecoin ?? null)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg">
              <Image src="/images/money-bag.png" alt="Coin Icon" width={20} height={20} />
              ซื้อด้วยถุงเงิน {ep?.freecoin ? `(${ep.freecoin})` : ""}
            </button>
          )}

          <button onClick={() => openConfirm("coin", ep?.coin ?? null)} className={`flex items-center gap-2 px-4 py-2 ${canUseFreecoin ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'} rounded-lg`}>
            <Image src="/images/e-coin.png" alt="Coin Icon" width={20} height={20} />
            ซื้อด้วยเหรียญ {ep?.coin ? `(${ep.coin})` : ""}
          </button>
        </div>
      </div>
    );
  }

  const { data: allEpisodes, error: episodesError } = useQuery({
    queryKey: ["bookEpisodes", bookId],
    queryFn: () => {
      console.log("🔍 fetchBookEpisodes called with bookId:", bookId);
      return fetchBookEpisodes(bookId);
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
  });

  // Compute final episode title: prefer fields from `episode`, else lookup `allEpisodes` by id
  const computedEpisodeTitle = useMemo(() => {
    const ep: any = episode;
    const pickFromEpisode = () => {
      if (!ep) return "";
      const candidates = [ep.name];
      for (const c of candidates) {
        if (c !== undefined && c !== null && String(c).trim() !== "") return String(c).trim();
      }
      return "";
    };

    const fromEpisode = pickFromEpisode();
    if (fromEpisode) return fromEpisode;

    // fallback: try to find the episode in allEpisodes groups
    try {
      if (allEpisodes && Array.isArray(allEpisodes)) {
        const flat: any[] = allEpisodes;
        // some endpoints return grouped structure; handle both shapes
        // If flat looks like groups structure: { groups: [...] }
        if ((flat as any).groups) {
          const groups = (flat as any).groups as any[];
          for (const g of groups) {
            if (g.list && Array.isArray(g.list)) {
              for (const it of g.list) {
                const idShort = String(it.ep_id ?? it.epID ?? "");
                if (idShort && (idShort === String(ep?.ep_id ?? ep?.epID ?? episodeId))) {
                  return it.name || it.title || "";
                }
              }
            }
          }
        } else if (Array.isArray(flat)) {
          for (const it of flat) {
            const idShort = String(it.ep_id ?? it.epID ?? "");
            if (idShort && (idShort === String(ep?.ep_id ?? ep?.epID ?? episodeId))) {
              return it.name || it.title || "";
            }
          }
        }
      }
    } catch (err) {
      console.warn("computedEpisodeTitle lookup error:", err);
    }

    // last resort: use epID/ep_id if present
    if (ep) return String(ep.epID ?? ep.ep_id ?? "");
    return "";
  }, [episode, allEpisodes, episodeId]);

  const { prevIdFromList, nextIdFromList } = useMemo(() => {
    if (!allEpisodes || !Array.isArray(allEpisodes) || !episodeId) {
      return { prevIdFromList: null, nextIdFromList: null };
    }

    const idx = allEpisodes.findIndex((ep: any) => {
      const short = ep.ep_id != null ? String(ep.ep_id) : null;
      const long = ep.epID != null ? String(ep.epID) : null;
      return long === episodeId || short === episodeId;
    });

    if (idx === -1) return { prevIdFromList: null, nextIdFromList: null };

    const prev = idx > 0 ? allEpisodes[idx - 1] : null;
    const next = idx < allEpisodes.length - 1 ? allEpisodes[idx + 1] : null;

    const prevId = prev ? String(prev.ep_id ?? prev.epID) : null;
    const nextId = next ? String(next.ep_id ?? next.epID) : null;

    console.log("useMemo neighbor ids:", { idx, prevId, nextId });
    return { prevIdFromList: prevId, nextIdFromList: nextId };
  }, [allEpisodes, episodeId]);

  const getAdjacentId = (direction: "prev" | "next") => {
    try {
      // Compute adjacent episode ID directly from the latest `allEpisodes` and `episodeId`.
      if (!allEpisodes || !Array.isArray(allEpisodes) || !episodeId) return null;

      const idx = allEpisodes.findIndex((ep: any) => {
        const short = ep.ep_id != null ? String(ep.ep_id) : null;
        const long = ep.epID != null ? String(ep.epID) : null;
        return long === episodeId || short === episodeId;
      });

      if (idx === -1) return null;

      const adjIndex = direction === "prev" ? idx - 1 : idx + 1;
      if (adjIndex < 0 || adjIndex >= allEpisodes.length) return null;

      const adj = allEpisodes[adjIndex];
      return adj ? String(adj.ep_id ?? adj.epID) : null;
    } catch (err) {
      console.error("getAdjacentId error:", err);
      return null;
    }
  };

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

  // Prefetch adjacent episode content (prev/next) when we have candidate IDs
  useEffect(() => {
    const idsToPrefetch: string[] = [];
    if (prevIdFromList) idsToPrefetch.push(prevIdFromList);
    if (nextIdFromList) idsToPrefetch.push(nextIdFromList);
    if (prevEpisode) idsToPrefetch.push(prevEpisode);
    if (nextEpisode) idsToPrefetch.push(nextEpisode);

    idsToPrefetch.forEach((id) => {
      if (!id) return;
      const key = ["episodeContent", id];
      try {
        const has = queryClient.getQueryData(key);
        if (!has) {
          queryClient.prefetchQuery({ queryKey: key, queryFn: () => fetchEpisodeContent(id) }).then(() => {
            console.debug("ReadEpisodePage: prefetched episodeContent ->", id);
          }).catch((err) => {
            console.warn("ReadEpisodePage: prefetch episodeContent failed for", id, err);
          });
        }
      } catch (err) {
        console.warn("ReadEpisodePage: error during prefetch episodeContent", id, err);
      }
    });
  }, [prevIdFromList, nextIdFromList, prevEpisode, nextEpisode, queryClient]);

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

  useEffect(() => {
    console.log("🔄 Navigation effect triggered");
    console.log("allEpisodes:", allEpisodes?.length || 0);
    console.log("episodeId:", episodeId);

    if (!allEpisodes || !Array.isArray(allEpisodes) || allEpisodes.length === 0) {
      console.warn("⚠️ No episodes data or not an array");
      return;
    }

    if (!episodeId) {
      console.warn("⚠️ No episodeId");
      return;
    }

    console.log("🔍 Finding navigation for episode:", episodeId);
    console.log("📚 Total episodes:", allEpisodes.length);
    console.log("📝 First 3 epIDs:", allEpisodes.slice(0, 3).map((e: any) => e.epID));

    const currentIndex = allEpisodes.findIndex((ep: any) => {
      const short = ep.ep_id != null ? String(ep.ep_id) : null;
      const long = ep.epID != null ? String(ep.epID) : null;
      return long === episodeId || short === episodeId;
    });

    console.log("📍 Current index:", currentIndex);

    if (currentIndex !== -1) {
      const currentEp = allEpisodes[currentIndex];
      console.log("📖 Current episode:", {
        name: currentEp.name,
        epID: currentEp.epID,
        group: currentEp._groupName,
        groupIndex: currentEp._groupIndex,
        order: currentEp.order_by,
      });

      if (currentIndex > 0) {
        const prevEp = allEpisodes[currentIndex - 1];
        const prevId = String(prevEp.ep_id ?? prevEp.epID);
        console.log("⬅️ Setting prevEpisode ->", prevId, prevEp);
        setPrevEpisode(prevId);
        setPrevEpisodeData(prevEp);
        console.log("⬅️ Prev episode:", {
          ep_id: prevEp.ep_id,
          epID: prevEp.epID,
          name: prevEp.name,
          group: prevEp._groupName,
          sameGroup: prevEp._groupIndex === currentEp._groupIndex,
        });
      } else {
        setPrevEpisode(null);
        setPrevEpisodeData(null);
        console.log("⬅️ No prev episode (first episode)");
      }

      if (currentIndex < allEpisodes.length - 1) {
        const nextEp = allEpisodes[currentIndex + 1];
        const nextId = String(nextEp.ep_id ?? nextEp.epID);
        console.log("➡️ Setting nextEpisode ->", nextId, nextEp);
        setNextEpisode(nextId);
        setNextEpisodeData(nextEp);
        console.log("➡️ Next episode:", {
          ep_id: nextEp.ep_id,
          epID: nextEp.epID,
          name: nextEp.name,
          group: nextEp._groupName,
          sameGroup: nextEp._groupIndex === currentEp._groupIndex,
        });
      } else {
        setNextEpisode(null);
        setNextEpisodeData(null);
        console.log("➡️ No next episode (last episode)");
      }
    } else {
      console.error("❌ Current episode not found in list!");
      console.error("Looking for epID:", episodeId);
      console.error("Available epIDs:", allEpisodes.map((ep: any) => ep.epID));
    }
  }, [allEpisodes, episodeId]);

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

    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        document.body.innerHTML =
          '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-size:24px;color:red;">⚠️ กรุณาปิด Developer Tools</div>';
      }
    };

    const protectContent = () => {
      const noop = () => {};
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

    document.addEventListener("contextmenu", disableRightClick);
    document.addEventListener("keydown", disableDevTools);
    document.addEventListener("keydown", disableSelection);

    let cleanupProtection: (() => void) | undefined;
    const timer = setTimeout(() => {
      cleanupProtection = protectContent();
    }, 1000);

    const devToolsInterval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("keydown", disableDevTools);
      document.removeEventListener("keydown", disableSelection);
      clearTimeout(timer);
      clearInterval(devToolsInterval);
      if (cleanupProtection) {
        cleanupProtection();
      }
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
        white: { bg: "#ffffff", text: "#111827", border: "#000000" },
        sepia: { bg: "#fffbeb", text: "#111827", border: "#000000" },
        // Use a subtle light border on dark themes so borders remain visible against black backgrounds
        dark: { bg: "rgb(17 24 39)", text: "#FFFFFF", border: "#FFFFFF" },
        black: { bg: "#000000", text: "#FFFFFF", border: "#FFFFFF" },
      };

      const colors = colorMap[bgColor] ?? colorMap.white;

      // Inject a stylesheet that enforces colors using !important so it survives React re-renders
      const styleId = "navbar-theme-override";
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      const css = `#Navbar { background-color: ${colors.bg} !important; color: ${colors.text} !important; border-bottom-color: ${colors.border} !important; }
        #Navbar, #Navbar * { color: ${colors.text} !important; border-color: ${colors.border} !important; }
        #Navbar svg, #Navbar svg * { stroke: ${colors.text} !important; fill: none !important; }
        #Navbar a { color: ${colors.text} !important; }
        #Navbar .text-red-600, #Navbar .text-gray-800 { color: ${colors.text} !important; }
        /* Footer theme override for reader page - apply and remove only while on reader */
        footer { background-color: ${colors.bg} !important; color: ${colors.text} !important; border-top-color: ${colors.border} !important; }
        footer, footer * { color: ${colors.text} !important; border-color: ${colors.border} !important; }
        footer svg, footer svg * { stroke: ${colors.text} !important; fill: none !important; }
        footer a { color: ${colors.text} !important; }
        footer .text-gray-700, footer .text-gray-500, footer .text-gray-400 { color: ${colors.text} !important; }
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
  }, [bgColor]);

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
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          <Spin size="large" />
          <p className={`mt-4 ${currentBg?.text || "text-gray-900"}`}>
            กำลังโหลดเนื้อหา...
          </p>
        </div>
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
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {messageContextHolder}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]" onClick={() => setIsSidebarOpen(false)} />

          <div className="fixed top-0 right-0 h-full w-full sm:w-80 bg-white shadow-xl z-[70] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">สารบัญ</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {episodesData && episodesData.groups && episodesData.groups.length > 0 ? (
              <div className="divide-y divide-gray-100">
                <div className="px-4 py-3 flex gap-2">
                  <button onClick={expandAllGroups} className="text-sm px-3 py-1 bg-gray-100 rounded">แสดงทั้งหมด</button>
                  <button onClick={collapseAllGroups} className="text-sm px-3 py-1 bg-gray-100 rounded">ย่อทั้งหมด</button>
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
      )}

      <div className={`sticky top-0 z-50 ${currentBg?.bg} border-b border-gray-100`}>
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => (bookId ? router.push(`/book/${bookId}`) : router.back())} className={`p-2 rounded-full transition-colors ${currentBg?.text}`} style={{ backgroundColor: currentBg?.key === "white" ? "#f3f4f6" : currentBg?.key === "dark" || currentBg?.key === "black" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h1 className="text-sm font-medium truncate mx-4 flex-1 text-center">{computedEpisodeTitle || ""}</h1>

            <div className="flex items-center gap-1">
              <Dropdown menu={{ items: fontSizeMenu }} placement="bottomRight">
                <button className={`p-2 rounded-full transition-colors ${currentBg?.text}`} style={{ backgroundColor: currentBg?.key === "white" ? "#f3f4f6" : currentBg?.key === "dark" || currentBg?.key === "black" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }} title="ขนาดตัวอักษร">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                  </svg>
                </button>
              </Dropdown>

              <Dropdown menu={{ items: fontFamilyMenu }} placement="bottomRight">
                <button className={`p-2 rounded-full transition-colors ${currentBg?.text}`} style={{ backgroundColor: currentBg?.key === "white" ? "#f3f4f6" : currentBg?.key === "dark" || currentBg?.key === "black" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }} title="ประเภทฟอนต์">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </button>
              </Dropdown>

              <Dropdown menu={{ items: bgColorMenu }} placement="bottomRight">
                <button className={`p-2 rounded-full transition-colors ${currentBg?.text}`} style={{ backgroundColor: currentBg?.key === "white" ? "#f3f4f6" : currentBg?.key === "dark" || currentBg?.key === "black" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </button>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      <main className={`${currentBg?.bg} min-h-screen pb-20`}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <article className="episode-content-wrapper" style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none" }}>
            <div className={currentFontSize?.size || "text-base"} style={{ lineHeight: "1.8", fontFamily: currentFontFamily?.family || "'Sarabun', sans-serif" }}>
              {episode?.des ? (
                <ProtectedContent content={episode.des} className="episode-content" allowHtml={true} />
              ) : episode?.content ? (
                <ProtectedContent content={episode.content} className="episode-content" allowHtml={true} />
              ) : (
                <PurchaseFallback />
              )}
            </div>
          </article>
        </div>
      </main>

      <div className={`sticky bottom-0 border-t border-gray-100 ${currentBg?.bg} backdrop-blur-sm z-[90]`} style={{ zIndex: 90 }}>
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${!getAdjacentId("prev") ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 active:scale-95"}`} style={{ color: !getAdjacentId("prev") ? "#000000" : "#ffffff", textShadow: !getAdjacentId("prev") ? undefined : "0 1px 2px rgba(0,0,0,0.3)" }} onClick={() => { const target = getAdjacentId("prev"); console.log("Prev button clicked, target:", target); if (target && bookId) { router.push(`/read/${bookId}/${String(target)}`); } }}>← ก่อนหน้า</button>

            <Popover
              placement="top"
              title={<div className="text-sm font-semibold">สารบัญ</div>}
              content={renderEpisodesList()}
              trigger="click"
              open={isListPopoverOpen}
              onOpenChange={(open) => setIsListPopoverOpen(open)}
            >
              <button className={`p-3 rounded-lg border transition-colors ${currentBg?.key === "dark" || currentBg?.key === "black" ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"}`} aria-label="สารบัญ" type="button">
                <svg className={`w-5 h-5 ${currentBg?.text || "text-gray-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </Popover>

            <button className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${!getAdjacentId("next") ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 active:scale-95"}`} style={{ color: !getAdjacentId("next") ? undefined : "#ffffff", textShadow: !getAdjacentId("next") ? undefined : "0 1px 2px rgba(0,0,0,0.3)" }} onClick={() => { const target = getAdjacentId("next"); console.log("Next button clicked, target:", target); if (target && bookId) { router.push(`/read/${bookId}/${String(target)}`); } }}>ถัดไป →</button>
          </div>
        </div>
      </div>

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
          <div className="text-base font-semibold text-gray-700">{computedEpisodeTitle || 'ตอนนี้'}</div>
          <div className="text-sm text-red-600 font-medium flex items-center justify-center gap-2">
            <Image src="/images/e-coin.png" alt="เหรียญ" width={18} height={18} />
            <span>{confirmAmount != null ? confirmAmount : '---'}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
