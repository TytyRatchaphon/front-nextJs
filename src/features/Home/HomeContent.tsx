"use client";

import { useAuthStore } from "@/stores/authStore";
import React from 'react';
import DailyPopup from "@/components/utility/DailyPopup";
import { BackToTopButton } from "@/components/utility/BackToTopButton";
import FloatingGiftButton from "@/components/utility/FloatingGiftButton";
import Link from "next/link";
import Banner from "@/components/home/Banner";
import DailyCheckinModal from "@/components/home/DailyCheckinModal";
import BannerButtons from "@/components/home/BannerButtons";
import Image from "next/image";
import BookGroups from "@/components/home/BookGroups";
import TopRanking from "@/components/home/TopRanking";
import UpdateBookCard from "@/components/novelCard/UpdateBookCard";
import ContinueReadingSwiper from "@/components/swiper/ContinueReadingSwiper";
import SpotlightCard from "@/components/novelCard/SpotlightCard";
import NewArrivalCard from "@/components/novelCard/NewArrivalCard";
import { fetchHomeData, HomeDataResponse, fetchBookUpdates, fetchRankingCategories, fetchUserShelveContinue } from "@/services/apiServices";
import { useQuery } from "@tanstack/react-query";
import RankingCategoryLeft from "@/components/home/RankingCategoryLeft";
import RankingCategoryRight from "@/components/home/RankingCategoryRight";
import GifLoader from "@/components/utility/GifLoader";


interface HomeContentProps {
  initialData: HomeDataResponse | null;
  initialBookUpdates?: any[];
  initialRankingCategories?: any;
}

export default function HomeContent({ initialData, initialBookUpdates, initialRankingCategories }: HomeContentProps) {
  const { data: homeData, isLoading } = useQuery({
    queryKey: ['homeData'],
    queryFn: fetchHomeData,
    initialData: initialData,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <GifLoader />
      </div>
    );
  }

  const { data: bookUpdates } = useQuery({
    queryKey: ['bookUpdates'],
    queryFn: fetchBookUpdates,
    initialData: initialBookUpdates,
  });

  const { data: rankingCategories } = useQuery({
    queryKey: ['rankingCategories'],
    queryFn: fetchRankingCategories,
    initialData: initialRankingCategories,
  });

  const { token } = useAuthStore();

  const { data: continueBooks } = useQuery({
    queryKey: ['continueBooks'],
    queryFn: () => fetchUserShelveContinue(10), // Limit to 10 as per request
    select: (data: any) => data?.books ?? [],
    enabled: !!token, // Only fetch if user is logged in
  });

  const slides = homeData?.data?.slides || [];
  const groupBookHome = (homeData?.data as any)?.groupBookHome || [];
  const rankingGroup = groupBookHome.find((group: any) => group.type === 'ranking');



  return (
    <div className="bg-white font-primary font-medium flex flex-col items-center transition-colors duration-300 w-full overflow-x-hidden">
      <DailyCheckinModal />
      <Banner slides={slides} />
      {/* Main Content Section */}
      <div className="w-full flex justify-center mt-4 lg:mt-8">
        <div className="max-w-[1440px] w-full px-4 lg:px-[156px]">  {/* Edit Widht of Home Content Here */}
          
          <div className="w-full max-w mx-auto mb-2">
            <BannerButtons />
          </div>

          {continueBooks && continueBooks.length > 0 && (
            <div className="w-full">
              <ContinueReadingSwiper books={continueBooks} />
            </div>
          )}

          {/* Spotlight & New Novels Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-4 ">
            {/* Spotlight Column */}
            <div className="w-full h-auto">
              <h2 className="font-bold text-2xl mb-2 text-black">เรื่องเด่น !!</h2>
              <div className="w-full h-[1px] bg-gray-200 mb-4"></div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 gap-2 lg:gap-4 mb-2">
                {(() => {
                  const spotlightBooks = homeData?.data?.groupBookHome?.find((group: any) => group.name === 'spotlight' || group.type === 'spotlight')?.list || homeData?.data?.spotlight || [];

                  return spotlightBooks.length > 0 ? (
                    spotlightBooks.slice(0, 6).map((book: any, i: number) => (
                      <SpotlightCard key={book.book_id || i} book={book} />
                    ))
                  ) : (
                    // Skeleton/Loading state or empty
                    [...Array(6)].map((_, i) => (
                      <div key={i} className="flex flex-col w-full h-auto group animate-pulse">
                        <div className="relative shadow-md rounded-lg overflow-hidden bg-gray-200 aspect-[168/237]"></div>
                        <div className="mt-2 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))
                  );
                })()}
              </div>

              {/* Continue Reading Section */}
            </div>

            {/* New Novels Column */}
            <div>
              <h2 className="font-bold text-2xl mb-2 text-black">นิยายมาใหม่</h2>
              <div className="w-full h-[1px] bg-gray-200 mb-1"></div>
              <div className="flex flex-col gap-2">
                {(() => {
                  const newArrivalBooks = homeData?.data?.groupBookHome?.find((group: any) => group.name === 'มาใหม่' || group.type === 'new')?.list || [];

                  return newArrivalBooks.length > 0 ? (
                    newArrivalBooks.slice(0, 5).map((book: any, i: number) => (
                      <NewArrivalCard key={book.book_id || i} book={book} />
                    ))
                  ) : (
                    // Skeleton
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-2 items-start animate-pulse">
                        <div className="w-[91px] h-[128px] bg-gray-200 rounded flex-shrink-0"></div>
                        <div className="flex-1 space-y-2 py-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
                        </div>
                      </div>
                    ))
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Other Groups Section */}
          <BookGroups groupBookHome={groupBookHome} />

          {/* Top 10 Ranking Section */}
          <div className="w-full -mt-4">
            <TopRanking rankingGroup={rankingGroup} />
          </div>

          {/* Ranking Category Section */}
          <div className="w-full flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6 lg:gap-10 mt-4 mb-4 px-4">
            {rankingCategories?.left && (
              <RankingCategoryLeft
                categoryId={rankingCategories.left.id}
                categoryName={rankingCategories.left.name}
              />
            )}
            {rankingCategories?.right && (
              <RankingCategoryRight
                categoryId={rankingCategories.right.id}
                categoryName={rankingCategories.right.name}
              />
            )}
          </div>

          {/* Latest Updated Novels Section */}
          <div className="w-full mt-4 mb-4">
            <h2 className="font-bold text-2xl mb-4 text-black">นิยายอัพเดตล่าสุด</h2>
            <div className="w-full h-[1px] bg-gray-200 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bookUpdates?.map((book) => (
                <UpdateBookCard
                  key={book.book_id}
                  book={{
                    book_id: book.book_id,
                    title: book.name,
                    author: book.writer_name,
                    cover: book.img_full || book.img,
                    chapters: book.BookTranEps?.map((ep: any, index: number) => ({
                      id: ep.ep_id,
                      bookId: book.book_id,
                      title: ep.name,
                      // Use the isNew flag from the API
                      isNew: ep.isNew
                    })) || [],
                    stats: {
                      hearts: book.shelve_count,
                      views: book.view,
                      chapterCount: book.chapter
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <BackToTopButton />
          <FloatingGiftButton />
          <DailyPopup />
        </div>
      </div>
    </div>
  );
}
