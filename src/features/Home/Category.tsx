"use client";

import React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchCategoryBooks } from "@/services/apiServices";
import CategoryHorizontalCard from "@/components/novelCard/CategoryHorizontalCard";
import { Pagination } from "antd";
import GifLoader from '@/components/utility/GifLoader';
import { CategoryBookListResponse, CategoryBook, CategoryDetail } from "@/types/api";

const TABS = [
  { key: "new", label: "มาใหม่" },
  { key: "bestseller", label: "Best Seller" },
  { key: "topchart", label: "Top Chart" },
  { key: "end", label: "จบแล้ว" },
  { key: "recommend", label: "แนะนำ" },
];

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
}

const TYPE_LABELS: Record<string, string> = {
  tran: "นิยายแปล",
  write: "นิยายแต่ง",
  fanfic: "แฟนฟิค"
};

const genresCommon = [
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

const translatedSpecifics = [
  { name: "นิยายแปลจีน", id: '23' },
  { name: "นิยายแปลเกาหลี", id: '24' },
  { name: "นิยายแปลญี่ปุ่น", id: '25' },
  { name: "นิยายแปลอังกฤษ", id: '26' },
  { name: "นิยายแปลอื่นๆ", id: '27' },
  { name: "โรแมนติก", id: '2' },
];

const ALL_GENRES = [...genresCommon, ...translatedSpecifics];

export default function Category() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const idParam = params.id as string;
  const categoryId = idParam === 'list' ? searchParams.get('categoryId') || '' : idParam;
  const type = searchParams.get("type") || "tran";
  const tab = searchParams.get("tab") || "new";
  const page = Number(searchParams.get("page")) || 1;

  const categoryNameParam = searchParams.get("name") || "";
  const matchedGenre = ALL_GENRES.find(g => g.id === categoryId);
  const categoryName = categoryNameParam || matchedGenre?.name || "";

  // React Query to fetch books
  const { data, isLoading, isError } = useQuery<CategoryBookListResponse | null>({
    queryKey: ["categoryBooks", type, categoryId, tab, page],
    queryFn: () => fetchCategoryBooks(type, categoryId, tab, page, 20),
  });

  // Use banner from API response
  const categoryDetail = data?.data?.banner;

  const handleTabChange = (newTab: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", newTab);
    newParams.set("page", "1"); // Reset to page 1
    router.push(`/cat/${categoryId}?${newParams.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("page", newPage.toString());
    router.push(`/cat/${categoryId}?${newParams.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const typeLabel = TYPE_LABELS[type] || type;

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1200px] py-8">

        {/* Header */}
        <div
          className="text-center mb-8 py-20 md:py-28 rounded-xl relative overflow-hidden"
          style={{
            backgroundImage: categoryDetail?.img_bg ? `url(${categoryDetail.img_bg})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay to ensure text readability if needed, though user didn't ask, but safe */}
          {/* <div className="absolute inset-0 bg-white/50"></div> */}

          <h1
            className="text-xl md:text-4xl font-bold relative z-10 py-2 leading-relaxed"
            style={categoryDetail?.color && categoryDetail.color.length >= 2 ? {
              backgroundImage: `linear-gradient(to right, ${categoryDetail.color[0]}, ${categoryDetail.color[1]})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent', // Fallback
              display: 'inline-block'
            } : { color: '#1f2937' }}
          >
            {typeLabel} {categoryName}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-6 border-b border-gray-200 mb-8 mt-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`pb-3 text-lg font-medium transition-colors relative ${tab === t.key
                ? "text-red-600 border-b-2 border-red-600 -mb-[1px]"
                : "text-gray-500 hover:text-red-600"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64 min-h-[400px]">
            <GifLoader />
          </div>
        ) : (
          <div className="min-h-[400px]">
            {isError ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p>ไม่สามารถโหลดข้อมูลได้</p>
                <button onClick={() => window.location.reload()} className="mt-2 text-red-600 hover:underline">ลองใหม่</button>
              </div>
            ) : data?.data?.books?.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                ไม่พบรายการหนังสือในหมวดนี้
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  {data?.data?.books?.map((book: CategoryBook) => (
                    <CategoryHorizontalCard key={book.book_id} book={book} />
                  ))}
                </div>

                {/* Pagination */}
                {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <Pagination
                      current={page}
                      total={data.data.pagination.total}
                      pageSize={data.data.pagination.limit}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      className="custom-pagination" // You might need to add global styles for red color if ConfigProvider is not used globally
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}