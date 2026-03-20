"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Modal } from "antd";
import Cookies from "js-cookie";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { EffectCoverflow } from "swiper/modules";
import { useAuthStore } from "@/stores/authStore";
import { useWebsiteStore } from "@/stores/websiteStore";
import {
  fetchAllRanks,
  fetchRankProfile,
  RankItem,
  RankProfileResponse,
} from "@/services/api/userApi";

interface UserRankShowcaseProps {
  className?: string;
  variant?: "default" | "compact";
}

export default function UserRankShowcase({
  className = "",
  variant = "default",
}: UserRankShowcaseProps) {
  const { isLoggedIn, hasMounted } = useAuthStore();
  const { settings } = useWebsiteStore();
  const [rankData, setRankData] = useState<RankProfileResponse["data"] | null>(null);
  const [allRanks, setAllRanks] = useState<RankItem[]>([]);
  const [showRanksModal, setShowRanksModal] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  const currentRankIndex = useMemo(() => {
    if (!Array.isArray(allRanks)) return 0;
    const idx = allRanks.findIndex((rank) => rank.is_current_rank);
    return idx >= 0 ? idx : 0;
  }, [allRanks]);

  useEffect(() => {
    const loadRankData = async () => {
      if (!isLoggedIn) return;

      const rawToken = Cookies.get("token");
      const token = rawToken ? rawToken.replace(/^['"]+|['"]+$/g, "") : "";
      if (!token) return;

      try {
        const [profile, ranks] = await Promise.all([
          fetchRankProfile(token),
          fetchAllRanks(token),
        ]);

        setRankData(profile);
        setAllRanks(Array.isArray(ranks) ? ranks : []);
      } catch (error) {
        console.error("fetchRankProfile error:", error);
      }
    };

    if (hasMounted) {
      loadRankData();
    }
  }, [hasMounted, isLoggedIn]);

  if (!hasMounted || !isLoggedIn) {
    return null;
  }

  const isCompact = variant === "compact";

  if (!rankData) {
    return (
      <div
        className={`overflow-hidden rounded-[28px] border border-stone-200 bg-stone-100/80 p-5 shadow-sm ${isCompact ? "min-h-[160px] p-4" : "min-h-[236px]"} ${className}`}
      >
        <div className={`animate-pulse ${isCompact ? "space-y-3" : "space-y-4"}`}>
          <div className="h-4 w-24 rounded-full bg-stone-200" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`${isCompact ? "h-11 w-11" : "h-14 w-14"} rounded-full bg-stone-200`} />
              <div className="space-y-2">
                <div className={`rounded bg-stone-200 ${isCompact ? "h-3.5 w-20" : "h-4 w-24"}`} />
                <div className={`rounded bg-stone-200 ${isCompact ? "h-3 w-24" : "h-3 w-32"}`} />
              </div>
            </div>
            <div className={`${isCompact ? "h-8 w-16" : "h-9 w-20"} rounded-xl bg-stone-200`} />
          </div>
          <div className="h-2.5 w-full rounded-full bg-stone-200" />
          <div className={`${isCompact ? "h-3.5 w-4/5" : "h-4 w-2/3"} rounded bg-stone-200`} />
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowRanksModal(true)}
        title="ดูแรงก์ทั้งหมด"
        className={`relative w-full overflow-hidden rounded-[28px] border border-stone-200 bg-gradient-to-br from-[#eceef2] via-[#f8f8fa] to-[#dcdee5] text-left shadow-sm transition hover:shadow-md ${isCompact ? "min-h-[148px] p-3.5 md:p-4" : "p-5"} ${className}`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`absolute opacity-15 ${
              isCompact
                ? "-bottom-5 -right-5 h-20 w-20 md:h-24 md:w-24"
                : "-bottom-10 -right-10 h-48 w-48"
            }`}
          >
            <Image
              src={rankData.current_rank.rank_img || "/images/user.png"}
              alt=""
              fill
              className="object-contain object-right-bottom"
              unoptimized
            />
          </div>
        </div>

        <div className="relative z-10">
          <div className={`flex items-center justify-between gap-3 ${isCompact ? "mb-2.5" : "mb-4"}`}>
            <div className="flex items-center gap-3">
              <div
                className={`flex shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/70 p-2 shadow-sm ${isCompact ? "h-10 w-10" : "h-16 w-16"}`}
              >
                <Image
                  src={rankData.current_rank.rank_img || "/images/user.png"}
                  alt={rankData.current_rank.name}
                  width={isCompact ? 26 : 48}
                  height={isCompact ? 26 : 48}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <p className={`font-semibold uppercase text-stone-500 ${isCompact ? "text-[10px] tracking-[0.18em]" : "text-[11px] tracking-[0.24em]"}`}>
                  Current Rank
                </p>
                <p className={`font-bold text-stone-950 ${isCompact ? "text-sm leading-tight" : "text-lg"}`}>
                  {rankData.current_rank.name}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-1.5 rounded-xl border border-red-200/60 bg-red-100/60 ${isCompact ? "px-2 py-1" : "px-3 py-1.5"}`}>
              {settings?.exp && (
                <Image
                  src={settings.exp}
                  alt="RP"
                  width={isCompact ? 14 : 18}
                  height={isCompact ? 14 : 18}
                  className="object-contain"
                  unoptimized
                />
              )}
              <span className={`font-bold text-red-600 ${isCompact ? "text-sm" : "text-lg"}`}>
                {rankData.total_rp.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-[#fa807280] shadow-inner">
            <div
              className="h-full rounded-full bg-[#ff0000] transition-all duration-500 ease-out"
              style={{
                width: `${rankData.current_rank.max_rp > 0 ? Math.min(100, Math.max(0, (rankData.total_rp / rankData.current_rank.max_rp) * 100)) : 0}%`,
              }}
            />
          </div>

          <p className={`font-medium text-stone-700 ${isCompact ? "mt-1.5 text-[11px] leading-[1.45]" : "mt-3 text-sm"}`}>
            ต้องการอีก <span className="font-bold text-red-600">{rankData.rp_needed.toLocaleString()}</span>{" "}
            แต้ม เพื่ออัปแรงก์เป็น{" "}
            <span className="font-bold text-amber-600">{rankData.next_rank.name}</span>
          </p>
        </div>
      </button>

      <Modal
        open={showRanksModal}
        onCancel={() => setShowRanksModal(false)}
        footer={null}
        title={null}
        closable
        centered
        width={900}
        className="ranks-modal"
        styles={{ body: { padding: 0, overflow: "hidden" } }}
      >
        <div className="px-4 py-8">
          <h2 className="mb-1 text-center text-2xl font-bold text-gray-900">แรงก์ทั้งหมด</h2>
          <p className="mb-8 text-center text-sm text-gray-500">สะสมแต้มเพื่ออัปแรงก์ของคุณ</p>

          {showRanksModal && allRanks.length > 0 && (
            <>
              <Swiper
                key={showRanksModal ? "open" : "closed"}
                effect="coverflow"
                centeredSlides
                slidesPerView="auto"
                initialSlide={currentRankIndex}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                onSlideChange={(swiper) => setActiveSlideIndex(swiper.activeIndex)}
                coverflowEffect={{
                  rotate: 0,
                  stretch: 0,
                  depth: 200,
                  modifier: 1.5,
                  slideShadows: true,
                }}
                modules={[EffectCoverflow]}
                className="pb-4"
                navigation
              >
                {allRanks.map((rank) => (
                  <SwiperSlide key={rank.rank_id} style={{ width: "200px" }}>
                    <div
                      className={`flex min-h-[240px] flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-300 ${
                        rank.is_current_rank
                          ? "border-red-400 bg-gradient-to-br from-red-50 to-red-100 shadow-xl shadow-red-100"
                          : "border-gray-100 bg-white"
                      }`}
                    >
                      <div
                        className={`flex h-20 w-20 items-center justify-center rounded-full p-1 ${
                          rank.is_current_rank ? "bg-red-50 ring-2 ring-red-300" : "bg-gray-50"
                        }`}
                      >
                        <Image
                          src={rank.rank_img || "/images/user.png"}
                          alt={rank.name}
                          width={90}
                          height={90}
                          className="object-contain"
                          unoptimized
                        />
                      </div>

                      <p
                        className={`text-center text-sm font-bold leading-tight ${
                          rank.is_current_rank ? "text-red-600" : "text-gray-700"
                        }`}
                      >
                        {rank.name}
                      </p>

                      <p className="text-center text-xs text-gray-400">
                        {rank.max_rp !== null
                          ? `${rank.min_rp.toLocaleString()} - ${rank.max_rp.toLocaleString()} RP`
                          : `${rank.min_rp.toLocaleString()}+ RP`}
                      </p>

                      {rank.is_current_rank && (
                        <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                          แรงก์ปัจจุบัน
                        </span>
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              <div className="mt-4 flex h-10 justify-center">
                <button
                  onClick={() => swiperRef.current?.slideTo(currentRankIndex)}
                  className={`inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold !text-white shadow-md transition-all duration-200 hover:bg-red-600 hover:shadow-lg active:scale-95 ${
                    activeSlideIndex === currentRankIndex ? "invisible" : ""
                  }`}
                >
                  {activeSlideIndex > currentRankIndex && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  )}
                  กลับไปแรงก์ของฉัน
                  {activeSlideIndex < currentRankIndex && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
