"use client";

import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Pagination, Alert } from "antd";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/search/SearchBar";
import CardBook from "@/components/novelCard/CardBook";
import GifLoader from '@/components/utility/GifLoader';
import { useLogger } from '@/hooks/useLogger';
import apiClient from "@/services/apiClient";

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


const searchBooks = async (
  params: SearchParams,
  page: number,
  limit: number
) => {
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
    const response = await apiClient.get(`/book/search?${queryParams.toString()}`);
    if (response.data && response.data.code === 200) {
      return response.data.data;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Failed to search books:", error);
    throw new Error("Failed to search books");
  }
};

export default function SearchClient() {
  const searchParamsUrl = useSearchParams();
  const [currentPage, setCurrentPage] = useState(Number(searchParamsUrl?.get('page')) || 1);

  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: searchParamsUrl?.get('q') || "",
    categories: searchParamsUrl?.get('categories')?.split(',').map(Number) || [],
    types: searchParamsUrl?.get('types')?.split(',') || [],
    content_type: searchParamsUrl?.get('content_type')?.split(',') || [],
    status: searchParamsUrl?.get('status')?.split(',') || [],
    end: searchParamsUrl?.get('end') || "all",
    sortBy: searchParamsUrl?.get('sortBy') || "date_at",
    order: searchParamsUrl?.get('order') || "DESC",
  });

  const topRef = useRef<HTMLDivElement>(null);
  const pageSize = 20;
  const { log } = useLogger();
  const hasLoggedRef = useRef<string>('');

  // Log search action
  useEffect(() => {
    const logKey = `${searchParams.query}-${searchParams.categories.join(',')}-${currentPage}`;
    if (hasLoggedRef.current === logKey) return;
    if (!searchParams.query && searchParams.categories.length === 0) return;
    hasLoggedRef.current = logKey;
    console.log('[LOG] search =>', { query: searchParams.query, categories: searchParams.categories, page: currentPage });
    log('search', 'book', '', { query: searchParams.query, categories: searchParams.categories, page: currentPage });
  }, [searchParams.query, searchParams.categories, currentPage, log]);

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

  // Update state when URL changes (e.g. navigation from navbar)
  React.useEffect(() => {
    const paramsFromUrl: SearchParams = {
      query: searchParamsUrl?.get('q') || "",
      categories: searchParamsUrl?.get('categories')?.split(',').map(Number) || [],
      types: searchParamsUrl?.get('types')?.split(',') || [],
      content_type: searchParamsUrl?.get('content_type')?.split(',') || [],
      status: searchParamsUrl?.get('status')?.split(',') || [],
      end: searchParamsUrl?.get('end') || "all",
      sortBy: searchParamsUrl?.get('sortBy') || "date_at",
      order: searchParamsUrl?.get('order') || "DESC",
    };

    setSearchParams((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(paramsFromUrl)) {
        return prev;
      }
      // If categories from URL changed significantly, we might want to reset page? 
      // But for now just sync state.
      return paramsFromUrl;
    });
  }, [searchParamsUrl]);

  const {
    data: apiResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["searchBooks", searchParams, currentPage],
    queryFn: () => searchBooks(searchParams, currentPage, pageSize),
    staleTime: 5 * 60 * 1000,
  });

  const novels = useMemo(() => {

    if (!apiResponse?.items || !Array.isArray(apiResponse.items)) {
      return [];
    }


    // Normalize each item into the canonical shape CardBook expects
    const normalized = apiResponse.items.map((b: any) => {
      const imageRaw = b.imgtn || b.img || b.thumb || b.image || "";
      const imageUrl = typeof imageRaw === 'string' && imageRaw.startsWith('http')
        ? imageRaw
        : imageRaw
          ? imageRaw
          : "https://img.enjoybook.co/img/avatar/avatar-default.png";

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
        rate: b.rate,
      };
    });

    // Debug: show whether the API provided any shelve/shelf fields and the normalized result
    try {
      const rawShelveInfo = apiResponse.items.map((it: any) => ({
        book_id: it.book_id ?? it.bookID,
        shelveCount_raw: it.shelveCount ?? it.shelfCount ?? it.shelve_count ?? it.shelf_count ?? null,
      }));
    } catch (e) {
    }

    return normalized;
  }, [apiResponse]);

  const total = apiResponse?.total || 0;

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
              <p className="text-xs sm:text-sm text-gray-700">
                ผลการค้นหาทั้งหมด <span className="font-semibold">({total} รายการ)</span>
              </p>
              {/* Removed sort dropdown as per request */}
            </div>

            {/* Empty State */}
            {novels.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">ไม่พบข้อมูลหนังสือ</p>
              </div>
            ) : (
              <>
                {/* Grid แสดง Novel - Responsive */}
                <div
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-y-8 gap-x-4 justify-items-center"
                >
                  {novels.map((novel: any) => {
                    // novels are already normalized above; pass through to CardBook
                    return <CardBook key={novel.book_id || novel.bookID} book={novel} />;
                  })}
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
          </>
        )}
      </div>
    </>
  );
}
