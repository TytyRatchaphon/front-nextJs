"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { AlignJustify, Eye, Heart } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Pagination } from "swiper/modules";

interface SpotlightFeatureSectionProps {
  selectedSpotlight: any;
  spotlightBooks: any[];
  onSelectSpotlight: (bookId: number | string) => void;
  isPending: boolean;
  editorNoteTitle: string;
  editorNoteItems: any[];
  editorNoteLabeltag?: string | null;
}

const coverSrc = (img?: string) => {
  if (!img) return "/images/ejb.png";
  return img.startsWith("http") ? img : `https://img.enjoybook.co/img/book/${img}`;
};

const formatCount = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num || 0);
};

const resolveEditorNoteEpisodeHref = (book: any) =>
  book?.btn_novel
    ? `/book/${book.btn_novel}`
    : book?.parent_book_id
      ? `/book/${book.parent_book_id}`
      : book?.book_id
        ? `/book/${book.book_id}`
        : "/search";

const resolveEditorNotePackHref = (book: any) =>
  book?.btn_novel_pack ? `/book/${book.btn_novel_pack}` : book?.book_id ? `/book/${book.book_id}` : "/search";

export default function SpotlightFeatureSection({
  selectedSpotlight,
  spotlightBooks,
  onSelectSpotlight,
  isPending,
  editorNoteTitle,
  editorNoteItems,
  editorNoteLabeltag,
}: SpotlightFeatureSectionProps) {
  const spotlightPrevRef = React.useRef<HTMLButtonElement>(null);
  const spotlightNextRef = React.useRef<HTMLButtonElement>(null);
  const editorNoteBook = editorNoteItems[0] || selectedSpotlight;

  const renderSpotlightThumb = (book: any, i: number) => {
    const isActive = String(book.book_id) === String(selectedSpotlight?.book_id);

    return (
      <button
        key={book.book_id || i}
        type="button"
        onClick={() => onSelectSpotlight(book.book_id)}
        className={`spotlight-thumb group block text-left ${isActive ? "opacity-100" : "opacity-80"}`}
        aria-label={`เลือกนิยาย ${book.name}`}
        aria-pressed={isActive}
      >
        <div
          className={`relative aspect-[3/4] w-[58px] overflow-hidden rounded-2xl border bg-stone-50 shadow-[0_14px_30px_-28px_rgba(15,23,42,0.5)] transition duration-200 sm:w-[72px] md:w-[84px] ${
            isActive
              ? "border-red-300 shadow-[0_18px_36px_-28px_rgba(220,38,38,0.28)]"
              : "border-stone-200 group-hover:-translate-y-0.5 group-hover:border-red-200 group-hover:shadow-[0_18px_36px_-28px_rgba(220,38,38,0.28)]"
          }`}
        >
          <Image
            src={coverSrc(book.img || book.img_full)}
            alt={book.name}
            fill
            className={`object-cover transition duration-300 ${
              isActive
                ? "grayscale-0 scale-100"
                : "scale-100 opacity-70 saturate-[.72] brightness-110 contrast-90 group-hover:opacity-100 group-hover:saturate-100 group-hover:brightness-100 group-hover:contrast-100 group-hover:scale-105"
            }`}
            unoptimized
          />
        </div>
      </button>
    );
  };

  const renderEditorNoteCard = (book: any) => {
    const item = book || editorNoteBook;
    const description =
      item?.title ||
      item?.des ||
      "แนะนำเรื่องเด่นจากทีมงาน เพื่อให้ตัดสินใจได้เร็วขึ้น";
    const writer = (item as any)?.writer_name || (item as any)?.["writer.writer_name"] || "Enjoybook";

    return (
      <div className="flex min-h-[520px] w-full flex-col rounded-[24px] border border-stone-200 bg-white p-4 text-stone-900 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.22)] md:min-h-[548px] md:p-5">
        <Link
          href={resolveEditorNoteEpisodeHref(item)}
          className="group relative mb-4 block overflow-hidden rounded-[18px] bg-stone-100"
        >
          <div className="relative h-[176px] w-full sm:h-[210px]">
            <Image
              src={coverSrc(item?.img || item?.img_full)}
              alt={item?.name || "Editor note"}
              fill
              className="object-cover object-center transition duration-300 group-hover:scale-[1.03]"
              unoptimized
            />
          </div>
        </Link>

        <h4 className="line-clamp-2 text-[clamp(1rem,1.2vw,1.3rem)] font-bold leading-tight text-stone-900">
          {item?.name || selectedSpotlight?.name}
        </h4>
        <p className="mt-2 line-clamp-1 text-xs font-semibold text-orange-600">
          {editorNoteLabeltag ? `${editorNoteLabeltag} • ` : ""}
          {writer}
        </p>
        <p className="mt-2 min-h-[4.5rem] line-clamp-3 text-sm leading-6 text-stone-600">{description}</p>

        <div className="mt-auto grid grid-cols-2 gap-2.5 pt-4">
          <Link
            href={resolveEditorNoteEpisodeHref(item)}
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            อ่านรายตอน
          </Link>
          <Link
            href={resolveEditorNotePackHref(item)}
            className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
          >
            อ่านมัดแพ็ค
          </Link>
        </div>
      </div>
    );
  };

  if (!selectedSpotlight) {
    return (
      <section className="mb-10 space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-gray-100 p-3">
              <div className="aspect-[3/4] rounded-xl bg-gray-200" />
              <div className="mt-3 h-4 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-2/3 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10 space-y-6">
      <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_24px_70px_-40px_rgba(15,23,42,0.22)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_408px]">
          <div className="min-w-0 p-5 md:p-7 lg:p-8">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div className="hidden">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-600/80">
                  Spotlight
                </p>
                <h3 className="mt-2 text-[clamp(1.7rem,2.6vw,2.35rem)] font-bold leading-tight text-stone-950">
                  นิยายแนะนำประจำวัน
                </h3>
              </div>
              <div>
                <h3 className="text-[clamp(1.05rem,1.2vw,1.25rem)] font-bold leading-[1.25] text-stone-950">
                  เรื่องเด่น
                </h3>
              </div>
            </div>

            <div className="spotlight-stage-shell min-h-[15.5rem] md:min-h-[16.5rem]">
              <div
                key={selectedSpotlight.book_id}
                className={`spotlight-stage-enter grid gap-5 md:grid-cols-[168px_minmax(0,1fr)] md:items-start ${
                  isPending ? "opacity-90" : ""
                }`}
              >
                <Link
                  href={`/book/${selectedSpotlight.book_id}`}
                  className="spotlight-poster-enter relative mx-auto w-full max-w-[180px] overflow-hidden rounded-[22px] border border-stone-200 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] md:mx-0"
                >
                  <div className="relative aspect-[5/7] w-full">
                    <Image
                      src={coverSrc(selectedSpotlight.img || selectedSpotlight.img_full)}
                      alt={selectedSpotlight.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </Link>

                <div className="spotlight-copy-enter flex min-w-0 flex-col">
                  <p className="min-h-[1.5rem] text-sm font-medium text-stone-500">
                    {selectedSpotlight["writer.writer_name"] ||
                      (selectedSpotlight as any).writer_name ||
                      "Enjoybook"}
                  </p>
                  <Link
                    href={`/book/${selectedSpotlight.book_id}`}
                    className="mt-1 block overflow-hidden text-[clamp(1.35rem,2vw,2rem)] font-bold text-stone-950 transition-colors hover:text-red-600"
                  >
                    <span className="spotlight-thai-clamp-title block">
                      {selectedSpotlight.name}
                    </span>
                  </Link>
                  <p className="spotlight-thai-clamp-body mt-2 text-sm text-stone-600">
                    {selectedSpotlight.title ||
                      selectedSpotlight.des ||
                      "คัดเรื่องเด่นที่น่าอ่านในตอนนี้ เพื่อให้คุณตัดสินใจได้รวดเร็วและไม่พลาดเรื่องที่กำลังมาแรง"}
                  </p>

                  <div className="mt-4 flex min-h-[1.5rem] flex-wrap items-center gap-4 text-sm text-stone-500">
                    <div className="inline-flex items-center gap-1.5">
                      <Heart size={14} />
                      {formatCount(selectedSpotlight.shelve_count || 0)}
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      <Eye size={14} />
                      {formatCount(selectedSpotlight.view || 0)}
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      <AlignJustify size={14} />
                      {(selectedSpotlight.chapter || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {spotlightBooks.length > 0 && (
              <div className="mt-4">
                <div className="mb-3 text-sm font-semibold text-stone-500">
                  ยังมีให้อ่านอีกเพียบ...
                </div>
                {spotlightBooks.length > 6 ? (
                  <div className="group/spotlight-swiper relative">
                    <button
                      ref={spotlightPrevRef}
                      className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-stone-200 bg-white/95 p-2 text-stone-600 shadow-lg transition hover:border-red-200 hover:text-red-600 disabled:opacity-0 lg:block"
                      aria-label="เลื่อนนิยายก่อนหน้า"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      ref={spotlightNextRef}
                      className="absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-stone-200 bg-white/95 p-2 text-stone-600 shadow-lg transition hover:border-red-200 hover:text-red-600 disabled:opacity-0 lg:block"
                      aria-label="เลื่อนนิยายถัดไป"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>

                    <Swiper
                      modules={[Navigation, FreeMode]}
                      speed={450}
                      freeMode
                      slidesPerView="auto"
                      spaceBetween={12}
                      className="!px-0 !py-1"
                      navigation={{
                        prevEl: spotlightPrevRef.current,
                        nextEl: spotlightNextRef.current,
                      }}
                      onBeforeInit={(swiper) => {
                        // @ts-expect-error -- Swiper navigation refs are assigned imperatively.
                        swiper.params.navigation.prevEl = spotlightPrevRef.current;
                        // @ts-expect-error -- Swiper navigation refs are assigned imperatively.
                        swiper.params.navigation.nextEl = spotlightNextRef.current;
                      }}
                    >
                      {spotlightBooks.map((book: any, i: number) => (
                        <SwiperSlide key={book.book_id || i} className="!w-auto">
                          {renderSpotlightThumb(book, i)}
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {spotlightBooks.map((book: any, i: number) => renderSpotlightThumb(book, i))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-stone-200 bg-white p-4 md:p-5 lg:border-l lg:border-t-0 lg:px-4 xl:px-5">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-[clamp(1.05rem,1.2vw,1.25rem)] font-bold leading-[1.25] text-stone-950">
                  {editorNoteTitle}
                </h3>
              </div>

              <div className="mx-auto w-full max-w-[380px] lg:w-[380px]">
                {editorNoteItems.length > 1 ? (
                  <Swiper
                    modules={[Pagination]}
                    speed={460}
                    slidesPerView={1}
                    spaceBetween={12}
                    pagination={{ clickable: true }}
                    className="editor-note-swiper !overflow-hidden [&_.swiper-wrapper]:items-start [&_.swiper-pagination]:!relative [&_.swiper-pagination]:!bottom-0 [&_.swiper-pagination]:mt-3"
                  >
                    {editorNoteItems.map((item: any, idx: number) => (
                      <SwiperSlide
                        key={item?.book_id || item?.btn_novel_pack || idx}
                        className="!h-auto !w-full sm:!w-[380px] !opacity-100"
                      >
                        {renderEditorNoteCard(item)}
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  renderEditorNoteCard(editorNoteBook)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
