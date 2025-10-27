"use client";
import React from "react";

function SearchBar() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-md">
      {/* หัวข้อค้นหา */}
      <p className="text-lg font-semibold mb-4">ค้นหา</p>

      {/* ช่องค้นหา */}
      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            stroke="currentColor"
            fill="currentColor"
            viewBox="0 0 16 16"
            className="text-gray-500"
            height="1em"
            width="1em"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"></path>
          </svg>
        </div>
        <input
          type="text"
          placeholder="input search text"
          className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

      {/* ตัวกรอง */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium">ตัวกรอง</p>
          <button className="text-red-500 text-sm">ล้าง</button>
        </div>
        <hr className="border-t border-gray-300" />
      </div>

      {/* หมวดหมู่ */}
      <div className="mb-5">
        <p className="font-medium mb-2">หมวดหมู่</p>
        <div className="flex flex-col gap-2 text-sm">
          {["นิยายทั่วไป", "นิยายไทย", "นิยายจีน", "การ์ตูน", "โรแมนติก"].map(
            (item) => (
              <label key={item}>
                <input type="checkbox" className="mr-2 accent-red-500" /> {item}
              </label>
            )
          )}
        </div>
      </div>

      {/* รูปแบบ */}
      <div className="mb-5">
        <p className="font-medium mb-2">รูปแบบ</p>
        <div className="flex flex-col gap-2 text-sm">
          {["นิยายแปล", "นิยายแต่ง", "แฟนฟิค"].map((item) => (
            <label key={item}>
              <input type="checkbox" className="mr-2 accent-red-500" /> {item}
            </label>
          ))}
        </div>
      </div>

      {/* สถานะเรื่อง */}
      <div className="mb-5">
        <p className="font-medium mb-2">สถานะเรื่อง</p>
        <div className="flex flex-col gap-2 text-sm">
          {["จบแล้ว", "ยังไม่จบ"].map((item) => (
            <label key={item}>
              <input type="checkbox" className="mr-2 accent-red-500" /> {item}
            </label>
          ))}
        </div>
      </div>

      {/* ปุ่มค้นหา */}
      <button className="w-full bg-red-500 py-2 rounded-md hover:bg-red-600 text-sm  !text-white">
        ค้นหา
      </button>
    </div>
  );
}

export default SearchBar;
