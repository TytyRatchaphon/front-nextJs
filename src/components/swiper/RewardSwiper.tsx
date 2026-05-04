"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import parse from "html-react-parser";
import { App, Modal } from "antd";
import { useMutation } from "@tanstack/react-query";
import { AlignJustify, BellPlus, ChevronLeft, ChevronRight, Clock3, Eye, Gift } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation } from "swiper/modules";
import { followPromotion, unfollowPromotion } from "@/services/apiServices";
import { useAuthStore } from "@/stores/authStore";
import { resolveBookCoverImageSrc } from "@/utils/imageUtils";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

interface RewardSwiperProps {
  items: any[];
  title?: string;
  icon?: string;
  link?: string;
  onBookClick?: (book: any) => void;
  startDate?: string;
  endDate?: string;
  groupId?: string | number;
  canFollow?: boolean;
  isInitiallyFollowed?: boolean;
  initialNow?: number;
}

type CountdownPhase = "before_start" | "active" | "ended" | "hidden";

const formatPromoDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date);
};

const getCountdownSnapshot = (startDate?: string, endDate?: string, now: number = Date.now()) => {
  const start = startDate ? Date.parse(startDate) : NaN;
  const end = endDate ? Date.parse(endDate) : NaN;

  if (!Number.isNaN(start) && now < start) {
    return { phase: "before_start" as CountdownPhase, distance: start - now };
  }

  if (!Number.isNaN(end) && now < end) {
    return { phase: "active" as CountdownPhase, distance: end - now };
  }

  if (!Number.isNaN(end)) {
    return { phase: "ended" as CountdownPhase, distance: 0 };
  }

  return { phase: "hidden" as CountdownPhase, distance: 0 };
};

const splitCountdown = (distance: number) => ({
  days: Math.floor(distance / (1000 * 60 * 60 * 24)),
  hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
  minutes: Math.floor((distance / (1000 * 60)) % 60),
  seconds: Math.floor((distance / 1000) % 60),
});

const coverSrc = (img?: string) => {
  if (!img) return "/images/ejb.png";
  return img.startsWith("http") ? img : `https://img.enjoybook.co/img/book/${img}`;
};

const bookCoverSrc = (book?: any) => resolveBookCoverImageSrc(book, '/images/ejb.png', 'book');

const formatCount = (num?: number) => {
  const value = Number(num || 0);
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toLocaleString();
};

function RewardCard({
  book,
  isLocked = false,
  onBookClick,
}: {
  book: any;
  isLocked?: boolean;
  onBookClick?: (book: any) => void;
}) {
  const [isRewardsModalOpen, setIsRewardsModalOpen] = React.useState(false);
  const promotion = Array.isArray(book?.full_book_promotions) ? book.full_book_promotions[0] : null;
  const rewards = Array.isArray(promotion?.rewards)
    ? [...promotion.rewards].sort((a: any, b: any) => (a?.order_by || 0) - (b?.order_by || 0))
    : [];
  const hasOverflowRewards = rewards.length > 3;
  const previewRewards = hasOverflowRewards ? rewards.slice(0, 2) : rewards.slice(0, 3);
  const hiddenRewardsCount = Math.max(0, rewards.length - previewRewards.length);
  const discountPercent = book?.discount || promotion?.discount_percent || 0;

  return (
    <div className="relative h-[440px] w-[min(390px,calc(100vw-2rem))] shrink-0 sm:w-[360px] lg:w-[390px]">
      <article
        className={`group relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-stone-200 bg-white p-3 shadow-[0_28px_50px_-40px_rgba(15,23,42,0.4)] transition duration-300 ${
          isLocked ? "pointer-events-none" : "hover:-translate-y-1 hover:shadow-[0_34px_64px_-40px_rgba(220,38,38,0.18)]"
        }`}
      >
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,2fr)_120px] gap-3 rounded-[22px] border border-stone-200 bg-stone-50 p-3">
          <Link
            href={`/book/${book?.book_id}`}
            className="relative min-h-0 overflow-hidden rounded-[18px]"
            onClick={() => onBookClick?.(book)}
          >
            <div
              className={`absolute inset-0 transition duration-300 ${
                isLocked ? "blur-[18px] saturate-[0.25] brightness-95 scale-[1.03]" : ""
              }`}
            >
              <Image
                src={bookCoverSrc(book)}
                alt={book?.name || "reward book"}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            </div>
          </Link>

          <div
            className={`flex min-h-0 flex-col rounded-[18px] bg-[linear-gradient(180deg,#fff5f5_0%,#fff1f2_100%)] p-3 text-center transition duration-300 ${
              isLocked ? "blur-[14px] saturate-[0.35] opacity-60" : ""
            }`}
          >
            <div className="min-h-0 flex-1">
              <div className="space-y-2">
                {rewards.length > 0 ? (
                  previewRewards.map((reward: any, index: number) => (
                    <div
                      key={reward?.id || index}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/90 px-2 py-1 shadow-[0_10px_18px_-16px_rgba(15,23,42,0.35)]"
                    >
                      <div className="relative h-7 w-7 overflow-hidden rounded-full bg-white">
                        <Image
                          src={coverSrc(reward?.img)}
                          alt={reward?.item_type || "reward"}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <span className="text-sm font-bold text-stone-700">x{reward?.amount || 1}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex h-9 items-center justify-center rounded-full bg-white/90 px-2 py-1 text-stone-600 shadow-[0_10px_18px_-16px_rgba(15,23,42,0.35)]">
                    <Gift className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>

            {hasOverflowRewards && (
              <button
                type="button"
                onClick={() => setIsRewardsModalOpen(true)}
                className="relative mt-2 rounded-2xl border border-dashed border-red-200 bg-white/80 px-3 py-2 text-left shadow-[0_12px_24px_-22px_rgba(220,38,38,0.45)] transition hover:border-red-300 hover:bg-white"
              >
                <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-[0_10px_20px_-12px_rgba(220,38,38,0.65)]">
                  +{hiddenRewardsCount}
                </span>
                <div className="pr-4 text-[11px] leading-4 text-stone-500">กดเพื่อดูของรางวัลทั้งหมด</div>
              </button>
            )}

            <div
              className={`relative mt-4 h-11 w-full rounded-[14px] bg-white/60 px-2 text-center transition duration-300 ${
                isLocked ? "blur-[8px] opacity-70" : ""
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="block text-center text-[1rem] font-semibold leading-none text-red-500">-{discountPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`min-h-[132px] px-1 pb-1 pt-6 transition duration-300 ${isLocked ? "blur-[10px] opacity-60" : ""}`}>
          <div className="min-w-0">
            <Link href={`/book/${book?.book_id}`} className="block" onClick={() => onBookClick?.(book)}>
              <div className="space-y-1">
                <h3 className="line-clamp-2 min-h-[3.2rem] text-[1.05rem] font-bold leading-tight text-stone-900 transition-colors hover:text-red-600">
                  {book?.name}
                </h3>
                {book?.writer_name ? (
                  <p className="line-clamp-1 text-sm font-medium text-stone-500">{book.writer_name}</p>
                ) : null}
              </div>
            </Link>

            <div className="mt-2 flex items-center gap-4 text-[0.95rem] text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {formatCount(book?.view)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <AlignJustify className="h-4 w-4" />
                {formatCount(book?.chapter)}
              </span>
            </div>
          </div>
        </div>
      </article>

      <Modal
        open={isRewardsModalOpen}
        onCancel={() => setIsRewardsModalOpen(false)}
        footer={null}
        centered
        width={420}
        title={null}
        className="reward-items-modal"
      >
        <div className="px-1 pb-1 pt-2">
          <div className="mb-4 flex items-start gap-3">
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-100">
              <Image
                src={bookCoverSrc(book)}
                alt={book?.name || "reward book"}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-500">Rewards</p>
              <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-stone-900">{book?.name}</h3>
              <p className="mt-2 text-sm text-stone-500">-{discountPercent}% พร้อมของรางวัลทั้งหมดในโปรโมชันนี้</p>
            </div>
          </div>

          <div className="space-y-2">
            {rewards.length > 0 ? (
              rewards.map((reward: any, index: number) => (
                <div
                  key={reward?.id || index}
                  className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3"
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white">
                    <Image
                      src={coverSrc(reward?.img)}
                      alt={reward?.name || "reward"}
                      fill
                      className="object-contain p-1.5"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-stone-800">{reward?.name || "Reward item"}</p>
                    <p className="text-xs text-stone-500">จำนวน {reward?.amount || 1}</p>
                  </div>
                  <div className="rounded-full bg-red-100 px-2.5 py-1 text-sm font-bold text-red-600">
                    x{reward?.amount || 1}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                ไม่มีของรางวัลเพิ่มเติม
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function RewardSwiper({
  items,
  title,
  icon,
  link,
  onBookClick,
  startDate,
  endDate,
  groupId,
  canFollow = false,
  isInitiallyFollowed = false,
  initialNow,
}: RewardSwiperProps) {
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const { notification } = App.useApp();
  const { isLoggedIn } = useAuthStore();
  const [isMounted, setIsMounted] = React.useState(false);
  const [isFollowed, setIsFollowed] = React.useState(isInitiallyFollowed);
  const [countdown, setCountdown] = React.useState(() =>
    getCountdownSnapshot(startDate, endDate, initialNow ?? Date.now())
  );

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isMounted) return;

    const syncCountdown = () => setCountdown(getCountdownSnapshot(startDate, endDate));
    syncCountdown();

    if (!startDate && !endDate) return;

    const timer = window.setInterval(syncCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [startDate, endDate, isMounted]);

  React.useEffect(() => {
    setIsFollowed(isInitiallyFollowed);
  }, [isInitiallyFollowed]);

  const followMutation = useMutation({
    mutationFn: async (nextFollowed: boolean) => {
      if (!groupId) return null;
      const payload = { type: "group_bookhome", ref_id: groupId };
      return nextFollowed ? followPromotion(payload) : unfollowPromotion(payload);
    },
    onSuccess: (_data, nextFollowed) => {
      if (!nextFollowed) return;
      notification.success({
        placement: "topRight",
        icon: <BellPlus className="h-4 w-4 text-red-500" />,
        message: "คุณได้ติดตามกิจกรรมแล้ว",
        description: "ระบบจะแจ้งเตือนเมื่อถึงเวลากิจกรรม",
      });
    },
    onError: () => {
      setIsFollowed((prev) => !prev);
      notification.error({
        message: "ไม่สามารถอัปเดตการติดตามได้",
        placement: "topRight",
      });
    },
  });

  const handleFollowToggle = () => {
    if (!canFollow || !groupId) return;

    if (!isLoggedIn) {
      notification.warning({
        message: "กรุณาเข้าสู่ระบบเพื่อติดตามกิจกรรม",
        placement: "topRight",
      });
      return;
    }

    const nextFollowed = !isFollowed;
    setIsFollowed(nextFollowed);
    followMutation.mutate(nextFollowed);
  };

  const breakpoints = {
    320: { slidesPerView: "auto" as const, spaceBetween: 10 },
    640: { slidesPerView: "auto" as const, spaceBetween: 14 },
    1024: { slidesPerView: "auto" as const, spaceBetween: 18 },
  };

  const countdownParts = splitCountdown(countdown.distance);
  const isBeforeStart = countdown.phase === "before_start";
  const showCountdown = isMounted && countdown.phase !== "hidden";
  const countdownLabel =
    countdown.phase === "before_start" ? "เริ่มใน" : countdown.phase === "active" ? "เหลืออีก" : "สิ้นสุดแล้ว";
  const lockedAreaLabel = startDate
    ? `โปรโมชั่นจะเริ่มวันที่ ${formatPromoDate(startDate)}`
    : "โปรโมชั่นจะเริ่มเร็ว ๆ นี้";

  return (
    <section className="group/reward relative w-full py-3">
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/60 px-4 py-2">
        {title ? (
          <div className={`flex items-center ${title.trim().startsWith("<p") ? "translate-y-4" : "translate-y-1"}`}>
            <h2 className="text-lg font-bold leading-none [&_*]:m-0 sm:text-xl lg:text-2xl">{parse(title)}</h2>
          </div>
        ) : null}

        {link ? (
          <Link
            href={link}
            className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-red-500 transition hover:text-red-600"
          >
            ดูทั้งหมด
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      {showCountdown ? (
        <div className="mb-4 overflow-hidden rounded-[24px] border border-stone-200 bg-[linear-gradient(135deg,#fffdfd_0%,#fff1f2_100%)] shadow-[0_22px_50px_-40px_rgba(220,38,38,0.28)]">
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {countdownLabel}
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-stone-700">
                {countdown.phase === "before_start"
                  ? `โปรโมชั่นจะเริ่มวันที่ ${formatPromoDate(startDate)}`
                  : countdown.phase === "active"
                    ? `สิ้นสุด ${formatPromoDate(endDate)}`
                    : `โปรโมชันสิ้นสุดเมื่อ ${formatPromoDate(endDate)}`}
              </p>
            </div>

            {countdown.phase !== "ended" ? (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {[
                  { label: "วัน", value: countdownParts.days },
                  { label: "ชม.", value: countdownParts.hours },
                  { label: "นาที", value: countdownParts.minutes },
                  { label: "วิ", value: countdownParts.seconds },
                ].map((part) => (
                  <div
                    key={part.label}
                    className="flex min-w-[56px] flex-col items-center rounded-[18px] border border-white/70 bg-white/90 px-2 py-2 text-center shadow-[0_14px_30px_-24px_rgba(15,23,42,0.35)]"
                  >
                    <span className="text-lg font-bold leading-none text-stone-900">{String(part.value).padStart(2, "0")}</span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">{part.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-500">
                หมดเวลาแล้ว
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex items-stretch gap-4">
        {icon ? (
          <div className="hidden shrink-0 lg:block">
            <div className="relative h-[440px] w-[230px] overflow-hidden rounded-[28px] border border-stone-200 bg-[linear-gradient(180deg,#fff7f7_0%,#ffe4e6_100%)] shadow-[0_28px_50px_-40px_rgba(15,23,42,0.35)]">
              <Image src={icon} alt={title || "reward section icon"} fill className="object-cover" />
            </div>
          </div>
        ) : null}

        <div className="relative min-w-0 flex-1">
          {icon ? (
            <div className="mb-3 lg:hidden">
              <div className="relative h-[180px] w-full overflow-hidden rounded-[28px] border border-stone-200 bg-[linear-gradient(180deg,#fff7f7_0%,#ffe4e6_100%)] shadow-[0_28px_50px_-40px_rgba(15,23,42,0.35)]">
                <Image src={icon} alt={title || "reward section icon"} fill className="object-cover" />
              </div>
            </div>
          ) : null}

          {!isBeforeStart ? (
            <>
              <button
                ref={prevRef}
                className="absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg opacity-0 transition group-hover/reward:opacity-100 lg:block"
                aria-label="ก่อนหน้า"
              >
                <ChevronLeft className="h-5 w-5 text-stone-700" />
              </button>
              <button
                ref={nextRef}
                className="absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg opacity-0 transition group-hover/reward:opacity-100 lg:block"
                aria-label="ถัดไป"
              >
                <ChevronRight className="h-5 w-5 text-stone-700" />
              </button>
            </>
          ) : null}

          <div className="relative">
            <div className={isBeforeStart ? "pointer-events-none blur-[3px]" : ""}>
              <Swiper
                speed={520}
                breakpoints={breakpoints}
                modules={[Navigation, FreeMode]}
                freeMode={!isBeforeStart}
                allowTouchMove={!isBeforeStart}
                simulateTouch={!isBeforeStart}
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
              >
                {items && items.length > 0 ? (
                  items.map((book, index) => (
                    <SwiperSlide key={book?.book_id || index} className="!w-auto">
                      <RewardCard book={book} isLocked={isBeforeStart} onBookClick={onBookClick} />
                    </SwiperSlide>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-stone-400">ไม่มีของแถมในตอนนี้</div>
                )}
              </Swiper>
            </div>

            {isBeforeStart ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
                <div className="pointer-events-auto flex w-full max-w-[400px] flex-col items-center rounded-[28px] border border-white/80 bg-white/92 px-7 py-5 text-center shadow-[0_24px_50px_-30px_rgba(15,23,42,0.45)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-500">Coming Soon</p>
                  <p className="mt-2 text-base font-bold leading-snug text-stone-900">{lockedAreaLabel}</p>
                  {canFollow ? (
                    <button
                      type="button"
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending}
                      className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isFollowed
                          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          : "border-stone-200 bg-white text-stone-700 hover:border-red-200 hover:text-red-500"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <BellPlus className="h-4 w-4" />
                      {isFollowed ? "ติดตามแล้ว" : "ติดตามโปรโมชั่น"}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
