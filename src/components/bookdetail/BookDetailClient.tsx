"use client";

import React, { useState, useEffect, useRef } from "react";
import { Alert, Collapse, Segmented } from "antd";
import { ChevronDown } from 'lucide-react';
import BookDetailHeader from "@/components/bookdetail/BookDetailHeader";
import BookInfoCard, { BookInfoCardHandle } from "@/components/bookdetail/BookInfoCard";
import Footer from "@/components/home/Footer";
import CommentSection from "@/components/bookdetail/CommentSection";
import { BackToTopButton } from "@/components/utility/BackToTopButton";
import GifLoader from '@/components/utility/GifLoader';
import { useAuthStore } from "@/stores/authStore";
import { useWebsiteStore } from '@/stores/websiteStore';
import { useBookDetailData } from "@/hooks/book/useBookDetailData";
import { BookAboutTab } from "@/components/bookdetail/BookAboutTab";
import { BookEpisodesTab } from "@/components/bookdetail/BookEpisodesTab";
import { BookContentTab } from "@/components/bookdetail/BookContentTab";
import { useLogger } from "@/hooks/useLogger";
import RecommendedBooks from "@/components/bookdetail/RecommendedBooks";

const collapseTabs = ["รายละเอียดเรื่อง", "สารบัญ"] as const;
const segmentedTabs = ["รีวิวทั้งหมด", "ความคิดเห็นทั้งหมด"] as const;
type TabKey = (typeof collapseTabs)[number] | (typeof segmentedTabs)[number];

export default function BookDetailClient({ bookId }: { bookId: string }) {
  const [activeSegmentedTab, setActiveSegmentedTab] = useState<(typeof segmentedTabs)[number]>(segmentedTabs[0]);
  const { log, trackTimeSpent } = useLogger();
  const { token, hasMounted } = useAuthStore() as any;
  const { settings } = useWebsiteStore();

  const isReady = hasMounted;

  // Custom Hook for Data Fetching & Transformation
  const {
    book,
    bookDetail, // Raw data for About Tab
    episodesData,
    isLoading,
    isLoadingEpisodes,
    isError,
    error,
  } = useBookDetailData(bookId, token, isReady);

  // Set Document Title
  useEffect(() => {
    if (book?.title) {
      document.title = `${book.title} | EnjoyBook`;
    } else {
      document.title = "EnjoyBook - อ่านนิยายออนไลน์";
    }
  }, [book?.title]);

  useEffect(() => {
    if (book?.id && book?.title) {
       // Log Page View
       log('page_view', 'book', String(book.id), {
          name: book.title,
       });

       // Start Tracking Time
       // The function returns a cleanup function that logs 'time_spent' on unmount
       const stopTracking = trackTimeSpent('book', String(book.id), { name: book.title });
       return stopTracking;
    }
  }, [book?.id, book?.title, log, trackTimeSpent]);

  const bookInfoCardRef = useRef<BookInfoCardHandle>(null);

  const tabContents: Record<TabKey, React.ReactElement> = {
    รายละเอียดเรื่อง: <BookAboutTab bookDetail={bookDetail ?? null} />,
    สารบัญ: (
      <BookContentTab
        episodesData={episodesData}
        bookId={bookId}
        bookDetail={bookDetail}
        settings={settings}
        isLoading={isLoadingEpisodes}
        latestUpdate={book?.update_at}
        onOpenPurchaseModal={() => bookInfoCardRef.current?.openSelectionModal()}
      />
    ),
    รีวิวทั้งหมด: <CommentSection bookId={String(bookId)} mode="comment" />,
    ความคิดเห็นทั้งหมด: <CommentSection bookId={String(bookId)} mode="comment_ep" />,
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

  // Determine available tabs based on data or loading state
  const hasPack = (episodesData?.novel_packpack && episodesData.novel_packpack.length > 0) || (episodesData?.novel_pack && episodesData.novel_pack.length > 0) || (episodesData?.pack && episodesData.pack.length > 0);
  const hasNormal = (episodesData?.novel && episodesData.novel.length > 0) || (episodesData?.normal && episodesData.normal.length > 0) || (episodesData?.groups && episodesData.groups.length > 0);
  
  const hasContent = hasPack || hasNormal;
  const showContent = hasContent || isLoadingEpisodes;

  const validTabs = collapseTabs.filter(tab => {
    if (tab === 'สารบัญ') return showContent;
    return true; // Always show 'รายละเอียดเรื่อง'
  });

  const defaultActiveKey = showContent ? ['สารบัญ'] : ['รายละเอียดเรื่อง'];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Full-width Header Container - Responsive */}
      <div className="w-full">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-0">
          <BookDetailHeader book={book} />
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Mobile Only: BookInfoCard  */}
        <div className="lg:hidden mb-4">
          <BookInfoCard book={book} bookId={String(book.id)} />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-[30px] mt-6">
          {/* Left Content */}
          <div className="flex-1 w-full lg:max-w-[calc(100%-320px-1.5rem)]">
            <div className="space-y-4">
              <Collapse
                defaultActiveKey={defaultActiveKey}
                expandIconPosition="end"
                ghost
                expandIcon={({ isActive }) => (
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}
                  />
                )}
                className="bg-transparent flex flex-col gap-4"
                items={validTabs.map((tab) => ({
                  key: tab,
                  label: (
                    <div className="flex items-center gap-3 py-1">
                      <div className={`w-1 h-6 rounded-full ${
                        tab === 'รายละเอียดเรื่อง' ? 'bg-blue-500' :
                        tab === 'สารบัญ' ? 'bg-red-500' : 'bg-orange-500'
                      }`} />
                      <span className="font-bold text-lg text-gray-800">{tab}</span>
                    </div>
                  ),
                  children: (
                    <div className="mt-2">
                      {tabContents[tab]}
                    </div>
                  ),
                  style: {
                    marginBottom: 0,
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #f3f4f6',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                  },
                  classNames: {
                    header: '!items-center !py-4 !px-6 hover:!bg-gray-50/50 transition-colors',
                    body: '!p-0 !pb-2'
                  }
                }))}
              />
              <RecommendedBooks bookId={String(book.id)} />
              {/* Segmented Control */}
              <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-gray-800">ความคิดเห็น & รีวิว</h2>
                  <Segmented
                    options={[...segmentedTabs]}
                    value={activeSegmentedTab}
                    onChange={(val) => setActiveSegmentedTab(val as typeof segmentedTabs[number])}
                    className="bg-gray-100 p-1 rounded-lg font-primary"
                    size="large"
                    block={false}
                    style={{ borderRadius: '0.75rem' }}
                  />
                </div>
                <div className="pt-2">
                  {tabContents[activeSegmentedTab]}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-24">
              <BookInfoCard ref={bookInfoCardRef} book={book} bookId={String(book.id)} episodesData={episodesData} />
            </div>
          </div>
        </div>

      </main>
      <BackToTopButton />
    </div>
  );
}
