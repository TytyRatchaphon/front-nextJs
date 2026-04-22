import * as React from "react";
import Image from 'next/image';
import { PublicUserAchievement, PublicUserAchievementsResponse } from '@/services/api/publicUserApi';
import { Sparkles, Trophy } from 'lucide-react';

interface AchievementShowcaseCardProps {
    data?: PublicUserAchievementsResponse;
}

export const AchievementShowcaseCard: React.FC<AchievementShowcaseCardProps> = ({ data }) => {
    if (!data || data.list.length === 0) {
        return (
            <div className="w-full h-full min-h-[160px] bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Trophy className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">ยังไม่มีความสำเร็จที่แสดง</p>
            </div>
        );
    }

    const MAX_SHOWCASE = 3;
    // เติมช่องว่างให้ครบ 3 ช่องเสมอ
    const showcaseSlots = Array.from({ length: MAX_SHOWCASE }, (_, idx) => data.list[idx] || null);

    return (
        <div className="relative w-full h-full overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-[#FFF6E9] via-[#FFF9EF] to-[#FFEFD6] p-5 shadow-sm flex flex-col">
            <div className="pointer-events-none absolute -right-10 -top-8 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-orange-300/20 blur-2xl" />

            <div className="relative z-10 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E33527]/10 text-[#E33527]">
                        <Trophy size={16} />
                    </div>
                    <p className="mx-1 my-1 text-sm font-bold text-gray-800">เกียรติยศ</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-white/80 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <Sparkles size={12} />
                        {data.list.length}
                    </span>
                    {data.pagination.total > 3 && (
                        <button className="text-xs text-gray-600 hover:text-[#E33527] font-semibold transition-colors">
                            ดูทั้งหมด
                        </button>
                    )}
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-2.5 flex-1">
                {showcaseSlots.map((achievement: PublicUserAchievement | null, idx: number) => {
                    if (!achievement) {
                        return (
                            <div
                                key={`empty-slot-${idx}`}
                                className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-white/60 px-3 text-center"
                            >
                                <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100/50 text-xl font-light text-amber-600/50">
                                    ?
                                </span>
                                <p className="text-xs text-gray-400">ยังไม่ปลดล็อก</p>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={achievement.achievement_id}
                            className="group flex h-full min-h-[120px] flex-col items-center text-center rounded-xl border border-gray-200/70 bg-white/80 p-3 transition-all duration-200 hover:border-[#E33527]/25 hover:bg-white hover:shadow-sm"
                        >
                            <div className="mb-2 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-200 bg-white shadow-sm">
                                {achievement.icon_url ? (
                                    <Image
                                        src={achievement.icon_url}
                                        alt={achievement.title}
                                        width={30}
                                        height={30}
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <Trophy size={18} className="text-amber-500" />
                                )}
                            </div>
                            <p className="line-clamp-2 min-h-[40px] text-center text-sm font-bold text-gray-800 group-hover:text-[#E33527] leading-snug">
                                {achievement.title}
                            </p>
                            <p className="mt-1 line-clamp-1 text-center text-[10px] text-gray-500">
                                {achievement.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
