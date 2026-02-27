"use client";

import React, { useState, useMemo, useCallback } from "react";
import { notification } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import type { QuestGroup, QuestItem } from "@/services/api/userApi";
import { claimQuest } from "@/services/api/userApi";
import Cookies from "js-cookie";

interface QuestSectionProps {
    questGroups: QuestGroup[];
    onRefresh?: () => void;
}

const TAB_CONFIG: { key: string; label: string }[] = [
    { key: "daily", label: "รายวัน" },
    { key: "weekly", label: "รายสัปดาห์" },
    { key: "monthly", label: "รายเดือน" },
];

/** Calculate human-readable time remaining from now until endDate */
function getTimeRemaining(endDate: string): string {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) return "หมดเวลาแล้ว";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `เหลือ ${days} วัน ${hours} ชม.`;
    if (hours > 0) return `เหลือ ${hours} ชม. ${minutes} นาที`;
    return `เหลือ ${minutes} นาที`;
}

export default function QuestSection({ questGroups, onRefresh }: QuestSectionProps) {
    // Flatten all quests into a map by group key
    const questsByGroup = useMemo(() => {
        const map: Record<string, QuestItem[]> = {};
        for (const group of questGroups) {
            for (const quest of group.quests) {
                if (!map[quest.group]) map[quest.group] = [];
                map[quest.group].push(quest);
            }
        }
        return map;
    }, [questGroups]);

    // Available tabs (only show tabs that have quests)
    const availableTabs = useMemo(
        () => TAB_CONFIG.filter((tab) => questsByGroup[tab.key]?.length > 0),
        [questsByGroup]
    );

    const [activeTab, setActiveTab] = useState<string>(() => availableTabs[0]?.key || "daily");
    const [claimingId, setClaimingId] = useState<number | null>(null);

    const activeQuests = questsByGroup[activeTab] || [];

    const handleClaim = useCallback(async (questId: number) => {
        setClaimingId(questId);
        try {
            const rawToken = Cookies.get("token") || localStorage.getItem("token") || localStorage.getItem("authToken");
            const token = rawToken ? rawToken.replace(/^['"]+|['"]+$/g, "") : "";

            await claimQuest(questId, token || undefined);
            notification.success({
                message: "รับรางวัลสำเร็จ!",
                description: "คุณได้รับ RP เรียบร้อยแล้ว",
                icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
                placement: "topRight",
            });
            onRefresh?.();
        } catch (error: any) {
            const msg = error?.response?.data?.message || "ไม่สามารถรับรางวัลได้ กรุณาลองใหม่";
            notification.error({
                message: "เกิดข้อผิดพลาด",
                description: msg,
                placement: "topRight",
            });
        } finally {
            setClaimingId(null);
        }
    }, [onRefresh]);

    if (availableTabs.length === 0) return null;

    return (
        <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            {/* Header */}
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🎯</span> ภารกิจ
            </h2>

            {/* Tab Bar */}
            <div className="flex gap-2 mb-4">
                {availableTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                            activeTab === tab.key
                                ? "bg-red-600 !text-white border-red-600 shadow-md shadow-red-100"
                                : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-500"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Quest Cards */}
            <div className="flex flex-col gap-3">
                {activeQuests.map((quest) => (
                    <QuestCard
                        key={quest.quest_id}
                        quest={quest}
                        isClaiming={claimingId === quest.quest_id}
                        onClaim={handleClaim}
                    />
                ))}
            </div>

            {activeQuests.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                    ไม่มีภารกิจในขณะนี้
                </div>
            )}
        </div>
    );
}

// --- Quest Card ---

interface QuestCardProps {
    quest: QuestItem;
    isClaiming: boolean;
    onClaim: (questId: number) => void;
}

function QuestCard({ quest, isClaiming, onClaim }: QuestCardProps) {
    const isComplete = quest.status === "complete";
    const hasLimit = quest.max_per_user !== null && quest.max_per_user > 0;
    const progress = hasLimit
        ? Math.min(100, (quest.current_count / quest.max_per_user!) * 100)
        : 0;

    return (
        <div
            className={`rounded-2xl p-4 border transition-all duration-200 ${
                isComplete
                    ? "bg-green-50/60 border-green-200"
                    : "bg-gray-50/80 border-gray-100 hover:border-gray-200 hover:shadow-sm"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {isComplete && (
                            <span className="text-green-500 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </span>
                        )}
                        <h3 className={`text-sm font-bold truncate ${isComplete ? "text-green-700" : "text-gray-900"}`}>
                            {quest.name}
                        </h3>
                    </div>

                    {quest.description && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{quest.description}</p>
                    )}

                    {/* Progress bar (if max_per_user exists) */}
                    {hasLimit && (
                        <div className="mb-2">
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isComplete ? "bg-green-400" : "bg-red-500"
                                    }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {quest.current_count}/{quest.max_per_user} ครั้ง
                            </p>
                        </div>
                    )}

                    {/* Time remaining */}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>{getTimeRemaining(quest.end_date)}</span>
                    </div>
                </div>

                {/* Right: Reward + Claim */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* RP Reward Badge */}
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 3h12l4 6-10 13L2 9Z"></path>
                            <path d="M11 3 8 9l4 13 4-13-3-6"></path>
                            <path d="M2 9h20"></path>
                        </svg>
                        {quest.reward_rp} RP
                    </span>

                    {/* Claim Button */}
                    {isComplete && (
                        <button
                            onClick={() => onClaim(quest.quest_id)}
                            disabled={isClaiming}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                isClaiming
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-green-500 text-white hover:bg-green-600 shadow-sm hover:shadow-md active:scale-95"
                            }`}
                        >
                            {isClaiming ? "กำลังรับ..." : "🎁 รับรางวัล"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
