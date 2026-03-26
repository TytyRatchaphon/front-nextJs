import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import GifLoader from "@/components/utility/GifLoader";
import { CountdownTimer } from "@/components/common/CountdownTimer";

type Props = {
    episodesData: any;
    bookId: string;
    bookDetail: any;
    settings: any;
    isLoading: boolean;
    latestUpdate?: string;
};

export const BookEpisodesTab = ({ episodesData, bookId, bookDetail, settings, isLoading, latestUpdate }: Props) => {
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
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

    if (isLoading) {
        return <GifLoader className="h-48 w-48 mx-auto" width={200} height={200} />;
    }

    if (!episodesData || !episodesData.groups || episodesData.groups.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-gray-500">ยังไม่มีตอนที่เผยแพร่</p>
            </div>
        );
    }

    return (
        <div className="px-0">
            {/* Update Info */}
            <div className="px-4 sm:px-6 py-3 flex items-center justify-end ">
                <p className="text-xs text-gray-500">
                    อัพเดทล่าสุด{" "}
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
                                className="w-full flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors"
                            >
                                <h3 className="text-sm font-bold text-gray-900 text-left">{group.name}</h3>
                                <svg
                                    className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
                                        const early = episode?.early_access || {};
                                        const hasEarlyAccess = Boolean(early?.fast_ticket || early?.fast_coin || episode?.isFastTicket);
                                        const canPayByFastTicket = Boolean(early?.fast_ticket ?? episode?.isFastTicket);
                                        const canPayByFastCoin = hasEarlyAccess;
                                        const isFastBuyable = hasEarlyAccess && Boolean(early?.isFast_buyable ?? episode?.isFast_buyable);
                                        const isFastLocked = hasEarlyAccess && !isFastBuyable && !Boolean(episode?.isBuy);
                                        const rawFastTicketPrice = Number(early?.fastTicketPrice);
                                        const fastTicketPrice = Number.isFinite(rawFastTicketPrice) && rawFastTicketPrice > 0 ? rawFastTicketPrice : 1;
                                        const fastCoinPrice = Number(early?.fastCoinPrice ?? regularPrice);
                                        let promoPrice: number | undefined = undefined;
                                        let activePromo: any = null;

                                        const getPrice = (val: any) => {
                                            if (val === null || val === undefined) return undefined;
                                            const v = Number(val);
                                            return isNaN(v) ? undefined : v;
                                        };

                                        if (episode.Discount) {
                                            const p = getPrice(episode.Discount.discount_price);
                                            if (p !== undefined) {
                                                promoPrice = p;
                                                activePromo = episode.Discount;
                                            }
                                        } else if (Array.isArray(episode.promotions) && episode.promotions.length > 0) {
                                            const p = getPrice(episode.promotions[0].discount_price);
                                            if (p !== undefined) {
                                                promoPrice = p;
                                                activePromo = episode.promotions[0];
                                            }
                                        } else if (episode.discount_price !== undefined) {
                                            const p = getPrice(episode.discount_price);
                                            if (p !== undefined) {
                                                promoPrice = p;
                                            }
                                        }

                                        const hasPromo = !episode.isBuy && promoPrice !== undefined && promoPrice < regularPrice && promoPrice >= 0;
                                        const displayRegularPrice = hasPromo ? Number(promoPrice) : regularPrice;
                                        const isDiscountFree = !hasEarlyAccess && hasPromo && Number(promoPrice) === 0 && regularPrice > 0;
                                        const freeUntilLabel = isDiscountFree ? formatFreeUntil(activePromo?.end_date) : null;
                                        const rpEarn = Number((episode as any)?.rp_campaign?.rp_earn ?? 0);
                                        const rpCampaignEnd = (episode as any)?.rp_campaign?.end_date
                                            ? Date.parse((episode as any).rp_campaign.end_date)
                                            : null;
                                        const isRpCampaignActive = !episode.isBuy
                                            && regularPrice > 0
                                            && rpEarn > 0
                                            && (rpCampaignEnd === null || (Number.isFinite(rpCampaignEnd) && rpCampaignEnd > Date.now()));

                                        return (
                                            <Link
                                                key={episode.ep_id}
                                                href={`/read/${bookId}/${episode.ep_id}`}
                                                prefetch={false}
                                                className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors group gap-2"
                                            >
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm text-gray-900 group-hover:text-red-600 font-medium truncate">
                                                            {episode.name.trim()}
                                                        </p>
                                                                {episode.isBuy && (
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                ✓ ซื้อแล้ว
                                                            </span>
                                                        )}
                                                        {isFastLocked && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 whitespace-nowrap">
                                                                ตอนล่วงหน้า
                                                            </span>
                                                        )}
                                                        {isFastBuyable && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 whitespace-nowrap">
                                                                ตอนล่วงหน้า
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0 text-right">
                                                    <div className="flex flex-col items-end justify-center min-w-[60px]">
                                                        {(regularPrice > 0 || hasPromo) && !isDiscountFree ? (
                                                            <div className="flex flex-col items-end gap-1">
                                                                {isRpCampaignActive && (
                                                                    <div className="flex items-center gap-1.5">
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
                                                                            <CountdownTimer targetDate={(episode as any).rp_campaign.end_date} variant="violet" label="RP" />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {hasPromo && activePromo?.end_date && (
                                                                    <div className="flex items-center justify-end">
                                                                        <CountdownTimer targetDate={activePromo.end_date} variant="rose" label="ลดอีก" />
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1.5 justify-end">
                                                                    {((settings: any) => {
                                                                        const bookUseFreecoin = (bookDetail as any)?.use_freecoin;
                                                                        const epUseFreecoin = (episode as any)?.use_freecoin;
                                                                        const canUseFreecoin = epUseFreecoin !== undefined && epUseFreecoin !== null
                                                                            ? Number(epUseFreecoin) === 1
                                                                            : (bookUseFreecoin !== undefined && bookUseFreecoin !== null ? Number(bookUseFreecoin) === 1 : true);
                                                                        const allowFreecoin = canUseFreecoin && !hasEarlyAccess;

                                                                        return (
                                                                            <>
                                                                                {allowFreecoin && (
                                                                                    <Image src={settings?.freecoin || '/images/money-bag.png'} alt="freecoin" width={16} height={16} unoptimized />
                                                                                )}
                                                                                {canPayByFastTicket && !episode.isBuy && (
                                                                                    <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast ticket" width={16} height={16} unoptimized />
                                                                                )}
                                                                                {(canPayByFastCoin || !hasEarlyAccess) && (
                                                                                    <Image src={settings?.coin || '/images/e-coin.png'} alt="coin" width={16} height={16} unoptimized />
                                                                                )}
                                                                            </>
                                                                        );
                                                                    })(settings)}
                                                                    {isFastLocked ? (
                                                                        <span className="text-xs font-semibold text-gray-500">ยังซื้อไม่ได้</span>
                                                                    ) : episode.isBuy ? (
                                                                        <span className="text-sm font-semibold text-gray-400 line-through">{regularPrice}</span>
                                                                    ) : hasEarlyAccess && isFastBuyable ? (
                                                                        <div className="flex items-center gap-2 justify-end text-xs font-medium">
                                                                            <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                                                                                <span>(</span>
                                                                                {canPayByFastTicket && (
                                                                                    <>
                                                                                        <Image src={settings?.fast_ticket || '/images/fast_ticket.png'} alt="fast ticket" width={14} height={14} unoptimized />
                                                                                        <span className="text-sm font-semibold">{fastTicketPrice}</span>
                                                                                    </>
                                                                                )}
                                                                                {canPayByFastTicket && canPayByFastCoin && <span className="text-gray-400">/</span>}
                                                                                {canPayByFastCoin && (
                                                                                    <>
                                                                                        <Image src={settings?.coin || '/images/e-coin.png'} alt="fast coin" width={14} height={14} unoptimized />
                                                                                 <span className="text-sm font-semibold">{fastCoinPrice}</span>
                                                                                     </>
                                                                                 )}
                                                                                 <span>)</span>
                                                                             </div>
                                                                             <span className="text-gray-400">+</span>
                                                                            <div className="inline-flex items-center gap-1 text-orange-600">
                                                                                <Image src={settings?.coin || '/images/e-coin.png'} alt="coin" width={14} height={14} unoptimized />
                                                                                {((episode as any)?.use_freecoin === 1 || ((episode as any)?.use_freecoin == null && (bookDetail as any)?.use_freecoin === 1)) && (
                                                                                    <Image src={settings?.freecoin || '/images/money-bag.png'} alt="freecoin" width={14} height={14} unoptimized />
                                                                                )}
                                                                                <span className="text-sm font-semibold">{displayRegularPrice}</span>
                                                                                {hasPromo && (
                                                                                    <span className="text-xs text-gray-400 line-through decoration-gray-300">{regularPrice}</span>
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
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-sm font-semibold text-emerald-600">{'\u0e15\u0e2d\u0e19\u0e1f\u0e23\u0e35'}</span>
                                                                {freeUntilLabel && (
                                                                    <span className="text-[11px] text-emerald-700">{`\u0e2d\u0e48\u0e32\u0e19\u0e1f\u0e23\u0e35\u0e16\u0e36\u0e07 ${freeUntilLabel}`}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="hidden sm:flex items-center gap-1.5 text-gray-500 w-[50px] justify-end">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        <span className="text-xs">{episode.view}</span>
                                                    </div>

                                                    <span className="hidden md:block text-xs text-gray-500 w-[80px] text-right">
                                                        {new Date(episode.publish_datetime).toLocaleDateString("th-TH", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </span>
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
