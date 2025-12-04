"use client";

import Image from "next/image";
import BookDetailHeader from "@/components/bookdetail/BookDetailHeader";
import BookInfoCard from "@/components/bookdetail/BookInfoCard";
import TabsSection from "@/components/bookdetail/TabsSection";
import Footer from "@/components/Footer";


import { useState } from "react";
import { BackToTopButton } from "@/components/BackToTopButton";
import { useQuery } from "@tanstack/react-query";
import {
  fetchBookDetail,
  fetchBookEpisodes,
  fetchUserShelve,
  // fetchUserWallet,
} from "@/services/apiServices";
import { Spin, Alert } from "antd";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
// import type { Episode } from "@/types/api";

const tabs = ["แนะแนวเรื่อง", "สารบัญ", "ความคิดเห็น"] as const;
type TabKey = (typeof tabs)[number];

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
  });

  // เรียก API ด้วย React Query - User Shelf (เพื่อเช็คว่าเพิ่มเข้าชั้นหรือยัง กรณี API detail ไม่ส่งมา)
  const { data: userShelf } = useQuery({
    queryKey: ["userShelf", token],
    queryFn: fetchUserShelve,
    enabled: !!token, // เรียกเมื่อมี token เท่านั้น
    staleTime: 5 * 60 * 1000,
  });

  // เรียก API ด้วย React Query - Episodes
  const { data: episodesData, isLoading: isLoadingEpisodes } = useQuery({
    queryKey: ["bookEpisodes", bookId],
    queryFn: () => fetchBookEpisodes(bookId),
    enabled: !!bookId, // เรียกเสมอเพื่อให้ได้ firstEpisodeId สำหรับปุ่มอ่านเลย
    staleTime: 5 * 60 * 1000,
  });

  // หา episode แรกเพื่อใช้กับปุ่ม "อ่านเลย"
  const firstEpisodeId = episodesData?.groups?.[0]?.list?.[0]?.ep_id;

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
        cover: bookDetail.img || bookDetail.img_full,
        title: bookDetail.name,
        tag: (bookDetail as any).category1?.name || bookDetail["category1.name"],
        category2: (bookDetail as any).category2?.name || bookDetail["category2.name"],
        author: (bookDetail as any).writer?.writer_name || bookDetail["writer.writer_name"] || (bookDetail as any).writer_name || "Unknown",
        writerId: (bookDetail as any).writer?.user_id || bookDetail["writer.user_id"] || (bookDetail as any).writer_id,
        isFollowingWriter: (bookDetail as any).writer?.isFollowing || bookDetail.isFollowing || (bookDetail as any).is_following || false,
        views: bookDetail.view,
        chapters: bookDetail.chapter,
        reviews: bookDetail.comment,
        hearts: bookDetail.heart,
        flowers: bookDetail.flower,
        // Prefer API-provided remaining-paid fields when available
        remaining_paid_total:
          (bookDetail as any).remaining_paid_total ?? (bookDetail as any).remaining_paid?.total,
        remaining_paid_count:
          (bookDetail as any).remaining_paid_count ?? (bookDetail as any).remaining_paid?.count,
        price: (bookDetail as any).price ?? 2299, // fallback if API doesn't provide price
        promotion: (bookDetail as any).discount_full_book ? {
          id: (bookDetail as any).discount_full_book.dfb_id,
          title: (bookDetail as any).discount_full_book.subject,
          startDate: (bookDetail as any).discount_full_book.start_date,
          endDate: (bookDetail as any).discount_full_book.end_date,
          percent: (bookDetail as any).discount_full_book.discount_percent,
          price: (bookDetail as any).remaining_promo_total_discount ?? 0,
        } : undefined,
        description: bookDetail.title, // คำโปรยสั้นๆ
        tags: Array.isArray(bookDetail.tag)
          ? bookDetail.tag
          : typeof bookDetail.tag === "string"
          ? (bookDetail.tag as string).split(",").filter((t: string) => t.trim() !== "")
          : [],
        publishDate: bookDetail.date_at,
        status: bookDetail.end,
        rate: bookDetail.rate,
        firstEpisodeId: firstEpisodeId,
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
                <strong>ผู้แต่ง:</strong> {(bookDetail as any).writer?.writer_name || bookDetail["writer.writer_name"] || (bookDetail as any).writer_name}
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
          <div className="flex justify-center py-12">
            <Spin />
            <span className="ml-3 text-gray-500 text-sm">กำลังโหลดรายการตอน...</span>
          </div>
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
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        isExpanded ? "rotate-180" : ""
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
                      {group.list.map((episode: any) => (
                        <Link
                          key={episode.ep_id}
                          href={`/read/${bookDetail?.book_id}/${episode.ep_id}`}
                          className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors group"
                        >
                          {/* Episode Info */}
                          <div className="flex-1 min-w-0 pr-4">
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

                          {/* Status & Meta */}
                          <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                            {/* Price/Free Badge */}
                            {episode.coin > 0 ? (
                              <div className="flex items-center gap-1">
                                <Image src="/images/e-coin.png" alt="coin" width={16} height={16} />
                                <span
                                  className={`text-sm font-semibold ${
                                    episode.isBuy
                                      ? "text-gray-400 line-through"
                                      : "text-orange-600"
                                  }`}
                                >
                                  {episode.coin}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-semibold text-red-600">อ่านฟรี</span>
                            )}

                            {/* Views */}
                            <div className="hidden sm:flex items-center gap-1.5 text-gray-500">
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
                            <span className="hidden md:block text-xs text-gray-500">
                              {new Date(episode.publish_datetime).toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </Link>
                      ))}
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
    ความคิดเห็น: (
      <div className="text-center px-2 sm:px-4">
        <p className="text-xs sm:text-sm text-gray-700 font-semibold mb-4">รีวิวจากผู้อ่าน</p>
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-gray-600">- สนุกมาก!</p>
          <p className="text-xs sm:text-sm text-gray-600">- เนื้อเรื่องดี ตัวละครมีมิติ</p>
          <p className="text-xs sm:text-sm text-gray-600">- อ่านแล้ววางไม่ลงเลยครับ</p>
        </div>
      </div>
    ),
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="flex flex-col justify-center items-center min-h-[300px] sm:min-h-[400px] px-4">
          <Spin size="large" />
          <p className="mt-4 text-sm sm:text-base text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
        <Footer />
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
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <BookDetailHeader book={book} />
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <main className="max-w-[1255px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Mobile Only: BookInfoCard แสดงด้านบนก่อน (ซ่อนบน desktop) */}
        <div className="lg:hidden mb-4">
          <BookInfoCard book={book} bookId={String((bookDetail as any)?.book_id ?? bookId)} />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Left Content - Full width on mobile, flexible on desktop */}
          <div className="flex-1 w-full lg:max-w-[calc(100%-320px-1.5rem)]">
            {/* Tabs Section */}
            <div className="mt-0 lg:mt-5">
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
