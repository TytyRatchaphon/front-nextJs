"use client";

import React, { useState, useRef, useMemo } from "react";
import Image from "next/image";
import { Pagination, Spin, Alert } from "antd";
import { useQuery } from "@tanstack/react-query";

import SearchBar from "@/components/SearchBar";
import NovelCard from "@/components/NovelCard";
import Footer from "@/components/Footer";

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
  if (categories.length > 0)
    queryParams.append("categories", categories.join(","));
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

export default function SearchPage() {
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

  // เรียก API ด้วย React Query พร้อม pagination (เรียกตั้งแต่เริ่มต้นเพื่อแสดงหนังสือทั้งหมด)
  const {
    data: apiResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["searchBooks", searchParams, currentPage],
    queryFn: () => searchBooks(searchParams, currentPage, pageSize),
    staleTime: 5 * 60 * 1000, // Cache 5 นาที
  });

  // แปลงข้อมูลจาก API ให้ตรงกับ format ที่ NovelCard ต้องการ
  const novels = useMemo(() => {
    console.log("📦 API Response received:", apiResponse);

    if (!apiResponse?.items || !Array.isArray(apiResponse.items)) {
      console.warn("⚠️ apiResponse.items is not an array or is empty");
      return [];
    }

    console.log("📚 Total books on this page:", apiResponse.items.length);
    console.log("📚 First book sample:", apiResponse.items[0]);

    return apiResponse.items.map((book: any) => {
      // ใช้ imgtn ที่เป็น URL เต็มจาก API หรือ fallback ไปใช้ img
      const imageUrl =
        book.imgtn ||
        book.img ||
        "https://img.enjoybook.co/img/avatar/avatar-default.png";

      return {
        bookID: book.bookID || book.book_id?.toString() || "",
        img: imageUrl,
        name: book.name || "ไม่มีชื่อ",
        user_id: book.user_id || "ไม่ระบุผู้แต่ง",
        view: book.view || 0,
        type: book.type || "",
      };
    });
  }, [apiResponse]);

  const total = apiResponse?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  console.log("📊 Pagination Info:", {
    currentPage,
    pageSize,
    total,
    totalPages,
    novelsCount: novels.length,
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Banner */}
      <section className="py-3 sm:py-5 flex justify-center px-3 sm:px-4">
        <Image
          src="https://img.enjoybook.co/img/img_campaign2025O5WjY5DhqK0916150451.jpeg?w=3840&q=75"
          alt="banner"
          width={1200}
          height={200}
          className="rounded-md object-contain w-full max-w-[1400px]"
        />
      </section>

      {/* Content Layout */}
      <div
        ref={topRef}
        className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 mt-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-3 xl:col-span-3">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 xl:col-span-9">
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
                    ผลการค้นหาทั้งหมด{" "}
                    <span className="font-semibold">({total} รายการ)</span>
                  </p>
                  <div className="w-full sm:w-auto">
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
                      {novels.map((novel: any) => (
                        <NovelCard key={novel.bookID} novel={novel} />
                      ))}
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
        </div>
      </div>

      <Footer />
    </div>
  );
}
