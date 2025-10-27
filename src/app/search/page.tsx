"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Pagination } from "antd";

import SearchBar from "@/components/SearchBar";
import NovelCard from "@/components/NovelCard";

// Mock data
const mockNovels = [
  {
    bookID: "1",
    img: "/assets/book.jpg",
    name: "นิยายแฟนตาซี",
    user_id: "นักเขียน A",
    view: 1200,
    type: "แฟนตาซี",
  },
  {
    bookID: "2",
    img: "/assets/book.jpg",
    name: "นิยายรักโรแมนติก",
    user_id: "นักเขียน B",
    view: 5400,
    type: "โรแมนติก",
  },
  {
    bookID: "3",
    img: "/assets/book.jpg",
    name: "นิยายสืบสวนสอบสวน",
    user_id: "นักเขียน C",
    view: 890,
    type: "สืบสวน",
  },
  {
    bookID: "4",
    img: "/assets/book.jpg",
    name: "นิยายไซไฟ",
    user_id: "นักเขียน D",
    view: 2300,
    type: "ไซไฟ",
  },
  {
    bookID: "5",
    img: "/assets/book.jpg",
    name: "นิยายดราม่า",
    user_id: "นักเขียน E",
    view: 780,
    type: "ดราม่า",
  },
  {
    bookID: "6",
    img: "/assets/book.jpg",
    name: "นิยายประวัติศาสตร์",
    user_id: "นักเขียน F",
    view: 1500,
    type: "ประวัติศาสตร์",
  },
  {
    bookID: "7",
    img: "/assets/book.jpg",
    name: "นิยายแฟนตาซี2",
    user_id: "นักเขียน G",
    view: 2200,
    type: "แฟนตาซี",
  },
  {
    bookID: "8",
    img: "/assets/book.jpg",
    name: "นิยายรักโรแมนติก2",
    user_id: "นักเขียน H",
    view: 4300,
    type: "โรแมนติก",
  },
  {
    bookID: "9",
    img: "/assets/book.jpg",
    name: "นิยายสืบสวนสอบสวน2",
    user_id: "นักเขียน I",
    view: 1900,
    type: "สืบสวน",
  },
  {
    bookID: "10",
    img: "/assets/book.jpg",
    name: "นิยายไซไฟ2",
    user_id: "นักเขียน J",
    view: 3300,
    type: "ไซไฟ",
  },
  {
    bookID: "11",
    img: "/assets/book.jpg",
    name: "นิยายดราม่า2",
    user_id: "นักเขียน K",
    view: 1280,
    type: "ดราม่า",
  },
  {
    bookID: "12",
    img: "/assets/book.jpg",
    name: "นิยายประวัติศาสตร์2",
    user_id: "นักเขียน L",
    view: 2500,
    type: "ประวัติศาสตร์",
  },
  {
    bookID: "13",
    img: "/assets/book.jpg",
    name: "นิยายแฟนตาซี3",
    user_id: "นักเขียน M",
    view: 3200,
    type: "แฟนตาซี",
  },
  {
    bookID: "14",
    img: "/assets/book.jpg",
    name: "นิยายรักโรแมนติก3",
    user_id: "นักเขียน N",
    view: 1500,
    type: "โรแมนติก",
  },
  {
    bookID: "15",
    img: "/assets/book.jpg",
    name: "นิยายสืบสวนสอบสวน3",
    user_id: "นักเขียน O",
    view: 970,
    type: "สืบสวน",
  },
  {
    bookID: "16",
    img: "/assets/book.jpg",
    name: "นิยายไซไฟ3",
    user_id: "นักเขียน P",
    view: 3800,
    type: "ไซไฟ",
  },
  {
    bookID: "17",
    img: "/assets/book.jpg",
    name: "นิยายดราม่า3",
    user_id: "นักเขียน Q",
    view: 890,
    type: "ดราม่า",
  },
  {
    bookID: "18",
    img: "/assets/book.jpg",
    name: "นิยายประวัติศาสตร์3",
    user_id: "นักเขียน R",
    view: 1600,
    type: "ประวัติศาสตร์",
  },
  {
    bookID: "19",
    img: "/assets/book.jpg",
    name: "นิยายแฟนตาซี4",
    user_id: "นักเขียน S",
    view: 4200,
    type: "แฟนตาซี",
  },
  {
    bookID: "20",
    img: "/assets/book.jpg",
    name: "นิยายรักโรแมนติก4",
    user_id: "นักเขียน T",
    view: 5100,
    type: "โรแมนติก",
  },
  {
    bookID: "21",
    img: "/assets/book.jpg",
    name: "นิยายสืบสวนสอบสวน4",
    user_id: "นักเขียน U",
    view: 990,
    type: "สืบสวน",
  },
  {
    bookID: "22",
    img: "/assets/book.jpg",
    name: "นิยายไซไฟ4",
    user_id: "นักเขียน V",
    view: 3900,
    type: "ไซไฟ",
  },
  {
    bookID: "23",
    img: "/assets/book.jpg",
    name: "นิยายดราม่า4",
    user_id: "นักเขียน W",
    view: 1200,
    type: "ดราม่า",
  },
  {
    bookID: "24",
    img: "/assets/book.jpg",
    name: "นิยายประวัติศาสตร์4",
    user_id: "นักเขียน X",
    view: 2600,
    type: "ประวัติศาสตร์",
  },
];

export default function SearchPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const cols = 4;
  const rows = 5;
  const pageSize = cols * rows; // 4*11=44 ต่อหน้า

  const total = mockNovels.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = mockNovels.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="bg-white min-h-screen">
      {/* Banner */}
      <section className="py-5 flex justify-center">
        <Image
          src="/assets/banner.png"
          alt="banner"
          width={1200}
          height={200}
          className="rounded-md object-contain"
        />
      </section>

      {/* Content Layout */}
      <div className="max-w-[1200px] mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-4 ">
            <SearchBar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-700">
                ผลการค้นหาทั้งหมด{" "}
                <span className="font-semibold">({total} รายการ)</span>
              </p>
              <select className="border rounded-md text-sm px-2 py-1">
                <option>ล่าสุด</option>
                <option>ยอดนิยม</option>
                <option>อัพเดตล่าสุด</option>
              </select>
            </div>

            {/* Grid แสดง Novel */}
            <div className="grid grid-cols-4 gap-4">
              {currentItems.map((novel) => (
                <NovelCard key={novel.bookID} novel={novel} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-10">
              <Pagination
                current={currentPage}
                total={total}
                pageSize={pageSize}
                showSizeChanger={false}
                onChange={handlePageChange}
                className="ant-pagination-hover-red"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-10 py-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm px-5">
          <div>
            <p className="font-semibold mb-3">บริการของเรา</p>
            <ul className="space-y-1 text-gray-600">
              <li>นโยบายความเป็นส่วนตัว</li>
              <li>เงื่อนไขการใช้งาน</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3">นักเขียน/สำนักพิมพ์</p>
            <ul className="space-y-1 text-gray-600">
              <li>คู่มือนักเขียน</li>
              <li>สมัครนักเขียน</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3">ติดต่อเรา</p>
            <ul className="space-y-1 text-gray-600">
              <li>support@fictionbook.com</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3">ดาวน์โหลดแอป</p>
            <div className="flex gap-2">
              <Image
                src="/googleplay.png"
                alt="Google Play"
                width={100}
                height={30}
              />
              <Image
                src="/appstore.png"
                alt="App Store"
                width={100}
                height={30}
              />
            </div>
          </div>
        </div>
        <div className="text-center text-gray-400 text-xs mt-10">
          © Copyright © FICTIONBOOK CO., LTD
        </div>
      </footer>
    </div>
  );
}
