"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { BookUpdateTimeGroup } from "../bookUpdatesUtils";
import { TimelineBookCard } from "./TimelineBookCard";
import { TimelineStackPreview } from "./TimelineStackPreview";

export function TimelineTimeGroup({ group }: { group: BookUpdateTimeGroup }) {
  const [expanded, setExpanded] = React.useState(false);
  const canStack = group.books.length > 1;
  const isCollapsed = canStack && !expanded;

  const toggleExpanded = () => {
    if (!canStack) return;
    setExpanded((current) => !current);
  };

  return (
    <section className="shrink-0" aria-label={`อัปเดตเวลา ${group.timeLabel}`}>
      <div className="relative mb-8 flex h-10 min-w-full items-center justify-center">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-rose-200" />
        <button
          type="button"
          onClick={toggleExpanded}
          disabled={!canStack}
          aria-expanded={canStack ? expanded : undefined}
          className="relative z-10 inline-flex cursor-pointer items-center rounded-full border border-rose-100 bg-white p-0.5 shadow-[0_10px_24px_rgba(239,48,75,0.08)] transition-transform hover:-translate-y-0.5 disabled:cursor-default disabled:hover:translate-y-0"
        >
          <span className="rounded-full bg-[#ef304b] px-4 py-1.5 text-sm font-black text-white shadow-[0_8px_18px_rgba(239,48,75,0.22)]">
            {group.timeLabel}
          </span>
          {group.books.length > 1 ? (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black text-[#b42335]">
              {group.books.length} เรื่อง
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          ) : null}
        </button>
      </div>

      <div className="flex gap-4 sm:gap-5">
        {isCollapsed ? (
          <TimelineStackPreview group={group} onExpand={toggleExpanded} />
        ) : (
          group.books.map((book) => (
            <TimelineBookCard
              key={`${book.book_id}-${book.latest_episode?.ep_id ?? book.last_publish_at ?? book.name}`}
              book={book}
            />
          ))
        )}
      </div>
    </section>
  );
}
