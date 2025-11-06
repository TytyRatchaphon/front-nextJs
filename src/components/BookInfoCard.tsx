"use client";

type Book = {
  cover: string;
  title: string;
  author: string;
  price: number;
  chapters?: number;
  views?: number;
  reviews?: number;
  tag?: string;
};

import Image from "next/image";
import { useState } from "react";

interface BookInfoCardProps {
  book: Book;
}

const Pill = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`h-10 px-3 rounded-full border border-gray-200 bg-white shadow-sm flex items-center gap-2 ${className}`}
  >
    {children}
  </div>
);

const BookInfoCard = ({ book }: BookInfoCardProps) => {
  const [heartQty, setHeartQty] = useState<number>(0);
  const [roseQty, setRoseQty] = useState<number>(10);

  return (
    <aside className="w-full">
      {/* Outer card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-4">
        {/* Title row and coins pill */}
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-gray-900">ซื้อหลายตอน</h3>
          <div className="relative">
            <Pill className="pr-10">
              <span className="w-5 h-5 rounded-full bg-yellow-400/90 ring-2 ring-yellow-200 text-white grid place-items-center text-[12px] font-extrabold">
                ฿
              </span>
              <span className="font-semibold text-gray-900">150</span>
            </Pill>
            <button
              aria-label="เพิ่มเหรียญ"
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-500 text-white grid place-items-center shadow"
            >
              <span className="text-xl leading-none">+</span>
            </button>
          </div>
        </div>

        <div className="px-5 pb-5">
          {/* Ownership Status */}
          <p className="text-[14px] text-gray-800 mb-3">
            คุณยังไม่ได้เป็นเจ้าของอีก{" "}
            <span className="text-red-600 font-semibold">24 ตอน</span>
          </p>

          {/* Price box */}
          <div className="rounded-2xl bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-200 shadow-inner px-5 py-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-gray-800">
                  เหมาทั้งเรื่อง
                </span>
                <span className="w-5 h-5 rounded-full bg-yellow-400/90 ring-2 ring-yellow-200 text-white grid place-items-center text-[12px] font-extrabold">
                  ฿
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl leading-none font-extrabold text-red-600">
                  {book.price.toLocaleString()}
                </span>
                <span className="text-gray-400 line-through text-lg">
                  3,299
                </span>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-500 text-xs mb-3">หรือ</div>
          <button className="w-full h-12 rounded-2xl border-2 border-red-600 text-red-600 text-lg font-bold hover:bg-red-50 transition-colors">
            เลือกเอง
          </button>

          {/* Divider */}
          <div className="my-5 border-t border-gray-200" />

          {/* Gift header with stats pills */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-extrabold text-gray-900">ส่งของขวัญ</h3>
            <div className="flex items-center gap-2">
              <Pill>
                <Image
                  src="/assets/icons/rose.png"
                  alt="rose"
                  width={18}
                  height={18}
                />
                <span className="font-semibold text-gray-900">580</span>
              </Pill>
              <Pill>
                <Image
                  src="/assets/icons/heart.png"
                  alt="heart"
                  width={18}
                  height={18}
                />
                <span className="font-semibold text-gray-900">320</span>
              </Pill>
            </div>
          </div>

          {/* Gift rows */}
          <div className="space-y-4">
            {/* Row 1: heart, disabled send */}
            <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 h-12 px-3 flex-nowrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-9 rounded-full bg-rose-50 border border-rose-200 grid place-items-center">
                  <Image
                    src="/assets/icons/heart.png"
                    alt="heart"
                    width={22}
                    height={22}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                <input
                  type="number"
                  min={0}
                  value={heartQty}
                  disabled
                  className="w-14 h-9 rounded-full border border-gray-200 bg-gray-100 text-gray-500 text-center text-sm px-2 shrink-0"
                  readOnly
                />
                <div className="h-9 px-4 rounded-full bg-gray-200 text-gray-500 grid place-items-center text-base shrink-0">
                  ส่ง
                </div>
              </div>
            </div>

            {/* Row 2: rose, active send */}
            <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 h-12 px-3 flex-nowrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-9 rounded-full bg-emerald-50 border border-emerald-200 grid place-items-center">
                  <Image
                    src="/assets/icons/rose.png"
                    alt="rose"
                    width={22}
                    height={22}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                <input
                  type="number"
                  min={1}
                  value={roseQty}
                  onChange={(e) => setRoseQty(parseInt(e.target.value || "0"))}
                  className="w-14 h-9 rounded-full border border-gray-200 bg-white text-gray-900 text-center text-sm px-2 shrink-0"
                />
                <button className="h-9 px-4 rounded-full bg-red-600 text-white text-base font-semibold shadow hover:bg-red-700 transition-colors shrink-0">
                  ส่ง
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default BookInfoCard;
