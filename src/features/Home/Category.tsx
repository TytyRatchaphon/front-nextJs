"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchCategoryBooks, fetchActiveCategories, fetchCategoryBanners, postBannerClick, type Slide } from "@/services/apiServices";
import CategoryHorizontalCard from "@/components/novelCard/CategoryHorizontalCard";
import { Pagination } from "antd";
import GifLoader from '@/components/utility/GifLoader';
import { CategoryBookListResponse, CategoryBook, CategoryDetail } from "@/types/api";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import CategoryTypeSwiper from "./CategoryTypeSwiper";
import CategoryGenreSwiper from "./CategoryGenreSwiper";
import { useLogger } from "@/hooks/useLogger";
import { resolveBannerImageSrc } from "@/utils/imageUtils";
import { navigateSafely } from "@/utils/navigationUtils";

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

const handleCategoryBannerClick = (slide: Slide) => {
  postBannerClick(slide.banner_id);

  if (slide.type_link === 'novel') {
    navigateSafely(`/book/${slide.ref_id}`);
  } else if (slide.type_link === 'link') {
    navigateSafely(slide.ref_id, { allowExternal: true });
  } else if (slide.type_link === 'campaign') {
    navigateSafely(`/campaign/${slide.ref_id}`);
  } else if (slide.type_link === 'article') {
    navigateSafely(`/article/${slide.ref_id}`);
  } else if (slide.type_link === 'store') {
    navigateSafely('/store');
  } else if (slide.type_link === 'pack_campaign') {
    navigateSafely(`/pack-campaign/${slide.ref_id}`);
  } else if (slide.type_link === 'campaign-discount') {
    navigateSafely('/campaign-discount');
  }
};

function CategoryBannerSwiper({ slides }: { slides: Slide[] }) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const canNavigate = slides.length > 3;

  if (slides.length === 0) return null;

  return (
    <div className="w-full flex justify-center bg-white group/banner banner-scale-context">
      <div className="w-full relative group/banner-inner">
        {canNavigate && (
          <>
            <button
              ref={prevRef}
              className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg opacity-0 transition-all duration-300 hover:bg-white group-hover/banner-inner:opacity-100 disabled:cursor-not-allowed disabled:opacity-0 lg:block"
              aria-label="Previous banner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              ref={nextRef}
              className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg opacity-0 transition-all duration-300 hover:bg-white group-hover/banner-inner:opacity-100 disabled:cursor-not-allowed disabled:opacity-0 lg:block"
              aria-label="Next banner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        <Swiper
          onSwiper={(swiper) => setSwiperInstance(swiper)}
          modules={[Autoplay, Navigation]}
          slidesPerView={1}
          spaceBetween={8}
          loop={canNavigate}
          speed={600}
          autoplay={canNavigate ? {
            delay: 5000,
            disableOnInteraction: false,
          } : false}
          navigation={canNavigate ? {
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          } : false}
          onBeforeInit={(swiper) => {
            if (!canNavigate) return;
            // @ts-expect-error - Swiper navigation refs are assigned during init
            swiper.params.navigation.prevEl = prevRef.current;
            // @ts-expect-error - Swiper navigation refs are assigned during init
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.realIndex % slides.length);
          }}
          breakpoints={{
            640: {
              slidesPerView: Math.min(2, slides.length),
              spaceBetween: 8,
            },
            1024: {
              slidesPerView: Math.min(3, slides.length),
              spaceBetween: 8,
            },
          }}
          className="w-full rounded-2xl overflow-hidden"
        >
          {slides.map((slide, index) => {
            const imageUrl = resolveBannerImageSrc(slide.img, '/images/hero-banner.png');

            return (
              <SwiperSlide key={`${slide.banner_id}-${index}`} className="!h-auto">
                <button
                  type="button"
                  onClick={() => handleCategoryBannerClick(slide)}
                  className="group relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-stone-100 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label={slide.name || 'Category banner'}
                >
                  <Image
                    src={imageUrl}
                    alt={slide.name || 'Category banner'}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    priority={index === 0}
                    quality={80}
                  />
                </button>
              </SwiperSlide>
            );
          })}
        </Swiper>

        <div className="relative z-10 mt-4 flex w-full justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                swiperInstance?.slideToLoop(index);
              }}
              className={`block h-2 rounded-full transition-all duration-300 ${
                activeIndex === index ? 'w-6 bg-red-600' : 'w-2 bg-gray-300'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Category() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { settings } = useWebsiteSettings();

  const idParam = params.id as string;
  const categoryId = idParam === 'list' ? searchParams.get('categoryId') || '' : idParam;
  const type = searchParams.get("type") || "tran";
  const tab = searchParams.get("tab") || "bestseller";
  const period = searchParams.get("period") || ((tab === "bestseller" || tab === "topchart") ? "30" : "1");
  const page = Number(searchParams.get("page")) || 1;

  // --- Activity Logging ---
  const { log } = useLogger();
  const hasLoggedRef = useRef<string>('');

  // React Query to fetch books
  const { data, isLoading, isError } = useQuery<CategoryBookListResponse | null>({
    queryKey: ["categoryBooks", type, categoryId, tab, page, period],
    queryFn: () => fetchCategoryBooks(type, categoryId, tab, page, 20, period),
  });
  const books = data?.data?.books ?? [];
  const pagination = data?.data?.pagination;
  const hasLoadError = isError || !data?.data;

  // Use Active Categories to get immediate banner if available
  const { data: activeCategories = [] } = useQuery({
    queryKey: ['activeCategories', type],
    queryFn: () => fetchActiveCategories(type),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categoryBanners = [] } = useQuery({
    queryKey: ["categoryBanners"],
    queryFn: fetchCategoryBanners,
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

  useEffect(() => {
    if (!categoryId) return;
    const logKey = `${categoryId}-${type}-${tab}`;
    if (hasLoggedRef.current === logKey) return;
    hasLoggedRef.current = logKey;

    log('category_click', 'category', categoryId, { type, tab, name: categoryName || '' });
  }, [categoryId, type, tab, categoryName, log]);

  const handleTabChange = (newTab: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", newTab);
    newParams.set("page", "1"); // Reset to page 1
    // If switching to non-ranking tabs, remove period to avoid confusion/URL clutter
    if (newTab !== 'bestseller' && newTab !== 'topchart') {
      newParams.delete("period");
    } else if (!newParams.get("period")) {
       newParams.set("period", "30");
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
      <div className="sticky top-[60px] lg:top-[80px] z-[1000] bg-white shadow-sm">
        <CategoryTypeSwiper />
        <CategoryGenreSwiper />
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-[1200px] py-8">

        {/* Header */}
        {categoryBanners.length > 0 ? (
          <div className="mb-8">
            <CategoryBannerSwiper slides={categoryBanners} />
          </div>
        ) : (
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
            <div className="absolute inset-0 transition-opacity duration-300"></div>

            <h1 className="sr-only">
              {typeLabel} {categoryName}
            </h1>
          </div>
        )}

        {/* Tabs - Sticky Swiper */}
        <div className="bg-white border-b border-gray-200 mb-8 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-2">
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
            {hasLoadError ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p>ไม่สามารถโหลดข้อมูลได้</p>
                <button onClick={() => window.location.reload()} className="mt-2 text-red-600 hover:underline">ลองใหม่</button>
              </div>
            ) : books.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                ไม่พบรายการหนังสือในหมวดนี้
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  {books.map((book: CategoryBook) => (
                    <CategoryHorizontalCard key={book.book_id} book={book} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <Pagination
                      current={page}
                      total={pagination.total}
                      pageSize={pagination.limit}
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
