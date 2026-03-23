"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";
import Link from "next/link";
import { Rate } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import ReviewModal from "@/components/modal/ReviewModal";
import SpoilerCardWrapper from "@/components/ui/SpoilerCardWrapper";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import ProfileAvatarLink, { extractFrameSrc, normalizeProfileAssetSrc } from "@/components/ui/ProfileAvatarLink";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

dayjs.extend(relativeTime);
dayjs.locale("th");

interface PinnedReviewsSwiperProps {
  reviews: any[];
}

export default function PinnedReviewsSwiper({ reviews }: PinnedReviewsSwiperProps) {
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);

  const [selectedReview, setSelectedReview] = React.useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleReviewClick = (review: any) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const breakpoints = {
    320: { slidesPerView: "auto" as const, spaceBetween: 12 },
    640: { slidesPerView: "auto" as const, spaceBetween: 14 },
    768: { slidesPerView: "auto" as const, spaceBetween: 16 },
    1024: { slidesPerView: "auto" as const, spaceBetween: 18 },
    1280: { slidesPerView: "auto" as const, spaceBetween: 20 },
    1536: { slidesPerView: "auto" as const, spaceBetween: 20 },
  };

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="mt-6 w-full bg-[radial-gradient(circle_at_top,_#fff5f4_0%,_#ffecec_45%,_#ffe7e7_100%)] py-7 sm:py-9">
      <div className="group/swiper relative mx-auto w-full max-w-[1440px] px-4 lg:px-[156px]">
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 md:flex-row md:items-end">
          <div className="min-w-0 max-w-[14rem] sm:max-w-none">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b85b50]">Reader Reviews</p>
            <h2 className="mt-1 text-[clamp(2rem,8vw,30px)] font-bold leading-[1.02] text-[#d93324]">
              ปักหมุดรีวิวจากนักอ่าน
            </h2>
          </div>
          <div className="flex items-center gap-2 self-end md:ml-auto">
            <span className="rounded-full border border-[#f1bdb7] bg-white/85 px-3 py-1 text-xs font-semibold text-[#cc3f2f]">
              {reviews.length} รีวิว
            </span>
            <Link
              href="/all-review"
              className="inline-flex items-center gap-1 rounded-full border border-[#f0c5c0] bg-white px-3 py-1.5 text-sm font-semibold text-[#cc3f2f] transition-colors hover:bg-[#fff7f6]"
            >
              ดูทั้งหมด
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>

        <button
          ref={prevRef}
          aria-label="ดูรีวิวก่อนหน้า"
          className="arrow-left absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-[#f0c8c3] bg-white/95 p-2.5 text-[#b45d52] shadow-md opacity-0 transition-all duration-300 hover:bg-white group-hover/swiper:opacity-100 md:flex lg:left-[132px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          ref={nextRef}
          aria-label="ดูรีวิวถัดไป"
          className="arrow-right absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-[#f0c8c3] bg-white/95 p-2.5 text-[#b45d52] shadow-md opacity-0 transition-all duration-300 hover:bg-white group-hover/swiper:opacity-100 md:flex lg:right-[132px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <Swiper
          centeredSlides={false}
          speed={500}
          breakpoints={breakpoints}
          modules={[Navigation, FreeMode]}
          className="z-0 !overflow-visible pb-3"
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            // @ts-expect-error -- Swiper navigation refs are assigned imperatively.
            swiper.params.navigation.prevEl = prevRef.current;
            // @ts-expect-error -- Swiper navigation refs are assigned imperatively.
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          freeMode={{ enabled: true, momentumBounce: false }}
        >
          {reviews.map((review) => {
            const userAvatar = normalizeProfileAssetSrc(
              review.user?.img,
              "/images/default-avatar.png",
              "https://img.enjoybook.co/img/profile/",
            );
            const userFrame = extractFrameSrc(review.user);
            const userName = review.user?.fullname || "Unknown";
            const bookCover = normalizeProfileAssetSrc(
              review.book?.img || review.book?.img_full,
              "/images/ejb.png",
              "https://img.enjoybook.co/img/book/",
            );
            const bookTitle = review.book?.name || "Unknown Book";
            const bookTag = review.book?.tag?.[0] || "นิยาย";
            const writerName = review.book?.writer_name || "Unknown Writer";
            const timeAgo = dayjs(review.created_at).fromNow();
            const episodeRead = Number(review.ep_read || 0);

            let cleanContent = String(review.content || "");
            cleanContent = cleanContent.replace(/<[^>]+>/g, "");
            cleanContent = cleanContent.replace(/\[\/?\s*SPOILER\s*\]/gi, "").trim();

            const isSpoilerCard = Boolean(review.is_spoiler);

            const cardContent = (
              <>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <ProfileAvatarLink
                        userId={review.user?.user_id}
                        name={userName}
                        avatarSrc={userAvatar}
                        frameSrc={userFrame}
                        sizeClassName="h-8 w-8"
                        frameScaleClassName="-inset-1"
                        stopPropagation
                      />
                      <Link
                        href={`/profile/${review.user?.user_id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="line-clamp-1 text-sm font-semibold text-[#2f2f35] hover:text-[#d93324]"
                      >
                        {userName}
                      </Link>
                    </div>
                  <span className="whitespace-nowrap text-[11px] font-medium text-[#9b8c8a]">{timeAgo}</span>
                </div>

                <div className="mb-3 flex items-center justify-between gap-2">
                  <Rate
                    disabled
                    defaultValue={review.rating}
                    allowHalf
                    className="text-[15px] text-amber-500 [&_.ant-rate-star]:!me-[2px]"
                  />
                  <span className="rounded-full bg-[#fff1ef] px-2.5 py-1 text-[11px] font-semibold text-[#b3554a]">
                    {episodeRead > 0 ? `อ่านถึง #${episodeRead}` : "รีวิวจากนักอ่าน"}
                  </span>
                </div>

                <div className="mb-4 flex-1 break-words text-[14px] leading-6 text-[#4d4b52] line-clamp-3">
                  {cleanContent || "รีวิวนี้ยังไม่มีข้อความเพิ่มเติม"}
                </div>

                <Link
                  href={`/book/${review.book?.book_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-auto flex items-center gap-3 rounded-xl border border-[#f0d9d6] bg-white/75 p-2.5 transition-colors hover:bg-white"
                >
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md">
                    <ImageWithFallback
                      src={bookCover}
                      fallbackSrc="/images/ejb.png"
                      alt={bookTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <h4 className="truncate text-sm font-bold text-[#22222a]">{bookTitle}</h4>
                    <span className="mb-0.5 block truncate text-xs font-semibold text-[#d63d2a]">{bookTag}</span>
                    <span className="block truncate text-xs text-[#7f7d86]">{writerName}</span>
                  </div>
                </Link>
              </>
            );

            return (
              <SwiperSlide
                key={review.review_id || `${review.user?.user_id}-${review.created_at}`}
                className="!w-[min(82vw,300px)] sm:!w-[300px] md:!w-[338px] xl:!w-[350px]"
              >
                <SpoilerCardWrapper
                  isSpoiler={isSpoilerCard}
                  onClick={() => handleReviewClick(review)}
                  variant="home"
                  revealTitle="รีวิวนี้มีสปอยล์"
                  revealSubtitle="แตะเพื่อเปิดอ่าน"
                >
                  {cardContent}
                </SpoilerCardWrapper>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        review={selectedReview}
      />
    </section>
  );
}
