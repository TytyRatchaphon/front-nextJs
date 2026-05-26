"use client";
import * as React from "react";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Pagination, Alert } from "antd";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import SearchBar from "@/components/search/SearchBar";
import CardBook from "@/components/novelCard/CardBook";
import GifLoader from '@/components/utility/GifLoader';
import { useLogger } from "@/hooks/useLogger";
import apiClient from '@/services/apiClient';
import { normalizeBookPurchaseReward } from '@/utils/bookPurchaseReward';

interface SearchParams {
  query: string;
  categories: number[];
  types: string[];
  content_type: string[];
  status: string[];
  end: string;
  sortBy: string;
  order: string;
}

interface SearchBooksResponse {
  items: unknown[];
  total: number;
}

const EMPTY_SEARCH_RESPONSE: SearchBooksResponse = {
  items: [],
  total: 0,
};

const parseNumberListParam = (value: string | null) => {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
};

const parseStringListParam = (value: string | null) => {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parsePageParam = (value: string | null) => {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
};

const getSearchParamsFromUrl = (searchParamsUrl: ReturnType<typeof useSearchParams>): SearchParams => ({
  query: searchParamsUrl?.get('q') || "",
  categories: parseNumberListParam(searchParamsUrl?.get('categories') || null),
  types: parseStringListParam(searchParamsUrl?.get('types') || null),
  content_type: parseStringListParam(searchParamsUrl?.get('content_type') || null),
  status: parseStringListParam(searchParamsUrl?.get('status') || null),
  end: searchParamsUrl?.get('end') || "all",
  sortBy: searchParamsUrl?.get('sortBy') || "date_at",
  order: searchParamsUrl?.get('order') || "DESC",
});

const searchBooks = async (
  params: SearchParams,
  page: number,
  limit: number
): Promise<SearchBooksResponse> => {
  const { query, categories, types, content_type, status, end, sortBy, order } = params;

  // --- กรณีที่ 2: ถ้าไม่มีคำค้นหา (ใช้ระบบ API เดิมของคุณ) ---
  // (Original logic restored for all cases)
  const queryParams = new URLSearchParams();
  if (query) queryParams.append("q", query);
  if (categories.length > 0) queryParams.append("categories", categories.join(","));
  if (types.length > 0) queryParams.append("types", types.join(","));
  if (content_type && content_type.length > 0) queryParams.append("content_type", content_type.join(","));
  if (status.length > 0) queryParams.append("status", status.join(","));
  if (end && end !== "all") queryParams.append("end", end);
  if (sortBy) queryParams.append("sortBy", sortBy);
  if (order) queryParams.append("order", order);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());


  try {
    const response = await apiClient.get(`/book/search?${queryParams.toString()}`, {
      headers: {
        'x-skip-auth': 'true',
      },
    });

    const data = response.data;

    if (data.code === 200 && data.data) {
      return {
        items: Array.isArray(data.data.items) ? data.data.items : [],
        total: Number(data.data.total || 0),
      };
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn('[search] Invalid response format', data);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[search] Failed to fetch search results', error);
    }
  }

  return EMPTY_SEARCH_RESPONSE;
};

export default function SearchClient() {
  const searchParamsUrl = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parsePageParam(searchParamsUrl?.get('page') || null));

  const [searchParams, setSearchParams] = useState<SearchParams>(() => getSearchParamsFromUrl(searchParamsUrl));

  const topRef = useRef<HTMLDivElement>(null);
  const pageSize = 20;

  const handleSearch = useCallback((params: SearchParams) => {
    setSearchParams((prev) => {
      // Use JSON.stringify for simple deep comparison to prevent infinite loops
      if (JSON.stringify(prev) === JSON.stringify(params)) {
        return prev;
      }
      setCurrentPage(1);
      return params;
    });
  }, []);

  // --- Activity Logging ---
  const { log } = useLogger();
  const hasLoggedRef = useRef<string>('');

  useEffect(() => {
    if (!searchParams.query && searchParams.categories.length === 0) return;
    
    const logKey = JSON.stringify({ q: searchParams.query, cat: searchParams.categories, page: currentPage });
    if (hasLoggedRef.current === logKey) return;
    hasLoggedRef.current = logKey;

    void log('search', 'book', '', {
      query: searchParams.query,
      categories: searchParams.categories,
      types: searchParams.types,
      status: searchParams.status,
      end: searchParams.end,
      sortBy: searchParams.sortBy,
      order: searchParams.order,
    }).catch(() => {
      // Logging is best-effort and should not affect the search page.
    });
  }, [searchParams, currentPage, log]);

  // Update state when URL changes (e.g. navigation from navbar)
  React.useEffect(() => {
    const paramsFromUrl = getSearchParamsFromUrl(searchParamsUrl);
    const pageFromUrl = parsePageParam(searchParamsUrl?.get('page') || null);

    setSearchParams((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(paramsFromUrl)) {
        return prev;
      }
      // If categories from URL changed significantly, we might want to reset page? 
      // But for now just sync state.
      return paramsFromUrl;
    });
    setCurrentPage((prev) => prev === pageFromUrl ? prev : pageFromUrl);
  }, [searchParamsUrl]);

  const {
    data: apiResponse,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["searchBooks", searchParams, currentPage],
    queryFn: () => searchBooks(searchParams, currentPage, pageSize),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    throwOnError: false,
    placeholderData: (previousData) => previousData,
  });

  const novels = useMemo(() => {

    if (!apiResponse?.items || !Array.isArray(apiResponse.items)) {
      return [];
    }


    // Normalize each item into the canonical shape CardBook expects
    const normalized = apiResponse.items.map((b: any) => {
      const imageRaw = b.img || b.imgtn || b.img_full || b.thumb || b.image || "";
      const gifRaw = b.img_gif || b.img_gif_full || "";
      const imageUrl = typeof imageRaw === 'string' && imageRaw.startsWith('http')
        ? imageRaw
        : imageRaw
          ? imageRaw
          : "https://img.enjoybook.co/img/avatar/avatar-default.png";
      const gifUrl = typeof gifRaw === 'string' && gifRaw.startsWith('http')
        ? gifRaw
        : gifRaw || undefined;

      const book_id = b.book_id ?? (b.bookID ? Number(b.bookID) : 0);
      const bookID = b.bookID?.toString() || (book_id ? String(book_id) : "");
      const name = b.name || b.title || b.bookname || "ไม่มีชื่อ";
      const author = b['writer.writer_name'] || b.writer_name || b.author || (b.user_id ? String(b.user_id) : 'ไม่ระบุผู้แต่ง');
      const chapter = b.chapter ?? b.chapters ?? b.chapter_count ?? 0;
      const end = b.end ?? b.status ?? b.finished ?? b.is_end ?? b.ended ?? b.end_status ?? null;

      return {
        book_id: Number(book_id) || 0,
        bookID: String(bookID || ""),
        type: b.type || "",
        img: imageUrl,
        img_gif: gifUrl,
        img_gif_full: b.img_gif_full || undefined,
        img_full: b.img_full || undefined,
        name,
        title: name,
        tag: b.tag || '',
        view: Number(b.view || 0),
        // map possible shelf/shelve fields to shelveCount
        shelveCount: Number(b.shelveCount ?? b.shelfCount ?? b.shelve_count ?? b.shelf_count ?? 0),
        heart: b.heart ?? b.likes ?? b.like ?? 0,
        flower: b.flower ?? b.flower_count ?? 0,
        author,
        chapter: Number(chapter || 0),
        end,
        isBestSeller: b.isBestSeller,
        isNew: b.isNew,
        discount: b.discount,
        isNewEp: b.isNewEp,
        discount_ep_count: b.discount_ep_count,
        discount_end_date: b.discount_end_date,
        time_end: b.time_end || b.end_date,
        ep_purchase_reward: normalizeBookPurchaseReward(b),
      };
    });

    // Debug: show whether the API provided any shelve/shelf fields and the normalized result
    try {
      apiResponse.items.map((it: any) => ({
        book_id: it.book_id ?? it.bookID,
        shelveCount_raw: it.shelveCount ?? it.shelfCount ?? it.shelve_count ?? it.shelf_count ?? null,
      }));
    } catch {
    }

    return normalized;
  }, [apiResponse]);

  const total = apiResponse?.total || 0;
  const isUpdatingResults = isFetching && !isLoading;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Sidebar */}
      <div className="lg:col-span-3 xl:col-span-3">
        <SearchBar
          onSearch={handleSearch}
          isSearching={isFetching}
          initialQuery={searchParams.query}
          initialFilters={{
            categories: searchParams.categories,
            types: searchParams.types,
            content_type: searchParams.content_type,
            status: searchParams.status,
            end: searchParams.end
          }}
        />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-9 xl:col-span-9" ref={topRef}>
        {/* Loading State */}
        {isLoading && (
          <GifLoader className="h-[60vh]" width={150} height={150} />
        )}

        {/* Error State */}
        {isError && (
          <Alert
            message="เกิดข้อผิดพลาด"
            description={
              error instanceof Error
                ? error.message
                : "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
            }
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        {/* Content State */}
        {!isLoading && !isError && (
          <>
            <div className="mb-4 flex min-h-9 flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <p className="text-xs sm:text-sm text-gray-700">
                ผลการค้นหาทั้งหมด <span className="font-semibold">({total} รายการ)</span>
              </p>
              {isUpdatingResults ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600"
                >
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  กำลังค้นหา...
                </div>
              ) : null}
              {/* Removed sort dropdown as per request */}
            </div>

            {/* Empty State */}
            {novels.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">ไม่พบข้อมูลหนังสือ</p>
              </div>
            ) : (
              <>
                <div aria-busy={isUpdatingResults} className="relative">
                  {isUpdatingResults ? (
                    <div className="absolute -top-2 left-0 right-0 z-10 h-1 overflow-hidden rounded-full bg-red-50">
                      <span className="search-loading-bar block h-full w-1/3 rounded-full bg-red-500" />
                    </div>
                  ) : null}
                  {/* Grid แสดง Novel - Responsive */}
                  <div
                    className={`grid grid-cols-2 justify-items-center gap-x-4 gap-y-8 transition-opacity duration-200 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 ${
                      isUpdatingResults ? "opacity-60" : "opacity-100"
                    }`}
                  >
                    {novels.map((novel: any, index: number) => {
                      // novels are already normalized above; pass through to CardBook
                      return <CardBook key={`${novel.book_id || novel.bookID || 'book'}-${index}`} book={novel} />;
                    })}
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-center mt-6 sm:mt-8 lg:mt-10">
                  <Pagination
                    current={currentPage}
                    total={total}
                    pageSize={pageSize}
                    showSizeChanger={false}
                    onChange={handlePageChange}
                    className="ant-pagination-hover-red gap-2"
                    size="small"
                    responsive
                  />
                </div>
              </>
            )}
            <style jsx>{`
              @keyframes search-loading-slide {
                0% {
                  transform: translateX(-110%);
                }
                100% {
                  transform: translateX(330%);
                }
              }

              .search-loading-bar {
                animation: search-loading-slide 900ms ease-in-out infinite;
              }

              @media (prefers-reduced-motion: reduce) {
                .search-loading-bar {
                  animation: none;
                  width: 100%;
                  opacity: 0.55;
                }
              }
            `}</style>
          </>
        )}
      </div>
    </>
  );
}
