"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { getCoverSrc, type BookUpdateTimeGroup } from "../bookUpdatesUtils";

export function TimelineStackPreview({
  group,
  onExpand,
}: {
  group: BookUpdateTimeGroup;
  onExpand: () => void;
}) {
  const [coverOffset, setCoverOffset] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const canRotate = group.books.length > 3;
  const previewBooks = React.useMemo(() => {
    if (!canRotate) return group.books.slice(0, 3);

    return Array.from({ length: 3 }, (_, index) => group.books[(coverOffset + index) % group.books.length]);
  }, [canRotate, coverOffset, group.books]);
  const stackedBooks = [...previewBooks].reverse();
  const visibleTitleBooks = group.books.slice(0, 2);
  const remainingTitleCount = Math.max(0, group.books.length - visibleTitleBooks.length);
  const titlePreviewText = `${visibleTitleBooks.map((book) => book.name).join(" / ")}${remainingTitleCount > 0 ? ` ... อีก ${remainingTitleCount} เรื่อง` : ""}`;
  const totalUpdatedEpisodes = group.books.reduce((sum, book) => sum + Math.max(0, book.updated_episode_count || 0), 0);

  React.useEffect(() => {
    if (!canRotate || isPaused) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const intervalId = window.setInterval(() => {
      setCoverOffset((current) => (current + 1) % group.books.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [canRotate, group.books.length, isPaused]);

  return (
    <button
      type="button"
      onClick={onExpand}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-label={`ดูนิยายทั้งหมดในเวลา ${group.timeLabel} จำนวน ${group.books.length} เรื่อง`}
      className="group/stack block w-[184px] shrink-0 cursor-pointer pr-6 text-left sm:w-[202px]"
    >
      <div className="relative mb-5 h-[211px] w-[158px] sm:h-[235px] sm:w-[176px]">
        {stackedBooks.map((book, index) => {
          const depth = stackedBooks.length - index - 1;

          return (
            <div
              key={`${book.book_id}-${book.latest_episode?.ep_id ?? book.name}-stack`}
              className="absolute inset-0 overflow-hidden rounded-xl border border-white bg-white shadow-[0_18px_36px_rgba(127,29,29,0.14)] transition-transform duration-300 group-hover/stack:-translate-y-1"
              style={{
                transform: `translate(${depth * 8}px, ${depth * 7}px) rotate(${depth * 1.6}deg)`,
                zIndex: index + 1,
              }}
            >
              <Image src={getCoverSrc(book)} alt={book.name} fill className="object-cover" sizes="176px" />
              {depth === 0 ? (
                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent" />
              ) : null}
            </div>
          );
        })}
        <span className="absolute bottom-3 left-3 right-3 z-10 inline-flex items-center justify-center gap-1 rounded-full border border-white/50 bg-white/25 px-3 py-2 text-xs font-black text-white shadow-[0_12px_24px_rgba(127,29,29,0.16)] backdrop-blur-md transition-transform duration-300 group-hover/stack:-translate-y-0.5">
          กดเพื่อขยาย
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="pt-4">
        <h3 className="line-clamp-2 min-h-[2.65rem] text-[15px] font-black leading-[1.35] text-black transition-colors group-hover/stack:text-[#ef304b]">
          {titlePreviewText}
        </h3>
        <p className="mt-2 line-clamp-1 text-[11px] font-semibold leading-4 text-stone-400">
          อัปเดตทั้งหมด {group.books.length} เรื่อง
        </p>
        <div className="mt-3 space-y-1.5 border-t border-rose-100/80 pt-2.5">
          <p className="line-clamp-1 text-[11px] font-black leading-4 text-[#b42335]">
            {totalUpdatedEpisodes > 0 ? `รวม ${totalUpdatedEpisodes} ตอนใหม่` : `เวลา ${group.timeLabel}`}
          </p>
        </div>
      </div>
    </button>
  );
}
