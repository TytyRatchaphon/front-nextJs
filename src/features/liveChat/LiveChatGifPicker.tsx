"use client";

import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import { Popover } from "antd";
import { LoaderCircle, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toGifPickerItem } from "./gifPickerModel";
import type { GifPickerItem } from "./gifPickerModel";

type LiveChatGifPickerProps = {
  disabled: boolean;
  isSending: boolean;
  onSelect: (item: GifPickerItem) => Promise<void>;
};

const GIPHY_GRID_WIDTH = 296;
const GIPHY_PAGE_SIZE = 12;

export default function LiveChatGifPicker({ disabled, isSending, onSelect }: LiveChatGifPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY?.trim() ?? "";
  const giphy = useMemo(() => apiKey ? new GiphyFetch(apiKey) : null, [apiKey]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => setFetchError(null), [debouncedQuery, isOpen]);

  const canSearch = debouncedQuery.length === 0 || debouncedQuery.length >= 2;
  const fetchGifs = useCallback((offset: number) => {
    if (!giphy) return Promise.reject(new Error("ยังไม่ได้ตั้งค่า NEXT_PUBLIC_GIPHY_API_KEY"));
    const options = { offset, limit: GIPHY_PAGE_SIZE, rating: "pg-13" as const };
    return debouncedQuery
      ? giphy.search(debouncedQuery, { ...options, lang: "th" })
      : giphy.trending(options);
  }, [debouncedQuery, giphy]);

  const content = (
    <div className="w-[min(320px,calc(100vw-32px))] p-1">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหา GIF บน GIPHY..."
          autoFocus
          className="h-10 w-full rounded-md border border-stone-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/10"
        />
      </label>

      <div className="mt-2 max-h-80 overflow-y-auto overflow-x-hidden pr-1">
        {!apiKey ? (
          <p className="px-4 py-12 text-center text-sm text-red-600">
            ยังไม่ได้ตั้งค่า NEXT_PUBLIC_GIPHY_API_KEY
          </p>
        ) : !canSearch ? (
          <p className="py-12 text-center text-sm text-stone-400">พิมพ์อย่างน้อย 2 ตัวอักษร</p>
        ) : fetchError ? (
          <p className="px-4 py-12 text-center text-sm text-red-600">{fetchError}</p>
        ) : (
          <Grid
            key={debouncedQuery || "trending"}
            width={GIPHY_GRID_WIDTH}
            columns={2}
            gutter={6}
            fetchGifs={fetchGifs}
            noLink
            borderRadius={6}
            onGifsFetchError={() => setFetchError("ค้นหา GIF ไม่สำเร็จ กรุณาลองใหม่")}
            onGifClick={(gif, event) => {
              event.preventDefault();
              const item = toGifPickerItem(gif);
              if (!item) {
                setFetchError("GIF นี้ไม่สามารถส่งได้");
                return;
              }
              setIsOpen(false);
              void onSelect(item);
            }}
          />
        )}
      </div>

      <p className="mt-1 text-right text-[10px] font-semibold text-stone-400">Powered by GIPHY</p>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="topLeft"
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!disabled) setIsOpen(nextOpen);
      }}
      arrow
      destroyOnHidden
    >
      <button
        type="button"
        disabled={disabled}
        className="grid size-11 shrink-0 place-items-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-[#dc2626] disabled:opacity-40"
        aria-label="เปิดตัวเลือก GIF"
        title="ส่ง GIF"
      >
        {isSending
          ? <LoaderCircle className="size-5 animate-spin" />
          : <span className="text-xs font-bold">GIF</span>}
      </button>
    </Popover>
  );
}
