"use client";

import React, { useMemo, useRef, useState } from "react";
import { Alert, Pagination } from "antd";
import { useQuery } from "@tanstack/react-query";
import CardBook from "@/components/novelCard/CardBook";
import { fetchNewNovels } from "@/services/apiServices";
import type { NewNovelContentType } from "@/services/apiServices";
import type { UniversalBook } from "@/types/api";
import { normalizeBookForCard } from "@/utils/normalizeBookForCard";

type ContentFilter = NewNovelContentType;

const PAGE_SIZE = 20;

const contentFilters: Array<{ key: ContentFilter; label: string }> = [
  { key: "all", label: "ทั้งหมด" },
  { key: "novel", label: "รายตอน" },
  { key: "novel_pack", label: "มัดแพ็ค" },
];

const normalizeNewNovelBook = (book: UniversalBook): UniversalBook => normalizeBookForCard(book);
/* const bookId = book.book_id ?? (book.bookID ? Number(book.bookID) : undefined);
  const tags = Array.isArray(book.tag)
    ? book.tag.map((tag) => String(tag).replace(/^"+|"+$/g, "").trim()).filter(Boolean)
    : book.tag;

  return {
    ...book,
    book_id: typeof bookId === "number" && Number.isFinite(bookId) ? bookId : book.book_id,
    bookID: book.bookID ?? (bookId ? String(bookId) : undefined),
    img: book.img || book.img_full || "/images/ejb.png",
    img_gif: book.img_gif || undefined,
    img_full: book.img_full || undefined,
    name: book.name || book.title || "ไม่มีชื่อเรื่อง",
    title: book.title || book.name || "",
    tag: tags,
    view: Number(book.view || 0),
    chapter: Number(book.chapter || 0),
    shelve_count: Number(book.shelve_count || 0),
    writer_name: book.writer_name || book.author || "ไม่ระบุนักเขียน",
    isBestSeller: Boolean(book.isBestSeller),
    isNew: book.isNew ?? true,
    isNewEp: Boolean(book.isNewEp),
    discount: book.discount || undefined,
    discount_ep_count: book.discount_ep_count ?? null,
  };
}; */

function NewNovel() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("all");
  const topRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["newNovels", currentPage, PAGE_SIZE, activeFilter],
    queryFn: async () => {
      const response = await fetchNewNovels(currentPage, PAGE_SIZE, activeFilter);
      if (!response) throw new Error("ไม่สามารถโหลดนิยายใหม่ได้");
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });

  const books = useMemo(() => (
    (data?.books ?? []).map(normalizeNewNovelBook)
  ), [data?.books]);

  const pagination = data?.pagination;
  const totalBooks = pagination?.total ?? books.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFilterChange = (filter: ContentFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main ref={topRef} className="relative min-h-screen overflow-hidden bg-[#fff7f7] pb-16 pt-6 lg:pt-[92px]">
      <style jsx>{`
        :global(.new-novel-pagination .ant-pagination-item-active) {
          border-color: #ef4444 !important;
        }
        :global(.new-novel-pagination .ant-pagination-item-active a) {
          color: #dc2626 !important;
        }
        :global(.new-novel-pagination .ant-pagination-item:hover) {
          border-color: #f87171 !important;
        }
        :global(.new-novel-pagination .ant-pagination-item:hover a) {
          color: #dc2626 !important;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-red-200/35 blur-3xl" />
        <div className="absolute right-[-90px] top-44 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute bottom-16 left-1/3 h-56 w-56 rounded-full bg-rose-100/70 blur-3xl" />
      </div>

      <section className="relative mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-0">
        <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/85 p-5 shadow-[0_24px_80px_-48px_rgba(185,28,28,0.45)] backdrop-blur sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,_rgba(254,226,226,0.88),_rgba(255,255,255,0.42)_44%,_rgba(255,237,213,0.65))]" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rotate-12 rounded-[32px] border border-red-200/70 bg-red-100/70" />
          <div className="pointer-events-none absolute bottom-6 right-16 hidden h-14 w-14 rotate-45 rounded-2xl bg-orange-200/70 md:block" />

          <div className="relative z-10">
            <div>
              <h1 className="max-w-2xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                นิยายใหม่ล่าสุด
                <span className="block text-red-600">อัปเดตจาก EnjoyBook</span>
              </h1>
            </div>

          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-white/80 bg-white/82 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-wrap gap-2">
            {contentFilters.map((filter) => {
              const isActive = activeFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => handleFilterChange(filter.key)}
                  className={`group rounded-2xl border px-4 py-2 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${
                    isActive
                      ? "border-red-200 bg-red-500 !text-white shadow-sm"
                      : "border-stone-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50"
                  }`}
                >
                  <span className="block text-sm font-bold">{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {isError && (
          <Alert
            type="error"
            showIcon
            className="mt-5"
            message="โหลดนิยายใหม่ไม่สำเร็จ"
            description={error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง"}
          />
        )}

        {data?.degradedMode && (
          <Alert
            type="warning"
            showIcon
            className="mt-5"
            message="กำลังใช้โหมดสำรอง"
            description="ข้อมูลหน้านี้มาจาก endpoint สำรอง อาจมีรายการ/จำนวนหน้าไม่ตรงกับ endpoint หลัก"
          />
        )}

        {isLoading ? (
          <div className="mt-7 grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-[380px] w-full max-w-[180px] animate-pulse rounded-xl bg-white/80 p-2 shadow-sm">
                <div className="h-[237px] rounded-lg bg-red-100/70" />
                <div className="mt-4 h-4 rounded bg-slate-100" />
                <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
                <div className="mt-4 h-3 w-2/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={`mt-7 transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}>
              {books.length > 0 ? (
                <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {books.map((book) => (
                    <CardBook key={book.book_id || book.bookID} book={book} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-red-200 bg-white/75 px-5 py-12 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7v13h12V7" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7a3 3 0 0 1 6 0" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-slate-900">ยังไม่มีรายการในตัวกรองนี้</p>
                  <p className="mt-1 text-sm text-slate-500">ลองเลือก “ทั้งหมด” เพื่อดูนิยายใหม่ในหน้านี้</p>
                </div>
              )}
            </div>

            {totalBooks > PAGE_SIZE && (
              <div className="mt-10 flex justify-center pb-6">
                <Pagination
                  className="new-novel-pagination"
                  current={currentPage}
                  total={totalBooks}
                  pageSize={PAGE_SIZE}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  responsive
                />
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default NewNovel;
