"use client";

import { useState, useEffect, useRef, useMemo, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Alert, Button, Popover, Modal, Slider, Switch, Select, ConfigProvider, App, Input, Space } from "antd";
import parse from "html-react-parser";
import { BackToTopButton } from "@/components/utility/BackToTopButton";
import Link from "next/link";
import GifLoader from '@/components/utility/GifLoader';
import EpisodeCommentSection from "@/components/bookdetail/EpisodeCommentSection";
import Image from "next/image";
import { modifiedHtml, addParagraphIndexes } from "@/utils/htmlUtils";
import { decryptContent } from "@/utils/securityUtils";
import { useWebsiteStore } from '@/stores/websiteStore';
import { fetchBookDetail, fetchHasPaymentHistory } from "@/services/apiServices";
import apiClient from '@/services/apiClient';
import { useAuthStore, AuthState } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import '@/utils/imageUtils';

// Hooks
import { useContentProtection } from "@/hooks/reader/useContentProtection";
import { useReadingProgress } from "@/hooks/reader/useReadingProgress";
import { useReadingTheme } from "@/hooks/reader/useReadingTheme";
import { useEpisodeNavigation } from "@/hooks/reader/useEpisodeNavigation";
import { useReadFreeQuota } from "@/hooks/reader/useReadFreeQuota";
import { useLogger } from "@/hooks/useLogger";
import { CheckCircleOutlined } from "@ant-design/icons";
import { buildReadBuyPayload, getReadConfirmButtonLabel, getReadEpisodePurchaseState, getRegularEpisodePrices, type ReadFastPayMethod, type ReadPayMethod } from "./purchaseUtils";

type Props = {
  bookId: string;
  episodeId: string;
};

type EpisodeBookmark = {
  id: number;
  ep_id: number;
  paragraph_index: number;
  note?: string;
  created_at?: string;
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
  const { notification } = App.useApp();
  const [isBookmarkPopoverOpen, setIsBookmarkPopoverOpen] = useState(false);
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [bookmarkParagraphIndex, setBookmarkParagraphIndex] = useState<number | null>(null);
  const [editingBookmarkId, setEditingBookmarkId] = useState<number | null>(null);
  const [selectedParagraphIndex, setSelectedParagraphIndex] = useState<number | null>(null);
  const [trackedParagraphIndex, setTrackedParagraphIndex] = useState<number | null>(null);

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

  const { data: bookmarks = [], isFetching: isFetchingBookmarks } = useQuery<EpisodeBookmark[]>({
    queryKey: ["episodeBookmarks", episodeId],
    queryFn: async () => {
      const res = await apiClient.get(`/user/bookmarks`, { params: { ep_id: Number(episodeId) } });
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      return list
        .map((item: any) => ({
          id: Number(item?.id),
          ep_id: Number(item?.ep_id),
          paragraph_index: Number(item?.paragraph_index),
          note: item?.note,
          created_at: item?.created_at,
        }))
        .filter((item: EpisodeBookmark) => Number.isFinite(item.paragraph_index) && item.paragraph_index > 0)
        .sort((a: EpisodeBookmark, b: EpisodeBookmark) => a.paragraph_index - b.paragraph_index);
    },
    enabled: !!episodeId && isLoggedIn,
    staleTime: 30 * 1000,
  });

  const createBookmarkMutation = useMutation({
    mutationFn: async (payload: { paragraph_index: number; note: string }) => {
      return apiClient.post('/user/bookmarks', {
        book_id: Number(bookId),
        ep_id: Number(episodeId),
        paragraph_index: payload.paragraph_index,
        note: payload.note,
      });
    },
    onSuccess: () => {
      notification.success({ message: 'บันทึกตำแหน่งสำเร็จ', placement: 'topRight' });
      queryClient.invalidateQueries({ queryKey: ['episodeBookmarks', episodeId] });
      setBookmarkModalOpen(false);
      setBookmarkNote('');
      setBookmarkParagraphIndex(null);
      setEditingBookmarkId(null);
    },
    onError: (err: any) => {
      notification.error({ message: err?.response?.data?.message || 'บันทึกตำแหน่งไม่สำเร็จ', placement: 'topRight' });
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: async (payload: { bookmark_id: number; note: string }) => {
      return apiClient.patch('/user/bookmarks', payload);
    },
    onSuccess: () => {
      notification.success({ message: 'แก้ไข Bookmark สำเร็จ', placement: 'topRight' });
      queryClient.invalidateQueries({ queryKey: ['episodeBookmarks', episodeId] });
      setBookmarkModalOpen(false);
      setBookmarkNote('');
      setBookmarkParagraphIndex(null);
      setEditingBookmarkId(null);
    },
    onError: (err: any) => {
      notification.error({ message: err?.response?.data?.message || 'แก้ไข Bookmark ไม่สำเร็จ', placement: 'topRight' });
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: async (bookmarkId: number) => {
      return apiClient.delete('/user/bookmarks', { data: { bookmark_ids: [bookmarkId] } });
    },
    onSuccess: () => {
      notification.success({ message: 'ลบ Bookmark สำเร็จ', placement: 'topRight' });
      queryClient.invalidateQueries({ queryKey: ['episodeBookmarks', episodeId] });
    },
    onError: (err: any) => {
      notification.error({ message: err?.response?.data?.message || 'ลบ Bookmark ไม่สำเร็จ', placement: 'topRight' });
    },
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

  const renderedEpisodeHtml = useMemo(() => {
    const rawHtml = episode?.des || episode?.content || '';
    if (!rawHtml) return '';
    const normalizedHtml = modifiedHtml(rawHtml, currentFontFamily?.family || "var(--font-sarabun), sans-serif", user);
    return addParagraphIndexes(normalizedHtml).html;
  }, [episode?.des, episode?.content, currentFontFamily?.family, user]);

  const bookmarkedParagraphIndexes = useMemo(
    () => new Set(bookmarks.map((b) => b.paragraph_index).filter((n) => Number.isFinite(n) && n > 0)),
    [bookmarks]
  );

  const purchaseState = useMemo(
    () => getReadEpisodePurchaseState(episode as any, (bookDetail as any)?.use_freecoin),
    [episode, bookDetail]
  );

  const formatFreeUntil = (endDate?: string | null) => {
    if (!endDate) return null;
    const parsed = new Date(endDate);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEpisodeFreeMeta = (ep: any) => {
    const prices = getRegularEpisodePrices(ep as any);
    const isDiscountFree = Boolean(prices.isDiscountFree) && !Boolean(ep?.isBuy);
    return {
      isDiscountFree,
      freeUntilLabel: isDiscountFree ? formatFreeUntil(prices.discountEndDate) : null,
      displayCoinPrice: Number(prices.coinPrice ?? ep?.coin ?? 0),
    };
  };

  const readerToggleIgnoreSelector = [
    "a",
    "button",
    "input",
    "textarea",
    "select",
    "label",
    "[role='button']",
    "[data-reader-ignore-toggle='true']",
    ".ant-popover",
    ".ant-popover-content",
    ".ant-modal",
    ".ant-modal-wrap",
  ].join(",");

  const shouldIgnoreReaderToggle = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(readerToggleIgnoreSelector));
  };

  const handleReaderSurfaceClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (shouldIgnoreReaderToggle(event.target)) return;
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    if (!isFocused) {
      setIsFocused(true);
      return;
    }

    setShowNav((prev) => !prev);
  };

  const scrollToParagraph = (paragraphIndex: number) => {
    const root = innerContentRef.current;
    if (!root) return;

    const target = root.querySelector(`[data-paragraph-index="${paragraphIndex}"]`) as HTMLElement | null;
    if (!target) {
      notification.warning({
        message: 'ไม่พบตำแหน่งที่บุ๊กมาร์กไว้',
        description: `ย่อหน้าที่ ${paragraphIndex} ไม่มีในเนื้อหาปัจจุบัน`,
        placement: 'topRight',
      });
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('bookmark-highlight');
    window.setTimeout(() => target.classList.remove('bookmark-highlight'), 1400);
    setIsBookmarkPopoverOpen(false);
  };

  const getCurrentParagraphIndex = () => {
    const root = innerContentRef.current;
    if (!root) return null;

    const nodes = Array.from(root.querySelectorAll('[data-paragraph-index]')) as HTMLElement[];
    if (nodes.length === 0) return null;

    const anchorY = window.innerHeight * 0.35;
    let closestIdx: number | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    nodes.forEach((node) => {
      const idx = Number(node.getAttribute('data-paragraph-index'));
      if (!Number.isFinite(idx)) return;

      const rect = node.getBoundingClientRect();
      const topDistance = Math.abs(rect.top - anchorY);

      if (topDistance < closestDistance) {
        closestDistance = topDistance;
        closestIdx = idx;
      }
    });

    return closestIdx;
  };

  const openCreateBookmarkModal = () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    const idx = getCurrentParagraphIndex();
    if (!idx) {
      notification.warning({ message: 'ไม่พบย่อหน้าปัจจุบัน', placement: 'topRight' });
      return;
    }

    const existing = bookmarks.find((item) => item.paragraph_index === idx);
    if (existing) {
      setEditingBookmarkId(existing.id);
      setBookmarkParagraphIndex(existing.paragraph_index);
      setBookmarkNote(existing.note || '');
      setBookmarkModalOpen(true);
      return;
    }

    setEditingBookmarkId(null);
    setBookmarkParagraphIndex(idx);
    setBookmarkNote('');
    setBookmarkModalOpen(true);
  };

  const openCreateBookmarkModalByIndex = (paragraphIndex: number) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    const existing = bookmarks.find((item) => item.paragraph_index === paragraphIndex);
    if (existing) {
      setEditingBookmarkId(existing.id);
      setBookmarkParagraphIndex(existing.paragraph_index);
      setBookmarkNote(existing.note || '');
      setBookmarkModalOpen(true);
      return;
    }

    setEditingBookmarkId(null);
    setBookmarkParagraphIndex(paragraphIndex);
    setBookmarkNote('');
    setBookmarkModalOpen(true);
  };

  const openEditBookmarkModal = (bookmark: EpisodeBookmark) => {
    setEditingBookmarkId(bookmark.id);
    setBookmarkParagraphIndex(bookmark.paragraph_index);
    setBookmarkNote(bookmark.note || '');
    setBookmarkModalOpen(true);
  };

  const handleDeleteBookmark = (bookmarkId: number) => {
    Modal.confirm({
      title: 'ลบ Bookmark',
      content: 'ยืนยันการลบบุ๊กมาร์กนี้?',
      okText: 'ลบ',
      cancelText: 'ยกเลิก',
      okButtonProps: { danger: true, loading: deleteBookmarkMutation.isPending },
      onOk: async () => {
        await deleteBookmarkMutation.mutateAsync(bookmarkId);
      },
    });
  };

  const submitBookmarkModal = () => {
    if (!bookmarkParagraphIndex) {
      notification.warning({ message: 'ไม่พบย่อหน้าที่ต้องการบันทึก', placement: 'topRight' });
      return;
    }

    if (editingBookmarkId) {
      updateBookmarkMutation.mutate({
        bookmark_id: editingBookmarkId,
        note: bookmarkNote.trim() || `Bookmark ย่อหน้า ${bookmarkParagraphIndex}`,
      });
      return;
    }

    createBookmarkMutation.mutate({
      paragraph_index: bookmarkParagraphIndex,
      note: bookmarkNote.trim() || `Bookmark ย่อหน้า ${bookmarkParagraphIndex}`,
    });
  };

  useEffect(() => {
    const onSelectionChange = () => {
      const root = innerContentRef.current;
      if (!root || !isFocused) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setSelectedParagraphIndex(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const targetNode = container.nodeType === Node.ELEMENT_NODE ? container as Element : container.parentElement;

      if (!targetNode || !root.contains(targetNode)) {
        setSelectedParagraphIndex(null);
        return;
      }

      const paragraphEl = (targetNode as Element).closest('[data-paragraph-index]') as HTMLElement | null;
      if (!paragraphEl) {
        setSelectedParagraphIndex(null);
        return;
      }

      const idx = Number(paragraphEl.getAttribute('data-paragraph-index'));
      if (!Number.isFinite(idx) || idx <= 0) {
        setSelectedParagraphIndex(null);
        return;
      }

      setSelectedParagraphIndex(idx);
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) {
      setTrackedParagraphIndex(null);
      return;
    }

    const updateTrackedParagraph = () => {
      setTrackedParagraphIndex(getCurrentParagraphIndex());
    };

    updateTrackedParagraph();
    window.addEventListener('scroll', updateTrackedParagraph, { passive: true });
    window.addEventListener('resize', updateTrackedParagraph);

    return () => {
      window.removeEventListener('scroll', updateTrackedParagraph);
      window.removeEventListener('resize', updateTrackedParagraph);
    };
  }, [isFocused, renderedEpisodeHtml]);

  useEffect(() => {
    const root = innerContentRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll('[data-paragraph-index]')) as HTMLElement[];
    nodes.forEach((node) => node.classList.remove('paragraph-tracked-current'));

    if (!trackedParagraphIndex) return;
    const target = root.querySelector(`[data-paragraph-index="${trackedParagraphIndex}"]`) as HTMLElement | null;
    if (target) target.classList.add('paragraph-tracked-current');
  }, [trackedParagraphIndex, renderedEpisodeHtml]);

  useEffect(() => {
    const root = innerContentRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll('[data-paragraph-index]')) as HTMLElement[];
    nodes.forEach((node) => node.classList.remove('paragraph-bookmarked'));

    bookmarkedParagraphIndexes.forEach((idx) => {
      const target = root.querySelector(`[data-paragraph-index="${idx}"]`) as HTMLElement | null;
      if (target) target.classList.add('paragraph-bookmarked');
    });
  }, [bookmarkedParagraphIndexes, renderedEpisodeHtml]);

  const bookmarkIconStroke = currentBg?.key === 'dark' ? '#DFDFEC' : '#4B5563';

  const { episodesData, displayTitle, prevEpId, nextEpId } = useEpisodeNavigation(bookId, episodeId, episode);
  const currentEpisodeMeta = useMemo(() => {
    const groups = episodesData?.groups;
    if (!Array.isArray(groups)) return null;
    for (const group of groups) {
      const list = Array.isArray(group?.list) ? group.list : [];
      const found = list.find((ep: any) => String(ep?.ep_id ?? ep?.epID) === String(episodeId));
      if (found) return found;
    }
    return null;
  }, [episodesData, episodeId]);

  const isCurrentEpisodeOwned = Boolean((currentEpisodeMeta as any)?.isBuy ?? (episode as any)?.isBuy);
  const canTrackFreeReadQuota = Boolean(episode && renderedEpisodeHtml);
  const freeReadQuota = useReadFreeQuota({
    bookId,
    episodeId,
    isLoggedIn,
    userId: user?.user_id,
    canTrack: canTrackFreeReadQuota,
    isEpisodeOwned: isCurrentEpisodeOwned,
  });

  const hasReachedMemberFreeLimit =
    isLoggedIn &&
    freeReadQuota.limit > 0 &&
    freeReadQuota.currentCount >= freeReadQuota.limit;
  const isQuotaHardBlocked = freeReadQuota.isBlocked && freeReadQuota.reason === "guest-limit";

  const shouldCheckPaymentHistory =
    hasReachedMemberFreeLimit &&
    Boolean(user?.user_id) &&
    !freeReadQuota.hasShownTopupPrompt;

  const { data: hasPaymentHistory } = useQuery({
    queryKey: ["hasPaymentHistory", user?.user_id],
    queryFn: fetchHasPaymentHistory,
    enabled: shouldCheckPaymentHistory,
    staleTime: 5 * 60 * 1000,
  });

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
  const [confirmMethod, setConfirmMethod] = useState<ReadPayMethod | null>(null);
  const [confirmFastMethod, setConfirmFastMethod] = useState<ReadFastPayMethod>("fast_ticket");
  const [confirmAmount, setConfirmAmount] = useState<number | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);
  const [quotaLoginModalOpen, setQuotaLoginModalOpen] = useState(false);
  const [firstTopupModalOpen, setFirstTopupModalOpen] = useState(false);

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

  useEffect(() => {
    if (isQuotaHardBlocked && !isLoggedIn) {
      setQuotaLoginModalOpen(true);
    }
  }, [isQuotaHardBlocked, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn && quotaLoginModalOpen) {
      return;
    }
    if (isLoggedIn && quotaLoginModalOpen) {
      setQuotaLoginModalOpen(false);
    }
  }, [isLoggedIn, quotaLoginModalOpen]);

  useEffect(() => {
    if (hasReachedMemberFreeLimit && hasPaymentHistory === false && !freeReadQuota.hasShownTopupPrompt) {
      setFirstTopupModalOpen(true);
      freeReadQuota.markTopupPromptShown();
    }
  }, [
    hasReachedMemberFreeLimit,
    freeReadQuota.hasShownTopupPrompt,
    freeReadQuota.markTopupPromptShown,
    hasPaymentHistory,
  ]);

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
  const openConfirm = (method: ReadPayMethod, amount?: number | null) => {
    setConfirmMethod(method);
    setConfirmFastMethod(purchaseState.canFastTicket ? 'fast_ticket' : 'coin');
    setConfirmAmount(typeof amount === 'number' ? amount : null);
    setConfirmOpen(true);
  };

  const handleBuy = async (method: ReadPayMethod, earlyMethod: ReadFastPayMethod = "coin") => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    try {
      setBuyLoading(true);
      const ep = episode as any;

      if (purchaseState.isFastLocked) {
        notification.error({
          message: 'ตอนนี้ยังไม่เปิดให้ซื้อ',
          description: 'ตอนล่วงหน้ายังไม่สามารถซื้อได้ในตอนนี้',
          placement: 'topRight',
        });
        return;
      }

      if (purchaseState.isEarlyAccess && method === 'freecoin') {
        notification.error({
          message: 'ไม่รองรับการซื้อด้วยถุงเงิน',
          description: 'ตอนล่วงหน้าไม่รองรับการซื้อด้วยถุงเงิน',
          placement: 'topRight',
        });
        return;
      }

      const epId = String(ep?.ep_id ?? ep?.epID ?? episodeId);
      const { coinPrice, freecoinPrice: freeCoinPrice } = getRegularEpisodePrices(ep);
      const priceToDeduct = method === 'coin' ? coinPrice : freeCoinPrice;

      const payload = buildReadBuyPayload(epId, method, earlyMethod, purchaseState);
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

    if (isQuotaHardBlocked) {
      const isGuestLimit = true;
      return (
        <div className="text-center py-12">
          <Image src={settings?.img_buyep || '/images/unlock.png'} alt="Free quota reached" width={100} height={100} unoptimized className="justify-center mx-auto" />
          <p className="mt-2 text-base font-semibold text-gray-700">
            {isGuestLimit ? 'สิ้นสุดโควต้าอ่านฟรี' : 'อ่านฟรีครบ 40 ตอนแล้ว'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {isGuestLimit ? 'เข้าสู่ระบบเพื่ออ่านฟรีต่ออีก 30 ตอน' : 'ปลดล็อกตอนเพื่ออ่านต่อได้ทันที'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {isGuestLimit ? (
              <button
                type="button"
                onClick={openLoginModal}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                เข้าสู่ระบบเพื่ออ่านต่อ
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/store')}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                เติมเหรียญเพื่ออ่านต่อ
              </button>
            )}
          </div>
        </div>
      );
    }

    const { coinPrice, freecoinPrice, hasDiscount } = getRegularEpisodePrices(ep);
    const { isEarlyAccess, canFastTicket, canFastCoin, isFastLocked, fastTicketPrice, fastCoinPrice, canUseFreecoin } = purchaseState;
    const baseRegularPrice = Number(coinPrice ?? 0);
    const isDiscountFree = Boolean(purchaseState.isDiscountFree) && !isEarlyAccess;
    const freeUntilLabel = isDiscountFree ? formatFreeUntil(purchaseState.discountEndDate) : null;

    if (isDiscountFree || (!isEarlyAccess && baseRegularPrice <= 0)) {
      return (
        <div className="text-center py-12">
          <Image src={settings?.img_buyep || '/images/unlock.png'} alt="Free Episode" width={100} height={100} unoptimized className="justify-center mx-auto" />
          <p className="text-sm font-semibold text-emerald-700">{'\u0e15\u0e2d\u0e19\u0e19\u0e35\u0e49\u0e40\u0e1b\u0e34\u0e14\u0e2d\u0e48\u0e32\u0e19\u0e1f\u0e23\u0e35'}</p>
          {freeUntilLabel && (
            <p className="mt-1 text-xs text-emerald-700">{`\u0e2d\u0e48\u0e32\u0e19\u0e1f\u0e23\u0e35\u0e16\u0e36\u0e07 ${freeUntilLabel}`}</p>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <Image src={settings?.img_buyep || '/images/unlock.png'} alt="No Content" width={100} height={100} unoptimized className="justify-center mx-auto" />
        <p className="text-sm text-gray-500 mb-4">ตอนนี้ยังไม่มีเนื้อหา หากต้องการอ่าน กรุณาซื้อ</p>
        {isEarlyAccess && (
          <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isFastLocked ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'}`}>
            <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast ticket" width={16} height={16} unoptimized />
            {isFastLocked ? 'ตอนล่วงหน้า ยังไม่เปิดให้ซื้อ' : canFastTicket && canFastCoin ? 'ตอนล่วงหน้า เลือกจ่าย FastTicket / เหรียญ' : canFastTicket ? 'ตอนล่วงหน้า จ่ายด้วย FastTicket' : 'ตอนล่วงหน้า จ่ายด้วยเหรียญ'}
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          {canUseFreecoin && !isEarlyAccess && (
            <button onClick={() => openConfirm("freecoin", freecoinPrice)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg">
              <Image src={settings?.freecoin || '/images/money-bag.png'} alt="Coin Icon" width={20} height={20} unoptimized />
              ซื้อด้วยถุงเงิน {freecoinPrice ? `(${freecoinPrice})` : ""}
            </button>
          )}
          <button onClick={() => openConfirm("coin", coinPrice)} disabled={isFastLocked || (isEarlyAccess && !canFastCoin)} className={`flex items-center gap-2 px-4 py-2 ${(canUseFreecoin && !isEarlyAccess) ? 'bg-yellow-400' : 'bg-red-600'} text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed`}>
            {isEarlyAccess ? (
              <div className="flex items-center gap-2 text-white font-medium">
                {canFastTicket && (
                  <div className="inline-flex items-center gap-1">
                    <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="Fast Ticket" width={18} height={18} unoptimized />
                    <span>{fastTicketPrice}</span>
                  </div>
                )}
                {canFastTicket && canFastCoin && <span className="opacity-80">/</span>}
                {canFastCoin && (
                  <div className="inline-flex items-center gap-1">
                    <Image src={settings?.coin || '/images/e-coin.png'} alt="Coin Icon" width={18} height={18} unoptimized />
                    <span>{fastCoinPrice}</span>
                  </div>
                )}
                {baseRegularPrice > 0 && (
                  <>
                    <span className="opacity-80">+</span>
                    <div className="inline-flex items-center gap-1">
                      <Image src={settings?.coin || '/images/e-coin.png'} alt="regular coin" width={18} height={18} unoptimized />
                      {canUseFreecoin && (
                        <Image src={settings?.freecoin || '/images/money-bag.png'} alt="regular freecoin" width={18} height={18} unoptimized />
                      )}
                      <span>{baseRegularPrice}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Image src={settings?.coin || '/images/e-coin.png'} alt="Coin Icon" width={20} height={20} unoptimized />
                <div className="flex items-center gap-1 text-white">
                  <span>ซื้อด้วยเหรียญ</span>
                  {hasDiscount ? (
                    <>
                      <span className="line-through opacity-60 text-xs text-white">({ep?.coin})</span>
                      <span className="font-bold text-white">({coinPrice})</span>
                    </>
                  ) : (
                    <span className="text-white">{ep?.coin ? `(${ep.coin})` : ""}</span>
                  )}
                </div>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const renderReadConfirmSummary = () => {
    const ep = episode as any;
    const { coinPrice, freecoinPrice } = getRegularEpisodePrices(ep);
    const { isEarlyAccess, fastTicketPrice, fastCoinPrice } = purchaseState;

    if (isEarlyAccess) {
      const regularPaymentIcon = confirmMethod === 'freecoin'
        ? (settings?.freecoin || '/images/money-bag.png')
        : (settings?.coin || '/images/e-coin.png');
      const regularPaymentAmount = confirmMethod === 'freecoin' ? freecoinPrice : coinPrice;

      return (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
          <div className="text-xs font-medium text-gray-500 mb-2">สรุปราคา</div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-base font-semibold text-red-600">
            <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-amber-100 text-amber-700">
              <Image src={confirmFastMethod === 'fast_ticket' ? (settings?.fast_ticket || '/images/fast_ticket.png') : (settings?.coin || '/images/e-coin.png')} alt="early payment" width={16} height={16} unoptimized />
              <span>{confirmFastMethod === 'fast_ticket' ? fastTicketPrice : fastCoinPrice}</span>
            </div>
            <span className="text-gray-400">+</span>
            <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-orange-100 text-orange-600">
              <Image src={regularPaymentIcon} alt="regular payment" width={16} height={16} unoptimized />
              <span>{regularPaymentAmount}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-sm text-red-600 font-medium flex items-center justify-center gap-2">
        {confirmMethod === 'freecoin' ? (
          <Image src={settings?.freecoin || '/images/money-bag.png'} alt="ถุงเงิน" width={18} height={18} unoptimized />
        ) : (
          <Image src={settings?.coin || '/images/e-coin.png'} alt="เหรียญ" width={18} height={18} unoptimized />
        )}
        <span>{confirmAmount != null ? confirmAmount : '---'}</span>
      </div>
    );
  };

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
                    const { isDiscountFree, freeUntilLabel } = getEpisodeFreeMeta(ep);
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
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm">{ep.name?.trim()}</div>
                          {isDiscountFree && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{'\u0e15\u0e2d\u0e19\u0e1f\u0e23\u0e35'}</span>
                          )}
                        </div>
                        {isDiscountFree && freeUntilLabel && (
                          <div className="mt-0.5 truncate text-[10px] text-emerald-700">{`\u0e2d\u0e48\u0e32\u0e19\u0e1f\u0e23\u0e35\u0e16\u0e36\u0e07 ${freeUntilLabel}`}</div>
                        )}
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
      className={`min-h-screen ${currentBg?.bg} ${currentBg?.text} transition-colors duration-300 select-none ${currentBg?.key === 'dark' ? 'reader-theme-dark' : 'reader-theme-light'}`}
      style={{ userSelect: "none", minHeight: "100vh" }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
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
                            const { isDiscountFree, freeUntilLabel, displayCoinPrice } = getEpisodeFreeMeta(ep);
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
                                  {!ep.isBuy && isDiscountFree ? (
                                    <div className="flex flex-col items-end">
                                      <span className="text-[11px] font-semibold text-emerald-700">{'\u0e15\u0e2d\u0e19\u0e1f\u0e23\u0e35'}</span>
                                      {freeUntilLabel && (
                                        <span className="text-[10px] text-emerald-700">{`\u0e16\u0e36\u0e07 ${freeUntilLabel}`}</span>
                                      )}
                                    </div>
                                  ) : (displayCoinPrice > 0 && !ep.isBuy && (
                                    <span className="text-xs text-gray-500">{displayCoinPrice}</span>
                                  ))}
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
          <div
            className={`min-h-[1000px] rounded-md w-full lg:max-w-[1000px] ${currentBg?.paper || currentBg?.bg} ${currentBg?.text} shadow-lg relative flex flex-col ${showNav ? "reader-nav-visible" : "reader-nav-hidden"}`}
            onClick={handleReaderSurfaceClick}
          >
            {/* Header */}
            <div
              className={`transition-all duration-300 w-full sticky top-0 z-[120] ${currentBg?.paper || currentBg?.bg}`}
              data-reader-ignore-toggle="true"
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 120,
                borderColor: currentBg?.key === "dark" ? "#333333" : "rgba(0,0,0,0.05)",
                borderBottomWidth: "1px"
              }}>
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-1">
                  <Link href={bookId ? `/book/${bookId}` : "/"} className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`} style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      <span className="hidden sm:inline">หน้าหลัก</span>
                    </div>
                  </Link>
                  <Popover placement="bottomLeft" zIndex={900} title={<div className="text-sm font-semibold">สารบัญ</div>} content={renderEpisodesList()} trigger="click" open={isListPopoverOpen} onOpenChange={(open) => setIsListPopoverOpen(open)}>
                    <button className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`} title="สารบัญ" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                  </Popover>
                </div>

                <h1 className="text-sm font-medium truncate mx-4 flex-1 text-center opacity-80" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>{displayTitle || ""}</h1>

                <Popover
                  placement="bottomRight"
                  zIndex={900}
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
                    <div className="w-72 flex flex-col gap-4 p-1 bg-white text-gray-900">
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

                <Popover
                  placement="bottomRight"
                  zIndex={900}
                  trigger="click"
                  open={isBookmarkPopoverOpen}
                  onOpenChange={setIsBookmarkPopoverOpen}
                  title={<div className="text-sm font-semibold">ตำแหน่งที่บุ๊กมาร์กไว้</div>}
                  content={
                    <div className="w-80 bg-white text-gray-900">
                      <div className="mb-2 flex items-center justify-end">
                        <Button size="small" type="primary" onClick={openCreateBookmarkModal}>
                          เพิ่มจากตำแหน่งปัจจุบัน
                        </Button>
                      </div>
                      <div className="max-h-72 overflow-auto">
                        {isFetchingBookmarks ? (
                          <div className="py-4 text-center text-xs text-gray-500">กำลังโหลด...</div>
                        ) : bookmarks.length === 0 ? (
                          <div className="py-4 text-center text-xs text-gray-500">ยังไม่มีบุ๊กมาร์กในตอนนี้</div>
                        ) : (
                          <div className="space-y-1">
                            {bookmarks.map((bookmark) => (
                              <div key={bookmark.id} className="w-full px-3 py-2 rounded-lg transition-colors hover:bg-gray-100">
                                <button
                                  onClick={() => scrollToParagraph(bookmark.paragraph_index)}
                                  className="w-full text-left"
                                >
                                  <div className="text-sm font-medium text-gray-800">ย่อหน้า {bookmark.paragraph_index}</div>
                                  {bookmark.note && <div className="text-xs truncate text-gray-500">{bookmark.note}</div>}
                                </button>
                                <div className="mt-2 flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openEditBookmarkModal(bookmark)}
                                    className="text-xs text-blue-500 hover:text-blue-600"
                                  >
                                    แก้ไข
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBookmark(bookmark.id)}
                                    className="text-xs text-red-500 hover:text-red-600"
                                  >
                                    ลบ
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  }
                >
                  <button
                    className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                    title="Bookmark"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2C16 2 17 3.01 17 5.03V12.08C17 14.07 15.59 14.84 13.86 13.8L12.54 13C12.24 12.82 11.76 12.82 11.46 13L10.14 13.8C8.41 14.84 7 14.07 7 12.08V5.03C7 3.01 8 2 10 2H14Z" stroke={bookmarkIconStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6.82 4.98996C3.41 5.55996 2 7.65996 2 11.9V14.93C2 19.98 4 22 9 22H15C20 22 22 19.98 22 14.93V11.9C22 7.58996 20.54 5.47996 17 4.95996" stroke={bookmarkIconStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </Popover>
              </div>
            </div>

            {/* Content */}
            <article
              ref={contentRef}
              className="episode-content-wrapper relative mt-5 select-none leading-loose lg:px-11 px-6 text-wrap whitespace-normal overflow-hidden main-read cursor-pointer"
              style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none" }}
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
                  renderedEpisodeHtml && !isQuotaHardBlocked ? (
                    parse(renderedEpisodeHtml)
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

            {isFocused && selectedParagraphIndex && (
              <div className="fixed bottom-24 right-6 z-[850]">
                <button
                  onClick={() => {
                    openCreateBookmarkModalByIndex(selectedParagraphIndex);
                    window.getSelection()?.removeAllRanges();
                    setSelectedParagraphIndex(null);
                  }}
                  className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold shadow-lg hover:bg-red-700 transition-colors"
                >
                  บันทึกย่อหน้า {selectedParagraphIndex}
                </button>
              </div>
            )}

            {isFocused && trackedParagraphIndex && (
              <div className="fixed bottom-24 left-6 z-[840] px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium pointer-events-none">
                ย่อหน้า {trackedParagraphIndex.toLocaleString('th-TH')}
              </div>
            )}

            {/* Sticky Navigation Footer */}
            {(showNav) && (
              <div
                className={`w-full cursor-pointer border-t grid grid-cols-2 items-center sticky bottom-0 z-[999] transition-all duration-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] ${currentBg?.paper || currentBg?.bg}`}
                data-reader-ignore-toggle="true"
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
              <div className="px-4 pb-8" data-reader-ignore-toggle="true">
                <EpisodeCommentSection episodeId={episodeId} theme={currentBg} />
              </div>
            )}
          </div>
        </div>
      </main>

      <BackToTopButton />
      <Modal
        open={quotaLoginModalOpen}
        footer={null}
        closable={false}
        maskClosable
        onCancel={() => setQuotaLoginModalOpen(false)}
        centered
        width={420}
        zIndex={2100}
      >
        <div className="py-3 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 10V7a5 5 0 0 1 10 0v3" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <circle cx="12" cy="15" r="1" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">สิ้นสุดโควต้าอ่านฟรี</h3>
          <p className="mt-2 text-xl font-bold text-gray-800">อยากอ่านต่อฟรีอีก 30 ตอน?</p>
          <p className="mt-3 text-base leading-7 text-gray-500">
            แค่เข้าสู่ระบบก็รับสิทธิ์อ่านตอนฟรีแบบจุกๆ
            พร้อมสิทธิพิเศษอื่นๆ อีกมากมายได้ทันที
          </p>
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-red-600 py-3 text-lg font-bold !text-white hover:bg-red-700"
            onClick={() => {
              setQuotaLoginModalOpen(false);
              openLoginModal();
            }}
          >
            เข้าสู่ระบบเพื่ออ่านต่อ
          </button>
          <button
            type="button"
            className="mt-4 w-full py-2 text-lg font-semibold text-gray-500 hover:text-gray-700"
            onClick={() => {
              setQuotaLoginModalOpen(false);
              router.push("/");
            }}
          >
            กลับหน้าหลัก
          </button>
        </div>
      </Modal>
      <Modal
        open={firstTopupModalOpen}
        footer={null}
        closable={false}
        maskClosable
        onCancel={() => setFirstTopupModalOpen(false)}
        centered
        width={420}
        zIndex={2100}
      >
        <div className="py-3 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 7h18" strokeLinecap="round" />
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M16 13h2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">อ่านฟรีครบ 40 ตอนแล้ว</h3>
          <p className="hidden">
            รับสิทธิ์เติมเงินครั้งแรกราคาพิเศษ
            เพื่อปลดล็อกตอนต่อไปได้ทันที
          </p>
          <p className="mt-2 text-base leading-7 text-gray-500">
            {"อ่านฟรีครบแล้ว รับสิทธิ์เติมเงินครั้งแรกราคาพิเศษ"}
          </p>
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-red-600 py-3 text-lg font-bold !text-white hover:bg-red-700"
            onClick={() => {
              setFirstTopupModalOpen(false);
              router.push("/store");
            }}
          >
            เติมเงินครั้งแรกราคาพิเศษ
          </button>
          <button
            type="button"
            className="mt-4 w-full py-2 text-lg font-semibold text-gray-500 hover:text-gray-700"
            onClick={() => setFirstTopupModalOpen(false)}
          >
            ไว้ทีหลัง
          </button>
        </div>
      </Modal>
      <Modal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title={<div className="text-center text-lg font-medium">ยืนยันการซื้อ</div>}
        zIndex={2000}
        footer={[
          <Button key="cancel" onClick={() => setConfirmOpen(false)} disabled={buyLoading} className="transition-colors" onMouseEnter={() => setCancelHover(true)} onMouseLeave={() => setCancelHover(false)} style={{ borderColor: cancelHover ? '#dc2626' : 'transparent', color: cancelHover ? '#dc2626' : undefined }}>ยกเลิก</Button>,
          <Button key="confirm" type="primary" danger loading={buyLoading} onClick={() => { if (confirmMethod) handleBuy(confirmMethod, confirmFastMethod); }}>{getReadConfirmButtonLabel(confirmMethod, confirmFastMethod, purchaseState)}</Button>,
        ]}
      >
        <div className="space-y-2 text-center">
          <div className="text-base font-semibold text-gray-700">{displayTitle || 'ตอนนี้'}</div>
          {renderReadConfirmSummary()}
          {(() => {
              const ep = episode as any;
              if (!purchaseState.isEarlyAccess) return null;
              const regularPrices = getRegularEpisodePrices(ep);
              return (
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="mb-2 text-center text-xs font-medium text-gray-500">ชำระส่วนตอนล่วงหน้า</div>
                    <div className="flex justify-center">
                      <Space.Compact>
                        <Button type={confirmFastMethod === 'coin' ? 'primary' : 'default'} onClick={() => setConfirmFastMethod('coin')}>
                          เหรียญ <Image src={settings?.coin || '/images/e-coin.png'} alt="coin" width={14} height={14} unoptimized />
                        </Button>
                        <Button type={confirmFastMethod === 'fast_ticket' ? 'primary' : 'default'} onClick={() => setConfirmFastMethod('fast_ticket')} disabled={!purchaseState.canFastTicket}>
                          FastTicket <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast ticket" width={14} height={14} unoptimized />
                        </Button>
                      </Space.Compact>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-center text-xs font-medium text-gray-500">ชำระราคาตอนปกติ</div>
                    <div className="flex justify-center">
                      <Space.Compact>
                        <Button type={confirmMethod === 'coin' ? 'primary' : 'default'} onClick={() => { setConfirmMethod('coin'); setConfirmAmount(regularPrices.coinPrice); }}>
                          เหรียญ <Image src={settings?.coin || '/images/e-coin.png'} alt="coin" width={14} height={14} unoptimized />
                        </Button>
                        <Button type={confirmMethod === 'freecoin' ? 'primary' : 'default'} onClick={() => { setConfirmMethod('freecoin'); setConfirmAmount(regularPrices.freecoinPrice); }} disabled={!purchaseState.canUseFreecoin}>
                          ถุงเงิน <Image src={settings?.freecoin || '/images/money-bag.png'} alt="freecoin" width={14} height={14} unoptimized />
                        </Button>
                      </Space.Compact>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
      </Modal>
      <Modal
        open={bookmarkModalOpen}
        title={editingBookmarkId ? 'แก้ไข Bookmark' : 'เพิ่ม Bookmark'}
        onCancel={() => {
          setBookmarkModalOpen(false);
          setBookmarkNote('');
          setBookmarkParagraphIndex(null);
          setEditingBookmarkId(null);
        }}
        onOk={submitBookmarkModal}
        okText={editingBookmarkId ? 'บันทึกการแก้ไข' : 'บันทึก'}
        cancelText="ยกเลิก"
        confirmLoading={createBookmarkMutation.isPending || updateBookmarkMutation.isPending}
      >
        <div className="space-y-3 pt-2">
          <div className="text-sm text-gray-600">ตำแหน่งย่อหน้า: <span className="font-semibold text-gray-900">{bookmarkParagraphIndex ?? '-'}</span></div>
          <Input.TextArea
            value={bookmarkNote}
            onChange={(e) => setBookmarkNote(e.target.value)}
            rows={3}
            maxLength={120}
            placeholder="เพิ่มโน้ต (ไม่บังคับ)"
          />
        </div>
      </Modal>
      <style jsx global>{`
        .bookmark-highlight {
          background: rgba(227, 28, 61, 0.14);
          transition: background-color 0.25s ease;
          border-radius: 6px;
        }
        .paragraph-tracked-current {
          position: relative;
          background: transparent;
          border-radius: 0;
        }
        .paragraph-tracked-current::before {
          content: ">";
          position: absolute;
          left: -14px;
          top: 0.05em;
          font-weight: 700;
          font-size: 0.95em;
          line-height: 1;
          pointer-events: none;
          opacity: 1;
          transition: opacity 0.18s ease;
        }
        .reader-nav-hidden .paragraph-tracked-current::before {
          opacity: 0;
        }
        .reader-theme-light .paragraph-tracked-current::before {
          color: rgba(148, 163, 184, 0.92);
        }
        .reader-theme-dark .paragraph-tracked-current::before {
          color: rgba(203, 213, 225, 0.88);
        }
        .reader-theme-light .paragraph-bookmarked {
          background: rgba(59, 130, 246, 0.08);
          border-left: 3px solid rgba(59, 130, 246, 0.55);
          border-radius: 6px;
          padding-left: 10px;
        }
        .reader-theme-dark .paragraph-bookmarked {
          background: rgba(148, 163, 184, 0.14);
          border-left: 3px solid rgba(203, 213, 225, 0.65);
          border-radius: 6px;
          padding-left: 10px;
        }
      `}</style>
    </div>
  );
}
