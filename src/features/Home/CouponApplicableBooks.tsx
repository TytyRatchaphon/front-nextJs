"use client";

import Link from "next/link";
import { BookOpenCheck, ExternalLink } from "lucide-react";
import type { CouponUI } from "@/utils/couponUtils";

type ApplicableBook = NonNullable<CouponUI["applicable_books"]>[number];

type CouponApplicableBooksProps = {
  books?: ApplicableBook[] | null;
};

const getBookCover = (book: ApplicableBook) => book.img || book.img_full || "/images/ejb.png";

export default function CouponApplicableBooks({ books }: CouponApplicableBooksProps) {
  const validBooks = Array.isArray(books) ? books.filter((book) => book?.book_id) : [];

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <BookOpenCheck size={16} className="text-red-500" />
          หนังสือที่เข้าร่วมรายการ
        </h4>
        {validBooks.length > 0 && (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
            {validBooks.length.toLocaleString()} เรื่อง
          </span>
        )}
      </div>

      {validBooks.length > 0 ? (
        <div className="grid max-h-[280px] grid-cols-1 gap-3 overflow-y-auto px-1 py-1 sm:grid-cols-2">
          {validBooks.map((book) => (
            <Link
              key={book.book_id}
              href={`/book/${book.book_id}`}
              className="group flex gap-3 rounded-2xl border border-red-100/70 bg-gradient-to-br from-white to-red-50/40 p-2.5 transition hover:border-red-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <div className="h-[84px] w-[58px] flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                <img
                  src={getBookCover(book)}
                  alt={book.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1 py-1">
                <div className="line-clamp-2 text-sm font-bold leading-5 text-gray-900">
                  {book.name}
                </div>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-red-600 shadow-sm">
                  ดูหนังสือ
                  <ExternalLink size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm text-gray-500">
          คูปองนี้ยังไม่ได้ระบุหนังสือที่เข้าร่วมรายการ
        </div>
      )}
    </div>
  );
}
