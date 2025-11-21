import NextImage from "next/image";
import { useState } from "react";
import { Image as AntImage } from "antd";

interface BookDetailHeaderProps {
  book: {
    cover: string;
    title: string;
    tag: string;
    category2?: string;
    author: string;
    views: number;
    chapters: number;
    reviews: number;
    hearts?: number;
    flowers?: number;
    description?: string;
    tags?: string[];
    publishDate?: string;
    status?: string;
    rate?: number;
  };
}

const BookDetailHeader = ({ book }: BookDetailHeaderProps) => {



  // สร้าง URL รูปภาพที่สมบูรณ์
  const coverImageUrl = book.cover
    ? book.cover.startsWith("http")
      ? book.cover
      : `https://img.enjoybook.co/img/book/tn/${book.cover}`
    : "/assets/enjoycover.png";

  return (
    <div className="relative w-full -mx-4 sm:-mx-6 px-4 sm:px-6">
      {/* Full-width Background with Book Cover */}
      <div className="absolute inset-0 -mx-[100vw] left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen overflow-hidden">
        {/* Book Cover Background - Blurred and Faded */}
        <div className="absolute inset-0">
          <NextImage
            src={coverImageUrl}
            alt="background"
            fill
            className="object-cover object-center opacity-50"
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            priority
          />
        </div>
        {/* Overlay gradient for better readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/50 to-white/60"></div>
      </div>

      <div className="relative bg-white/50 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden">
        {/* Mobile & Tablet: Vertical Layout | Desktop: Horizontal Layout */}
        <div className="relative flex flex-col lg:flex-row gap-4 sm:gap-6 items-start p-4 sm:p-6">
          {/* Book Cover with Modal */}
          <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
            <div className="cursor-pointer hover:opacity-90 transition-opacity" title="คลิกเพื่อดูรูปขนาดใหญ่">
              <AntImage
                src={coverImageUrl}
                alt={book.title}
                width={168}
                height={237}
                preview={{}}
                className="object-cover rounded-lg shadow-md w-[168px] h-[237px]"
              />
            </div>
          </div>

          {/* Book Info - Full width on mobile/tablet */}
          <div className="flex-1 w-full lg:w-auto">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 text-gray-900">
              {book.title}{" "}
            </h1>

            {/* Rating and Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-3 h-3 sm:w-4 sm:h-4 fill-current ${
                      star <= (book.rate || 0)
                        ? "text-orange-400"
                        : "text-gray-300"
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-700 text-xs sm:text-sm font-medium">
                {book.rate || 0}.0
              </span>
              {book.status === "not_end" && (
                <span className="bg-pink-100 text-pink-600 px-2 sm:px-2.5 py-0.5 rounded text-[10px] sm:text-xs">
                  กำลังเขียน
                </span>
              )}
              {book.status === "end" && (
                <span className="bg-green-100 text-green-600 px-2 sm:px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold">
                  จบแล้ว
                </span>
              )}
            </div>

            {/* Stats using local assets icons */}
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 mb-2 sm:mb-3 text-xs sm:text-sm text-gray-700 flex-wrap">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <NextImage
                    src="/images/eye.png"
                    alt="views"
                    width={16}
                    height={16}
                    className="w-3 h-3 sm:w-4 sm:h-4 object-contain"
                  />
                <span className="font-medium">
                  {book.views?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <NextImage
                  src="/images/message-text.png"
                  alt="comments"
                  width={16}
                  height={16}
                  className="w-3 h-3 sm:w-4 sm:h-4 object-contain"
                />
                <span className="font-medium">
                  {book.reviews?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <NextImage
                  src="/images/heart.png"
                  alt="likes"
                  width={16}
                  height={16}
                  className="w-3 h-3 sm:w-4 sm:h-4 object-contain"
                />
                <span className="font-medium">
                  {book.hearts?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <NextImage
                  src="/images/rose.png"
                  alt="gifts"
                  width={16}
                  height={16}
                  className="w-3 h-3 sm:w-4 sm:h-4 object-contain"
                />
                <span className="font-medium">
                  {book.flowers?.toLocaleString() || 0}
                </span>
              </div>
            </div>

            {/* Author and Follow */}
            <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2  px-2 sm:px-3 py-1 sm:py-1.5 rounded-full  ">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 rounded-full flex items-center justify-center" style={{ width : 32, height : 32}}>
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm text-gray-800 font-medium">
                  {book.author}
                </span>
              </div>
              <button className="bg-white border border-gray-300 text-gray-500 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition">
                + ติดตาม
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {book.tags && book.tags.length > 0 ? (
                book.tags.slice(0, 5).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 sm:px-2.5 py-0.5 rounded-none border border-red-200 bg-white text-red-700 text-[10px] sm:text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="px-2 sm:px-2.5 py-0.5 rounded-none border border-red-200 bg-white text-red-700 text-[10px] sm:text-xs font-medium">
                  {book.tag}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-2 sm:mt-3 line-clamp-3 lg:line-clamp-none">
              {book.description || "ไม่มีคำอธิบาย"}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap">
              <button className="bg-red-600 !text-white px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm hover:bg-red-700 transition flex items-center gap-1.5 sm:gap-2 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15.5799 12C15.5799 13.98 13.9799 15.58 11.9999 15.58C10.0199 15.58 8.41992 13.98 8.41992 12C8.41992 10.02 10.0199 8.41998 11.9999 8.41998C13.9799 8.41998 15.5799 10.02 15.5799 12Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.9998 20.27C15.5298 20.27 18.8198 18.19 21.1098 14.59C22.0098 13.18 22.0098 10.81 21.1098 9.39997C18.8198 5.79997 15.5298 3.71997 11.9998 3.71997C8.46984 3.71997 5.17984 5.79997 2.88984 9.39997C1.98984 10.81 1.98984 13.18 2.88984 14.59C5.17984 18.19 8.46984 20.27 11.9998 20.27Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>อ่านเลย</span>
              </button>
              <button className="bg-white border border-red-800 text-gray-700 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition flex items-center gap-1.5 sm:gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" fill="white" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 2.44V12.42C17 14.39 15.59 15.16 13.86 14.12L12.54 13.33C12.24 13.15 11.76 13.15 11.46 13.33L10.14 14.12C8.41 15.15 7 14.39 7 12.42V2.44" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 2.44V12.42C17 14.39 15.59 15.16 13.86 14.12L12.54 13.33C12.24 13.15 11.76 13.15 11.46 13.33L10.14 14.12C8.41 15.15 7 14.39 7 12.42V2.44" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="hidden sm:inline text-red-800">เพิ่มเข้าชั้น</span>
                <span className="sm:hidden">ชั้นหนังสือ</span>
              </button>
              <button className="bg-white border border-red-800 text-gray-700 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition flex items-center gap-1.5 sm:gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M16.96 6.16998C18.96 7.55998 20.34 9.76998 20.62 12.32L16.96 6.16998Z" fill="#B01F1F"/>
                  <path d="M16.96 6.16998C18.96 7.55998 20.34 9.76998 20.62 12.32" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.49023 12.37C3.75023 9.82997 5.11023 7.61997 7.09023 6.21997" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.18994 20.94C9.34994 21.53 10.6699 21.86 12.0599 21.86C13.3999 21.86 14.6599 21.56 15.7899 21.01" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.0598 7.70001C13.5951 7.70001 14.8398 6.45537 14.8398 4.92001C14.8398 3.38466 13.5951 2.14001 12.0598 2.14001C10.5244 2.14001 9.27979 3.38466 9.27979 4.92001C9.27979 6.45537 10.5244 7.70001 12.0598 7.70001Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.8298 19.92C6.36516 19.92 7.60981 18.6753 7.60981 17.14C7.60981 15.6046 6.36516 14.36 4.8298 14.36C3.29445 14.36 2.0498 15.6046 2.0498 17.14C2.0498 18.6753 3.29445 19.92 4.8298 19.92Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.1701 19.92C20.7055 19.92 21.9501 18.6753 21.9501 17.14C21.9501 15.6046 20.7055 14.36 19.1701 14.36C17.6348 14.36 16.3901 15.6046 16.3901 17.14C16.3901 18.6753 17.6348 19.92 19.1701 19.92Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-red-800">แชร์</span>
              </button>
            </div>
          </div>

          {/* Right Side Info Card - ข้อมูลเรื่อง (Hidden on mobile/tablet, shown on large desktop) */}
          <div className="hidden xl:block flex-shrink-0 w-80 bg-white/90 backdrop-blur-sm rounded-lg p-5 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              ข้อมูลเรื่อง
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">โดย</span>
                <span className="text-gray-900 font-medium">{book.author}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">ผู้เขียน</span>
                <span className="text-gray-900 font-medium">นักเขียน</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">ผู้แปล</span>
                <span className="text-gray-900 font-medium">-</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">จำนวนตอน</span>
                <span className="text-gray-900 font-medium">
                  {book.chapters}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">หมวดหมู่</span>
                <span className="text-gray-900 font-medium text-right">
                  {book.tag}
                  {book.category2 ? ` / ${book.category2}` : ""}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">จัดเผยแพร่เมื่อ</span>
                <span className="text-gray-900 font-medium text-right text-xs">
                  {book.publishDate
                    ? new Date(book.publishDate).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailHeader;