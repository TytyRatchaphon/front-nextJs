"use client";

import { Button, DatePicker, Descriptions, Modal, Spin, Switch } from "antd";
import dayjs from "dayjs";
import Image from "next/image";
import { useState } from "react";

import { useManageStoryDetail, useUpdateStory } from "../hooks/useStoryManagement";
import StoryInsightsModal from "./StoryInsightsModal";
import StoryManageLinksModal from "./StoryManageLinksModal";
import StoryPlayer from "./StoryPlayer";

interface StoryManageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyItemId: number;
}

export default function StoryManageDetailModal({ isOpen, onClose, storyItemId }: StoryManageDetailModalProps) {
  const { data: storyDetail, isLoading } = useManageStoryDetail(storyItemId, isOpen);
  const updateMutation = useUpdateStory();
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Modal title="รายละเอียดวิดีโอสตอรี่" open={isOpen} onCancel={onClose} footer={null} width={900} destroyOnHidden>
      {isLoading ? (
        <div className="flex justify-center p-8"><Spin size="large" /></div>
      ) : storyDetail ? (
        <div className="mt-4 flex flex-col gap-6 md:flex-row">
          <div className="w-full flex-shrink-0 md:w-[320px]">
            {storyDetail.playback ? (
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[400px] overflow-hidden rounded-lg bg-black">
                {isPlaying ? (
                  <StoryPlayer src={storyDetail.playback.hlsUrl} isActive isMuted={false} />
                ) : (
                  <button type="button" className="relative h-full w-full" onClick={() => setIsPlaying(true)} aria-label="เล่นวิดีโอ">
                    {storyDetail.thumbnailUrl ? <Image src={storyDetail.thumbnailUrl} alt="" fill className="object-cover opacity-70" /> : null}
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl text-white">▶</span>
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-md border p-4 text-gray-500">ไม่พบข้อมูลวิดีโอ หรือ URL หมดอายุ</div>
            )}
          </div>

          <div className="flex-1">
            <Descriptions column={1} bordered size="small" layout="vertical">
              <Descriptions.Item label="ID">{storyDetail.id}</Descriptions.Item>
              <Descriptions.Item label="สถานะ">{storyDetail.status}</Descriptions.Item>
              <Descriptions.Item label="สถานะแสดงผล">{storyDetail.displayStatus}</Descriptions.Item>
              <Descriptions.Item label="เปิดให้แสดงผล">
                <Switch
                  checked={storyDetail.publishStatus === "active"}
                  loading={updateMutation.isPending}
                  onChange={(checked) => updateMutation.mutate({ storyItemId, data: { publishStatus: checked ? "active" : "hidden" } })}
                />
              </Descriptions.Item>
              <Descriptions.Item label="ระยะเวลา">
                <DatePicker.RangePicker
                  showTime
                  defaultValue={storyDetail.startDate && storyDetail.endDate ? [dayjs(storyDetail.startDate), dayjs(storyDetail.endDate)] : undefined}
                  disabled={updateMutation.isPending}
                  className="w-full"
                  onChange={(dates) => {
                    if (!dates?.[0] || !dates[1]) return;
                    updateMutation.mutate({
                      storyItemId,
                      data: { startDate: dates[0].toISOString(), endDate: dates[1].toISOString() },
                    });
                  }}
                />
              </Descriptions.Item>
              <Descriptions.Item label="สถิติ">
                ยอดวิว: {storyDetail.viewCount} | ถูกใจ: {storyDetail.likeCount} | ความคิดเห็น: {storyDetail.commentCount}
              </Descriptions.Item>
            </Descriptions>
            <div className="mt-6 flex flex-col gap-3">
              <Button type="primary" block onClick={() => setIsLinksOpen(true)}>จัดการปุ่มลิงก์ (CTA)</Button>
              <Button block onClick={() => setIsInsightsOpen(true)}>ดูข้อมูลเชิงลึก</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-red-500">ไม่พบข้อมูลสตอรี่</div>
      )}

      {isLinksOpen ? <StoryManageLinksModal open onCancel={() => setIsLinksOpen(false)} storyItemId={storyItemId} /> : null}
      {isInsightsOpen ? <StoryInsightsModal isOpen onClose={() => setIsInsightsOpen(false)} storyItemId={storyItemId} /> : null}
    </Modal>
  );
}
