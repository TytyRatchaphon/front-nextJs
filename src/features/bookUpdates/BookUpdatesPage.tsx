"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { queryKeys } from "@/constants/query";
import {
  fetchBookUpdateCalendar,
  fetchBookUpdateDaily,
  UpdateContentType,
  UpdateScope,
  UpdateSort,
} from "@/services/api/bookUpdatesApi";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { BOOK_UPDATES_LIMIT, scopeOptions } from "./bookUpdatesConstants";
import { getEmptyText, isLoginRequiredError } from "./bookUpdatesUtils";
import { BookUpdatesSwiper } from "./components/BookUpdatesSwiper";
import { BookListSkeleton, CalendarSkeleton } from "./components/BookUpdatesSkeletons";
import { CalendarStrip } from "./components/CalendarStrip";
import { FilterBar } from "./components/FilterBar";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";

export default function BookUpdatesPage() {
  const [selectedDate, setSelectedDate] = React.useState("");
  const [scope, setScope] = React.useState<UpdateScope>("all");
  const [contentType, setContentType] = React.useState<UpdateContentType>("all");
  const [sort, setSort] = React.useState<UpdateSort>("publish_time");
  const [page, setPage] = React.useState(1);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const hasMounted = useAuthStore((state) => state.hasMounted);
  const openLoginModal = useUIStore((state) => state.openLoginModal);
  const setLoginViewMode = useUIStore((state) => state.setLoginViewMode);

  const calendarQuery = useQuery({
    queryKey: queryKeys.bookUpdates.calendar(scope, contentType),
    queryFn: () => fetchBookUpdateCalendar({ scope, contentType }),
    staleTime: 60_000,
  });

  const calendarDataMatchesFilters =
    calendarQuery.data?.filters.scope === scope && calendarQuery.data?.filters.content_type === contentType;

  const resolvedSelectedDate = calendarDataMatchesFilters
    ? (
      calendarQuery.data?.days.some((day) => day.date === selectedDate)
        ? selectedDate
        : calendarQuery.data?.days.find((day) => day.is_today)?.date || calendarQuery.data?.days[0]?.date || selectedDate
    )
    : selectedDate;

  const dailyQuery = useQuery({
    queryKey: queryKeys.bookUpdates.daily(resolvedSelectedDate, scope, contentType, page, BOOK_UPDATES_LIMIT, sort),
    queryFn: () =>
      fetchBookUpdateDaily({
        date: resolvedSelectedDate,
        scope,
        contentType,
        page,
        limit: BOOK_UPDATES_LIMIT,
        sort,
      }),
    enabled: Boolean(resolvedSelectedDate) && Boolean(calendarDataMatchesFilters),
    staleTime: 30_000,
  });

  const requireLogin = React.useCallback(() => {
    setLoginViewMode("login");
    openLoginModal();
  }, [openLoginModal, setLoginViewMode]);

  const handleScopeChange = (nextScope: UpdateScope) => {
    const nextOption = scopeOptions.find((option) => option.value === nextScope);
    if (nextOption?.requiresLogin && hasMounted && !isLoggedIn) {
      requireLogin();
      return;
    }

    setScope(nextScope);
    setPage(1);
  };

  const handleContentTypeChange = (nextContentType: UpdateContentType) => {
    setContentType(nextContentType);
    setPage(1);
  };

  const handleSortChange = (nextSort: UpdateSort) => {
    setSort(nextSort);
    setPage(1);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setPage(1);
  };

  const days = calendarQuery.data?.days || [];
  const books = dailyQuery.data?.books || [];
  const pagination = dailyQuery.data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const activeSelectedDate = resolvedSelectedDate || selectedDate;

  React.useEffect(() => {
    if (!calendarQuery.data?.days.length) return;

    setSelectedDate((currentDate) => {
      const currentDateStillVisible = calendarQuery.data.days.some((day) => day.date === currentDate);
      if (currentDateStillVisible) return currentDate;

      return calendarQuery.data.days.find((day) => day.is_today)?.date || calendarQuery.data.days[0]?.date || currentDate;
    });
  }, [calendarQuery.data]);

  React.useEffect(() => {
    const errorMessage =
      (calendarQuery.error as Error | null)?.message || (dailyQuery.error as Error | null)?.message;

    if (scope !== "all" && isLoginRequiredError(errorMessage)) {
      requireLogin();
      setScope("all");
      setPage(1);
    }
  }, [calendarQuery.error, dailyQuery.error, requireLogin, scope]);

  return (
    <main className="min-h-screen bg-[#fff8f3] text-[#23181b]">
      <section className="relative overflow-hidden border-b border-rose-100 bg-[radial-gradient(circle_at_8%_0%,rgba(239,48,75,0.16),transparent_28%),linear-gradient(135deg,#fff6ee_0%,#ecfeff_100%)]">
        <div className="absolute right-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-rose-200/45 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] h-[340px] w-[340px] rounded-full bg-rose-200/50 blur-3xl" />

        <div className="relative mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:py-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-bold text-[#0f6674] backdrop-blur">
            <CalendarDays className="h-4 w-4" />
            ตารางอัปเดตนิยายรายวัน
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.03em] text-[#23181b] sm:text-5xl lg:text-6xl">
            ดูได้ทันทีว่าวันนี้เรื่องไหนลงตอนใหม่
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
            เลือกวัน กรองจากชั้นหนังสือหรือนักเขียนที่ติดตาม แล้วอ่านต่อจากตอนล่าสุดได้เร็วขึ้นโดยไม่ต้องไล่หาเอง
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-10">
        <FilterBar
          scope={scope}
          contentType={contentType}
          sort={sort}
          isLoggedIn={isLoggedIn}
          onScopeChange={handleScopeChange}
          onContentTypeChange={handleContentTypeChange}
          onSortChange={handleSortChange}
        />

        <div className="mb-0 rounded-t-[24px] border border-stone-100 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#23181b]">ตารางเวลา</h2>
              <p className="text-sm font-medium text-stone-500">เลื่อนดูวัน แล้วเลือกวันที่อยากตามอ่าน</p>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden items-center gap-2 rounded-md bg-stone-100 px-4 py-2 text-sm font-black text-stone-700 sm:flex">
                <CalendarDays className="h-6 w-6" />
                อัปเดตล่าสุด
              </div>
              {calendarQuery.isFetching ? (
                <span className="shrink-0 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">กำลังโหลด</span>
              ) : null}
            </div>
          </div>

          {calendarQuery.isLoading ? (
            <CalendarSkeleton />
          ) : calendarQuery.isError ? (
            <div className="rounded-[26px] border border-red-100 bg-red-50 px-5 py-6 text-sm font-semibold text-red-700">
              โหลดปฏิทินไม่สำเร็จ กรุณาลองใหม่
            </div>
          ) : (
            <CalendarStrip days={days} selectedDate={activeSelectedDate} onSelectDate={handleDateSelect} />
          )}
        </div>

        {!activeSelectedDate || dailyQuery.isLoading || dailyQuery.isFetching ? (
          <BookListSkeleton />
        ) : dailyQuery.isError ? (
          <div className="rounded-[32px] border border-amber-100 bg-amber-50 px-6 py-8 text-center">
            <SearchX className="mx-auto h-10 w-10 text-amber-600" />
            <h3 className="mt-3 text-xl font-black text-stone-900">โหลดรายการไม่สำเร็จ</h3>
            <p className="mt-2 text-sm font-medium text-stone-600">
              {(dailyQuery.error as Error)?.message || "กรุณาลองใหม่อีกครั้ง"}
            </p>
            <button
              type="button"
              onClick={() => dailyQuery.refetch()}
              className="mt-5 cursor-pointer rounded-full bg-[#ef304b] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#d91d3c]"
            >
              ลองใหม่
            </button>
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-rose-200 bg-white px-6 py-12 text-center">
            <SearchX className="mx-auto h-12 w-12 text-rose-400" />
            <h3 className="mt-4 text-2xl font-black text-[#23181b]">{getEmptyText(scope)}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
              ลองเลือกวันอื่น หรือกลับไปดูรายการรวมทั้งหมดเพื่อไม่พลาดนิยายที่เพิ่งอัปเดต
            </p>
            {scope !== "all" ? (
              <button
                type="button"
                onClick={() => handleScopeChange("all")}
                className="mt-5 cursor-pointer rounded-full bg-[#ef304b] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#d91d3c]"
              >
                กลับไปทั้งหมด
              </button>
            ) : null}
          </div>
        ) : (
          <BookUpdatesSwiper books={books} sort={sort} />
        )}

        {totalPages > 1 ? (
          <nav
            className="relative left-1/2 flex w-screen -translate-x-1/2 items-center justify-center gap-3 bg-[#fff7ed] pb-10"
            aria-label="เปลี่ยนหน้ารายการอัปเดต"
          >
            <button
              type="button"
              disabled={page <= 1 || dailyQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-rose-100 bg-white text-[#ef304b] shadow-sm transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="หน้าก่อนหน้า"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="rounded-full bg-white px-5 py-3 text-sm font-black text-stone-800 shadow-sm">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || dailyQuery.isFetching}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-rose-100 bg-white text-[#ef304b] shadow-sm transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="หน้าถัดไป"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        ) : null}
      </section>

      <style jsx global>{`
        .book-updates-sort-select .ant-select-selector {
          height: 48px !important;
          min-height: 48px !important;
          display: flex !important;
          align-items: center !important;
          border-radius: 16px !important;
          border-color: #ffe4e6 !important;
          box-shadow: none !important;
          padding-inline: 16px !important;
        }

        .book-updates-sort-select .ant-select-selector:hover,
        .book-updates-sort-select.ant-select-focused .ant-select-selector {
          border-color: #ef304b !important;
          box-shadow: 0 0 0 4px rgba(239, 48, 75, 0.14) !important;
        }

        .book-updates-sort-select .ant-select-selection-item {
          display: flex !important;
          align-items: center !important;
          color: #44403c !important;
          font-size: 15px !important;
          font-weight: 700 !important;
          line-height: 1.45 !important;
        }

        .book-updates-sort-select .ant-select-arrow {
          top: 50% !important;
          margin-top: 0 !important;
          transform: translateY(-50%) !important;
          color: #a8a29e !important;
        }

        .book-updates-sort-dropdown {
          border-radius: 18px !important;
          overflow: hidden !important;
          padding: 6px !important;
        }

        .book-updates-sort-dropdown .ant-select-item {
          min-height: 44px !important;
          display: flex !important;
          align-items: center !important;
          border-radius: 12px !important;
          font-weight: 700 !important;
          padding-block: 4px !important;
        }

        .book-updates-sort-dropdown .ant-select-item-option-content {
          display: flex !important;
          align-items: center !important;
          min-height: 34px !important;
          font-size: 15px !important;
          line-height: 1.45 !important;
        }

        .book-updates-sort-dropdown .ant-select-item-option-selected {
          background: #ef304b !important;
          color: #ffffff !important;
        }

        .book-updates-book-swiper .swiper-wrapper {
          align-items: stretch;
        }

        .book-updates-book-swiper .swiper-slide {
          height: auto;
        }

        .book-updates-book-swiper .swiper-button-disabled {
          opacity: 0 !important;
        }
      `}</style>
    </main>
  );
}
