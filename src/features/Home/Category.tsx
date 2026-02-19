"use client";

import React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchCategoryBooks, fetchActiveCategories } from "@/services/apiServices";
import CategoryHorizontalCard from "@/components/novelCard/CategoryHorizontalCard";
import { Pagination } from "antd";
import GifLoader from '@/components/utility/GifLoader';
import { CategoryBookListResponse, CategoryBook, CategoryDetail } from "@/types/api";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useWebsiteStore } from '@/stores/websiteStore';
import CategoryTypeSwiper from "./CategoryTypeSwiper";
import CategoryGenreSwiper from "./CategoryGenreSwiper";

const TABS = [
  { key: "bestseller", label: "นิยายขายดี" },
  { key: "topchart", label: "นิยายยอดฮิต" },
  { key: "new", label: "นิยายมาใหม่" },
  { key: "end", label: "นิยายจบแล้ว" },
  { key: "recommend", label: "นิยายแนะนำ" },
];



const TYPE_LABELS: Record<string, string> = {
  tran: "นิยายแปล",
  write: "นิยายแต่ง",
  fanfic: "แฟนฟิค",
  all: "นิยายทั้งหมด"
};

export default function Category() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { settings } = useWebsiteStore();

  const idParam = params.id as string;
  const categoryId = idParam === 'list' ? searchParams.get('categoryId') || '' : idParam;
  const type = searchParams.get("type") || "tran";
  const tab = searchParams.get("tab") || "new";
  const period = searchParams.get("period") || "30"; // Default to Month (30)
  const page = Number(searchParams.get("page")) || 1;

  // React Query to fetch books
  const { data, isLoading, isError } = useQuery<CategoryBookListResponse | null>({
    queryKey: ["categoryBooks", type, categoryId, tab, page, period],
    queryFn: () => fetchCategoryBooks(type, categoryId, tab, page, 20, period),
  });

  // Use Active Categories to get immediate banner if available
  const { data: activeCategories = [] } = useQuery({
    queryKey: ['activeCategories', type],
    queryFn: () => fetchActiveCategories(type),
    staleTime: 5 * 60 * 1000,
  });

  const activeCategory = activeCategories.find((c: any) => String(c.id) === String(categoryId));
  



  // Use banner from API response or Fallback to activeCategory
  const bannerFromApi = data?.data?.banner;
  
  // Prioritize activeCategory as it is the source user explicitly mentioned
  const activeCategoryDetail = activeCategory ? {
    name: activeCategory.name,
    img_bg: activeCategory.img_bg || (activeCategory as any).img || (activeCategory as any).banner || (activeCategory as any).image || "",
    color: activeCategory.color ? (Array.isArray(activeCategory.color) ? activeCategory.color : [activeCategory.color, activeCategory.color]) : [],
    id: Number(activeCategory.id),
    description: "",
    order_by: activeCategory.order_by || 0
  } as unknown as CategoryDetail : undefined;

  const categoryDetail = activeCategoryDetail?.img_bg ? activeCategoryDetail : (bannerFromApi || activeCategoryDetail);

  
  const categoryNameParam = searchParams.get("name") || "";
  const categoryName = categoryNameParam || categoryDetail?.name || "";

  const handleTabChange = (newTab: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", newTab);
    newParams.set("page", "1"); // Reset to page 1
    // If switching to non-ranking tabs, remove period to avoid confusion/URL clutter
    if (newTab !== 'bestseller' && newTab !== 'topchart') {
      newParams.delete("period");
    } else if (!newParams.get("period")) {
       newParams.set("period", "1");
    }
    router.push(`/cat/${categoryId}?${newParams.toString()}`);
  };

  const handlePeriodChange = (newPeriod: string) => {
     const newParams = new URLSearchParams(searchParams.toString());
     newParams.set("period", newPeriod);
     newParams.set("page", "1");
     router.push(`/cat/${categoryId}?${newParams.toString()}`);
  };

  

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("page", newPage.toString());
    router.push(`/cat/${categoryId}?${newParams.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const typeLabel = TYPE_LABELS[type] || (type === 'all' ? "นิยายทั้งหมด" : type);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Mobile Type Swiper */}
      <div className="sticky top-[100px] lg:top-[80px] z-[1000] bg-white shadow-sm">
        <CategoryTypeSwiper />
        <CategoryGenreSwiper />
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-[1200px] py-8">

        {/* Header */}
        <div
          className="text-center mb-8 py-20 md:py-28 rounded-xl relative overflow-hidden"
          style={{
            backgroundImage: settings?.cat_pic_default === "active" 
                ? `url('https://image.enjoybook.co/enjoybook.image/banner/Web_bg_cat.jpg')` 
                : (categoryDetail?.img_bg ? `url(${categoryDetail.img_bg})` : undefined),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark Overlay for contrast */}
          <div className="absolute inset-0  transition-opacity duration-300"></div>

          <h1
            className="text-xl md:text-4xl font-bold relative z-10 py-2 leading-relaxed text-white drop-shadow-lg"
          >
            {typeLabel} {categoryName}
          </h1>
        </div>

        {/* Tabs - Sticky Swiper */}
        <div className="sticky top-[150px] lg:top-[170px] z-[990] bg-white border-b border-gray-200 mb-8 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-2">
          <Swiper
            spaceBetween={20}
            slidesPerView="auto"
            className="w-full md:flex-1"
            freeMode={true}
          >
            {TABS.map((t) => (
              <SwiperSlide key={t.key} className="!w-auto">
                <button
                  onClick={() => handleTabChange(t.key)}
                  className={`pb-3 text-lg font-medium transition-colors relative whitespace-nowrap px-1 ${tab === t.key
                    ? "text-red-600 border-b-2 border-red-600 -mb-[1px]"
                    : "text-gray-500 hover:text-red-600"
                    }`}
                >
                  {t.label}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Period Filter - Only for Best Seller & Top Chart */}
          {(tab === 'bestseller' || tab === 'topchart') && (
            <div className="flex items-center gap-2 pb-2 md:pb-0 overflow-x-auto no-scrollbar w-full md:w-auto px-1 md:px-0">
              {[
                { label: 'วันนี้', value: '1' },
                { label: 'สัปดาห์', value: '7' },
                { label: 'เดือน', value: '30' },
                { label: 'ตลอดกาล', value: 'all' },
              ].map((p) => (
                 <button
                   key={p.value}
                   onClick={() => handlePeriodChange(p.value)}
                   className={`px-3 py-1 text-sm rounded-full border transition-all whitespace-nowrap flex-shrink-0 ${
                     period === p.value 
                       ? 'bg-red-600 !text-white border-red-600' 
                       : 'bg-white text-gray-500 border-gray-200 hover:border-red-600 hover:text-red-600'
                   }`}
                 >
                   {p.label}
                 </button>
              ))}
            </div>
          )}
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