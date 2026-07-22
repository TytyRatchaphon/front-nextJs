"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Grid } from "swiper/modules";
import "swiper/css";
import "swiper/css/grid";
import type { ActiveCategory } from "@/services/apiServices";

interface ActiveCategoriesStripProps {
  categories: ActiveCategory[];
  categoryType?: string;
}

const pillThemes = [
  "!bg-emerald-500 !text-white border border-emerald-500 shadow-[0_10px_24px_-18px_rgba(16,185,129,0.8)]",
  "!bg-amber-500 !text-white border border-amber-500 shadow-[0_10px_24px_-18px_rgba(245,158,11,0.8)]",
  "!bg-orange-500 !text-white border border-orange-500 shadow-[0_10px_24px_-18px_rgba(249,115,22,0.8)]",
  "!bg-rose-500 !text-white border border-rose-500 shadow-[0_10px_24px_-18px_rgba(244,63,94,0.8)]",
  "!bg-violet-500 !text-white border border-violet-500 shadow-[0_10px_24px_-18px_rgba(139,92,246,0.8)]",
  "!bg-sky-500 !text-white border border-sky-500 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.8)]",
  "!bg-cyan-500 !text-white border border-cyan-500 shadow-[0_10px_24px_-18px_rgba(6,182,212,0.8)]",
  "!bg-green-500 !text-white border border-green-500 shadow-[0_10px_24px_-18px_rgba(34,197,94,0.8)]",
  "!bg-pink-500 !text-white border border-pink-500 shadow-[0_10px_24px_-18px_rgba(236,72,153,0.8)]",
];

export default function ActiveCategoriesStrip({
  categories,
  categoryType = "all",
}: ActiveCategoriesStripProps) {
  if (!categories.length) return null;

  const buildCategoryHref = (categoryId: string | number, categoryName?: string) => {
    const params = new URLSearchParams({
      type: categoryType,
      categoryId: String(categoryId),
      tab: "new",
      limit: "10",
      page: "1",
    });

    if (categoryName) {
      params.set("name", categoryName);
    }

    return `/cat/list?${params.toString()}`;
  };

  return (
    <section className="mb-5 mt-6 w-full border-b border-stone-200 pb-4 sm:mb-6 sm:mt-8">
      <div className="flex items-end justify-between gap-4">
        <p className="text-[15px] font-semibold text-stone-900">หมวดหมู่</p>
        <Link
          href={buildCategoryHref("all", "ทั้งหมด")}
          className="shrink-0 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          ดูทั้งหมด
        </Link>
      </div>

      <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
        {categories.map((category, index) => (
          <Link
            key={`${category.id}-${category.name}`}
            href={buildCategoryHref(category.id, category.name)}
            className={`inline-flex min-h-8 items-center rounded-md px-3 py-1.5 text-xs font-semibold leading-none no-underline transition duration-200 hover:-translate-y-0.5 hover:brightness-[1.05] ${pillThemes[index % pillThemes.length]}`}
          >
            {category.name}
          </Link>
        ))}
      </div>

      <div className="mt-3 sm:hidden">
        <Swiper
          modules={[Grid]}
          grid={{ rows: 2, fill: "row" }}
          slidesPerView={3.25}
          spaceBetween={8}
          className="w-full"
          breakpoints={{
            420: {
              slidesPerView: 3.6,
            },
            560: {
              slidesPerView: 4.2,
            },
          }}
        >
          {categories.map((category, index) => (
            <SwiperSlide key={`${category.id}-${category.name}`} className="!h-auto pb-2">
              <Link
                href={buildCategoryHref(category.id, category.name)}
                className={`flex min-h-8 w-full items-center justify-center rounded-md px-2 py-1.5 text-center text-[11px] font-semibold leading-none no-underline transition duration-200 ${pillThemes[index % pillThemes.length]}`}
              >
                <span className="line-clamp-1">{category.name}</span>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
