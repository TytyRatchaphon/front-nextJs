"use client";

import React, { useState, useMemo } from "react";
import { ChevronUp, Clock, Gift, Info, ShoppingCart, Tag } from "lucide-react";

type EpPurchaseRewardCampaign = {
  campaign_id: number;
  buy_count: number;
  reward_count: number;
  badge_label: string;
  display_title: string;
  display_description: string;
  icon_url: string | null;
  detail_text: string;
  start_date: string;
  end_date: string | null;
};

type EpPurchaseRewardData = {
  has_promotion: boolean;
  campaign?: EpPurchaseRewardCampaign | null;
};

interface EpPurchaseRewardCollapseProps {
  data: EpPurchaseRewardData | null | undefined;
}

export default function EpPurchaseRewardCollapse({ data }: EpPurchaseRewardCollapseProps) {
  const [isOpen, setIsOpen] = useState(false);

  const campaign = data?.campaign;

  const startDate = campaign?.start_date;
  const formattedStartDate = useMemo(() => {
    if (!startDate) return null;
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  }, [startDate]);

  const endDate = campaign?.end_date;
  const formattedEndDate = useMemo(() => {
    if (!endDate) return null;
    const d = new Date(endDate);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  }, [endDate]);

  if (!data?.has_promotion || !campaign) return null;

  return (
    <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50/70 via-white to-white overflow-hidden shadow-sm">
      {/* Header badge + title */}
      <div className="px-4 pt-4 pb-3">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
            <Tag className="h-3 w-3" />
            {campaign.badge_label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 leading-snug">
          {campaign.display_title}
        </h3>

        {/* Date */}
        {formattedStartDate && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            <span>
              เริ่ม {formattedStartDate}
              {formattedEndDate && ` – ${formattedEndDate}`}
            </span>
          </div>
        )}
      </div>

      {/* Expand toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-pink-50/50 transition-colors border-t border-pink-100/50"
      >
        <Info className="h-4 w-4" />
        <span>ดูเพิ่มเติม</span>
        <ChevronUp className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "" : "rotate-180"}`} />
      </button>

      {/* Collapsible content */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-4">
            {/* Condition label */}
            <p className="text-xs text-gray-400 font-medium">เงื่อนไขและรายละเอียดรางวัล</p>

            {/* Buy / Reward pills */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
                  <ShoppingCart className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium leading-tight">ซื้อตอน</p>
                  <p className="text-lg font-bold text-gray-900 leading-tight">{campaign.buy_count} <span className="text-sm font-medium text-gray-500">ตอน</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50">
                  <Gift className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium leading-tight">รับฟรี</p>
                  <p className="text-lg font-bold text-gray-900 leading-tight">{campaign.reward_count} <span className="text-sm font-medium text-gray-500">ตอน</span></p>
                </div>
              </div>
            </div>

            {/* Description */}
            {campaign.display_description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {campaign.display_description}
              </p>
            )}

            {/* Detail text */}
            {campaign.detail_text && (
              <div className="rounded-xl bg-red-50/60 border border-red-100/60 px-4 py-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-1">รายละเอียดแคมเปญ</p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {campaign.detail_text}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
