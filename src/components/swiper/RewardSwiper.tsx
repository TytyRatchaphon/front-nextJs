"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import parse from "html-react-parser";
import { Eye, AlignJustify, ChevronLeft, ChevronRight, Gift } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

interface RewardSwiperProps {
  items: any[];
  title?: string;
  icon?: string;
  link?: string;
}

const coverSrc = (img?: string) => {
  if (!img) return "/images/ejb.png";
  return img.startsWith("http") ? img : `https://img.enjoybook.co/img/book/${img}`;
};

const formatCount = (num?: number) => {
  const value = Number(num || 0);
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toLocaleString();
};

function RewardCard({ book }: { book: any }) {
  const promotion = Array.isArray(book?.full_book_promotions) ? book.full_book_promotions[0] : null;
  const rewards = Array.isArray(promotion?.rewards)
    ? [...promotion.rewards].sort((a: any, b: any) => (a?.order_by || 0) - (b?.order_by || 0))
    : [];
  const discountPercent = book?.discount || promotion?.discount_percent || 0;

  return (
    <Link
      href={`/book/${book?.book_id}`}
      className="group block w-[390px] overflow-hidden rounded-[28px] border border-stone-200 bg-white p-3 shadow-[0_28px_50px_-40px_rgba(15,23,42,0.4)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_64px_-40px_rgba(220,38,38,0.18)]"
    >
      <div className="grid grid-cols-[minmax(0,2fr)_120px] gap-3 rounded-[22px] border border-stone-200 bg-stone-50 p-3">
        <div className="relative overflow-hidden rounded-[18px]">
          <div className="relative aspect-[4/5] w-full">
            <Image
              src={coverSrc(book?.img_full || book?.img)}
              alt={book?.name || "reward book"}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
              unoptimized
            />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[18px] bg-[linear-gradient(180deg,#fff5f5_0%,#fff1f2_100%)] p-3 text-center">
          <div className="space-y-2">
            {rewards.length > 0 ? (
              rewards.slice(0, 3).map((reward: any, index: number) => (
                <div
                  key={reward?.id || index}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-white/90 px-2 py-1 shadow-[0_10px_18px_-16px_rgba(15,23,42,0.35)]"
                >
                  <div className="relative h-7 w-7 overflow-hidden rounded-full bg-white">
                    <Image
                      src={coverSrc(reward?.img)}
                      alt={reward?.item_type || "reward"}
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                  </div>
                  <span className="text-sm font-bold text-stone-700">x{reward?.amount || 1}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center rounded-full bg-white/90 px-2 py-1 text-stone-600 shadow-[0_10px_18px_-16px_rgba(15,23,42,0.35)]">
                <Gift className="h-4 w-4" />
              </div>
            )}
          </div>

          <div className="rounded-[18px] bg-white/70 px-2 py-3">
            <p className="text-sm font-semibold text-red-500">ลด</p>
            <p className="mt-1 text-[2rem] font-bold leading-none text-red-600">
              -{discountPercent}%
            </p>
          </div>
        </div>
      </div>

      <div className="px-1 pb-1 pt-4">
        <h3 className="line-clamp-2 text-[1.05rem] font-bold leading-tight text-stone-900 transition-colors group-hover:text-red-600">
          {book?.name}
        </h3>

        <div className="mt-3 flex items-center gap-4 text-[0.95rem] text-stone-500">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {formatCount(book?.view)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AlignJustify className="h-4 w-4" />
            {formatCount(book?.chapter)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function RewardSwiper({ items, title, icon, link }: RewardSwiperProps) {
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);

  const breakpoints = {
    320: { slidesPerView: "auto" as const, spaceBetween: 10 },
    640: { slidesPerView: "auto" as const, spaceBetween: 14 },
    1024: { slidesPerView: "auto" as const, spaceBetween: 18 },
  };

  return (
    <section className="group/reward relative w-full py-3">
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/60 px-4 py-2">
        {icon ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            <Image src={icon} alt={title || "reward icon"} fill className="object-cover" unoptimized />
          </div>
        ) : null}

        {title ? (
          <div className={`flex items-center ${title.trim().startsWith("<p") ? "translate-y-4" : "translate-y-1"}`}>
            <h2 className="text-lg font-bold leading-none [&_*]:m-0 sm:text-xl lg:text-2xl">
              {parse(title)}
            </h2>
          </div>
        ) : null}

        {link ? (
          <Link
            href={link}
            className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-red-500 transition hover:text-red-600"
          >
            ดูทั้งหมด
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <button
        ref={prevRef}
        className="absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg opacity-0 transition group-hover/reward:opacity-100 lg:block"
        aria-label="ก่อนหน้า"
      >
        <ChevronLeft className="h-5 w-5 text-stone-700" />
      </button>
      <button
        ref={nextRef}
        className="absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg opacity-0 transition group-hover/reward:opacity-100 lg:block"
        aria-label="ถัดไป"
      >
        <ChevronRight className="h-5 w-5 text-stone-700" />
      </button>

      <Swiper
        speed={520}
        breakpoints={breakpoints}
        modules={[Navigation, FreeMode]}
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
      >
        {items && items.length > 0 ? (
          items.map((book, index) => (
            <SwiperSlide key={book?.book_id || index} className="!w-auto">
              <RewardCard book={book} />
            </SwiperSlide>
          ))
        ) : (
          <div className="px-4 py-10 text-center text-sm text-stone-400">ไม่มีของแถมในตอนนี้</div>
        )}
      </Swiper>
    </section>
  );
}
