"use client";

import parse from "html-react-parser";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface HomeCollection {
  id?: number | string;
  collection_id?: number | string;
  name?: string;
  title?: string;
  description?: string | null;
  cover_image?: string | null;
  cover?: string | null;
  img?: string | null;
  book_count?: number;
  books_count?: number;
  total_books?: number;
  user_id?: number | string;
  link?: string;
  user?: {
    user_id?: number | string;
    fullname?: string;
    name?: string;
  };
  owner?: {
    user_id?: number | string;
    fullname?: string;
    name?: string;
  };
}

interface PopularCollectionSectionProps {
  collections: HomeCollection[];
  title?: string;
  icon?: string;
  link?: string;
}

const getCollectionHref = (collection: HomeCollection) => {
  if (collection.link) return collection.link;

  const collectionId = collection.id ?? collection.collection_id;
  const userId = collection.user_id ?? collection.user?.user_id ?? collection.owner?.user_id;

  if (collectionId && userId) return `/profile/${userId}/collection/${collectionId}`;
  return null;
};

function CollectionCover({ collection }: { collection: HomeCollection }) {
  const cover = collection.cover_image || collection.cover || collection.img;
  const name = collection.name || collection.title || "คอลเลกชัน";

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
      {cover ? (
        <Image
          src={cover}
          alt={name}
          fill
          sizes="(max-width: 640px) 78vw, 270px"
          className="object-cover transition-transform duration-500 group-hover/card:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-end justify-center gap-2 bg-[linear-gradient(145deg,#fafaf9_0%,#e7e5e4_100%)] px-8 pb-6">
          {["h-20 bg-red-600", "h-28 bg-stone-800", "h-24 bg-red-400", "h-16 bg-stone-500"].map((style, index) => (
            <span
              key={index}
              className={`w-8 rounded-t-sm border-x border-white/20 shadow-sm ${style}`}
              aria-hidden="true"
            />
          ))}
          <span className="absolute bottom-5 left-6 right-6 h-1.5 rounded-full bg-stone-300" aria-hidden="true" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent" aria-hidden="true" />
      <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-700 backdrop-blur-sm">
        Collection
      </span>
    </div>
  );
}

function CollectionCard({ collection }: { collection: HomeCollection }) {
  const name = collection.name || collection.title || "คอลเลกชันไม่มีชื่อ";
  const ownerName =
    collection.user?.fullname ||
    collection.user?.name ||
    collection.owner?.fullname ||
    collection.owner?.name ||
    "นักอ่าน EnjoyBook";
  const bookCount = collection.book_count ?? collection.books_count ?? collection.total_books ?? 0;
  const href = getCollectionHref(collection);

  const content = (
    <article className="group/card w-[260px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_2px_10px_rgba(28,25,23,0.05)] transition duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_12px_28px_rgba(28,25,23,0.12)] motion-reduce:transform-none motion-reduce:transition-none sm:w-[270px]">
      <CollectionCover collection={collection} />
      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-bold text-stone-950 transition-colors group-hover/card:text-red-600">
          {name}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-stone-500">โดย {ownerName}</p>
        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1.5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {bookCount.toLocaleString("th-TH")} เล่ม
          </span>
          <span className="font-semibold text-red-600 opacity-0 transition-opacity group-hover/card:opacity-100">เปิดดู →</span>
        </div>
      </div>
    </article>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}

export default function PopularCollectionSection({
  collections,
  title = "คอลเลกชันยอดนิยม",
  icon,
  link,
}: PopularCollectionSectionProps) {
  if (!Array.isArray(collections) || collections.length === 0) return null;

  let headingIcon: ReactNode = <span className="h-6 w-1 shrink-0 rounded-full bg-red-600" aria-hidden="true" />;
  if (icon) {
    headingIcon = (
      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-100">
        <Image src={icon} alt="" fill className="object-cover" />
      </span>
    );
  }

  return (
    <section className="mb-8 mt-5 w-full" aria-labelledby="popular-collection-title">
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-stone-200 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          {headingIcon}
          <h2 id="popular-collection-title" className="truncate text-xl font-bold leading-tight text-stone-950 sm:text-2xl [&_*]:m-0">
            {parse(title)}
          </h2>
        </div>

        {link ? (
          <Link href={link} className="group/link inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-red-600 transition-colors hover:text-red-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
            ดูทั้งหมด
            <svg className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : null}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] [scrollbar-color:#d6d3d1_transparent] sm:mx-0 sm:px-0">
        <div className="flex w-max gap-3 sm:gap-4">
          {collections.map((collection, index) => (
            <CollectionCard key={`${collection.id ?? collection.collection_id ?? "collection"}-${index}`} collection={collection} />
          ))}
        </div>
      </div>
    </section>
  );
}
