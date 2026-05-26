"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Modal } from "antd";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import type { BookUpdateDailyBook, UpdateSort } from "@/services/api/bookUpdatesApi";
import { getCoverSrc, getFastAccessText, groupBooksByPublishTime, type BookUpdateTimeGroup } from "../bookUpdatesUtils";

const COLLAPSED_ROW_COUNT = 5;

const getSortLabel = (sort: UpdateSort) => {
  if (sort === "view") return "ยอดเข้าชม";
  if (sort === "bestseller") return "ขายดี";
  return "อัปเดตใหม่";
};

const rankColorClass = (index: number) => {
  if (index === 0) return "text-[#ef304b]";
  if (index === 1) return "text-[#f97316]";
  if (index === 2) return "text-emerald-500";
  return "text-stone-500";
};

function BookUpdateRankRow({ book, index }: { book: BookUpdateDailyBook; index: number }) {
  const latestEpisode = book.latest_episode?.name || "ยังไม่ระบุตอนล่าสุด";
  const fastAccessText = getFastAccessText(book);
  const advanceDays = book.latest_episode?.fast_access.advance_days ?? 0;
  const updatedCountText = book.updated_episode_count > 0
    ? `อัปเดตล่าสุด ${book.updated_episode_count} ตอน`
    : "มีอัปเดตใหม่";

  return (
    <Link
      href={`/book/${book.book_id}`}
      prefetch={false}
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      className="group grid h-[92px] select-none grid-cols-[48px_minmax(0,1fr)] gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-rose-50/80 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#ef304b]"
      aria-label={`เปิดเรื่อง ${book.name}`}
    >
      <div className="relative h-16 w-12 overflow-hidden rounded-md bg-rose-50 shadow-sm">
        <Image
          src={getCoverSrc(book)}
          alt={book.name}
          fill
          draggable={false}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          sizes="48px"
        />
      </div>

      <div className="min-w-0 pt-0.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className={`shrink-0 text-sm font-black tabular-nums ${rankColorClass(index)}`}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="line-clamp-1 text-[15px] font-black leading-5 text-stone-950 transition-colors group-hover:text-[#ef304b]">
            {book.name}
          </h3>
        </div>
        <div className="mt-1 flex h-[18px] min-w-0 items-baseline gap-2">
          <p className="min-w-0 truncate text-xs font-bold leading-[18px] text-[#b42335]">
            {updatedCountText}
          </p>
          {fastAccessText ? (
            <span
              title={fastAccessText}
              className="inline-flex h-[17px] shrink-0 items-center rounded-md border border-amber-200 bg-amber-50/80 px-1.5 text-[10px] font-bold leading-none text-amber-700"
            >
              ล่วงหน้า {advanceDays} วัน
            </span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-1 text-[11px] font-semibold leading-4 text-stone-500">
          <span className="text-stone-700">ตอนล่าสุด</span> {latestEpisode}
        </p>
      </div>
    </Link>
  );
}

function BookUpdateRankingColumn({
  group,
  onOpenMore,
  active,
  pop,
}: {
  group: BookUpdateTimeGroup;
  onOpenMore: () => void;
  active: boolean;
  pop: boolean;
}) {
  const totalUpdatedEpisodes = group.books.reduce((sum, book) => sum + Math.max(0, book.updated_episode_count || 0), 0);
  const hasMore = group.books.length > COLLAPSED_ROW_COUNT;
  const visibleBooks = group.books.slice(0, COLLAPSED_ROW_COUNT);
  const hiddenCount = Math.max(0, group.books.length - COLLAPSED_ROW_COUNT);
  const emptySlotCount = Math.max(0, COLLAPSED_ROW_COUNT - visibleBooks.length);

  return (
    <section
      className={`w-[300px] shrink-0 rounded-[26px] border border-rose-100 bg-white/92 p-4 transition-all duration-300 sm:w-[320px] ${
        active
          ? "book-update-column-active"
          : "scale-[0.985] opacity-[0.56] saturate-[0.72] shadow-[0_20px_56px_rgba(127,29,29,0.06)] hover:opacity-[0.74] hover:saturate-[0.88]"
      } ${pop ? "book-update-column-pop" : ""}`}
    >
      <div className="mb-3 border-b border-rose-100 pb-2.5">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex h-7 min-w-0 items-center gap-2">
            <span className="h-[28px] w-1 shrink-0 rounded-full bg-[#ef304b]" />
            <span
              className="inline-flex h-[22px] items-center text-xl font-black leading-none text-[#ef304b]"
              style={{ transform: "translateY(-1px)" }}
            >
              {group.timeLabel}
            </span>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-black leading-4 text-stone-600">
              {group.books.length} เรื่อง
            </p>
            <p className="text-[11px] font-black leading-4 text-stone-500">
              {totalUpdatedEpisodes > 0 ? `${totalUpdatedEpisodes} ตอนใหม่` : "อัปเดตใหม่"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {visibleBooks.map((book, index) => (
          <BookUpdateRankRow
            key={`${book.book_id}-${book.latest_episode?.ep_id ?? book.last_publish_at ?? book.name}`}
            book={book}
            index={index}
          />
        ))}
        {Array.from({ length: emptySlotCount }).map((_, index) => (
          <div key={`empty-slot-${group.timeLabel}-${index}`} className="h-[92px]" aria-hidden="true" />
        ))}
      </div>

      <div className="mt-3 h-[46px]">
        {hasMore ? (
        <button
          type="button"
          onClick={onOpenMore}
          className="flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50/70 px-3 text-xs font-black text-[#b42335] transition-colors hover:border-rose-200 hover:bg-rose-100 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#ef304b]"
        >
          ดูเพิ่มอีก {hiddenCount} เรื่อง
          <ChevronDown className="h-4 w-4" />
        </button>
        ) : null}
      </div>
    </section>
  );
}

function BookUpdatesMoreModal({
  group,
  open,
  onClose,
}: {
  group: BookUpdateTimeGroup | null;
  open: boolean;
  onClose: () => void;
}) {
  const totalUpdatedEpisodes = group?.books.reduce((sum, book) => sum + Math.max(0, book.updated_episode_count || 0), 0) ?? 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      className="book-updates-more-modal"
      title={(
        <div className="pr-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl font-black text-[#ef304b]">{group?.timeLabel}</span>
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-[#b42335]">
              {group?.books.length ?? 0} เรื่อง
            </span>
          </div>
          <p className="mt-1 text-xs font-normal text-stone-500">
            {totalUpdatedEpisodes > 0 ? `รวม ${totalUpdatedEpisodes} ตอนใหม่` : "รายการอัปเดตทั้งหมดในช่วงเวลานี้"}
          </p>
        </div>
      )}
    >
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <div className="space-y-1">
          {group?.books.map((book, index) => (
            <BookUpdateRankRow
              key={`modal-${book.book_id}-${book.latest_episode?.ep_id ?? book.last_publish_at ?? book.name}`}
              book={book}
              index={index}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}

function BookUpdatesOverview({
  books,
  groups,
  onSelectGroup,
  activeGroupKey,
  calendarHeader,
  summaryLabel = "วันนี้",
  summaryDescription = "เรื่องในวันนี้",
}: {
  books: BookUpdateDailyBook[];
  groups: BookUpdateTimeGroup[];
  onSelectGroup: (groupKey: string, groupIndex: number) => void;
  activeGroupKey: string | null;
  calendarHeader?: React.ReactNode;
  summaryLabel?: string;
  summaryDescription?: string;
}) {
  const activityGroups = groups;
  const activitySwiperRef = React.useRef<SwiperInstance | null>(null);
  const [canScrollActivityPrev, setCanScrollActivityPrev] = React.useState(false);
  const [canScrollActivityNext, setCanScrollActivityNext] = React.useState(false);

  const updateActivitySwiperState = React.useCallback((swiper = activitySwiperRef.current) => {
    if (!swiper || swiper.destroyed) return;

    setCanScrollActivityPrev(!swiper.isBeginning);
    setCanScrollActivityNext(!swiper.isEnd);
  }, []);

  React.useEffect(() => {
    const swiper = activitySwiperRef.current;
    if (!swiper) return;

    swiper.update();
    updateActivitySwiperState(swiper);
  }, [activityGroups, updateActivitySwiperState]);

  React.useEffect(() => {
    if (!activeGroupKey) return;

    const swiper = activitySwiperRef.current;
    const activeIndex = activityGroups.findIndex(
      (group, index) => `${group.timeLabel}-${index}` === activeGroupKey,
    );
    if (!swiper || activeIndex < 0) return;

    const slide = swiper.slides[activeIndex] as HTMLElement | undefined;
    if (!slide) return;

    const swiperRect = swiper.el.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const centeredTranslate = swiper.translate - (
      (slideRect.left + slideRect.width / 2) - (swiperRect.left + swiperRect.width / 2)
    );
    const targetTranslate = Math.max(
      swiper.maxTranslate(),
      Math.min(swiper.minTranslate(), centeredTranslate),
    );

    swiper.translateTo(targetTranslate, 320, true, true);
  }, [activeGroupKey, activityGroups]);

  const scrollActivity = React.useCallback((direction: "prev" | "next") => {
    if (direction === "next") {
      activitySwiperRef.current?.slideNext();
      return;
    }
    activitySwiperRef.current?.slidePrev();
  }, []);

  return (
    <section className="mx-auto mb-5 max-w-[1180px] px-4 sm:px-6" aria-label="สรุปตารางลงนิยายวันนี้">
      <div className="rounded-[24px] border border-rose-100 bg-white/92 px-5 py-5 shadow-[0_18px_60px_rgba(127,29,29,0.08)]">
        {calendarHeader ? (
          <div className="border-b border-rose-100 pb-5">
            {calendarHeader}
          </div>
        ) : null}

        <div className={`grid gap-5 md:grid-cols-[130px_minmax(0,1fr)] md:items-center ${calendarHeader ? "pt-5" : ""}`}>
          <div className="flex flex-col items-center justify-center border-b border-rose-100 pb-4 text-center md:min-h-[92px] md:border-b-0 md:border-r md:pb-0 md:pr-5">
            <p className="text-xs font-medium text-stone-500">{summaryLabel}</p>
            <p className="mt-2 text-4xl font-black leading-none text-[#ef304b]">{books.length}</p>
            <p className="mt-2 text-xs font-medium text-stone-500">{summaryDescription}</p>
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-stone-800">ช่วงเวลาที่อัปเดต</h2>
                <p className="text-xs font-normal text-stone-400">เลือกเวลาเพื่อไปยังรายการที่ต้องการอ่าน</p>
              </div>
            </div>

            <div className="relative">
              {canScrollActivityPrev ? (
                <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-10 bg-gradient-to-r from-white via-white/90 to-transparent" />
              ) : null}
              {canScrollActivityNext ? (
                <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-10 bg-gradient-to-l from-white via-white/90 to-transparent" />
              ) : null}
              <button
                type="button"
                onClick={() => scrollActivity("prev")}
                disabled={!canScrollActivityPrev}
                aria-label="เลื่อนช่วงเวลาไปทางซ้าย"
                className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-rose-100 bg-white text-[#ef304b] shadow-sm transition-opacity disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollActivity("next")}
                disabled={!canScrollActivityNext}
                aria-label="เลื่อนช่วงเวลาไปทางขวา"
                className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-rose-100 bg-white text-[#ef304b] shadow-sm transition-opacity disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <Swiper
                modules={[FreeMode]}
                slidesPerView="auto"
                spaceBetween={10}
                freeMode={{ enabled: true, momentumRatio: 0.85, momentumVelocityRatio: 0.85 }}
                speed={420}
                onSwiper={(swiper) => {
                  activitySwiperRef.current = swiper;
                  updateActivitySwiperState(swiper);
                }}
                onAfterInit={updateActivitySwiperState}
                onSlideChange={updateActivitySwiperState}
                onReachBeginning={updateActivitySwiperState}
                onReachEnd={updateActivitySwiperState}
                onFromEdge={updateActivitySwiperState}
                onResize={updateActivitySwiperState}
                className="book-updates-time-filter-swiper select-none !py-1"
              >
                {activityGroups.map((group, index) => {
                  const groupKey = `${group.timeLabel}-${index}`;
                  const isActive = activeGroupKey === groupKey;

                  return (
                    <SwiperSlide key={`activity-${groupKey}`} className="!w-auto">
                      <button
                        type="button"
                        onClick={() => onSelectGroup(groupKey, index)}
                        className={`flex h-[54px] min-w-[70px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-3 transition-all focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#ef304b] ${
                          isActive
                            ? "border-[#ef304b] bg-[#ef304b] !text-white shadow-[0_10px_22px_rgba(239,48,75,0.2)]"
                            : "border-rose-100 bg-rose-50/45 text-stone-600 hover:border-rose-200 hover:bg-rose-50"
                        }`}
                        title={`${group.timeLabel}: ${group.books.length} เรื่อง`}
                        aria-label={`ไปยังช่วงเวลา ${group.timeLabel} มี ${group.books.length} เรื่อง`}
                        aria-pressed={isActive}
                      >
                        <span className="text-xs font-medium leading-none">
                          {group.timeLabel}
                        </span>
                        <span className={`text-[11px] font-normal leading-none ${isActive ? "text-white/90" : "text-[#ef304b]"}`}>
                          {group.books.length} เรื่อง
                        </span>
                      </button>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BookUpdatesSwiper({
  books,
  sort,
  calendarHeader,
  summaryLabel,
  summaryDescription,
}: {
  books: BookUpdateDailyBook[];
  sort: UpdateSort;
  calendarHeader?: React.ReactNode;
  summaryLabel?: string;
  summaryDescription?: string;
}) {
  const [modalGroup, setModalGroup] = React.useState<BookUpdateTimeGroup | null>(null);
  const [activeGroupKey, setActiveGroupKey] = React.useState<string | null>(null);
  const [popGroupKey, setPopGroupKey] = React.useState<string | null>(null);
  const swiperRef = React.useRef<SwiperInstance | null>(null);
  const pendingPopGroupKeyRef = React.useRef<string | null>(null);
  const popTimeoutRef = React.useRef<number | null>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const groups = React.useMemo(() => {
    if (sort === "publish_time") {
      return groupBooksByPublishTime(books);
    }

    return [
      {
        timeLabel: getSortLabel(sort),
        books,
      },
    ];
  }, [books, sort]);

  const updateSwiperState = React.useCallback((swiper = swiperRef.current) => {
    if (!swiper || swiper.destroyed) return;

    setCanScrollPrev(!swiper.isBeginning);
    setCanScrollNext(!swiper.isEnd);
  }, []);

  const syncCenteredGroup = React.useCallback((swiper = swiperRef.current) => {
    if (!swiper || swiper.destroyed || swiper.slides.length === 0) return;

    const swiperRect = swiper.el.getBoundingClientRect();
    const centerX = swiperRect.left + swiperRect.width / 2;
    let centeredIndex = 0;
    let centeredDistance = Number.POSITIVE_INFINITY;

    swiper.slides.forEach((slide, index) => {
      const slideRect = (slide as HTMLElement).getBoundingClientRect();
      const distance = Math.abs(slideRect.left + slideRect.width / 2 - centerX);
      if (distance < centeredDistance) {
        centeredDistance = distance;
        centeredIndex = index;
      }
    });

    const centeredGroup = groups[centeredIndex];
    if (!centeredGroup) return;

    const groupKey = `${centeredGroup.timeLabel}-${centeredIndex}`;
    setActiveGroupKey((currentGroupKey) => (
      currentGroupKey === groupKey ? currentGroupKey : groupKey
    ));
  }, [groups]);

  React.useEffect(() => {
    window.requestAnimationFrame(() => {
      updateSwiperState();
      syncCenteredGroup();
    });

    const handleResize = () => {
      updateSwiperState();
      syncCenteredGroup();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [groups, syncCenteredGroup, updateSwiperState]);

  React.useEffect(() => {
    setModalGroup(null);
    setActiveGroupKey(null);
    setPopGroupKey(null);
    window.requestAnimationFrame(() => syncCenteredGroup());
  }, [books, sort, syncCenteredGroup]);

  React.useEffect(() => () => {
    if (popTimeoutRef.current) {
      window.clearTimeout(popTimeoutRef.current);
    }
  }, []);

  const scrollColumns = React.useCallback((direction: "prev" | "next") => {
    if (direction === "next") {
      swiperRef.current?.slideNext();
      return;
    }
    swiperRef.current?.slidePrev();
  }, []);

  const triggerPop = React.useCallback((groupKey: string) => {
    setPopGroupKey(groupKey);
    if (popTimeoutRef.current) {
      window.clearTimeout(popTimeoutRef.current);
    }
    popTimeoutRef.current = window.setTimeout(() => setPopGroupKey(null), 520);
  }, []);

  const scrollToGroup = React.useCallback((groupKey: string, groupIndex: number) => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    if (groupIndex < 0 || groupIndex >= swiper.slides.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const slide = swiper.slides[groupIndex] as HTMLElement | undefined;
    if (!slide) return;

    const swiperRect = swiper.el.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const centeredTranslate = swiper.translate - (
      (slideRect.left + slideRect.width / 2) - (swiperRect.left + swiperRect.width / 2)
    );
    const targetTranslate = Math.max(
      swiper.maxTranslate(),
      Math.min(swiper.minTranslate(), centeredTranslate),
    );

    setActiveGroupKey(groupKey);
    setPopGroupKey(null);
    if (popTimeoutRef.current) {
      window.clearTimeout(popTimeoutRef.current);
    }

    pendingPopGroupKeyRef.current = prefersReducedMotion ? null : groupKey;
    swiper.translateTo(targetTranslate, prefersReducedMotion ? 0 : 520, true, true);

    if (prefersReducedMotion) return;
    if (Math.abs(swiper.translate - targetTranslate) <= 2 && !swiper.animating) {
      triggerPop(groupKey);
    }
  }, [triggerPop]);

  const handleSwiperTransitionEnd = React.useCallback((swiper: SwiperInstance) => {
    updateSwiperState(swiper);
    syncCenteredGroup(swiper);
    const pendingGroupKey = pendingPopGroupKeyRef.current;
    if (!pendingGroupKey) return;

    pendingPopGroupKeyRef.current = null;
    triggerPop(pendingGroupKey);
  }, [syncCenteredGroup, triggerPop, updateSwiperState]);

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[linear-gradient(180deg,#fff1f2_0%,#fff7ed_100%)] pb-10 pt-5">
      <div className="w-full">
        <BookUpdatesOverview
          books={books}
          groups={groups}
          onSelectGroup={scrollToGroup}
          activeGroupKey={activeGroupKey}
          calendarHeader={calendarHeader}
          summaryLabel={summaryLabel}
          summaryDescription={summaryDescription}
        />

        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          {canScrollPrev ? (
            <div className="pointer-events-none absolute bottom-3 left-0 top-0 z-10 w-16 bg-gradient-to-r from-[#fff1f2] to-transparent" />
          ) : null}
          {canScrollNext ? (
            <div className="pointer-events-none absolute bottom-3 right-0 top-0 z-10 w-16 bg-gradient-to-l from-[#fff7ed] to-transparent" />
          ) : null}

          <button
            type="button"
            onClick={() => scrollColumns("prev")}
            disabled={!canScrollPrev}
            aria-label="เลื่อนตารางไปทางซ้าย"
            className="absolute left-6 top-[calc(50%_-_14px)] z-20 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-rose-100 bg-white/95 text-[#ef304b] shadow-[0_16px_36px_rgba(127,29,29,0.16)] transition-all hover:-translate-x-0.5 hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:left-8 lg:left-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollColumns("next")}
            disabled={!canScrollNext}
            aria-label="เลื่อนตารางไปทางขวา"
            className="absolute right-6 top-[calc(50%_-_14px)] z-20 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-rose-100 bg-white/95 text-[#ef304b] shadow-[0_16px_36px_rgba(127,29,29,0.16)] transition-all hover:translate-x-0.5 hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:right-8 lg:right-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <Swiper
            modules={[FreeMode]}
            slidesPerView="auto"
            spaceBetween={24}
            freeMode={{
              enabled: true,
              momentumRatio: 0.85,
              momentumVelocityRatio: 0.85,
            }}
            speed={520}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              updateSwiperState(swiper);
              syncCenteredGroup(swiper);
            }}
            onAfterInit={(swiper) => {
              updateSwiperState(swiper);
              syncCenteredGroup(swiper);
            }}
            onSlideChange={(swiper) => {
              updateSwiperState(swiper);
              syncCenteredGroup(swiper);
            }}
            onReachBeginning={updateSwiperState}
            onReachEnd={updateSwiperState}
            onFromEdge={updateSwiperState}
            onResize={(swiper) => {
              updateSwiperState(swiper);
              syncCenteredGroup(swiper);
            }}
            onSetTranslate={(swiper) => syncCenteredGroup(swiper)}
            onTransitionEnd={handleSwiperTransitionEnd}
            breakpoints={{
              320: { spaceBetween: 24 },
              1024: { spaceBetween: 28 },
            }}
            className="book-updates-schedule-swiper -mt-4 select-none !pb-12 !pt-8"
          >
            {groups.map((group, index) => {
              const groupKey = `${group.timeLabel}-${index}`;

              return (
                <SwiperSlide key={groupKey} className="!w-auto">
                  <BookUpdateRankingColumn
                    group={group}
                    onOpenMore={() => setModalGroup(group)}
                    active={activeGroupKey === groupKey}
                    pop={popGroupKey === groupKey}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>

      <BookUpdatesMoreModal
        group={modalGroup}
        open={Boolean(modalGroup)}
        onClose={() => setModalGroup(null)}
      />

      <style jsx global>{`
        @keyframes book-update-column-pop {
          0% {
            transform: translateY(-12px) scale(1.035);
          }
          42% {
            transform: translateY(-14px) scale(1.058);
          }
          72% {
            transform: translateY(-11px) scale(1.028);
          }
          100% {
            transform: translateY(-12px) scale(1.035);
          }
        }

        .book-update-column-pop {
          animation: book-update-column-pop 520ms cubic-bezier(0.2, 0.9, 0.3, 1);
          transform-origin: center center;
        }

        .book-update-column-active {
          position: relative;
          z-index: 2;
          transform: translateY(-12px) scale(1.035);
          box-shadow:
            0 8px 18px rgba(120, 45, 55, 0.08),
            0 26px 56px rgba(190, 18, 60, 0.14),
            0 38px 72px rgba(120, 45, 55, 0.09);
        }

        .book-updates-schedule-swiper .swiper-wrapper {
          align-items: stretch;
          cursor: grab;
        }

        .book-updates-schedule-swiper .swiper-wrapper:active {
          cursor: grabbing;
        }

        .book-updates-time-filter-swiper .swiper-wrapper {
          cursor: grab;
        }

        .book-updates-time-filter-swiper .swiper-wrapper:active {
          cursor: grabbing;
        }

        .book-updates-schedule-swiper .swiper-slide {
          height: auto;
        }

        @media (prefers-reduced-motion: reduce) {
          .book-update-column-pop {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
