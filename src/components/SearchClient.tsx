"use client";

import React, { useState, useRef, useMemo } from "react";
import { Pagination, Spin, Alert } from "antd";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/SearchBar";
import CardBook from "@/components/CardBook";

interface SearchParams {
  query: string;
  categories: number[];
  types: string[];
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
  const { query, categories, types, status, end, sortBy, order } = params;

  const queryParams = new URLSearchParams();

  if (query) queryParams.append("q", query);
  if (categories.length > 0) queryParams.append("categories", categories.join(","));
  if (types.length > 0) queryParams.append("types", types.join(","));
  if (status.length > 0) queryParams.append("status", status.join(","));
  if (end && end !== "all") queryParams.append("end", end);
  if (sortBy) queryParams.append("sortBy", sortBy);
  if (order) queryParams.append("order", order);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());

  const url = `http://192.168.220.214:3331/book/search?${queryParams.toString()}`;
  console.log("🔍 Search URL:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to search books");
  }

  const data = await response.json();
  console.log("📦 Search response:", data);

  if (data.code === 200 && data.data) {
    return data.data;
  }

  throw new Error("Invalid response format");
};

export default function SearchClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: "",
    categories: [],
    types: [],
    status: [],
    end: "all",
    sortBy: "date_at",
    order: "DESC",
  });
  const topRef = useRef<HTMLDivElement>(null);
  const pageSize = 20;

  const handleSearch = (params: SearchParams) => {
    console.log("🔍 Search triggered with params:", params);
    setSearchParams(params);
    setCurrentPage(1);
  };

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
    console.log("📦 API Response received:", apiResponse);

    if (!apiResponse?.items || !Array.isArray(apiResponse.items)) {
      console.warn("⚠️ apiResponse.items is not an array or is empty");
      return [];
    }

    console.log("📚 Total books on this page:", apiResponse.items.length);
    console.log("📚 First book sample:", apiResponse.items[0]);

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
      };
    });

    // Debug: show whether the API provided any shelve/shelf fields and the normalized result
    try {
      const rawShelveInfo = apiResponse.items.map((it: any) => ({
        book_id: it.book_id ?? it.bookID,
        shelveCount_raw: it.shelveCount ?? it.shelfCount ?? it.shelve_count ?? it.shelf_count ?? null,
      }));
      console.log('🔎 raw shelve info (from API items):', rawShelveInfo);
      console.log('🔎 normalized sample (first book):', normalized[0]);
    } catch (e) {
      console.warn('Could not print shelve debug info', e);
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
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-9 xl:col-span-9" ref={topRef}>
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <Spin size="large" />
            <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
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
              <div className="w-full sm:w-auto sm:mr-30">
                <select
                  className="border rounded-md text-xs sm:text-sm px-2 py-1 w-full sm:w-auto"
                  value={searchParams.sortBy}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      sortBy: e.target.value,
                    })
                  }
                >
                  <option value="date_at">ล่าสุด</option>
                  <option value="view">ยอดนิยม</option>
                </select>
              </div>
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
                  className="grid justify-items-center"
                  style={{
                    gridTemplateColumns: "repeat(auto-fill, 168px)",
                    gap: "8px",
                    justifyContent: "start",
                  }}
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
                    className="ant-pagination-hover-red"
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
