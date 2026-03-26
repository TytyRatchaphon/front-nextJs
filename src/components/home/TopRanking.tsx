"use client";

import React from "react";
import Link from "next/link";
import parse from "html-react-parser";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation } from "swiper/modules";
import CardBook from "@/components/novelCard/CardBook";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";

interface TopRankingProps {
  rankingGroup: any;
}

const getRankChip = (rank: number) => {
  if (rank === 1) {
    return {
      label: "1st",
      className: "bg-[#FFD84D] text-stone-900 shadow-[0_10px_24px_-18px_rgba(234,179,8,0.85)]",
    };
  }

  if (rank === 2) {
    return {
      label: "2nd",
      className: "bg-[#D1D5DB] text-stone-700 shadow-[0_10px_24px_-18px_rgba(148,163,184,0.85)]",
    };
  }

  if (rank === 3) {
    return {
      label: "3rd",
      className: "bg-[#D99138] text-white shadow-[0_10px_24px_-18px_rgba(217,145,56,0.9)]",
    };
  }

  return {
    label: `${rank}th`,
    className: "bg-stone-200 text-stone-700 shadow-[0_10px_24px_-18px_rgba(120,113,108,0.65)]",
  };
};

export default function TopRanking({ rankingGroup }: TopRankingProps) {
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const rankingList = Array.isArray(rankingGroup?.list) ? rankingGroup.list.slice(0, 10) : [];

  if (rankingList.length === 0) return null;

  return (
    <section className="w-full py-3">
      <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-white/60 px-4 py-2">
        <h2 className="text-lg font-bold leading-none text-stone-950 [&_*]:m-0 sm:text-xl lg:text-2xl">
          {rankingGroup?.name_web ? parse(rankingGroup.name_web) : "อันดับนิยายมาแรง"}
        </h2>

        <Link
          href="/ranking"
          className="inline-flex items-center gap-1 text-sm font-medium text-red-500 transition hover:text-red-600"
        >
          ดูทั้งหมด
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="group/top-ranking relative">
        <button
          ref={prevRef}
          className="absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/95 p-3 text-stone-700 shadow-lg opacity-0 transition group-hover/top-ranking:opacity-100 lg:block"
          aria-label="อันดับก่อนหน้า"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          ref={nextRef}
          className="absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/95 p-3 text-stone-700 shadow-lg opacity-0 transition group-hover/top-ranking:opacity-100 lg:block"
          aria-label="อันดับถัดไป"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <Swiper
          speed={520}
          modules={[Navigation, FreeMode]}
          slidesPerView="auto"
          spaceBetween={12}
          freeMode
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            // @ts-expect-error -- Swiper navigation refs are assigned imperatively.
            swiper.params.navigation.prevEl = prevRef.current;
            // @ts-expect-error -- Swiper navigation refs are assigned imperatively.
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          breakpoints={{
            320: { spaceBetween: 10 },
            640: { spaceBetween: 12 },
            1024: { spaceBetween: 14 },
          }}
        >
          {rankingList.map((book: any, index: number) => {
            const chip = getRankChip(index + 1);

            return (
              <SwiperSlide key={book?.book_id || index} className="!w-auto">
                <div className="w-[180px] shrink-0 pt-3">
                  <div className="mb-2 flex justify-center">
                    <div
                      className={`inline-flex min-w-[50px] items-center justify-center rounded-full px-3 py-1 text-xs font-bold ${chip.className}`}
                    >
                      {chip.label}
                    </div>
                  </div>

                  <CardBook book={{ ...book, rank: undefined }} />
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
