"use client";

import { useQuery } from "@tanstack/react-query";
import { Popover } from "antd";
import { LoaderCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { searchGifs } from "./gifPickerApi";
import type { GifPickerItem } from "./gifPickerModel";

type LiveChatGifPickerProps = {
  disabled: boolean;
  isSending: boolean;
  onSelect: (item: GifPickerItem) => Promise<void>;
};

export default function LiveChatGifPicker({ disabled, isSending, onSelect }: LiveChatGifPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const canSearch = debouncedQuery.length === 0 || debouncedQuery.length >= 2;
  const gifsQuery = useQuery({
    queryKey: ["live-chat", "gifs", debouncedQuery],
    queryFn: ({ signal }) => searchGifs(debouncedQuery, signal),
    enabled: isOpen && canSearch,
    staleTime: 5 * 60 * 1000,
  });

  const content = (
    <div className="w-[min(320px,calc(100vw-32px))] p-1">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหา GIF บน Tenor..."
          autoFocus
          className="h-10 w-full rounded-md border border-stone-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/10"
        />
      </label>

      <div className="mt-2 max-h-80 overflow-y-auto pr-1">
        {!canSearch ? (
          <p className="py-12 text-center text-sm text-stone-400">พิมพ์อย่างน้อย 2 ตัวอักษร</p>
        ) : gifsQuery.isLoading ? (
          <div className="grid min-h-52 place-items-center">
            <LoaderCircle className="size-6 animate-spin text-[#dc2626]" />
          </div>
        ) : gifsQuery.isError ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-red-600">
              {gifsQuery.error instanceof Error ? gifsQuery.error.message : "ค้นหา GIF ไม่สำเร็จ"}
            </p>
            <button
              type="button"
              onClick={() => void gifsQuery.refetch()}
              className="mt-3 text-sm font-bold text-[#dc2626] hover:underline"
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : gifsQuery.data?.length ? (
          <div className="columns-2 gap-2">
            {gifsQuery.data.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  void onSelect(item);
                }}
                className="mb-2 block w-full break-inside-avoid overflow-hidden rounded-md bg-stone-100 focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:ring-offset-2"
                aria-label={`ส่ง GIF: ${item.title}`}
                title={item.title}
              >
                <img
                  src={item.previewUrl}
                  alt={item.title}
                  width={item.width}
                  height={item.height}
                  loading="lazy"
                  className="h-auto min-h-20 w-full object-cover transition hover:brightness-90"
                />
              </button>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-stone-400">ไม่พบ GIF</p>
        )}
      </div>

      <p className="mt-1 text-right text-[10px] font-semibold text-stone-400">Powered by Tenor</p>
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
