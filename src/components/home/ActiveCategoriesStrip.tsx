"use client";

import Link from "next/link";
import type { ActiveCategory } from "@/services/apiServices";

interface ActiveCategoriesStripProps {
  categories: ActiveCategory[];
}

const pillThemes = [
  "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
  "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200",
  "bg-green-100 text-green-700 ring-1 ring-green-200",
  "bg-pink-100 text-pink-700 ring-1 ring-pink-200",
];

export default function ActiveCategoriesStrip({ categories }: ActiveCategoriesStripProps) {
  if (!categories.length) return null;

  return (
    <section className="mb-5 mt-6 w-full border-b border-stone-200 pb-4 sm:mb-6 sm:mt-8">
      <div className="flex items-end justify-between gap-4">
        <p className="text-[15px] font-semibold text-stone-900">หมวดหมู่</p>
        <Link
          href="/cat/all?type=all&tab=new&page=1&name=ทั้งหมด"
          className="shrink-0 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          ดูทั้งหมด
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {categories.map((category, index) => (
          <Link
            key={`${category.id}-${category.name}`}
            href={`/cat/${category.id}?type=all&tab=new&page=1&name=${encodeURIComponent(category.name)}`}
            className={`inline-flex min-h-8 items-center rounded-md px-3 py-1.5 text-xs font-semibold leading-none transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${pillThemes[index % pillThemes.length]}`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
