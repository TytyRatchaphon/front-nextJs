"use client";

import NextImage from "next/image";
import axios from "axios";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Image as AntImage, App, Modal } from "antd";
import apiClient from "@/services/apiClient";
import { fetchLatestReadEpisode } from "@/services/apiServices";

import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { FacebookShareButton, TwitterShareButton, LineShareButton } from "react-share";
import { TagSwiper } from "@/components/swiper/ImageSlider";
import { useWebsiteStore } from '@/stores/websiteStore';

interface BookDetailHeaderProps {
  book: {
    id?: number | string;
    isAddedToShelf?: boolean;
    cover: string;
    title: string;
    tag: string;
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

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('/')) return src;
  return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
}

const BookDetailHeaderContent = ({ book }: BookDetailHeaderProps) => {
  const { message: messageApi } = App.useApp();
  const { token, hasMounted, user } = useAuthStore() as any;
  const { openLoginModal } = useUIStore();
  const [isAdded, setIsAdded] = useState(book.isAddedToShelf || false);
  const [loading, setLoading] = useState(false);
  const [isFollowed, setIsFollowed] = useState(book.writer?.isFollowing || false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [readEpInfo, setReadEpInfo] = useState<{ id: number | string; label: string } | null>(null);

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
      } catch (error) {
      }
    }
  }, [token]);

  useEffect(() => {
    setIsAdded(book.isAddedToShelf || false);
  }, [book.isAddedToShelf]);

  useEffect(() => {
    setIsFollowed(book.writer?.isFollowing || false);
  }, [book.writer?.isFollowing]);

  const handleToggleBookshelf = async () => {
    if (!token) {
      openLoginModal();
      return;
    }

    if (!book.id) {
      messageApi.error("ไม่พบข้อมูลหนังสือ");
      return;
    }

    setLoading(true);
    try {
      if (isAdded) {
        // Remove
        await apiClient.post(`/user/savebookshelve/remove/${book.id}`);
        setIsAdded(false);
        messageApi.success("นำออกจากชั้นหนังสือแล้ว");
      } else {
        // Add
        await apiClient.post(`/user/savebookshelve/add/${book.id}`);
        setIsAdded(true);
        messageApi.success("เพิ่มเข้าชั้นหนังสือแล้ว");
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
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
      messageApi.error("ไม่พบข้อมูลนักเขียน");
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
      messageApi.success(isFollowed ? "เลิกติดตามแล้ว" : "ติดตามแล้ว");
    } catch (error: any) {

      const resData = error.response?.data;
      if (resData?.message?.includes('ติดตามผู้ใช้นี้แล้ว')) {
        setIsFollowed(true);
        messageApi.info("คุณได้ติดตามผู้ใช้นี้แล้ว");
      } else if (resData?.message?.includes('ไม่ได้ติดตาม')) {
        setIsFollowed(false);
        messageApi.info("คุณไม่ได้ติดตามผู้ใช้นี้");
      } else {
        messageApi.error(resData?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const coverImageUrl = book.cover
    ? book.cover.trim().startsWith("http")
      ? book.cover
      : `https://img.enjoybook.co/img/book/thumbnail/${book.cover.trim()}`
    : "/images/book.png";

  const handleTrackShare = (platform: 'facebook' | 'twitter' | 'line') => {
    // Track share
    if (currentUserId && book.id) {
      apiClient.post('gift/saveshare', {
        userID: currentUserId,
        bookID: book.id,
        type: platform,
      }).catch(() => { });
    }
  };

  const { settings } = useWebsiteStore();

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
            loader={imageLoader}
          />
        </div>
        {/* Overlay gradient for better readability */}
        <div className="absolute inset-0 bg-white/60 via-white/50 to-white/60"></div>
      </div>

      <div className="relative bg-white/50 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden p-2 sm:p-6">
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
                      loader={imageLoader}
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
                      loader={imageLoader}
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
                    href={book.writer?.user_id ? `/wprofile?id=${book.writer.user_id}` : '#'}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-red-50 transition-colors group ${!book.writer?.user_id ? 'pointer-events-none' : ''}`}
                  >
                    {book.writer?.img && (
                      <NextImage
                        src={book.writer.img.startsWith('http') ? book.writer.img : `https://img.enjoybook.co/${book.writer.img}`}
                        alt="writer"
                        width={24}
                        height={24}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-gray-100"
                        unoptimized
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
                <button
                  onClick={handleToggleBookshelf}
                  disabled={loading}
                  className={`bg-white border border-red-800 text-gray-700 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition flex items-center gap-1.5 sm:gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isAdded ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2C16 2 17 3.01 17 5.03V12.08C17 14.07 15.59 14.84 13.86 13.8L12.54 13C12.24 12.82 11.76 12.82 11.46 13L10.14 13.8C8.41 14.84 7 14.07 7 12.08V5.03C7 3.01 8 2 10 2H14Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6.82 4.98996C3.41 5.55996 2 7.65996 2 11.9V14.93C2 19.98 4 22 9 22H15C20 22 22 19.98 22 14.93V11.9C22 7.58996 20.54 5.47996 17 4.95996" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 22 9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" fill="white" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17 2.44V12.42C17 14.39 15.59 15.16 13.86 14.12L12.54 13.33C12.24 13.15 11.76 13.15 11.46 13.33L10.14 14.12C8.41 15.15 7 14.39 7 12.42V2.44" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <span className="hidden sm:inline text-red-800">
                    {isAdded ? "นำออกจากชั้น" : "เพิ่มเข้าชั้น"}
                  </span>
                </button>
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="bg-white border border-red-800 text-gray-700 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition flex items-center gap-1.5 sm:gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M16.96 6.16998C18.96 7.55998 20.34 9.76998 20.62 12.32L16.96 6.16998Z" fill="#B01F1F" />
                    <path d="M16.96 6.16998C18.96 7.55998 20.34 9.76998 20.62 12.32" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3.49023 12.37C3.75023 9.82997 5.11023 7.61997 7.09023 6.21997" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.18994 20.94C9.34994 21.53 10.6699 21.86 12.0599 21.86C13.3999 21.86 14.6599 21.56 15.7899 21.01" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12.0598 7.70001C13.5951 7.70001 14.8398 6.45537 14.8398 4.92001C14.8398 3.38466 13.5951 2.14001 12.0598 2.14001C10.5244 2.14001 9.27979 3.38466 9.27979 4.92001C9.27979 6.45537 10.5244 7.70001 12.0598 7.70001Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.8298 19.92C6.36516 19.92 7.60981 18.6753 7.60981 17.14C7.60981 15.6046 6.36516 14.36 4.8298 14.36C3.29445 14.36 2.0498 15.6046 2.0498 17.14C2.0498 18.6753 3.29445 19.92 4.8298 19.92Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19.1701 19.92C20.7055 19.92 21.9501 18.6753 21.9501 17.14C21.9501 15.6046 20.7055 14.36 19.1701 14.36C17.6348 14.36 16.3901 15.6046 16.3901 17.14C16.3901 18.6753 17.6348 19.92 19.1701 19.92Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-red-800">แชร์</span>
                </button>
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
                  <Link href={`/wprofile?id=${book.writer.user_id}`} className="text-gray-900 font-medium hover:text-red-600 hover:underline transition-colors">
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
                  {book.tag}
                  {book.category2 ? ` / ${book.category2}` : ""}
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
                  messageApi.success("คัดลอกลิงก์แล้ว");
                }
              }}
              className="bg-[#f7f8fa] hover:bg-[#9a9a9e] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              copy link
            </button>
          </div>
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