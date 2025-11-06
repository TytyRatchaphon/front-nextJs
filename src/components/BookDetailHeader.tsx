import Image from "next/image";
import { useState } from "react";
import { Modal } from "antd";

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

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
          <Image
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
            <div
              className="cursor-pointer hover:opacity-90 transition-opacity"
              onClick={showModal}
              title="คลิกเพื่อดูรูปขนาดใหญ่"
            >
              <Image
                src={coverImageUrl}
                alt={book.title}
                width={180}
                height={262}
                className="object-cover rounded-lg shadow-md w-[140px] h-[204px] sm:w-[160px] sm:h-[233px] lg:w-[180px] lg:h-[262px]"
                priority
              />
            </div>
          </div>

          {/* Modal for enlarged image */}
          <Modal
            open={isModalOpen}
            onCancel={handleCancel}
            footer={null}
            width="90%"
            style={{ maxWidth: 600 }}
            centered
            styles={{
              body: { padding: 0 },
            }}
          >
            <div className="relative w-full" style={{ aspectRatio: "180/262" }}>
              <Image
                src={coverImageUrl}
                alt={book.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 90vw, 600px"
              />
            </div>
          </Modal>

          {/* Book Info - Full width on mobile/tablet */}
          <div className="flex-1 w-full lg:w-auto">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 text-gray-900">
              {book.title}{" "}
              <span className="text-gray-400 font-normal text-sm sm:text-base lg:text-lg">
                Demo
              </span>
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
                <span className="bg-pink-100 text-pink-600 px-2 sm:px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold">
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
                <Image
                  src="/assets/icons/eye.png"
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
                <Image
                  src="/assets/icons/message-text.png"
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
                <Image
                  src="/assets/icons/heart.png"
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
                <Image
                  src="/assets/icons/rose.png"
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
              <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-200">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 rounded-full flex items-center justify-center">
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
              <button className="bg-white border border-gray-300 text-gray-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-50 transition">
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
              <button className="bg-red-600 !text-white px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm hover:bg-red-700 transition flex items-center gap-1.5 sm:gap-2 shadow-sm">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>อ่านเลย</span>
              </button>
              <button className="bg-white border border-gray-300 text-gray-700 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-50 transition flex items-center gap-1.5 sm:gap-2">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                <span className="hidden sm:inline">เพิ่มเข้าชั้น</span>
                <span className="sm:hidden">ชั้นหนังสือ</span>
              </button>
              <button className="bg-white border border-gray-300 text-gray-700 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-50 transition flex items-center gap-1.5 sm:gap-2">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                <span>แชร์</span>
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
