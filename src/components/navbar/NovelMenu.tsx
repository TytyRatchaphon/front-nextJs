"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Genre {
  name: string;
  id: string;
  url?: string;
}

interface Category {
  id: string;
  label: string;
  genres: Genre[];
}

export const genresCommon: Genre[] = [
  { name: "แฟนตาซี", id: '8' },
  { name: "ย้อนเวลา", id: '7' },
  { name: "กีฬา", id: '5' },
  { name: "Boylove โรแมนซ์", id: '20' },
  { name: "ระบบ", id: '18' },
  { name: "รักโรแมนซ์", id: '19' },
  { name: "Girl love โรแมนซ์", id: '21' },
  { name: "เรื่องสั้น", id: '22' },
  { name: "ย้อนยุค / วินเทจ / โบราณ", id: '16' },
  { name: "ผจญภัย", id: '6' },
  { name: "Boyslove(BL)", id: '14' },
  { name: "สืบสวนสอบสวน", id: '4' },
  { name: "รักวัยรุ่น", id: '3' },
  { name: "เกมออนไลน์", id: '17' },
  { name: "กำลังภายใน", id: '13' },
  { name: "GirlsLove(GL)", id: '15' },
];

export const translatedSpecifics: Genre[] = [
  { name: "นิยายแปลจีน", id: '23'},
  { name: "นิยายแปลเกาหลี", id: '24' },
  { name: "นิยายแปลญี่ปุ่น", id: '25' },
  { name: "นิยายแปลอังกฤษ", id: '26' },
  { name: "นิยายแปลอื่นๆ", id: '27' },
  { name: "โรแมนติก", id: '2' },
];

export const categories: Category[] = [
  {
    id: "tran",
    label: "นิยายแปล",
    genres: [...translatedSpecifics, ...genresCommon],
  },
  {
    id: "write",
    label: "นิยายแต่ง",
    genres: [...genresCommon],
  },
  {
    id: "fanfic",
    label: "แฟนฟิค",
    genres: [...genresCommon],
  },
];

export default function NovelMenu() {
  const [activeTab, setActiveTab] = useState<string>("tran");

  const currentCategory = categories.find((c) => c.id === activeTab);

  return (
    <div className="absolute top-full left-0 mt-2 w-[900px] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden flex z-50 animate-in fade-in zoom-in-95 duration-200">
      {/* Left Sidebar */}
      <div className="w-[220px] bg-gray-50/50 py-4 flex flex-col gap-1 border-r border-gray-100">
        {categories.map((category) => (
          <button
            key={category.id}
            onMouseEnter={() => setActiveTab(category.id)}
            onClick={() => setActiveTab(category.id)}
            className={`w-full px-6 py-3 text-left text-[15px] font-medium transition-all duration-200 flex items-center justify-between group ${
              activeTab === category.id
                ? "text-red-600 bg-white shadow-sm border-l-4 border-red-600"
                : "text-gray-600 hover:text-red-600 hover:bg-gray-50"
            }`}
          >
            {category.label}
            {activeTab === category.id && (
              <ChevronRight className="w-4 h-4 text-red-600" />
            )}
          </button>
        ))}
      </div>

      {/* Right Content */}
      <div className="flex-1 p-6 bg-white">
        <div className="grid grid-cols-4 gap-x-4 gap-y-3">
          {currentCategory?.genres.map((genre, index) => (
            <Link
              key={index}
              href={`/cat/list?type=${activeTab}&categoryId=${genre.id}&tab=new&limit=10&page=1`}
              className="text-[14px] text-gray-600 hover:text-red-600 transition-colors duration-200 py-1 px-1 hover:bg-red-50 rounded text-left truncate block"
            >
              {genre.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
