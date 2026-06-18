"use client";
import { Suspense, useEffect, useState } from "react";
import { Image as AntdImage, Button } from "antd";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import GifLoader from "@/components/utility/GifLoader";
import { imageLoader } from "@/utils/imageUtils";
import AmountPill from "@/components/utility/AmountPill";
import FreeCoinPill from "@/components/utility/FreeCoinPill";
import StampPill from "@/components/utility/StampPill";
import RPPill from "@/components/utility/RPPill";
import ProfileAchievements from "@/components/achievement/ProfileAchievements";
import UserRankShowcase from "@/features/user/components/UserRankShowcase";
import RpQuestPanel from "@/features/user/components/RpQuestPanel";
import FrameOverlayImage from "@/components/ui/FrameOverlayImage";
import FastTicketPill from "@/components/utility/FastTicketPill";

function MyProfileContent() {
  const { user, isLoggedIn, hasMounted } = useAuthStore();
  const router = useRouter();
  const [bannerError, setBannerError] = useState(false);

  useEffect(() => {
    setBannerError(false);
  }, [user?.banner]);

    // document.title override removed in favor of SSR metadata

  if (!hasMounted) {
    return <GifLoader className="h-64" width={150} height={150} />;
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white pb-10 font-primary">
        <p className="mb-4 text-gray-500">กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์ของคุณ</p>
        <Button type="primary" onClick={() => router.push("/")}>
          กลับหน้าหลัก
        </Button>
      </div>
    );
  }

  const {
    fullname,
    banner,
    img: profileImg,
    frame,
    aka,
    stamp = 0,
    coin = 0,
    freecoin = 0,
    current_rp = 0,
    fast_ticket = 0,
  } = user as any;

  return (
    <div className="min-h-screen bg-white pb-10 font-primary">
      <div className="relative h-[200px] w-full overflow-hidden bg-gray-100 md:h-[280px]">
        {banner && !bannerError ? (
          <AntdImage
            src={imageLoader({
              src:
                banner.startsWith("http") || banner.startsWith("data:") || banner.startsWith("/")
                  ? banner
                  : `https://img.enjoybook.co/${banner}`,
              width: 1000,
            })}
            alt="Banner"
            width="100%"
            height="100%"
            style={{ objectFit: "cover" }}
            preview={false}
            onError={() => setBannerError(true)}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-red-600 to-rose-500" />
        )}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="container relative z-10 mx-auto mb-8 -mt-16 px-4 md:mb-12">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100/50 bg-white/95 p-4 shadow-xl backdrop-blur-sm md:flex-row md:items-center md:gap-6 md:p-6">
          <div className="relative shrink-0 md:-mt-20">
            <div className="group relative -mt-16 h-28 w-28 overflow-hidden rounded-full border-[4px] border-white bg-gray-50 shadow-lg md:h-40 md:w-40 md:border-[6px]">
              <AntdImage
                src={imageLoader({
                  src: profileImg
                    ? profileImg.startsWith("http") ||
                      profileImg.startsWith("data:") ||
                      profileImg.startsWith("/")
                      ? profileImg
                      : `https://img.enjoybook.co/${profileImg}`
                    : "/images/default-avatar.png",
                  width: 300,
                })}
                alt="Profile"
                width="100%"
                height="100%"
                className="object-cover transition-transform duration-500"
                style={{ objectFit: "cover", zIndex: 1 }}
                preview={false}
                fallback="/images/default-avatar.png"
              />
              {frame?.img && (
                <div className="pointer-events-none absolute inset-0 z-10">
                  <FrameOverlayImage src={frame.img} alt="Frame" className="object-contain" />
                </div>
              )}
            </div>
          </div>

          <div className="w-full flex-1 text-center md:w-auto md:text-left">
            <h1 className="mb-2 truncate px-2 text-2xl font-bold text-gray-900 md:px-0 md:text-3xl">
              {fullname || "ผู้ใช้งาน"}
            </h1>
            <p className="mb-3 text-sm font-medium text-gray-500">
              ฉายา: {aka?.name || "ไม่มีฉายา"}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-gray-600 md:justify-start md:gap-4">
              <AmountPill amount={Number(coin) || 0} />
              <FreeCoinPill amount={Number(freecoin) || 0} />
              <StampPill amount={Number(stamp) || 0} />
              <RPPill amount={Number(current_rp) || 0} />
              <FastTicketPill amount={Number(fast_ticket) || 0} />
            </div>
          </div>

          <div className="flex w-full justify-center gap-3 md:w-auto md:justify-start">
            <Button
              onClick={() => router.push("/sprofile")}
              className="flex h-12 items-center gap-2 rounded-full border border-gray-300 bg-white px-8 text-base font-medium text-gray-800 shadow-sm transition-all hover:!border-red-600 hover:!text-red-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              แก้ไขข้อมูล
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-8 px-4">
        <div className="mb-6">
          <RpQuestPanel />
        </div>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          <UserRankShowcase />
          <ProfileAchievements />
        </div>
      </div>
    </div>
  );
}

export default function MyProfile() {
  return (
    <Suspense fallback={<GifLoader />}>
      <MyProfileContent />
    </Suspense>
  );
}
