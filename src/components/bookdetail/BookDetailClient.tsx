"use client";

import Image from "next/image";
import BookDetailHeader from "@/components/bookdetail/BookDetailHeader";
import BookInfoCard from "@/components/bookdetail/BookInfoCard";
import TabsSection from "@/components/bookdetail/TabsSection";
import Footer from "@/components/home/Footer";


import { useState, useEffect } from "react";
import { BackToTopButton } from "@/components/utility/BackToTopButton";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchBookDetail,
  fetchBookEpisodes,
  fetchUserShelve,
  fetchBookPurchaseDetails,
  // fetchUserWallet,
} from "@/services/apiServices";
import { Alert } from "antd";
import Link from "next/link";
import CommentSection from "@/components/bookdetail/CommentSection";
import { useAuthStore } from "@/stores/authStore";
import GifLoader from '@/components/utility/GifLoader';
// import type { Episode } from "@/types/api";

const tabs = ["แนะแนวเรื่อง", "สารบัญ", "รีวิวทั้งหมด", "ความคิดเห็นทั้งหมด"] as const;
type TabKey = (typeof tabs)[number];

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        return {
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    const t = calculateTimeLeft();
    setTimeLeft(t);

    if (!t) return;

    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);
      if (!updated) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1 text-[10px] text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 whitespace-nowrap">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        {timeLeft.d > 0 ? `${timeLeft.d}วัน ` : ""}
        {String(timeLeft.h).padStart(2, "0")}:{String(timeLeft.m).padStart(2, "0")}:{String(timeLeft.s).padStart(2, "0")}
      </span>
    </div>
  );
};

export default function BookDetailClient({ bookId }: { bookId: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>(tabs[0]);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
  //   const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  // cast to any because AuthState doesn't expose 'accessToken' (adjust to the actual property name if available)
  const { token } = useAuthStore() as any;

  // เรียก API ด้วย React Query - Book Detail
  const {
    data: bookDetail,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["bookDetail", bookId, token],
    queryFn: async () => {
      const data = await fetchBookDetail(bookId);
      console.log("🔍 BookDetailClient received data:", data);
      return data;
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // Cache 5 นาที
    placeholderData: keepPreviousData,
  });

  // Set Document Title
  useEffect(() => {
    if (bookDetail?.name) {
      document.title = `${bookDetail.name} | EnjoyBook`;
    } else {
      document.title = "EnjoyBook - อ่านนิยายออนไลน์";
    }
  }, [bookDetail]);

  // เรียก API ด้วย React Query - User Shelf (เพื่อเช็คว่าเพิ่มเข้าชั้นหรือยัง กรณี API detail ไม่ส่งมา)
  const { data: userShelf } = useQuery({
    queryKey: ["userShelf", token],
    queryFn: () => fetchUserShelve(),
    enabled: !!token, // เรียกเมื่อมี token เท่านั้น
    staleTime: 5 * 60 * 1000,
  });

  // เรียก API ด้วย React Query - Episodes
  const { data: episodesData, isLoading: isLoadingEpisodes } = useQuery({
    queryKey: ["bookEpisodes", bookId, token],
    queryFn: () => fetchBookEpisodes(bookId),
    enabled: !!bookId, // เรียกเสมอเพื่อให้ได้ firstEpisodeId สำหรับปุ่มอ่านเลย
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  // หา episode แรกเพื่อใช้กับปุ่ม "อ่านเลย"
  const firstEpisodeId = episodesData?.groups?.[0]?.list?.[0]?.ep_id;

  // เรียก API ด้วย React Query - Book Purchase Details
  const { data: purchaseDetails } = useQuery({
    queryKey: ["bookPurchaseDetails", bookId, token],
    queryFn: () => fetchBookPurchaseDetails(bookId),
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
  });

  // เช็คว่าหนังสืออยู่ในชั้นหรือไม่
  const isInShelf = userShelf && Array.isArray(userShelf)
    ? userShelf.some((b: any) => String(b.book_id) === String(bookId))
    : false;

  // แปลงข้อมูลจาก API ให้ตรงกับ format ที่ component ต้องการ
  const book = bookDetail
    ? {
      id: bookDetail.book_id,
      // ใช้ค่าจาก API หรือถ้าไม่มีให้ใช้จากการเช็คใน shelf (ใช้ || เพื่อให้ถ้าอันไหนเป็น true ก็ให้เป็น true)
      isAddedToShelf: (bookDetail as any).isAddedToShelf || bookDetail.isFollowing || isInShelf,
      cover: bookDetail.img_full,
      title: bookDetail.name,
      tag: (bookDetail as any).category1?.name || bookDetail["category1.name"],
      category2: (bookDetail as any).category2?.name || bookDetail["category2.name"],
      writer: (bookDetail as any).writer ? {
        user_id: (bookDetail as any).writer.user_id,
        writer_name: (bookDetail as any).writer.writer_name || (bookDetail as any).writer.fullname || (bookDetail as any).writer_name || "Unknown",
        img: (bookDetail as any).writer.img || (bookDetail as any).writer.user_img || "",
        isFollowing: (bookDetail as any).writer.isFollowing || false,
      } : (bookDetail as any).user ? {
        user_id: (bookDetail as any).user.user_id,
        writer_name: (bookDetail as any).user.fullname,
        img: (bookDetail as any).user.img,
        isFollowing: (bookDetail as any).user.isFollowing || false,
      } : null,
      // author: (bookDetail as any).writer?.writer_name || bookDetail["writer.writer_name"] || (bookDetail as any).writer_name || "Unknown",
      views: bookDetail.view,
      chapters: bookDetail.chapter,
      reviews: bookDetail.comment,
      hearts: bookDetail.heart,
      flowers: bookDetail.flower,
      // Prefer API-provided remaining-paid fields when available
      remaining_paid_total: purchaseDetails?.remaining_paid_total ?? (bookDetail as any).remaining_paid_total ?? (bookDetail as any).remaining_paid?.total,
      remaining_paid_count: purchaseDetails?.remaining_paid_count ?? (bookDetail as any).remaining_paid_count ?? (bookDetail as any).remaining_paid?.count,
      price: (bookDetail as any).price ?? 2299, // fallback if API doesn't provide price
      promotion: (purchaseDetails?.discount_full_book || (bookDetail as any).discount_full_book) ? {
        id: (purchaseDetails?.discount_full_book?.dfb_id || (bookDetail as any).discount_full_book.dfb_id),
        title: (purchaseDetails?.discount_full_book?.subject || (bookDetail as any).discount_full_book.subject),
        startDate: (purchaseDetails?.discount_full_book?.start_date || (bookDetail as any).discount_full_book.start_date),
        endDate: (purchaseDetails?.discount_full_book?.end_date || (bookDetail as any).discount_full_book.end_date),
        percent: (purchaseDetails?.discount_full_book?.discount_percent || (bookDetail as any).discount_full_book.discount_percent),
        price: (purchaseDetails?.remaining_promo_total_discount ?? (bookDetail as any).remaining_promo_total_discount ?? 0),
      } : undefined,
      description: bookDetail.title, // คำโปรยสั้นๆ
      tags: Array.isArray(bookDetail.tag)
        ? bookDetail.tag
        : typeof bookDetail.tag === "string"
          ? (bookDetail.tag as string).split(",").filter((t: string) => t.trim() !== "")
          : [],
      publishDate: bookDetail.date_at,
      end: bookDetail.end,
      rate: bookDetail.rate,
      star: bookDetail.star,
      firstEpisodeId: firstEpisodeId,
      fastTicket: purchaseDetails?.fast_ticket,
    }
    : null;

  const tabContents: Record<TabKey, React.ReactElement> = {
    แนะแนวเรื่อง: (
      <div className="text-left px-2 sm:px-4 lg:px-6">
        {bookDetail && (
          <>
            <div className="mb-4 sm:mb-6 space-y-2">
              <p className="text-xs sm:text-sm text-gray-700">
                <strong>หมวดหมู่:</strong> {(bookDetail as any).category1?.name || bookDetail["category1.name"]} /{" "}
                {(bookDetail as any).category2?.name || bookDetail["category2.name"]}
              </p>
              <p className="text-xs sm:text-sm text-gray-700">
                <strong>สถานะ:</strong>{" "}
                {bookDetail.end === "not_end" ? "ยังไม่จบ" : "จบแล้ว"}
              </p>
              <p className="text-xs sm:text-sm text-gray-700">
                <strong>ผู้แต่ง:</strong> {(bookDetail as any).writer?.writer_name || (bookDetail as any)["writer.writer_name"] || (bookDetail as any).writer_name}
              </p>
              <p className="text-xs sm:text-sm text-gray-700">
                <strong>อัปเดตล่าสุด:</strong>{" "}
                {new Date(bookDetail.update_at).toLocaleDateString("th-TH")}
              </p>
            </div>

            {(() => {
              // 1. แปลงข้อมูลให้เป็น Array เสมอ (ปลอดภัยไว้ก่อน)
              let tagsArray: string[] = [];

              if (Array.isArray(bookDetail.tag)) {
                tagsArray = bookDetail.tag;
              } else if (typeof bookDetail.tag === "string") {
                // ถ้าเป็น string เช่น "ตลก,โรแมนติก" ให้ตัดด้วย comma
                tagsArray = (bookDetail.tag as string).split(",").filter((t: string) => t.trim() !== "");
              }

              // 2. ถ้าไม่มีแท็ก ไม่ต้องแสดงอะไรเลย
              if (tagsArray.length === 0) return null;

              return (
                <div className="mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                    แท็ก:
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {tagsArray.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 sm:px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] sm:text-xs"
                      >
                        {/* ใช้ .trim() ลบช่องว่างหน้าหลังออก */}
                        {String(tag).trim()}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* เรื่องย่อ */}
            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                เรื่องย่อ:
              </p>
              <div
                className="text-xs sm:text-sm text-gray-700 leading-relaxed prose prose-sm sm:prose max-w-none"
                dangerouslySetInnerHTML={{ __html: bookDetail.des }}
              />
            </div>
          </>
        )}
      </div>
    ),

    สารบัญ: (
      <div className="px-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">สารบัญ</h2>
          <p className="text-sm text-gray-600">
            {episodesData?.groups?.reduce(
              (acc: number, g: any) => acc + g.list.length,
              0
            ) || 0}{" "}
            ตอน
          </p>
        </div>

        {/* Update Info & Buy Multiple Button */}
        <div className="px-4 sm:px-6 py-3 flex items-center justify-end ">
          <p className="text-xs text-gray-500">
            อัพเดทล่าสุด{" "}
            {episodesData?.groups?.[0]?.list?.[0]?.update_at
              ? new Date(
                episodesData.groups[0].list[0].update_at
              ).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
              : "-"}
          </p>
        </div>

        {/* Episodes List */}
        {isLoadingEpisodes ? (
          <GifLoader className="h-48 w-48 mx-auto" width={200} height={200} />
        ) : episodesData &&
          episodesData.groups &&
          episodesData.groups.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {episodesData.groups.map((group: any, groupIndex: number) => {
              const isExpanded =
                expandedGroups[group.group_id] ?? groupIndex === 0;
              const toggleGroup = () => {
                setExpandedGroups((prev) => ({
                  ...prev,
                  [group.group_id]: !isExpanded,
                }));
              };

              return (
                <div key={group.group_id} className="bg-white">
                  {/* Group Header - Clickable */}
                  <button
                    onClick={toggleGroup}
                    className="w-full flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-sm font-bold text-gray-900 text-left">{group.name}</h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Episodes List - Collapsible */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-50">
                      {group.list.map((episode: any) => {
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
                          if (p !== undefined) {
                            promoPrice = p;
                          }
                        }

                        const hasPromo = !episode.isBuy && promoPrice !== undefined && promoPrice < regularPrice && promoPrice >= 0;

                        return (
                          <Link
                            key={episode.ep_id}
                            href={`/read/${bookDetail?.book_id}/${episode.ep_id}`}
                            className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors group gap-2"
                          >
                            {/* Episode Info */}
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-900 group-hover:text-red-600 font-medium truncate">
                                  {episode.name.trim()}
                                </p>
                                {/* แสดงสถานะซื้อแล้ว */}
                                {episode.isBuy && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    ✓ ซื้อแล้ว
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Middle: Countdown Timer */}
                            {hasPromo && activePromo?.end_date && (
                              <div className="flex-shrink-0 px-2 hidden sm:block">
                                <CountdownTimer targetDate={activePromo.end_date} />
                              </div>
                            )}

                            {/* Status & Meta */}
                            <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0 text-right">
                              {/* Price/Free Badge */}
                              <div className="flex flex-col items-end justify-center min-w-[60px]">
                                {(regularPrice > 0 || hasPromo) ? (
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <Image src="/images/e-coin.png" alt="coin" width={16} height={16} />
                                    {episode.isBuy ? (
                                      <span className="text-sm font-semibold text-gray-400 line-through">
                                        {regularPrice}
                                      </span>
                                    ) : hasPromo ? (
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

                                {/* Mobile-only Timer (fallback if needed, but user wants middle. I'll stick to middle hidden on mobile maybe? Or show on mobile too? Space is tight on mobile. I'll show on mobile for now as user didn't specify desktop only. Actually above I put hidden sm:block. Let's make it visible on mobile but maybe small?) */}
                                {/* Re-adding mobile timer logic below price strictly for mobile if preferred? No, let's try to fit efficiently. */}
                                {hasPromo && activePromo?.end_date && (
                                  <div className="sm:hidden mt-1">
                                    <CountdownTimer targetDate={activePromo.end_date} />
                                  </div>
                                )}
                              </div>

                              {/* Views */}
                              <div className="hidden sm:flex items-center gap-1.5 text-gray-500 w-[50px] justify-end">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                <span className="text-xs">{episode.view}</span>
                              </div>

                              {/* Date */}
                              <span className="hidden md:block text-xs text-gray-500 w-[80px] text-right">
                                {new Date(episode.publish_datetime).toLocaleDateString("th-TH", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </Link>
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
            <p className="text-sm text-gray-500">ยังไม่มีตอนที่เผยแพร่</p>
          </div>
        )}
      </div>
    ),
    รีวิวทั้งหมด: (
      <CommentSection bookId={String(bookId)} mode="comment" />
    ),
    ความคิดเห็นทั้งหมด: (
      <CommentSection bookId={String(bookId)} mode="comment_ep" />
    ),
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <GifLoader className="h-screen" />
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Alert
            message="เกิดข้อผิดพลาด"
            description={
              error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลหนังสือได้"
            }
            type="error"
            showIcon
            className="text-sm sm:text-base"
          />
        </div>
        <Footer />
      </div>
    );
  }

  // No Data State
  if (!book) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Alert
            message="ไม่พบข้อมูล"
            description="ไม่พบข้อมูลหนังสือที่คุณค้นหา"
            type="warning"
            showIcon
            className="text-sm sm:text-base"
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Full-width Header Container - Responsive */}
      <div className="w-full">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-0">
          <BookDetailHeader book={book} />
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <main className="max-w-[1400px] mx-auto px-4 sm:pl-6 sm:pr-18 py-4 sm:py-6">
        {/* Mobile Only: BookInfoCard แสดงด้านบนก่อน (ซ่อนบน desktop) */}
        <div className="lg:hidden mb-4">
          <BookInfoCard book={book} bookId={String((bookDetail as any)?.book_id ?? bookId)} />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-[30px]">
          {/* Left Content - Full width on mobile, flexible on desktop */}
          <div className="flex-1 w-full lg:max-w-[calc(100%-320px-1.5rem)]">
            {/* Tabs Section */}
            <div className="mt-0">
              <TabsSection
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(tab: TabKey) => setActiveTab(tab)}
              />
              <div className="bg-white rounded-b-lg p-4 sm:p-6 lg:p-8 shadow-sm">
                {tabContents[activeTab]}
              </div>
            </div>
          </div>

          {/* Right Sidebar - ซ่อนบนมือถือ, แสดงบน desktop */}
          <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <BookInfoCard book={book} bookId={String((bookDetail as any)?.book_id ?? bookId)} />
          </div>
        </div>
      </main>
      <BackToTopButton />
    </div>
  );
}
