"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { BookStatusBadges } from "@/components/novelCard/BookStatusBadges";
import { computeEnded } from "@/components/novelCard/bookCardUtils";
import type { BookUpdateDailyBook } from "@/services/api/bookUpdatesApi";
import { getCoverSrc, getFastAccessText } from "../bookUpdatesUtils";

export function TimelineBookMeta({
  book,
  hoverVariant = "card",
}: {
  book: BookUpdateDailyBook;
  hoverVariant?: "card" | "stack";
}) {
  const titleHoverClass =
    hoverVariant === "stack" ? "group-hover/stack:text-[#ef304b]" : "group-hover:text-[#ef304b]";

  return (
    <div className="pt-4">
      <h3 className={`line-clamp-2 min-h-[2.65rem] text-[15px] font-black leading-[1.35] text-black transition-colors ${titleHoverClass}`}>
        {book.name}
      </h3>
      <p className="mt-2 line-clamp-1 text-[11px] font-semibold leading-4 text-stone-400">
        โดย {book.writer_name || "ไม่ระบุนักเขียน"}
      </p>
      {(book.updated_episode_count > 0 || book.latest_episode?.name) ? (
        <div className="mt-3 space-y-1.5 border-t border-rose-100/80 pt-2.5">
          {book.updated_episode_count > 0 ? (
            <p className="line-clamp-1 text-[11px] font-black leading-4 text-[#b42335]">
              อัปเดตล่าสุด {book.updated_episode_count} ตอน
            </p>
          ) : null}
          {book.latest_episode?.name ? (
            <p className="line-clamp-2 text-[11px] font-semibold leading-[1.55] text-stone-500">
              <span className="text-stone-700">ตอนล่าสุด</span> {book.latest_episode.name}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function TimelineBookCard({ book }: { book: BookUpdateDailyBook }) {
  const fastAccessText = getFastAccessText(book);
  const categories = book.categories?.length ? book.categories.slice(0, 2) : [];
  const tags = book.tag?.slice(0, Math.max(0, 3 - categories.length)) ?? [];
  const ended = computeEnded(book as Record<string, unknown>);
  const discountBadge = book.discount ?? null;

  return (
    <article className="w-[158px] shrink-0 sm:w-[176px]">
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
              {categories.map((category) => (
                <span
                  key={`${book.book_id}-${category.id}-${category.name}`}
                  className="rounded bg-white/18 px-2 py-1 text-[11px] font-bold text-white backdrop-blur"
                >
                  {category.name}
                </span>
              ))}
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
              ) : null}
            </div>
            <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#ef304b] text-sm font-black text-white shadow-[0_10px_24px_rgba(239,48,75,0.35)] transition-colors group-hover:bg-[#d91d3c]">
              <Play className="h-4 w-4 fill-white" />
              อ่าน
            </span>
          </div>
        </div>
        <TimelineBookMeta book={book} />
      </Link>
    </article>
  );
}
