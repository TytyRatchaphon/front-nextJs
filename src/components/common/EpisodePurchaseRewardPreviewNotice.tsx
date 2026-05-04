"use client";

import { Alert, Skeleton } from "antd";
import type { EpisodePurchaseRewardPreviewResult } from "@/services/api/episodePurchaseRewardApi";

type EpisodePurchaseRewardPreviewNoticeProps = {
  loading?: boolean;
  preview?: EpisodePurchaseRewardPreviewResult | null;
};

export function EpisodePurchaseRewardPreviewNotice({
  loading = false,
  preview = null,
}: EpisodePurchaseRewardPreviewNoticeProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2">
        <Skeleton.Input active size="small" className="!w-full" />
      </div>
    );
  }

  if (!preview?.message) return null;

  return (
    <Alert
      showIcon
      type={preview.tone}
      message={preview.message}
      className="!rounded-xl !text-left"
    />
  );
}
