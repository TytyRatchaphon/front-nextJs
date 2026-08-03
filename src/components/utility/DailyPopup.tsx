"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { Modal } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useUIStore } from "@/stores/uiStore";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { fetchHomeData, PopupItem } from "@/services/apiServices";
import { useRouter } from "next/navigation";
import { navigateSafely } from "@/utils/navigationUtils";
import { useAuthStore } from "@/stores/authStore";
import { parseJwtToken } from "@/utils/jwtParser";

import "swiper/css";
import "swiper/css/pagination";

const STORAGE_KEY = "enjoybook_promo_popup_closed_date";

interface PromoItem {
  id: number;
  imageUrl: string;
  linkUrl: string;
  position?: "center" | "bottom_right" | string;
}

const isSameDay = (timestamp1: number, timestamp2: number): boolean => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const resolvePopupLink = (item: PopupItem): string => {
  if (item.type_link === "novel") {
    return item.ref_id ? `/book/${item.ref_id}` : `/book/${item.popup_id}`;
  }

  if (item.txt && (item.txt.startsWith("http") || item.txt.startsWith("/"))) {
    return item.txt;
  }

  if (item.ref_id !== undefined && item.ref_id !== null) {
    return String(item.ref_id);
  }

  return "#";
};

const DailyPromoPopup: React.FC = () => {
  const router = useRouter();
  const { isDailyPopupOpen, openDailyPopup, closeDailyPopup, setDailyPopupProcessComplete } = useUIStore();
  const token = useAuthStore((state) => state.token);

  const [centerPromoItems, setCenterPromoItems] = useState<PromoItem[]>([]);
  const [floatingPromoItem, setFloatingPromoItem] = useState<PromoItem | null>(null);
  const [isFloatingVisible, setIsFloatingVisible] = useState(false);
  const [activeCenterIndex, setActiveCenterIndex] = useState(0);
  const [shouldMountCenterPopup, setShouldMountCenterPopup] = useState(false);

  const resolveInternalPath = (rawUrl: string): string | null => {
    const raw = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!raw || raw === "#") return null;

    // Absolute/protocol-relative URL: only keep internal when it's enjoybook domain.
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("//")) {
      try {
        const parsed = new URL(
          raw.startsWith("//") ? `${window.location.protocol}${raw}` : raw,
          window.location.origin
        );
        const isCoinEnjoyDomain =
          parsed.hostname === "coinenjoy.enjoybook.co" ||
          parsed.hostname.endsWith(".coinenjoy.enjoybook.co");
        if (isCoinEnjoyDomain) {
          return null;
        }
        const isEnjoybookDomain =
          parsed.hostname === "enjoybook.co" ||
          parsed.hostname.endsWith(".enjoybook.co");
        if (isEnjoybookDomain) {
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
        return null;
      } catch {
        return null;
      }
    }

    if (raw.startsWith("/")) return raw;

    return `/${raw.replace(/^\/+/, "")}`;
  };

  const attachTokenToCoinEnjoyLink = (rawUrl: string): string => {
    const raw = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!raw || raw === "#") return rawUrl;

    const authToken = parseJwtToken(token);
    if (!authToken) return rawUrl;

    if (!(raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("//"))) {
      return rawUrl;
    }

    try {
      const parsed = new URL(
        raw.startsWith("//") ? `${window.location.protocol}${raw}` : raw,
        window.location.origin
      );
      const isCoinEnjoyDomain =
        parsed.hostname === "coinenjoy.enjoybook.co" ||
        parsed.hostname.endsWith(".coinenjoy.enjoybook.co");

      if (!isCoinEnjoyDomain) return rawUrl;

      parsed.searchParams.set("tk", authToken);
      return parsed.toString();
    } catch {
      return rawUrl;
    }
  };

  const navigateByLink = (linkUrl: string) => {
    const targetUrl = attachTokenToCoinEnjoyLink(linkUrl);
    const internalPath = resolveInternalPath(targetUrl);
    if (internalPath) {
      router.push(internalPath);
      return;
    }
    if (targetUrl && targetUrl !== "#") {
      navigateSafely(targetUrl, { allowExternal: true });
    }
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;
    let removeInteractionListeners: (() => void) | undefined;

    const initPopup = async () => {
      try {
        const homeData = await fetchHomeData(undefined, undefined, { skipAuth: true });
        const popupList = homeData?.data?.popup ?? [];

        if (popupList.length === 0) {
          setDailyPopupProcessComplete(true);
          return;
        }

        const mappedItems: PromoItem[] = popupList.map((item) => ({
          id: item.popup_id,
          imageUrl: item.img,
          linkUrl: resolvePopupLink(item),
          position: item.position,
        }));

        const centerItems = mappedItems.filter((item) => item.position !== "bottom_right");
        const bottomRightItem = mappedItems.find((item) => item.position === "bottom_right") ?? null;

        setCenterPromoItems(centerItems);
        setFloatingPromoItem(bottomRightItem);
        setIsFloatingVisible(Boolean(bottomRightItem));

        if (centerItems.length === 0) {
          setDailyPopupProcessComplete(true);
          return;
        }

        const lastCloseDate = localStorage.getItem(STORAGE_KEY);
        if (!lastCloseDate || !isSameDay(Number.parseInt(lastCloseDate, 10), Date.now())) {
          const openAfterInteraction = () => {
            removeInteractionListeners?.();
            setShouldMountCenterPopup(true);
            openDailyPopup();
          };
          const events = ["pointerdown", "keydown", "scroll", "touchstart"];
          removeInteractionListeners = () => {
            events.forEach((eventName) => window.removeEventListener(eventName, openAfterInteraction));
          };
          events.forEach((eventName) => {
            window.addEventListener(eventName, openAfterInteraction, { once: true, passive: true });
          });
          return;
        }

        setDailyPopupProcessComplete(true);
      } catch {
        setDailyPopupProcessComplete(true);
      }
    };

    const runInit = () => {
      void initPopup();
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = (
        window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number }
      ).requestIdleCallback(() => runInit());
    } else {
      timeoutId = setTimeout(runInit, 1500);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      removeInteractionListeners?.();
      if (typeof window !== "undefined" && idleId && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (handle: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, [openDailyPopup, setDailyPopupProcessComplete]);

  const handleCenterClose = () => {
    closeDailyPopup();
    setShouldMountCenterPopup(false);
  };

  const handleCenterDisableToday = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    closeDailyPopup();
    setShouldMountCenterPopup(false);
  };

  const handleCenterPromoClick = (linkUrl: string) => {
    closeDailyPopup();
    setShouldMountCenterPopup(false);
    navigateByLink(linkUrl);
  };

  const handleFloatingClose = () => {
    setIsFloatingVisible(false);
  };

  const handleFloatingPromoClick = (linkUrl: string) => {
    setIsFloatingVisible(false);
    navigateByLink(linkUrl);
  };

  if (centerPromoItems.length === 0 && (!floatingPromoItem || !isFloatingVisible)) return null;

  return (
    <>
      {shouldMountCenterPopup && centerPromoItems.length > 0 ? (
        <Modal
          open={isDailyPopupOpen}
          onCancel={handleCenterClose}
          centered
          footer={null}
          width={400}
          zIndex={5000}
          closeIcon={null}
          destroyOnHidden
          styles={{
            content: {
              padding: 0,
              borderRadius: "16px",
              overflow: "hidden",
              background: "transparent",
              boxShadow: "none",
            },
            mask: { backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.6)" },
          }}
          className="custom-daily-popup"
        >
        <div className="relative w-full max-w-[400px]">
          <div className="relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              onClick={handleCenterClose}
              className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/40"
              aria-label="Close"
            >
              <CloseOutlined style={{ fontSize: "14px" }} />
            </button>

            <Swiper
              modules={[Pagination, Autoplay]}
              pagination={{ clickable: true, dynamicBullets: true }}
              loop={centerPromoItems.length > 1}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              className="aspect-[3/4] w-full"
              onSlideChange={(swiper) => setActiveCenterIndex(swiper.realIndex)}
            >
              {centerPromoItems.map((item, index) => {
                const isFirstSlide = index === 0;
                const shouldRenderImage =
                  centerPromoItems.length <= 2 ||
                  Math.abs(index - activeCenterIndex) <= 1 ||
                  Math.abs(index - activeCenterIndex) >= centerPromoItems.length - 1;

                return (
                  <SwiperSlide key={item.id} className="group relative h-full w-full">
                  <a
                    href={item.linkUrl || "#"}
                    onClick={(event) => {
                      event.preventDefault();
                      handleCenterPromoClick(item.linkUrl);
                    }}
                    className="relative block h-full w-full overflow-hidden"
                  >
                    {shouldRenderImage ? (
                      <Image
                        src={item.imageUrl}
                        alt="Promotion"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 400px) 100vw, 400px"
                        loading={isFirstSlide ? "eager" : "lazy"}
                        quality={65}
                      />
                    ) : null}
                  </a>
                </SwiperSlide>
                );
              })}
            </Swiper>

            <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3">
              <span className="font-primary text-sm text-gray-500">แนะนำวันนี้</span>
              <button
                onClick={handleCenterDisableToday}
                className="font-primary text-xs text-gray-400 underline decoration-dotted transition-colors hover:!text-red-500"
              >
                ไม่ต้องแสดงวันนี้
              </button>
            </div>
          </div>
        </div>
        </Modal>
      ) : null}

      {floatingPromoItem && isFloatingVisible ? (
        <div className="fixed bottom-40 right-4 z-[910]">
          <div className="relative">
            <button
              type="button"
              onClick={handleFloatingClose}
              className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white shadow-md transition-colors hover:bg-black/80"
              aria-label="Close floating promotion"
            >
              <CloseOutlined style={{ fontSize: "12px" }} />
            </button>
            <button
              type="button"
              onClick={() => handleFloatingPromoClick(floatingPromoItem.linkUrl)}
              className="relative h-16 w-16 overflow-hidden rounded-full border border-white/80 bg-white shadow-xl transition-transform hover:scale-105 sm:h-20 sm:w-20"
              aria-label="Open promotion"
            >
              <Image
                src={floatingPromoItem.imageUrl}
                alt="Floating promotion"
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default DailyPromoPopup;
