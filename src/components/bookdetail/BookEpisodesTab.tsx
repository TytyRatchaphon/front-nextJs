import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import GifLoader from "@/components/utility/GifLoader";
import { CountdownTimer } from "@/components/common/CountdownTimer";
import { normalizeEpisodeEarlyAccess } from "@/utils/earlyAccessUtils";

type Props = {
  episodesData: any;
  bookId: string;
  bookDetail: any;
  settings: any;
  isLoading: boolean;
  latestUpdate?: string;
};

const formatThaiDate = (value?: string | null, includeTime = false) => {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit" as const,
          minute: "2-digit" as const,
        }
      : {}),
  });
};

const formatFreeUntil = (endDate?: string | null) => {
  if (!endDate) return null;

  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ReleaseCountdownBadge = ({ targetDate }: { targetDate?: string | null }) => {
  const [countdownText, setCountdownText] = useState<string | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setCountdownText(null);
      return;
    }

    const calculateCountdown = () => {
      const target = new Date(targetDate).getTime();
      if (Number.isNaN(target)) return null;

      const diff = target - Date.now();
      if (diff <= 0) return null;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return `${days > 0 ? `${days} วัน ` : ""}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    const nextValue = calculateCountdown();
    setCountdownText(nextValue);

    if (!nextValue) return;

    const intervalId = window.setInterval(() => {
      const updatedValue = calculateCountdown();
      setCountdownText(updatedValue);

      if (!updatedValue) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [targetDate]);

  if (!countdownText) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 whitespace-nowrap">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3A9 9 0 1112 3a9 9 0 019 9z" />
        </svg>
        จะเผยแพร่อีก
      </span>
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-white px-2 py-1 text-[11px] font-semibold text-amber-700 whitespace-nowrap">
        {countdownText}
      </span>
    </div>
  );
};

export const BookEpisodesTab = ({
  episodesData,
  bookId,
  bookDetail,
  settings,
  isLoading,
  latestUpdate,
}: Props) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  if (isLoading) {
    return <GifLoader className="mx-auto h-48 w-48" width={200} height={200} />;
  }

  if (!episodesData || !episodesData.groups || episodesData.groups.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-500">ยังไม่มีตอนที่เผยแพร่</p>
      </div>
    );
  }

  return (
    <div className="px-0">
      <div className="flex items-center justify-end px-4 py-3 sm:px-6">
        <p className="text-xs text-gray-500">
          อัปเดตล่าสุด{" "}
          {latestUpdate
            ? new Date(latestUpdate).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {episodesData.groups.map((group: any, groupIndex: number) => {
          const isExpanded = expandedGroups[group.group_id] ?? groupIndex === 0;

          const toggleGroup = () => {
            setExpandedGroups((prev) => ({
              ...prev,
              [group.group_id]: !isExpanded,
            }));
          };

          return (
            <div key={group.group_id} className="bg-white">
              <button
                onClick={toggleGroup}
                className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 sm:px-6"
              >
                <h3 className="text-left text-sm font-bold text-gray-900">{group.name}</h3>
                <svg
                  className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="divide-y divide-gray-50">
                  {group.list.map((episode: any) => {
                    const regularPrice = Number(episode.coin ?? 0);
                    const early = normalizeEpisodeEarlyAccess(episode);
                    const hasEarlyAccess = early.isEarlyAccess;
                    const canPayByFastTicket = early.fastTicket;
                    const canPayByFastCoin = early.fastCoin;
                    const isFastBuyable = early.isBuyable;
                    const isFastLocked = hasEarlyAccess && !isFastBuyable && !Boolean(episode?.isBuy);
                    const fastTicketPrice = early.fastTicketPrice;
                    const fastCoinPrice = early.fastCoinPrice;

                    let promoPrice: number | undefined;
                    let activePromo: any = null;

                    const getPrice = (value: any) => {
                      if (value === null || value === undefined) return undefined;
                      const parsed = Number(value);
                      return Number.isNaN(parsed) ? undefined : parsed;
                    };

                    if (episode.Discount) {
                      const nextPromoPrice = getPrice(episode.Discount.discount_price);
                      if (nextPromoPrice !== undefined) {
                        promoPrice = nextPromoPrice;
                        activePromo = episode.Discount;
                      }
                    } else if (Array.isArray(episode.promotions) && episode.promotions.length > 0) {
                      const nextPromoPrice = getPrice(episode.promotions[0].discount_price);
                      if (nextPromoPrice !== undefined) {
                        promoPrice = nextPromoPrice;
                        activePromo = episode.promotions[0];
                      }
                    } else if (episode.discount_price !== undefined) {
                      const nextPromoPrice = getPrice(episode.discount_price);
                      if (nextPromoPrice !== undefined) {
                        promoPrice = nextPromoPrice;
                      }
                    }

                    const hasPromo =
                      !episode.isBuy &&
                      promoPrice !== undefined &&
                      promoPrice < regularPrice &&
                      promoPrice >= 0;
                    const displayRegularPrice = hasPromo ? Number(promoPrice) : regularPrice;
                    const isDiscountFree =
                      !hasEarlyAccess && hasPromo && Number(promoPrice) === 0 && regularPrice > 0;
                    const freeUntilLabel = isDiscountFree ? formatFreeUntil(activePromo?.end_date) : null;

                    const rpEarn = Number((episode as any)?.rp_campaign?.rp_earn ?? 0);
                    const rpCampaignEnd = (episode as any)?.rp_campaign?.end_date
                      ? Date.parse((episode as any).rp_campaign.end_date)
                      : null;
                    const isRpCampaignActive =
                      !episode.isBuy &&
                      regularPrice > 0 &&
                      rpEarn > 0 &&
                      (rpCampaignEnd === null || (Number.isFinite(rpCampaignEnd) && rpCampaignEnd > Date.now()));

                    const publishTimestamp = episode.publish_datetime ? Date.parse(episode.publish_datetime) : NaN;
                    const showReleaseCountdown =
                      hasEarlyAccess && Number.isFinite(publishTimestamp) && publishTimestamp > Date.now();
                    const publishDateLabel = formatThaiDate(episode.publish_datetime);
                    const publishDateTimeLabel = formatThaiDate(episode.publish_datetime, true);

                    const bookUseFreecoin = (bookDetail as any)?.use_freecoin;
                    const episodeUseFreecoin = (episode as any)?.use_freecoin;
                    const canUseFreecoin =
                      episodeUseFreecoin !== undefined && episodeUseFreecoin !== null
                        ? Number(episodeUseFreecoin) === 1
                        : bookUseFreecoin !== undefined && bookUseFreecoin !== null
                          ? Number(bookUseFreecoin) === 1
                          : true;
                    const allowFreecoin = canUseFreecoin && !hasEarlyAccess;

                    return (
                      <Link
                        key={episode.ep_id}
                        href={`/read/${bookId}/${episode.ep_id}`}
                        prefetch={false}
                        className="group flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-gray-50 sm:px-6 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0 w-full md:flex-1 md:pr-4">
                          <div className="flex flex-wrap items-start gap-2">
                            <p className="min-w-0 flex-1 text-sm font-medium text-gray-900 transition-colors group-hover:text-red-600">
                              {episode.name.trim()}
                            </p>
                            {episode.isBuy && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 whitespace-nowrap">
                                ซื้อแล้ว
                              </span>
                            )}
                          </div>

                          {(showReleaseCountdown || isFastLocked || isFastBuyable) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {showReleaseCountdown && (
                                <ReleaseCountdownBadge targetDate={episode.publish_datetime} />
                              )}
                              {isFastLocked && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 whitespace-nowrap">
                                  ต้องซื้อตอนก่อนหน้าเพื่อปลดล็อก
                                </span>
                              )}
                              {isFastBuyable && !showReleaseCountdown && (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 whitespace-nowrap">
                                  เปิดซื้อล่วงหน้าได้
                                </span>
                              )}
                            </div>
                          )}

                          {publishDateTimeLabel && (
                            <div className={`mt-2 text-[11px] font-medium text-gray-500 ${showReleaseCountdown ? "" : "md:hidden"}`}>
                              เผยแพร่ {publishDateTimeLabel} น.
                            </div>
                          )}
                        </div>

                        <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
                          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start sm:justify-between md:w-auto md:justify-end">
                            <div className="flex min-w-0 flex-col gap-1 md:items-end">
                              {(regularPrice > 0 || hasPromo) && !isDiscountFree ? (
                                <div className="flex w-full flex-col gap-1 md:items-end">
                                  {isRpCampaignActive && (
                                    <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 whitespace-nowrap">
                                        <span>{`+${rpEarn}`}</span>
                                        {settings?.rp ? (
                                          <Image
                                            src={settings.rp}
                                            alt="rank point"
                                            width={12}
                                            height={12}
                                            className="object-contain"
                                            unoptimized
                                          />
                                        ) : (
                                          <span>RP</span>
                                        )}
                                      </span>
                                      {(episode as any)?.rp_campaign?.end_date && (
                                        <CountdownTimer
                                          targetDate={(episode as any).rp_campaign.end_date}
                                          variant="violet"
                                          label="RP"
                                        />
                                      )}
                                    </div>
                                  )}

                                  {hasPromo && activePromo?.end_date && (
                                    <div className="flex items-center justify-start md:justify-end">
                                      <CountdownTimer targetDate={activePromo.end_date} variant="rose" label="ลดอีก" />
                                    </div>
                                  )}

                                  <div className="flex w-full flex-wrap items-center gap-1.5 md:justify-end">
                                    {allowFreecoin && (
                                      <Image
                                        src={settings?.freecoin || "/images/money-bag.png"}
                                        alt="freecoin"
                                        width={16}
                                        height={16}
                                        unoptimized
                                      />
                                    )}
                                    {canPayByFastTicket && !episode.isBuy && (
                                      <Image
                                        src={settings?.fast_ticket || "/images/fast_ticket.png"}
                                        alt="fast ticket"
                                        width={16}
                                        height={16}
                                        unoptimized
                                      />
                                    )}
                                    {(canPayByFastCoin || !hasEarlyAccess) && (
                                      <Image
                                        src={settings?.coin || "/images/e-coin.png"}
                                        alt="coin"
                                        width={16}
                                        height={16}
                                        unoptimized
                                      />
                                    )}

                                    {isFastLocked ? (
                                      <span className="text-xs font-semibold text-gray-500">รอปลดล็อกการซื้อ</span>
                                    ) : episode.isBuy ? (
                                      <span className="text-sm font-semibold text-gray-400 line-through">{regularPrice}</span>
                                    ) : hasEarlyAccess && isFastBuyable ? (
                                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                                          <span>(</span>
                                          {canPayByFastTicket && (
                                            <>
                                              <Image
                                                src={settings?.fast_ticket || "/images/fast_ticket.png"}
                                                alt="fast ticket"
                                                width={14}
                                                height={14}
                                                unoptimized
                                              />
                                              <span className="text-sm font-semibold">{fastTicketPrice}</span>
                                            </>
                                          )}
                                          {canPayByFastTicket && canPayByFastCoin && (
                                            <span className="text-gray-400">/</span>
                                          )}
                                          {canPayByFastCoin && (
                                            <>
                                              <Image
                                                src={settings?.coin || "/images/e-coin.png"}
                                                alt="fast coin"
                                                width={14}
                                                height={14}
                                                unoptimized
                                              />
                                              <span className="text-sm font-semibold">{fastCoinPrice}</span>
                                            </>
                                          )}
                                          <span>)</span>
                                        </div>
                                        <span className="text-gray-400">+</span>
                                        <div className="inline-flex items-center gap-1 text-orange-600">
                                          <Image
                                            src={settings?.coin || "/images/e-coin.png"}
                                            alt="coin"
                                            width={14}
                                            height={14}
                                            unoptimized
                                          />
                                          {((episode as any)?.use_freecoin === 1 ||
                                            (((episode as any)?.use_freecoin == null) &&
                                              (bookDetail as any)?.use_freecoin === 1)) && (
                                            <Image
                                              src={settings?.freecoin || "/images/money-bag.png"}
                                              alt="freecoin"
                                              width={14}
                                              height={14}
                                              unoptimized
                                            />
                                          )}
                                          <span className="text-sm font-semibold">{displayRegularPrice}</span>
                                          {hasPromo && (
                                            <span className="text-xs text-gray-400 line-through decoration-gray-300">
                                              {regularPrice}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ) : hasPromo ? (
                                      <>
                                        <span className="text-sm font-semibold text-rose-600">{promoPrice}</span>
                                        <span className="text-xs text-gray-400 line-through decoration-gray-300">{regularPrice}</span>
                                      </>
                                    ) : (
                                      <span className="text-sm font-semibold text-orange-600">{regularPrice}</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col md:items-end">
                                  <span className="text-sm font-semibold text-emerald-600">ตอนฟรี</span>
                                  {freeUntilLabel && (
                                    <span className="text-[11px] text-emerald-700">{`อ่านฟรีถึง ${freeUntilLabel}`}</span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-3 text-gray-500 sm:justify-end md:gap-4">
                              <div className="flex items-center gap-1.5">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                <span className="text-xs">{episode.view}</span>
                              </div>

                              {!showReleaseCountdown && publishDateLabel && (
                                <span className="text-right text-xs text-gray-500">{publishDateLabel}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
