"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Pagination } from "antd";

import SearchBar from "@/components/SearchBar";
import NovelCard from "@/components/NovelCard";
import Footer from "@/components/Footer";

// Mock data
const mockNovels = [
  {
    bookID: "1",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายแฟนตาซี",
    user_id: "นักเขียน A",
    view: 1200,
    type: "แฟนตาซี",
  },
  {
    bookID: "2",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายรักโรแมนติก",
    user_id: "นักเขียน B",
    view: 5400,
    type: "โรแมนติก",
  },
  {
    bookID: "3",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายสืบสวนสอบสวน",
    user_id: "นักเขียน C",
    view: 890,
    type: "สืบสวน",
  },
  {
    bookID: "4",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายไซไฟ",
    user_id: "นักเขียน D",
    view: 2300,
    type: "ไซไฟ",
  },
  {
    bookID: "5",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายดราม่า",
    user_id: "นักเขียน E",
    view: 780,
    type: "ดราม่า",
  },
  {
    bookID: "6",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายประวัติศาสตร์",
    user_id: "นักเขียน F",
    view: 1500,
    type: "ประวัติศาสตร์",
  },
  {
    bookID: "7",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายแฟนตาซี2",
    user_id: "นักเขียน G",
    view: 2200,
    type: "แฟนตาซี",
  },
  {
    bookID: "8",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายรักโรแมนติก2",
    user_id: "นักเขียน H",
    view: 4300,
    type: "โรแมนติก",
  },
  {
    bookID: "9",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายสืบสวนสอบสวน2",
    user_id: "นักเขียน I",
    view: 1900,
    type: "สืบสวน",
  },
  {
    bookID: "10",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายไซไฟ2",
    user_id: "นักเขียน J",
    view: 3300,
    type: "ไซไฟ",
  },
  {
    bookID: "11",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายดราม่า2",
    user_id: "นักเขียน K",
    view: 1280,
    type: "ดราม่า",
  },
  {
    bookID: "12",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายประวัติศาสตร์2",
    user_id: "นักเขียน L",
    view: 2500,
    type: "ประวัติศาสตร์",
  },
  {
    bookID: "13",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายแฟนตาซี3",
    user_id: "นักเขียน M",
    view: 3200,
    type: "แฟนตาซี",
  },
  {
    bookID: "14",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายรักโรแมนติก3",
    user_id: "นักเขียน N",
    view: 1500,
    type: "โรแมนติก",
  },
  {
    bookID: "15",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายสืบสวนสอบสวน3",
    user_id: "นักเขียน O",
    view: 970,
    type: "สืบสวน",
  },
  {
    bookID: "16",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายไซไฟ3",
    user_id: "นักเขียน P",
    view: 3800,
    type: "ไซไฟ",
  },
  {
    bookID: "17",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายดราม่า3",
    user_id: "นักเขียน Q",
    view: 890,
    type: "ดราม่า",
  },
  {
    bookID: "18",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายประวัติศาสตร์3",
    user_id: "นักเขียน R",
    view: 1600,
    type: "ประวัติศาสตร์",
  },
  {
    bookID: "19",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายแฟนตาซี4",
    user_id: "นักเขียน S",
    view: 4200,
    type: "แฟนตาซี",
  },
  {
    bookID: "20",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายรักโรแมนติก4",
    user_id: "นักเขียน T",
    view: 5100,
    type: "โรแมนติก",
  },
  {
    bookID: "21",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายสืบสวนสอบสวน4",
    user_id: "นักเขียน U",
    view: 990,
    type: "สืบสวน",
  },
  {
    bookID: "22",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายไซไฟ4",
    user_id: "นักเขียน V",
    view: 3900,
    type: "ไซไฟ",
  },
  {
    bookID: "23",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายดราม่า4",
    user_id: "นักเขียน W",
    view: 1200,
    type: "ดราม่า",
  },
  {
    bookID: "24",
    img: "https://img.enjoybook.co/img/book/tn/B2025DF0u0dL15um74sFF308M1016113235.jpeg?w=640&q=75",
    name: "นิยายประวัติศาสตร์4",
    user_id: "นักเขียน X",
    view: 2600,
    type: "ประวัติศาสตร์",
  },
];

export default function SearchPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);
  const cols = 4;
  const rows = 5;
  const pageSize = cols * rows; // 4*5=20 ต่อหน้า

  const total = mockNovels.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = mockNovels.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Banner */}
      <section className="py-3 sm:py-5 flex justify-center px-2 sm:px-4">
        <Image
          src="https://img.enjoybook.co/img/img_campaign2025O5WjY5DhqK0916150451.jpeg?w=3840&q=75"
          alt="banner"
          width={1200}
          height={200}
          className="rounded-md object-contain w-full max-w-[1200px]"
        />
      </section>

      {/* Content Layout */}
      <div ref={topRef} className="max-w-[1200px] mx-auto px-2 sm:px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-4">
            <SearchBar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
              <p className="text-xs sm:text-sm text-gray-700">
                ผลการค้นหาทั้งหมด{" "}
                <span className="font-semibold">({total} รายการ)</span>
              </p>
              {/* ซ่อน dropdown บนมือถือ เพราะมีอยู่ใน SearchBar แล้ว */}
              <select className="hidden lg:block border rounded-md text-xs sm:text-sm px-2 py-1 w-auto">
                <option>ล่าสุด</option>
                <option>ยอดนิยม</option>
                <option>อัพเดตล่าสุด</option>
              </select>
            </div>

            {/* Grid แสดง Novel - Responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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

      <Footer />
    </div>
  );
}
