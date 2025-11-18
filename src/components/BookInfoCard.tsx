"use client";

type Book = {
  cover: string;
  title: string;
  author: string;
  price?: number;
  // API-provided fields for remaining paid info
  remaining_paid_total?: number;
  remaining_paid_count?: number;
  chapters?: number;
  views?: number;
  reviews?: number;
  tag?: string;
};

import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

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
  const { token } = useAuthStore();
  const [userCoinCount, setUserCoinCount] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      setUserCoinCount(null);
      return;
    }

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);
      const coins = decoded.coin ?? decoded.coins ?? decoded.goldCoins ?? decoded.gold_coin ?? 0;
      setUserCoinCount(Number(coins) || 0);
    } catch (e) {
      console.warn("Failed to decode token for coin count", e);
      setUserCoinCount(null);
    }
  }, [token]);

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
              <span className="font-semibold text-gray-900">{(userCoinCount != null ? userCoinCount : (book.remaining_paid_total ?? book.price ?? 0)).toLocaleString()}</span>
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
            <span className="text-red-600 font-semibold">{book.remaining_paid_count ?? 0} ตอน</span>
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
                  {(book.remaining_paid_total ?? book.price ?? 0).toLocaleString()}
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
                  src="/images/rose.png"
                  alt="rose"
                  width={18}
                  height={18}
                />
                <span className="font-semibold text-gray-900">580</span>
                <Image
                  src="/images/heart.png"
                  alt="heart"
                  width={18}
                  height={18}
                />
                <span className="font-semibold text-gray-900">320</span>
              </Pill>
            </div>
          </div>

          {/* Gift rows - place items side-by-side */}
          <div className="flex items-stretch gap-3">
            {/* Item 1: heart (flex item) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 h-10 px-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Image src="/images/heart.png" alt="heart" width={20} height={20} />
                </div>
                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                  <input
                    type="number"
                    min={0}
                    value={heartQty}
                    disabled
                    className="w-12 h-8 rounded-full border border-gray-200 bg-gray-100 text-gray-500 text-center text-sm px-2"
                    readOnly
                  />
                  <button
                    disabled
                    aria-disabled
                    className="h-8 px-3 rounded-full bg-gray-200 text-gray-500 text-sm grid place-items-center"
                  >
                    ส่ง
                  </button>
                </div>
              </div>
            </div>

            {/* Item 2: rose (flex item) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 h-10 px-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Image src="/images/rose.png" alt="rose" width={20} height={20} />
                </div>
                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                  <input
                    type="number"
                    min={1}
                    value={roseQty}
                    onChange={(e) => setRoseQty(parseInt(e.target.value || "0"))}
                    className="w-12 h-8 rounded-full border border-gray-200 bg-white text-gray-900 text-center text-sm px-2"
                  />
                  <button className="h-8 px-3 rounded-full bg-red-600 text-white text-sm font-semibold shadow hover:bg-red-700 transition-colors">
                    ส่ง
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default BookInfoCard;