"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FreeMode, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { BookUpdateDailyBook, UpdateSort } from "@/services/api/bookUpdatesApi";
import { groupBooksByPublishTime } from "../bookUpdatesUtils";
import { TimelineTimeGroup } from "./TimelineTimeGroup";

export function BookUpdatesSwiper({ books, sort }: { books: BookUpdateDailyBook[]; sort: UpdateSort }) {
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const timeGroups = React.useMemo(() => {
    if (sort === "publish_time") {
      return groupBooksByPublishTime(books);
    }

    return books.map((book) => ({
      timeLabel: book.publish_time_text || "อัปเดตใหม่",
      books: [book],
    }));
  }, [books, sort]);

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
        spaceBetween={40}
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
          320: { spaceBetween: 24 },
          640: { spaceBetween: 32 },
          1024: { spaceBetween: 40 },
        }}
        className="book-updates-book-swiper !overflow-visible"
      >
        {timeGroups.map((group, index) => (
          <SwiperSlide key={`${group.timeLabel}-${index}`} className="!w-auto">
            <TimelineTimeGroup group={group} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
