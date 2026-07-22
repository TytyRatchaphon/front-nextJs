"use client";

import NextImage from "next/image";
import axios from "axios";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Image as AntImage, App, Modal, Dropdown, Select, Input, Checkbox } from "antd";
import { useAddBookToShelfMutation, useRemoveBookFromShelfMutation, useSaveBookShareMutation } from "@/hooks/book/useBookWriteMutations";
import { fetchLatestReadEpisode, fetchBookReportTypes, submitBookReport } from "@/services/apiServices";
import type { BookReportType } from "@/services/apiServices";
import { fetchUserCollections, addBooksToCollection } from "@/services/api/collectionApi";
import type { CollectionItem } from "@/services/api/collectionApi";

import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { FacebookShareButton, TwitterShareButton, LineShareButton } from "react-share";
import { TagSwiper } from "@/components/swiper/ImageSlider";
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';
import { normalizeEpisodeEarlyAccess } from "@/utils/earlyAccessUtils";

interface BookDetailHeaderProps {
  episodesData?: any;
  book: {
    id?: number | string;
    isAddedToShelf?: boolean;
    cover: string;
    img?: string;
    img_full?: string;
    img_gif?: string;
    img_gif_full?: string;
    title: string;
    tag: string;
    cat1?: number;
    cat2?: number;
    category2?: string;
    writer: {
      user_id: number;
      writer_name: string;
      img: string;
      isFollowing?: boolean;
    } | null;
    views: number;
    chapters: number;
    reviews: number;
    hearts?: number;
    flowers?: number;
    description?: string;
    tags?: string[];
    publishDate?: string;
    updateDate?: string;
    update_at?: string;
    status?: string;
    rate?: number;
    firstEpisodeId?: number | string;
    star?: number;
    end?: string;
  };
}

type ReadingProgressLine = {
  key: "normal" | "early";
  text: string;
  tone: "normal" | "early";
};

const getEpisodeDisplayName = (episode: any) => {
  return String(episode?.name ?? episode?.title ?? "").trim();
};

const getReadingProgressLines = (episodesData: any): ReadingProgressLine[] => {
  const orderedEpisodes = Array.isArray(episodesData?.groups)
    ? episodesData.groups.flatMap((group: any) => (Array.isArray(group?.list) ? group.list : []))
    : [];

  if (orderedEpisodes.length === 0) return [];

  const regularEpisodes = orderedEpisodes.filter((episode: any) => !normalizeEpisodeEarlyAccess(episode).isEarlyAccess);
  const earlyEpisodes = orderedEpisodes.filter((episode: any) => normalizeEpisodeEarlyAccess(episode).isEarlyAccess);
  const lines: ReadingProgressLine[] = [];

  if (regularEpisodes.length > 0) {
    const latestRegularEpisode = regularEpisodes[regularEpisodes.length - 1];
    const unreadRegularCount = regularEpisodes.filter((episode: any) => episode?.isRead !== true).length;
    const latestRegularName = getEpisodeDisplayName(latestRegularEpisode);
    const suffix = latestRegularName ? ` · ถึง${latestRegularName}` : "";

    lines.push({
      key: "normal",
      text: unreadRegularCount > 0
        ? `อ่านต่อได้อีก ${unreadRegularCount} ตอน${suffix}`
        : `อ่านถึงตอนล่าสุดแล้ว${suffix}`,
      tone: "normal",
    });
  }

  if (earlyEpisodes.length > 0) {
    const latestEarlyEpisode = earlyEpisodes[earlyEpisodes.length - 1];
    const unreadEarlyCount = earlyEpisodes.filter((episode: any) => episode?.isRead !== true).length;
    const latestEarlyName = getEpisodeDisplayName(latestEarlyEpisode);
    const suffix = latestEarlyName ? ` · ถึง${latestEarlyName}` : "";

    lines.push({
      key: "early",
      text: unreadEarlyCount > 0
        ? `อ่านล่วงหน้าต่อได้อีก ${unreadEarlyCount} ตอน${suffix}`
        : `อ่านตอนล่วงหน้าครบแล้ว${suffix}`,
      tone: "early",
    });
  }

  return lines;
};

const BookDetailHeaderContent = ({ book, episodesData }: BookDetailHeaderProps) => {
  const isDeleted = book.status?.toLowerCase().trim() === 'delete';
  const { notification } = App.useApp();
  const { token, hasMounted, user } = useAuthStore() as any;
  const { openLoginModal } = useUIStore();
  const addBookToShelfMutation = useAddBookToShelfMutation(book.id);
  const removeBookFromShelfMutation = useRemoveBookFromShelfMutation(book.id);
  const saveBookShareMutation = useSaveBookShareMutation();
  const [isAdded, setIsAdded] = useState(book.isAddedToShelf || false);
  const [loading, setLoading] = useState(false);
  const [isFollowed, setIsFollowed] = useState(book.writer?.isFollowing || false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [readEpInfo, setReadEpInfo] = useState<{ id: number | string; label: string } | null>(null);
  const [, setMoreMenuOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState<number | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTypes, setReportTypes] = useState<BookReportType[]>([]);
  const [reportTypesLoading, setReportTypesLoading] = useState(false);
  const [selectedReportTypeIds, setSelectedReportTypeIds] = useState<number[]>([]);
  const [reportReasonByTypeId, setReportReasonByTypeId] = useState<Record<number, number[]>>({});
  const [reportDetail, setReportDetail] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const bookshelfButtonClass = 'border-red-800 bg-white !text-[#B01F1F] hover:bg-red-50';

  useEffect(() => {
    // Wait for hydration to complete to avoid double fetching (guest -> user)
    if (!hasMounted) return;

    if (!book.id || !book.firstEpisodeId) return;

    const loadReadInfo = async (bookId: number,
      bookFirstEpisodeId: number | string) => {

      const res = await fetchLatestReadEpisode(bookId);
      if (res?.data) {
        const isRead = res.data.isRead;
        let targetEpId: number | string | undefined;

        if (isRead) {
          if (typeof res.data.ep_id === 'number') {
            targetEpId = res.data.ep_id;
          } else {
            const potentialObj = res.data.ep_id as any;
            targetEpId = potentialObj?.data?.ep_id ?? potentialObj?.ep_id;
          }

          if (targetEpId) {
            setReadEpInfo({ id: targetEpId, label: 'อ่านต่อ' });
          }
        } else {
          const complexEp = res.data.ep_id as any;
          targetEpId = complexEp?.data?.ep_id;

          if (targetEpId) {
            setReadEpInfo({ id: targetEpId, label: 'อ่านเลย' });
          } else if (bookFirstEpisodeId) {
            setReadEpInfo({ id: bookFirstEpisodeId, label: 'อ่านเลย' });
          }
        }
      }

    };
    loadReadInfo(book.id as number, book.firstEpisodeId as number | string);

  }, [book.id, book.firstEpisodeId, hasMounted, user?.user_id]);

  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        // Try to find user ID from token payload
        const uid = decoded.user_id || decoded.id || decoded.sub || decoded.userId;
        setCurrentUserId(uid);
      } catch {
      }
    }
  }, [token]);

  useEffect(() => {
    setIsAdded(book.isAddedToShelf || false);
  }, [book.isAddedToShelf]);

  useEffect(() => {
    setIsFollowed(book.writer?.isFollowing || false);
  }, [book.writer?.isFollowing]);

  const canSubmitReport =
    selectedReportTypeIds.length > 0 &&
    selectedReportTypeIds.every((typeId) => {
      const reasonIds = reportReasonByTypeId[typeId] ?? [];
      return reasonIds.length > 0;
    }) &&
    !submittingReport;

  const resetReportForm = () => {
    setSelectedReportTypeIds([]);
    setReportReasonByTypeId({});
    setReportDetail('');
  };

  const handleToggleReportType = (typeId: number, checked: boolean) => {
    setSelectedReportTypeIds((prev) => {
      if (checked) {
        if (prev.includes(typeId)) return prev;
        return [...prev, typeId];
      }
      return prev.filter((id) => id !== typeId);
    });

    setReportReasonByTypeId((prev) => {
      if (checked) {
        return {
          ...prev,
          [typeId]: prev[typeId] ?? [],
        };
      }
      const next = { ...prev };
      delete next[typeId];
      return next;
    });
  };

  const handleChangeReason = (typeId: number, reasonIds: number[]) => {
    const uniqueReasonIds = Array.from(new Set(reasonIds.filter((reasonId) => Number.isFinite(reasonId))));
    setReportReasonByTypeId((prev) => ({
      ...prev,
      [typeId]: uniqueReasonIds,
    }));
  };

  const getSelectedReasons = (type: BookReportType) => {
    const reasonIds = reportReasonByTypeId[type.id] ?? [];
    if (reasonIds.length === 0) return [];
    return type.reasons.filter((reason) => reasonIds.includes(reason.id));
  };

  const selectedReportTypes = selectedReportTypeIds
    .map((typeId) => reportTypes.find((type) => type.id === typeId) ?? null)
    .filter((type): type is BookReportType => type !== null);

  const selectedReportCount = selectedReportTypeIds.length;
  const selectedReasonCount = selectedReportTypeIds.reduce((total, typeId) => {
    const reasonIds = reportReasonByTypeId[typeId] ?? [];
    return total + reasonIds.length;
  }, 0);

  const reportSummaryText =
    selectedReportCount > 0
      ? `เลือก ${selectedReportCount} ประเภท • เลือกเหตุผลแล้ว ${selectedReasonCount} ข้อ`
      : 'ยังไม่ได้เลือกประเภท';

  const buildReportPayload = () => ({
    detail: reportDetail.trim() ? reportDetail.trim() : null,
    reports: selectedReportTypeIds.flatMap((typeId) => {
      const reasonIds = reportReasonByTypeId[typeId] ?? [];
      return reasonIds.map((reasonId) => ({
        type_id: typeId,
        reason_id: reasonId,
      }));
    }),
  });

  const validateSelectedReasons = () => {
    const missingReason = selectedReportTypeIds.some((typeId) => {
      const reasonIds = reportReasonByTypeId[typeId] ?? [];
      return reasonIds.length === 0;
    });
    if (missingReason) {
      notification.warning({ message: "กรุณาเลือกเหตุผลของทุกประเภทที่ติ๊กไว้" });
      return false;
    }
    return true;
  };

  const loadReportTypes = async () => {
    setReportTypesLoading(true);
    try {
      const types = await fetchBookReportTypes();
      setReportTypes(types);
    } catch {
      notification.error({ message: "โหลดประเภทการรายงานไม่สำเร็จ" });
    } finally {
      setReportTypesLoading(false);
    }
  };

  const handleToggleBookshelf = async () => {
    if (!token) {
      openLoginModal();
      return;
    }

    if (!book.id) {
      notification.error({ message: "ไม่พบข้อมูลหนังสือ" });
      return;
    }

    setLoading(true);
    try {
      if (isAdded) {
        // Remove
        await removeBookFromShelfMutation.mutateAsync();
        setIsAdded(false);
        notification.success({ message: "นำออกจากชั้นหนังสือแล้ว" });
      } else {
        // Add
        await addBookToShelfMutation.mutateAsync();
        setIsAdded(true);
        notification.success({ message: "เพิ่มเข้าชั้นหนังสือแล้ว" });
      }
    } catch {
      notification.error({ message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!token) {
      openLoginModal();
      return;
    }

    if (!book.writer?.user_id) {
      notification.error({ message: "ไม่พบข้อมูลนักเขียน" });
      return;
    }

    setFollowLoading(true);
    try {
      const action = isFollowed ? 'unfollow' : 'follow';
      await axios.post('/api/follow', {
        writer_id: book.writer.user_id,
        action: action
      }, {
        headers: { 'Authorization': token }
      });
      setIsFollowed(!isFollowed);
      notification.success({ message: isFollowed ? "เลิกติดตามแล้ว" : "ติดตามแล้ว" });
    } catch (error: any) {

      const resData = error.response?.data;
      if (resData?.message?.includes('ติดตามผู้ใช้นี้แล้ว')) {
        setIsFollowed(true);
        notification.info({ message: "คุณได้ติดตามผู้ใช้นี้แล้ว" });
      } else if (resData?.message?.includes('ไม่ได้ติดตาม')) {
        setIsFollowed(false);
        notification.info({ message: "คุณไม่ได้ติดตามผู้ใช้นี้" });
      } else {
        notification.error({ message: resData?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const coverImageUrl = resolveBookCoverImageSrc(book, "/images/book.png", "book");
  const readingProgressLines = getReadingProgressLines(episodesData);

  const handleTrackShare = (platform: 'facebook' | 'twitter' | 'line' | 'google' | 'instagram' | 'other') => {
    // Track share
    if (book.id) {
      saveBookShareMutation.mutate({
        bookID: book.id,
        type: platform,
      });
    }
  };

  const handleOpenCollectionModal = async () => {
    setMoreMenuOpen(false);
    setCollectionModalOpen(true);
    setCollectionsLoading(true);
    try {
      const data = await fetchUserCollections();
      setCollections(data ?? []);
    } catch {
      notification.error({ message: 'โหลดคอลเลคชั่นไม่สำเร็จ' });
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleAddToCollection = async (colId: number) => {
    if (!book.id) return;
    setAddingToCollection(colId);
    try {
      await addBooksToCollection(colId, [String(book.id)]);
      notification.success({ message: 'เพิ่มเข้าคอลเลคชั่นแล้ว' });
      setCollectionModalOpen(false);
    } catch {
      notification.error({ message: 'ไม่สามารถเพิ่มได้' });
    } finally {
      setAddingToCollection(null);
    }
  };

  const handleOpenReportModal = async () => {
    if (!token) {
      openLoginModal();
      return;
    }
    if (!book.id) {
      notification.error({ message: "ไม่พบข้อมูลนิยาย" });
      return;
    }

    setMoreMenuOpen(false);
    resetReportForm();
    setReportModalOpen(true);

    if (reportTypes.length === 0) {
      await loadReportTypes();
    }
  };

  const handleSubmitReport = async () => {
    if (!book.id || !canSubmitReport) return;
    if (!validateSelectedReasons()) return;

    setSubmittingReport(true);
    try {
      await submitBookReport(book.id, buildReportPayload());
      notification.success({ message: "ส่งรายงานนิยายเรียบร้อยแล้ว" });
      setReportModalOpen(false);
      resetReportForm();
    } catch (error: any) {
      notification.error({
        message: error?.response?.data?.message || "ไม่สามารถส่งรายงานได้",
      });
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Full-width Background with Book Cover */}
      <div className="absolute inset-0 -mx-[100vw] left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen overflow-hidden">
        {/* Book Cover Background - Blurred and Faded */}
        <div className="absolute inset-0">
          <NextImage
            src={coverImageUrl}
            alt="background"
            fill
            className="object-cover object-center opacity-50"
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            priority
          />
        </div>
        {/* Overlay gradient for better readability */}
        <div className="absolute inset-0 bg-white/60 via-white/50 to-white/60"></div>
      </div>

      <div className="relative bg-white/50 backdrop-blur-sm rounded-lg shadow-sm p-2 sm:p-6">
        {/* Mobile & Tablet: Vertical Layout | Desktop: Horizontal Layout */}
        <div className="relative flex flex-col xl:flex-row gap-4 sm:gap-6 items-start">

          {/* Main Left Column: Cover, Info, Tabs, Desc, Buttons */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-4">

            {/* Top part: Cover and Basic Info */}
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
              {/* Book Cover with Modal */}
              <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
                <div className="cursor-pointer hover:opacity-90 transition-opacity" title="คลิกเพื่อดูรูปขนาดใหญ่">
                  <AntImage
                    src={coverImageUrl}
                    alt={book.title}
                    width={168}
                    height={237}
                    preview={{}}
                    className="object-cover rounded-lg shadow-md w-[168px] h-[237px]"
                  />
                </div>
              </div>

              {/* Book Info - Full width on mobile/tablet */}
              <div className="flex-1 w-full lg:w-auto min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 text-gray-900 break-words">
                  {book.title}{" "}
                  {(book.end === "end" || book.status === "end") ? (
                    <span className="bg-green-100 text-green-600 px-2 sm:px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold align-middle ml-2">
                      จบแล้ว
                    </span>
                  ) : (
                    <span className="bg-pink-100 text-pink-600 px-2 sm:px-2.5 py-0.5 rounded text-[10px] sm:text-xs align-middle ml-2">
                      กำลังเขียน
                    </span>
                  )}
                </h1>

                {/* Stats using local assets icons */}
                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 mb-2 sm:mb-3 text-xs sm:text-sm text-gray-700 flex-wrap">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <NextImage
                      src="/images/eye.png"
                      alt="views"
                      width={16}
                      height={16}
                      className="w-3 h-3 sm:w-4 sm:h-4 object-contain"
                      unoptimized
                    />
                    <span className="font-medium">
                      {book.views?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <NextImage
                      src="/images/message-text.png"
                      alt="comments"
                      width={16}
                      height={16}
                      className="w-3 h-3 sm:w-4 sm:h-4 object-contain"
                      unoptimized
                    />
                    <span className="font-medium">
                      {book.reviews?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>

                {/* Author and Follow */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                  <span className="text-xs sm:text-sm text-gray-800 font-medium ml-1 -mr-3">โดย</span>
                  <Link
                    href={book.writer?.user_id ? `/wprofile/${book.writer.user_id}` : '#'}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-red-50 transition-colors group ${!book.writer?.user_id ? 'pointer-events-none' : ''}`}
                  >
                    {book.writer?.img && (
                      <NextImage
                        src={book.writer.img.startsWith('http') ? book.writer.img : `https://img.enjoybook.co/${book.writer.img}`}
                        alt="writer"
                        width={24}
                        height={24}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-gray-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-avatar.png'; }}
                      />
                    )}
                    <span className="text-xs sm:text-sm text-gray-800 font-semibold group-hover:text-red-600 transition-colors">
                      {book.writer?.writer_name || "ไม่ระบุ"}
                    </span>
                  </Link>
                  {currentUserId && book.writer?.user_id && String(currentUserId) === String(book.writer.user_id) ? (
                    <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-600 text-xs sm:text-sm font-medium flex items-center gap-1.5 shadow-sm select-none cursor-default">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      ผลงานของคุณ
                    </div>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition border ${isFollowed
                        ? 'bg-gray-100 border-gray-300 text-gray-600'
                        : 'bg-white border-black text-red-600 hover:bg-red-50'
                        } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {followLoading ? '...' : (isFollowed ? '✓ ติดตามแล้ว' : '+ ติดตาม')}
                    </button>
                  )}
                </div>

                {readingProgressLines.length > 0 && (
                  <div className="mt-6 flex flex-col gap-4 text-xs leading-5 sm:text-sm">
                    {readingProgressLines.map((line) => (
                      <p
                        key={line.key}
                        className={`flex items-start gap-2 ${
                          line.tone === "early" ? "text-amber-700" : "text-slate-600"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full ${
                            line.tone === "early" ? "bg-amber-400" : "bg-slate-400"
                          }`}
                        />
                        <span>{line.text}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Tags, Description, Buttons */}
            <div className="">
              {/* Tags */}
              <div className="w-full mb-3">
                <TagSwiper
                  tags={book.tags && book.tags.length > 0 ? book.tags : (book.tag ? [book.tag] : [])}
                  classImport="px-3 sm:px-4 py-1 rounded-full border border-red-200 bg-white text-red-700 text-xs sm:text-sm font-medium whitespace-nowrap"
                />
              </div>

              {/* Description */}
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">
                {book.description || "ไม่มีคำอธิบาย"}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                <Link
                  href={readEpInfo?.id ? `/read/${book.id}/${readEpInfo.id}` : (book.firstEpisodeId ? `/read/${book.id}/${book.firstEpisodeId}` : '#')}
                  className={`!bg-red-600 !text-white px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm hover:!bg-red-700 transition flex items-center gap-1.5 sm:gap-2 shadow-sm ${(!readEpInfo?.id && !book.firstEpisodeId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={(e) => {
                    if (!readEpInfo?.id && !book.firstEpisodeId) e.preventDefault();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15.5799 12C15.5799 13.98 13.9799 15.58 11.9999 15.58C10.0199 15.58 8.41992 13.98 8.41992 12C8.41992 10.02 10.0199 8.41998 11.9999 8.41998C13.9799 8.41998 15.5799 10.02 15.5799 12Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11.9998 20.27C15.5298 20.27 18.8198 18.19 21.1098 14.59C22.0098 13.18 22.0098 10.81 21.1098 9.39997C18.8198 5.79997 15.5298 3.71997 11.9998 3.71997C8.46984 3.71997 5.17984 5.79997 2.88984 9.39997C1.98984 10.81 1.98984 13.18 2.88984 14.59C5.17984 18.19 8.46984 20.27 11.9998 20.27Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{readEpInfo?.label || "อ่านเลย"}</span>
                </Link>
                {!isDeleted && (
                <button
                  onClick={handleToggleBookshelf}
                  disabled={loading}
                  className={`border px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition flex items-center gap-1.5 sm:gap-2 ${bookshelfButtonClass} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isAdded ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 384 512" fill="#B01F1F" aria-hidden="true">
                      <path fill="#B01F1F" d="M64 0C28.7 0 0 28.7 0 64L0 480c0 11.5 6.2 22.2 16.2 27.8s22.3 5.5 32.2-.4L192 421.3 335.5 507.4c9.9 5.9 22.2 6.1 32.2 .4S384 491.5 384 480l0-416c0-35.3-28.7-64-64-64L64 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 384 512" fill="#B01F1F" aria-hidden="true">
                      <path fill="#B01F1F" d="M0 64C0 28.7 28.7 0 64 0L320 0c35.3 0 64 28.7 64 64l0 417.1c0 25.6-28.5 40.8-49.8 26.6L192 412.8 49.8 507.7C28.5 521.9 0 506.6 0 481.1L0 64zM64 48c-8.8 0-16 7.2-16 16l0 387.2 117.4-78.2c16.1-10.7 37.1-10.7 53.2 0L336 451.2 336 64c0-8.8-7.2-16-16-16L64 48z" />
                    </svg>
                  )}
                  <span className="hidden sm:inline !text-[#B01F1F]">
                    {isAdded ? "นำออกจากชั้น" : "เพิ่มเข้าชั้น"}
                  </span>
                </button>
                )}
                {!isDeleted && (
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="bg-white border border-red-800 text-gray-700 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition flex items-center gap-1.5 sm:gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 512 512" fill="#B01F1F" aria-hidden="true">
                    <path fill="#B01F1F" d="M307.8 18.4c-12 5-19.8 16.6-19.8 29.6l0 80-112 0c-97.2 0-176 78.8-176 176 0 113.3 81.5 163.9 100.2 174.1 2.5 1.4 5.3 1.9 8.1 1.9 10.9 0 19.7-8.9 19.7-19.7 0-7.5-4.3-14.4-9.8-19.5-9.4-8.8-22.2-26.4-22.2-56.7 0-53 43-96 96-96l96 0 0 80c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l160-160c12.5-12.5 12.5-32.8 0-45.3l-160-160c-9.2-9.2-22.9-11.9-34.9-6.9z" />
                  </svg>
                  <span className="text-red-800">แชร์</span>
                </button>
                )}

                {/* More Options using Antd Dropdown to bypass overflow clipping */}
                {!isDeleted && (
                  <Dropdown
                    trigger={['click']}
                    placement="bottomRight"
                    menu={{
                      style: { marginTop: '8px' },
                      items: [
                        {
                          key: '1',
                          label: 'เพิ่มเข้าคอลเลคชั่น',
                          icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5v14" />
                              <path d="M5 12h14" />
                            </svg>
                          ),
                          onClick: handleOpenCollectionModal,
                        },
                        {
                          key: '2',
                          label: 'รายงานนิยาย',
                          icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 9v4" />
                              <path d="M12 17h.01" />
                              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            </svg>
                          ),
                          onClick: handleOpenReportModal,
                        },
                      ],
                    }}
                  >
                    <button
                      className="flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-red-800 bg-white text-sm text-gray-700 transition hover:bg-gray-50 sm:h-[44px] sm:w-[44px]"
                      title="เพิ่มเติม"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#B01F1F">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>
                  </Dropdown>
                )}
              </div>
            </div>
          </div>

          {/* Right Side Info Card - ข้อมูลเรื่อง (Hidden on mobile/tablet, shown on large desktop) */}
          <div className="hidden xl:block flex-shrink-0 w-80 bg-white/90 backdrop-blur-sm rounded-lg p-5 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              ข้อมูลเรื่อง
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">โดย</span>
                {book.writer?.user_id ? (
                  <Link href={`/wprofile/${book.writer.user_id}`} className="text-gray-900 font-medium hover:text-red-600 hover:underline transition-colors">
                    {book.writer.writer_name}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{book.writer?.writer_name || "-"}</span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">ผู้เขียน</span>
                <span className="text-gray-900 font-medium">นักเขียน</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">ผู้แปล</span>
                <span className="text-gray-900 font-medium">-</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">จำนวนตอน</span>
                <span className="text-gray-900 font-medium">
                  {book.chapters}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">หมวดหมู่</span>
                <span className="text-gray-900 font-medium text-right">
                  {book.cat1 ? (
                    <Link href={`/search?categories=${book.cat1}`} className="hover:text-red-600 hover:underline transition-colors">
                      {book.tag}
                    </Link>
                  ) : (
                    book.tag
                  )}
                  {book.category2 && (
                    <>
                      {" / "}
                      {book.cat2 ? (
                        <Link href={`/search?categories=${book.cat2}`} className="hover:text-red-600 hover:underline transition-colors">
                          {book.category2}
                        </Link>
                      ) : (
                        book.category2
                      )}
                    </>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">จัดเผยแพร่เมื่อ</span>
                <span className="text-gray-900 font-medium text-right text-xs">
                  {book.publishDate
                    ? new Date(book.publishDate).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">อัพเดทล่าสุดเมื่อ</span>
                <span className="text-gray-900 font-medium text-right text-xs">
                  {(book.update_at || book.updateDate)
                    ? new Date(book.update_at || book.updateDate!).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Share Modal */}
      <Modal
        open={shareModalOpen} // Update to use visible state variable
        onCancel={() => setShareModalOpen(false)}
        footer={null}
        centered
        width={600}
        closeIcon={<span className="text-gray-400 text-xl font-light">×</span>}
      >
        <div className="flex flex-col items-center p-4">
          <h3 className="text-lg font-bold mb-6 text-gray-800">แชร์นิยายเรื่องนี้</h3>

          {/* Social Icons */}
          <div className="flex gap-4 mb-6">
            {/* Facebook */}
            <FacebookShareButton
              url={typeof window !== 'undefined' ? window.location.href : ''}
              onClick={() => handleTrackShare('facebook')}
              className="hover:opacity-80 transition-opacity"
            >
              <NextImage src="/images/social-1.png" alt="Facebook" width={48} height={48} unoptimized />
            </FacebookShareButton>

            {/* Twitter */}
            <TwitterShareButton
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={`อ่านนิยาย ${book.title} ที่ EnjoyBook`}
              onClick={() => handleTrackShare('twitter')}
              className="hover:opacity-80 transition-opacity"
            >
              <NextImage src="/images/social-3.png" alt="Twitter" width={48} height={48} unoptimized />
            </TwitterShareButton>

            {/* Line */}
            <LineShareButton
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={`อ่านนิยาย ${book.title} ที่ EnjoyBook`}
              onClick={() => handleTrackShare('line')}
              className="hover:opacity-80 transition-opacity"
            >
              <NextImage src="/images/social-2.png" alt="Line" width={48} height={48} unoptimized />
            </LineShareButton>
          </div>

          {/* Copy Link Section */}
          <div className="flex w-full gap-2">
            <input
              type="text"
              readOnly
              value={typeof window !== 'undefined' ? window.location.href : ''}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-600 text-sm focus:outline-none bg-white"
            />
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href);
                  notification.success({ message: "คัดลอกลิงก์แล้ว" });
                  handleTrackShare('other');
                }
              }}
              className="bg-[#f7f8fa] hover:bg-[#9a9a9e] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              copy link
            </button>
          </div>
        </div>
      </Modal>

      {/* Collection Picker Modal */}
      <Modal
        open={collectionModalOpen}
        onCancel={() => setCollectionModalOpen(false)}
        footer={null}
        centered
        width={480}
        title={
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            <span className="!text-red-500">เพิ่มเข้าคอลเลคชั่น</span>
          </div>
        }
      >
        <div className="py-2">
          {collectionsLoading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
            </div>
          ) : collections.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p className="text-sm">ยังไม่มีคอลเลคชั่น</p>
              <p className="text-xs mt-1">สร้างคอลเลคชั่นได้ที่หน้าชั้นหนังสือ</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleAddToCollection(col.id)}
                  disabled={addingToCollection === col.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all text-left group"
                >
                  {/* Collection Cover */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                    {col.cover_image ? (
                      <NextImage src={col.cover_image} alt={col.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Collection Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-red-600 transition-colors">{col.name}</h4>
                    <p className="text-xs text-gray-400">{col.book_count} เล่ม</p>
                  </div>
                  {/* Add Icon */}
                  <div className="shrink-0">
                    {addingToCollection === col.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-red-500 transition-colors">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={reportModalOpen}
        onCancel={() => {
          setReportModalOpen(false);
          resetReportForm();
        }}
        onOk={handleSubmitReport}
        okText="ส่งรายงาน"
        cancelText="ยกเลิก"
        confirmLoading={submittingReport}
        okButtonProps={{ disabled: !canSubmitReport }}
        centered
        width={560}
        title="รายงานนิยาย"
      >
        <div className="space-y-4 py-2">
          {reportTypesLoading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-gray-500">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-red-600" />
              <span className="text-sm">กำลังโหลดประเภทการรายงาน...</span>
            </div>
          ) : reportTypes.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm">ไม่พบประเภทการรายงาน</p>
              <button
                type="button"
                onClick={loadReportTypes}
                className="mt-3 text-sm text-red-600 hover:text-red-700"
              >
                ลองโหลดใหม่
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-800">1) เลือกประเภท (เลือกได้หลายข้อ)</p>
                <div className="max-h-[220px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                  {reportTypes.map((type) => (
                    <label key={type.id} className="flex cursor-pointer items-start gap-2">
                      <Checkbox
                        checked={selectedReportTypeIds.includes(type.id)}
                        onChange={(event) => handleToggleReportType(type.id, event.target.checked)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-800">{type.title}</span>
                        {type.description ? (
                          <span className="block text-xs text-gray-500">{type.description}</span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">2) เลือกเหตุผลของแต่ละประเภท</p>
                  <p className="text-xs text-gray-500">{reportSummaryText}</p>
                </div>

                {selectedReportTypes.length === 0 ? (
                  <p className="text-xs text-gray-500">เลือกประเภทก่อนเพื่อระบุเหตุผล</p>
                ) : (
                  selectedReportTypes.map((type) => {
                    const selectedReasons = getSelectedReasons(type);
                    return (
                      <div key={type.id} className="space-y-2">
                        <p className="text-xs font-semibold text-gray-700">{type.title}</p>
                        <Select
                          mode="multiple"
                          value={reportReasonByTypeId[type.id] ?? []}
                          placeholder="เลือกเหตุผล"
                          onChange={(values) =>
                            handleChangeReason(
                              type.id,
                              (Array.isArray(values) ? values : []).map((value) => Number(value)),
                            )
                          }
                          options={type.reasons.map((reason) => ({
                            value: reason.id,
                            label: reason.title,
                          }))}
                          className="w-full"
                        />
                        {selectedReasons.map((reason) => (
                          reason.description ? (
                            <p key={`${type.id}-${reason.id}`} className="text-xs text-gray-500">
                              - {reason.description}
                            </p>
                          ) : null
                        ))}
                      </div>
                    );
                  })
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-800">3) เหตุผลประกอบ</p>
                <Input.TextArea
                  value={reportDetail}
                  onChange={(event) => setReportDetail(event.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
                />
                <p className="mt-1 text-right text-xs text-gray-400">{reportDetail.length}/500</p>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

const BookDetailHeader = (props: BookDetailHeaderProps) => (
  <App>
    <BookDetailHeaderContent {...props} />
  </App>
);

export default BookDetailHeader;
