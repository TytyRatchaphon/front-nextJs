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
    emptyMessage?: string;
};

export const BookEpisodesTab = ({ episodesData, bookId, bookDetail, settings, isLoading, latestUpdate, emptyMessage }: Props) => {
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

    if (isLoading) {
        return <GifLoader className="h-48 w-48 mx-auto" width={200} height={200} />;
    }

    if (!episodesData || !episodesData.groups || episodesData.groups.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-gray-500">{emptyMessage || "ยังไม่มีตอนที่เผยแพร่"}</p>
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

                                        return (
                                            <Link
                                                key={episode.ep_id}
                                                href={`/read/${bookId}/${episode.ep_id}`}
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
                                                    </div>
                                                </div>

                                                {hasPromo && activePromo?.end_date && (
                                                    <div className="flex-shrink-0 px-2 hidden sm:block">
                                                        <CountdownTimer targetDate={activePromo.end_date} />
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0 text-right">
                                                    <div className="flex flex-col items-end justify-center min-w-[60px]">
                                                        {(regularPrice > 0 || hasPromo) ? (
                                                            <div className="flex items-center gap-1.5 justify-end">
                                                                {((settings: any) => {
                                                                    const bookUseFreecoin = (bookDetail as any)?.use_freecoin;
                                                                    const epUseFreecoin = (episode as any)?.use_freecoin;
                                                                    const canUseFreecoin = epUseFreecoin !== undefined && epUseFreecoin !== null
                                                                        ? Number(epUseFreecoin) === 1
                                                                        : (bookUseFreecoin !== undefined && bookUseFreecoin !== null ? Number(bookUseFreecoin) === 1 : true);

                                                                    return (
                                                                        <>
                                                                            {canUseFreecoin && (
                                                                                <Image src={settings?.freecoin || '/images/money-bag.png'} alt="freecoin" width={16} height={16} unoptimized />
                                                                            )}
                                                                            <Image src={settings?.coin || '/images/e-coin.png'} alt="coin" width={16} height={16} unoptimized />
                                                                        </>
                                                                    );
                                                                })(settings)}
                                                                {episode.isBuy ? (
                                                                    <span className="text-sm font-semibold text-gray-400 line-through">{regularPrice}</span>
                                                                ) : hasPromo ? (
                                                                    <>
                                                                        <span className="text-sm font-semibold text-rose-600">{promoPrice}</span>
                                                                        <span className="text-xs text-gray-400 line-through decoration-gray-300">{regularPrice}</span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-sm font-semibold text-orange-600">{regularPrice}</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm font-semibold text-emerald-600">อ่านฟรี</span>
                                                        )}

                                                        {hasPromo && activePromo?.end_date && (
                                                            <div className="sm:hidden mt-1">
                                                                <CountdownTimer targetDate={activePromo.end_date} />
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
