"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Select } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import {
  ArrowDownUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Library,
  LockKeyhole,
  Play,
  RefreshCcw,
  SearchX,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { queryKeys } from "@/constants/query";
import {
  BookUpdateCalendarDay,
  BookUpdateDailyBook,
  fetchBookUpdateCalendar,
  fetchBookUpdateDaily,
  UpdateContentType,
  UpdateScope,
  UpdateSort,
} from "@/services/api/bookUpdatesApi";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { BookStatusBadges } from "@/components/novelCard/BookStatusBadges";
import { computeEnded } from "@/components/novelCard/bookCardUtils";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";

const LIMIT = 20;

const scopeOptions: Array<{
  value: UpdateScope;
  label: string;
  description: string;
  requiresLogin?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "all", label: "ทั้งหมด", description: "ทุกเรื่องที่อัปเดต", icon: Sparkles },
  {
    value: "shelf",
    label: "ชั้นหนังสือ",
    description: "เฉพาะเรื่องที่เก็บไว้",
    requiresLogin: true,
    icon: Library,
  },
  {
    value: "following",
    label: "นักเขียนที่ติดตาม",
    description: "จากนักเขียนคนโปรด",
    requiresLogin: true,
    icon: UserRoundCheck,
  },
];

const contentTypeOptions: Array<{ value: UpdateContentType; label: string }> = [
  { value: "all", label: "นิยายทั้งหมด" },
  { value: "novel", label: "นิยายรายตอน" },
  { value: "novel_pack", label: "นิยายมัดแพ็ค" },
];

const sortOptions: Array<{ value: UpdateSort; label: string }> = [
  { value: "publish_time", label: "เวลาที่ลง" },
  { value: "view", label: "ยอดวิวสูงสุด" },
  { value: "bestseller", label: "ขายดี" },
];

const sortSelectOptions = sortOptions.map((option) => ({
  value: option.value,
  label: option.label,
}));

const formatCompact = (value: number | null | undefined) =>
  new Intl.NumberFormat("th-TH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const getCoverSrc = (book: BookUpdateDailyBook) =>
  book.img_gif_full ||
  book.img_full ||
  book.img_gif ||
  book.img ||
  "/images/ejb.png";

const hasBookPromotion = (book: BookUpdateDailyBook) =>
  Boolean(book.discount || book.discount_ep_count || book.ep_purchase_reward?.has_promotion);

const getFastAccessText = (book: BookUpdateDailyBook) => {
  const fast = book.latest_episode?.fast_access;
  if (!fast?.available || fast.advance_days <= 0) return null;

  return `อ่านล่วงหน้าได้ ${fast.advance_days} วัน`;
};

const isLoginRequiredError = (message?: string) =>
  Boolean(message && /login|เข้าสู่ระบบ|กรุณาเข้าสู่ระบบ/i.test(message));

const getEmptyText = (scope: UpdateScope) => {
  if (scope === "shelf") return "วันนี้ยังไม่มีนิยายในชั้นหนังสือของคุณอัปเดต";
  if (scope === "following") return "วันนี้ยังไม่มีนิยายจากนักเขียนที่ติดตามอัปเดต";
  return "วันนี้ยังไม่มีนิยายอัปเดต";
};

function getCalendarDayClass(day: BookUpdateCalendarDay, selectedDate: string) {
  return [
    "calendar-day",
    day.date === selectedDate ? "is-selected" : "",
    day.is_today ? "is-today" : "",
    day.is_past ? "is-past" : "",
    day.is_future ? "is-future" : "",
    day.has_updates ? "has-updates" : "no-updates",
  ]
    .filter(Boolean)
    .join(" ");
}

function CalendarSkeleton() {
  return (
    <div className="mt-4 flex gap-2 overflow-hidden pb-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="h-16 min-w-16 animate-pulse rounded-xl bg-rose-50" />
      ))}
    </div>
  );
}

function BookListSkeleton() {
  return (
    <div className="flex gap-8 overflow-hidden bg-[#fff1f2] px-6 py-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="w-[260px] shrink-0 animate-pulse"
        >
          <div className="mx-auto mb-6 h-2 w-2 rounded-full bg-rose-200" />
          <div className="aspect-[4/5] rounded-lg bg-rose-100" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-3/4 rounded-full bg-rose-100" />
            <div className="h-3 w-1/2 rounded-full bg-rose-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarDayButton({
  day,
  selected,
  onSelect,
}: {
  day: BookUpdateCalendarDay;
  selected: boolean;
  onSelect: (date: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(day.date)}
      title={
        day.has_updates
          ? `มีอัปเดต ${day.book_count} เรื่อง / ${day.episode_count} ตอน`
          : "ยังไม่มีอัปเดต"
      }
      data-calendar-state={getCalendarDayClass(day, selected ? day.date : "")}
      className={`group relative flex h-16 min-w-16 cursor-pointer flex-col items-center justify-center rounded-xl border px-3 text-center transition-all duration-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#ef304b] ${
        selected
          ? "border-[#ef304b] bg-[#ef304b] !text-white shadow-[0_14px_28px_rgba(239,48,75,0.25)]"
          : day.is_today
            ? "border-[#ef304b] bg-white text-[#ef304b] ring-2 ring-rose-100 hover:bg-rose-50"
            : day.is_past
              ? "border-transparent bg-transparent text-stone-400 hover:bg-rose-50 hover:text-stone-700"
              : "border-transparent bg-transparent text-stone-600 hover:bg-rose-50 hover:text-stone-900"
      }`}
    >
      <span className={`text-xs font-semibold leading-none ${selected ? "text-white/85" : day.is_today ? "text-[#ef304b]" : "text-stone-500"}`}>
        {day.day_short}
      </span>
      <span className="mt-1 text-sm font-black leading-none">{day.day}</span>
      {day.is_today ? (
        <span className={`mt-1 text-[10px] font-bold leading-none ${selected ? "text-white/80" : "text-[#ef304b]"}`}>
          วันนี้
        </span>
      ) : null}
      {day.has_updates ? (
        <span className={`absolute -bottom-2 h-1.5 w-1.5 rounded-full ${selected ? "bg-[#ef304b]" : "bg-[#f97316]"}`} />
      ) : null}
    </button>
  );
}

function CalendarStrip({
  days,
  selectedDate,
  onSelectDate,
}: {
  days: BookUpdateCalendarDay[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const swiperRef = React.useRef<SwiperInstance | null>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const updateScrollState = React.useCallback((swiper: SwiperInstance | null) => {
    if (!swiper || swiper.destroyed) return;

    setCanScrollPrev(!swiper.isBeginning);
    setCanScrollNext(!swiper.isEnd);
  }, []);

  React.useEffect(() => {
    const handleResize = () => updateScrollState(swiperRef.current);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollState]);

  React.useEffect(() => {
    window.requestAnimationFrame(() => updateScrollState(swiperRef.current));
  }, [days, updateScrollState]);

  return (
    <div className="group/calendar relative mt-4">
      {canScrollPrev ? (
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-12 bg-gradient-to-r from-white to-transparent" />
      ) : null}
      {canScrollNext ? (
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-12 bg-gradient-to-l from-white to-transparent" />
      ) : null}

      {canScrollPrev ? (
        <button
          type="button"
          aria-label="เลื่อนปฏิทินไปทางซ้าย"
          onClick={() => swiperRef.current?.slidePrev()}
          className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-rose-100 bg-white/90 text-[#ef304b] opacity-80 shadow-sm transition-opacity hover:opacity-100 sm:opacity-0 sm:group-hover/calendar:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : null}

      {canScrollNext ? (
        <button
          type="button"
          aria-label="เลื่อนปฏิทินไปทางขวา"
          onClick={() => swiperRef.current?.slideNext()}
          className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-rose-100 bg-white/90 text-[#ef304b] opacity-80 shadow-sm transition-opacity hover:opacity-100 sm:opacity-0 sm:group-hover/calendar:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}

      <Swiper
        modules={[FreeMode]}
        slidesPerView="auto"
        spaceBetween={8}
        freeMode
        className="!pb-3"
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          updateScrollState(swiper);
        }}
        onAfterInit={updateScrollState}
        onSlideChange={updateScrollState}
        onReachBeginning={updateScrollState}
        onReachEnd={updateScrollState}
        onFromEdge={updateScrollState}
        onResize={updateScrollState}
        onTouchEnd={updateScrollState}
      >
        {days.map((day) => (
          <SwiperSlide key={day.date} className="!w-auto">
            <CalendarDayButton day={day} selected={day.date === selectedDate} onSelect={onSelectDate} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function FilterPill({
  active,
  children,
  onClick,
  locked,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active ? { color: "#ffffff" } : undefined}
      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#0891B2] ${
        active
          ? "border-[#ef304b] bg-[#ef304b] !text-white [&_svg]:!text-white"
          : "border-rose-100 bg-white text-stone-700 hover:border-rose-300 hover:bg-rose-50"
      }`}
    >
      {locked ? <LockKeyhole className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function TimelineBookCard({ book }: { book: BookUpdateDailyBook }) {
  const fastAccessText = getFastAccessText(book);
  const categories = book.categories?.length ? book.categories.slice(0, 2) : [];
  const tags = book.tag?.slice(0, Math.max(0, 3 - categories.length)) ?? [];
  const ended = computeEnded(book as Record<string, unknown>);
  const discountBadge = book.discount ?? null;

  return (
    <article className="w-[190px] shrink-0 sm:w-[210px]">
      <div className="relative mb-5 flex h-9 items-center justify-center">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-rose-200" />
        <span className="relative rounded-full bg-[#fff1f2] px-4 py-1 text-sm font-black text-stone-800">
          {book.publish_time_text || "อัปเดตใหม่"}
        </span>
        <span className="absolute bottom-0 h-2 w-2 rounded-full bg-[#c7b6a5]" />
      </div>

      <Link
        href={`/book/${book.book_id}`}
        prefetch={false}
        className="group block cursor-pointer"
        aria-label={`เปิดเรื่อง ${book.name}`}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-white shadow-[0_14px_32px_rgba(8,71,86,0.10)]">
          <Image
            src={getCoverSrc(book)}
            alt={book.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="210px"
          />
          <BookStatusBadges
            isBestSeller={book.isBestSeller}
            isNew={book.isNew || book.isNewEp}
            discount={discountBadge}
            ended={ended}
            size="sm"
          />
          {fastAccessText ? (
            <span className="absolute bottom-2 left-2 z-20 max-w-[calc(100%-1rem)] truncate rounded-sm bg-[#ef304b] px-2 py-1 text-[10px] font-black leading-none text-white shadow-sm">
              {fastAccessText}
            </span>
          ) : null}
          <div className="absolute inset-0 flex translate-y-2 flex-col justify-end bg-gradient-to-t from-black/90 via-black/45 to-transparent p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <span
                    key={`${book.book_id}-${category.id}-${category.name}`}
                    className="rounded bg-white/18 px-2 py-1 text-[11px] font-bold text-white backdrop-blur"
                  >
                    {category.name}
                  </span>
                ))
              ) : (
                null
              )}
              {tags.map((tag) => (
                <span
                  key={`${book.book_id}-${tag}`}
                  className="rounded bg-white/18 px-2 py-1 text-[11px] font-bold text-white backdrop-blur"
                >
                  {tag}
                </span>
              ))}
              {categories.length === 0 && tags.length === 0 ? (
                <span className="rounded bg-white/18 px-2 py-1 text-[11px] font-bold text-white backdrop-blur">นิยาย</span>
              ) : (
                null
              )}
            </div>
            <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#ef304b] text-sm font-black text-white shadow-[0_10px_24px_rgba(239,48,75,0.35)] transition-colors group-hover:bg-[#d91d3c]">
              <Play className="h-4 w-4 fill-white" />
              อ่าน
            </span>
          </div>
        </div>
        <div className="pt-4">
        <h3 className="line-clamp-2 text-base font-black leading-snug text-black transition-colors group-hover:text-[#ef304b]">
          {book.name}
        </h3>
        <p className="mt-2 line-clamp-1 text-xs font-medium leading-5 text-stone-400">
          โดย {book.writer_name || "ไม่ระบุนักเขียน"}
        </p>
        {book.updated_episode_count > 0 ? (
          <p className="mt-3 line-clamp-1 border-t border-rose-100/80 pt-2.5 text-xs font-semibold leading-5 text-[#b42335]">อัปเดตล่าสุด {book.updated_episode_count} ตอน</p>
        ) : null}
        {book.latest_episode?.name ? (
          <p className={`${book.updated_episode_count > 0 ? "mt-1.5" : "mt-3 border-t border-rose-100/80 pt-2.5"} line-clamp-2 text-xs leading-5 text-stone-500`}>
            <span className="font-semibold text-stone-700">ตอนล่าสุด</span> {book.latest_episode.name}
          </p>
        ) : null}
        </div>
      </Link>
    </article>
  );
}

function BookUpdatesSwiper({ books }: { books: BookUpdateDailyBook[] }) {
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div className="group/book-swiper relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[linear-gradient(180deg,#fff1f2_0%,#fff7ed_100%)] px-4 pb-10 pt-4 sm:px-10 lg:px-16">
      <div className="absolute left-0 top-0 z-10 hidden h-full w-14 bg-gradient-to-r from-[#fff1f2] to-transparent sm:block" />
      <div className="absolute right-0 top-0 z-10 hidden h-full w-14 bg-gradient-to-l from-[#fff1f2] to-transparent sm:block" />

      <button
        ref={prevRef}
        type="button"
        aria-label="เลื่อนรายการก่อนหน้า"
        className="absolute left-4 top-[44%] z-20 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-rose-100 bg-white/92 text-[#ef304b] shadow-[0_16px_36px_rgba(127,29,29,0.16)] transition-all hover:-translate-x-0.5 hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        ref={nextRef}
        type="button"
        aria-label="เลื่อนรายการถัดไป"
        className="absolute right-4 top-[44%] z-20 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-rose-100 bg-white/92 text-[#ef304b] shadow-[0_16px_36px_rgba(127,29,29,0.16)] transition-all hover:translate-x-0.5 hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <Swiper
        modules={[Navigation, FreeMode]}
        slidesPerView="auto"
        spaceBetween={28}
        freeMode={{
          enabled: true,
          momentumRatio: 0.7,
        }}
        speed={450}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          if (typeof swiper.params.navigation === "object") {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
          }
        }}
        breakpoints={{
          320: { spaceBetween: 16 },
          640: { spaceBetween: 20 },
          1024: { spaceBetween: 24 },
        }}
        className="book-updates-book-swiper !overflow-visible"
      >
        {books.map((book) => (
          <SwiperSlide key={book.book_id} className="!w-auto">
            <TimelineBookCard book={book} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

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
    queryKey: queryKeys.bookUpdates.daily(resolvedSelectedDate, scope, contentType, page, LIMIT, sort),
    queryFn: () => fetchBookUpdateDaily({ date: resolvedSelectedDate, scope, contentType, page, limit: LIMIT, sort }),
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

      return (
        calendarQuery.data.days.find((day) => day.is_today)?.date ||
        calendarQuery.data.days[0]?.date ||
        currentDate
      );
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
          <div>
            <div>
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
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-6 rounded-[30px] border border-rose-100 bg-white/85 p-4 shadow-[0_20px_70px_rgba(84,30,35,0.06)]">
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm font-black text-stone-800">ดูจาก</p>
              <div className="flex flex-wrap gap-2">
                {scopeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <FilterPill
                      key={option.value}
                      active={scope === option.value}
                      locked={option.requiresLogin && !isLoggedIn}
                      onClick={() => handleScopeChange(option.value)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </FilterPill>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-end">
              <div>
                <p className="mb-2 text-sm font-black text-stone-800">ประเภทนิยาย</p>
                <div className="flex flex-wrap gap-2">
                  {contentTypeOptions.map((option) => (
                    <FilterPill
                      key={option.value}
                      active={contentType === option.value}
                      onClick={() => handleContentTypeChange(option.value)}
                    >
                      {option.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <div className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-stone-800">
                  <ArrowDownUp className="h-4 w-4" />
                  เรียงตาม
                </span>
                <Select<UpdateSort>
                  value={sort}
                  onChange={handleSortChange}
                  options={sortSelectOptions}
                  size="large"
                  className="book-updates-sort-select w-full"
                  classNames={{ popup: { root: "book-updates-sort-dropdown" } }}
                />
              </div>
              
            </div>
          </div>
        </div>

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
          <BookUpdatesSwiper books={books} />
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
          min-height: 48px !important;
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
          color: #44403c !important;
          font-weight: 800 !important;
          line-height: 46px !important;
        }

        .book-updates-sort-dropdown {
          border-radius: 18px !important;
          overflow: hidden !important;
          padding: 6px !important;
        }

        .book-updates-sort-dropdown .ant-select-item {
          min-height: 40px !important;
          border-radius: 12px !important;
          font-weight: 700 !important;
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
