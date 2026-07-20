"use client";
import * as React from "react";
import { App } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import Banner from "@/components/home/Banner";
import BannerButtons from "@/components/home/BannerButtons";
import DailyCheckinModal from "@/components/home/DailyCheckinModal";
import ActiveCategoriesStrip from "@/components/home/ActiveCategoriesStrip";
import BookGroups from "@/components/home/BookGroups";
import RankingCategoryLeft from "@/components/home/RankingCategoryLeft";
import RankingCategoryRight from "@/components/home/RankingCategoryRight";
import SpotlightFeatureSection from "@/components/home/SpotlightFeatureSection";
import UpdateBookCard from "@/components/novelCard/UpdateBookCard";
import ContinueReadingSwiper from "@/components/swiper/ContinueReadingSwiper";
import PinnedReviewsSwiper from "@/components/swiper/PinnedReviewsSwiper";
import GifLoader from "@/components/utility/GifLoader";
import { BackToTopButton } from "@/components/utility/BackToTopButton";
import DailyPopup from "@/components/utility/DailyPopup";
import { useAuthStore } from "@/stores/authStore";
import { parseJwtToken } from "@/utils/jwtParser";
import { resolveBookCoverImageSrc } from "@/utils/imageUtils";
import {
  HomeDataResponse,
  normalizeBookUpdateTab,
  normalizeRankingContentTab,
} from "@/services/apiServices";
import {
  useHomeData,
  useBookUpdates,
  useActiveCategories,
  useRankingCategories,
  useContinueBooks,
  usePinnedReviews,
} from "@/hooks/home/useHomeQueries";

interface HomeContentProps {
  initialData: HomeDataResponse | null;
  contentType?: string;
  showPopups?: boolean;
  showSpotlightFeature?: boolean;
}

// hasRenderableHomeData moved to useHomeQueries.ts

export default function HomeContent({
  initialData,
  contentType,
  showPopups = true,
  showSpotlightFeature = true,
}: HomeContentProps) {
  const { notification } = App.useApp();
  const { user, token, isLoggedIn, hasMounted } = useAuthStore();
  const bookUpdateTab = normalizeBookUpdateTab(contentType);
  const rankingTab = normalizeRankingContentTab(contentType);
  const [selectedSpotlightId, setSelectedSpotlightId] = React.useState<number | string | null>(null);
  const [enableSecondaryQueries, setEnableSecondaryQueries] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const authToken = parseJwtToken(token);
  const shouldFetchAuthenticatedHome = hasMounted && isLoggedIn && Boolean(authToken);
  const homeAudienceKey = shouldFetchAuthenticatedHome
    ? `auth:${user?.user_id ?? "user"}`
    : "guest";
  const categoryType =
    contentType === "trancn"
      ? "tran"
      : contentType === "fiction"
        ? "write"
        : "all";

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    const enable = () => setEnableSecondaryQueries(true);

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = (window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number })
        .requestIdleCallback(() => enable());
    } else {
      timeoutId = setTimeout(enable, 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (typeof window !== "undefined" && idleId && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (handle: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, []);

  const { homeData, isLoading, error: homeDataError } = useHomeData({
    contentType,
    audienceKey: homeAudienceKey,
    authToken,
    shouldFetchAuthenticated: shouldFetchAuthenticatedHome,
    initialData,
  });

  const secondaryEnabled = !isLoading && enableSecondaryQueries;

  const {
    data: bookUpdates,
    isLoading: isBookUpdatesLoading,
    error: bookUpdatesError,
  } = useBookUpdates(bookUpdateTab, { enabled: secondaryEnabled });

  const {
    data: activeCategories,
    isLoading: isActiveCategoriesLoading,
    error: activeCategoriesError,
  } = useActiveCategories(categoryType, { enabled: secondaryEnabled });

  const {
    data: rankingCategories,
    isLoading: isRankingCategoriesLoading,
    error: rankingCategoriesError,
  } = useRankingCategories(rankingTab, { enabled: secondaryEnabled });
  const rankingLeftCategoryId =
    rankingTab === "trancn" || rankingTab === "fiction"
      ? "all"
      : rankingCategories?.left?.id;

  const {
    data: continueBooks,
    isLoading: isContinueBooksLoading,
    error: continueBooksError,
  } = useContinueBooks({ enabled: secondaryEnabled && !!user });

  const {
    data: pinnedReviewsData,
    isLoading: isPinnedReviewsLoading,
    error: pinnedReviewsError,
  } = usePinnedReviews({ enabled: secondaryEnabled });

  const pinnedReviews = pinnedReviewsData?.reviews || [];

  const notifiedErrorsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const errorConfigs = [
      { error: homeDataError, key: "homeData", title: "หน้าหลัก" },
      { error: bookUpdatesError, key: "bookUpdates", title: "นิยายอัปเดตล่าสุด" },
      { error: activeCategoriesError, key: "activeCategories", title: "หมวดหมู่" },
      { error: rankingCategoriesError, key: "rankingCategories", title: "หมวดหมู่นิยายฮิต" },
      { error: continueBooksError, key: "continueBooks", title: "อ่านต่อ" },
      { error: pinnedReviewsError, key: "pinnedReviews", title: "ปักหมุดรีวิว" },
    ];

    errorConfigs.forEach(({ error, key, title }) => {
      if (error && !notifiedErrorsRef.current.has(key)) {
        notifiedErrorsRef.current.add(key);
        notification.error({
          message: "เกิดข้อผิดพลาด",
          description: `ไม่สามารถโหลดข้อมูล${title}ได้`,
          placement: "topRight",
        });
      } else if (!error) {
        notifiedErrorsRef.current.delete(key);
      }
    });
  }, [
    activeCategoriesError,
    bookUpdatesError,
    continueBooksError,
    homeDataError,
    notification,
    pinnedReviewsError,
    rankingCategoriesError,
  ]);

  const slides = homeData?.data?.slides || [];
  const groupBookHome = (homeData?.data as any)?.groupBookHome || [];
  const spotlightBooks =
    homeData?.data?.groupBookHome?.find(
      (group: any) => group.name === "spotlight" || group.type === "spotlight",
    )?.list ||
    homeData?.data?.spotlight ||
    [];
  const featuredBook = spotlightBooks[0];
  const selectedSpotlight =
    spotlightBooks.find((book: any) => String(book.book_id) === String(selectedSpotlightId)) ||
    featuredBook;
  const editorNoteGroup =
    groupBookHome.find(
      (group: any) => group.type === "recommend_admin" && group.content_type === "novel",
    ) ||
    groupBookHome.find((group: any) => group.type === "recommend_admin") ||
    null;
  const editorNoteItems =
    (Array.isArray(editorNoteGroup?.list) && editorNoteGroup.list.length > 0
      ? editorNoteGroup.list
      : selectedSpotlight
        ? [selectedSpotlight]
        : []) || [];

  const handleSpotlightSelect = (bookId: number | string) => {
    startTransition(() => {
      setSelectedSpotlightId(bookId);
    });
  };

  React.useEffect(() => {
    if (!spotlightBooks.length) {
      setSelectedSpotlightId(null);
      return;
    }

    const hasSelected = spotlightBooks.some(
      (book: any) => String(book.book_id) === String(selectedSpotlightId),
    );

    if (!hasSelected) {
      setSelectedSpotlightId(spotlightBooks[0].book_id);
    }
  }, [selectedSpotlightId, spotlightBooks]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <GifLoader />
      </div>
    );
  }

  const cleanHtmlText = (value?: string) =>
    (value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const editorNoteTitle =
    cleanHtmlText(editorNoteGroup?.name_web) || editorNoteGroup?.name || "เรื่องเด่นจากทีมงาน";
  const shouldRenderSpotlightFeature = showSpotlightFeature && Boolean(selectedSpotlight);

  return (
    <div className="flex w-full flex-col items-center overflow-x-hidden bg-white font-primary font-medium transition-colors duration-300">
      <h1 className="sr-only">Enjoybook อ่านนิยาย นิยายแปล อ่านนิยายฟรี นิยายจีน</h1>
      {showPopups ? <DailyCheckinModal /> : null}
      <Banner slides={slides} />

      <div className="mt-4 flex w-full justify-center lg:mt-8">
        <div className="w-full max-w-[1440px] px-4 lg:px-[156px]">
          <div className="mx-auto mb-2 w-full max-w">
            <BannerButtons />
          </div>

          {isContinueBooksLoading ? (
            <div className="w-full animate-pulse">
              <div className="mb-4 h-[220px] w-full rounded-xl bg-gray-200" />
            </div>
          ) : continueBooks && continueBooks.length > 0 ? (
            <div className="w-full">
              <ContinueReadingSwiper books={continueBooks} />
            </div>
          ) : null}

          {isActiveCategoriesLoading ? (
            <div className="mb-5 mt-6 w-full animate-pulse border-b border-stone-200 pb-4 sm:mb-6 sm:mt-8">
              <div className="mb-3 h-5 w-16 rounded bg-stone-200" />
              <div className="flex flex-wrap gap-2">
                {[...Array(8)].map((_, index) => (
                  <div
                    key={index}
                    className="h-8 rounded-md bg-stone-200"
                    style={{ width: `${56 + ((index * 17) % 44)}px` }}
                  />
                ))}
              </div>
            </div>
          ) : activeCategories && activeCategories.length > 0 ? (
            <ActiveCategoriesStrip categories={activeCategories} categoryType={categoryType} />
          ) : null}

          {shouldRenderSpotlightFeature ? (
            <SpotlightFeatureSection
              selectedSpotlight={selectedSpotlight}
              spotlightBooks={spotlightBooks}
              onSelectSpotlight={handleSpotlightSelect}
              isPending={isPending}
              editorNoteTitle={editorNoteTitle}
              editorNoteItems={editorNoteItems}
              editorNoteLabeltag={editorNoteGroup?.labeltag}
            />
          ) : null}

          <BookGroups groupBookHome={groupBookHome} contentType={contentType} />
        </div>
      </div>

      {!isPinnedReviewsLoading && pinnedReviews.length > 0 && (
        <div className="mb-4 mt-4 w-full">
          <PinnedReviewsSwiper reviews={pinnedReviews} />
        </div>
      )}

      <div className="flex w-full justify-center">
        <div className="w-full max-w-[1440px] px-4 lg:px-[156px]">
          <div className="mb-4 mt-4 flex w-full flex-col items-center justify-center gap-4 px-4 md:flex-row md:gap-6 lg:gap-10">
            {isRankingCategoriesLoading ? (
              <div className="flex w-full flex-col items-center justify-center gap-4 md:flex-row md:gap-6 lg:gap-10">
                <div className="h-[150px] w-full animate-pulse rounded-lg bg-gray-200 md:w-1/2" />
                <div className="h-[150px] w-full animate-pulse rounded-lg bg-gray-200 md:w-1/2" />
              </div>
            ) : (
              <>
                {rankingCategories?.left && (
                  <RankingCategoryLeft
                    categoryId={rankingLeftCategoryId}
                    categoryName={rankingCategories.left.name}
                    tab={rankingTab}
                  />
                )}
                {rankingCategories?.right && (
                  <RankingCategoryRight
                    categoryId={rankingCategories.right.id}
                    categoryName={rankingCategories.right.name}
                    tab={rankingTab}
                  />
                )}
              </>
            )}
          </div>

          <div className="mb-4 mt-4 w-full">
            <h2 className="mb-4 text-2xl font-bold text-black">นิยายอัปเดตล่าสุด</h2>
            <div className="mb-6 h-[1px] w-full bg-gray-200" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {isBookUpdatesLoading ? (
                [...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex h-[160px] animate-pulse gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="h-[140px] w-[100px] shrink-0 rounded bg-gray-200" />
                    <div className="w-full flex-1 space-y-3 py-2">
                      <div className="h-4 w-3/4 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-200" />
                      <div className="mt-4 h-5 w-full rounded bg-gray-200" />
                      <div className="h-5 w-full rounded bg-gray-200" />
                    </div>
                  </div>
                ))
              ) : (
                bookUpdates?.map((book) => (
                  <UpdateBookCard
                    key={book.book_id}
                    book={{
                      book_id: book.book_id,
                      title: book.name,
                      author: book.writer_name,
                      cover: resolveBookCoverImageSrc(book, '/images/default-book.png', 'book'),
                      chapters:
                        book.BookTranEps?.map((ep: any) => ({
                          id: ep.ep_id,
                          bookId: book.book_id,
                          title: ep.name,
                          isNew: ep.isNew,
                        })) || [],
                      stats: {
                        hearts: book.shelve_count,
                        views: book.view,
                        chapterCount: book.chapter,
                      },
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <BackToTopButton />
          {showPopups ? <DailyPopup /> : null}
        </div>
      </div>
    </div>
  );
}
