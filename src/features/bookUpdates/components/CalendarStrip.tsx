"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import type { BookUpdateCalendarDay } from "@/services/api/bookUpdatesApi";
import { getCalendarDayClass } from "../bookUpdatesUtils";

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

export function CalendarStrip({
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
