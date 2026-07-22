import React, { useState } from 'react';
import { Modal, Tabs, Descriptions, Button, Switch, DatePicker, message, Spin, Space } from 'antd';
import dayjs from 'dayjs';
import { useManageStoryDetail, useUpdateStory } from '../hooks/useStoryManagement';
import StoryInsightsModal from './StoryInsightsModal';
import StoryManageLinksModal from './StoryManageLinksModal';
import StoryPlayer from './StoryPlayer';
import { StoryManageItem } from '../types/storyTypes';

interface StoryManageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyItemId: number;
}

export default function StoryManageDetailModal({ isOpen, onClose, storyItemId }: StoryManageDetailModalProps) {
  const { data: storyDetail, isLoading } = useManageStoryDetail(storyItemId, isOpen);
  const updateMutation = useUpdateStory();

  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleStatusChange = (checked: boolean) => {
    updateMutation.mutate({
      storyItemId,
      data: { publishStatus: checked ? 'active' : 'hidden' }
    });
  };

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      updateMutation.mutate({
        storyItemId,
        data: {
          startDate: dates[0].toISOString(),
          endDate: dates[1].toISOString()
        }
      });
    }
  };

  const renderPlayer = () => {
    if (!storyDetail?.playback) return <div className="text-gray-500 p-4 border rounded">ไม่พบข้อมูลวิดีโอ (อาจหมดอายุ)</div>;
    return (
      <div className="w-full max-w-[400px] mx-auto bg-black rounded-lg overflow-hidden relative" style={{ aspectRatio: '9/16' }}>
        {isPlaying ? (
          <StoryPlayer 
            src={storyDetail.playback.hlsUrl}
            isActive={true}
            isMuted={false}
          />
        ) : (
          <div className="w-full h-full relative cursor-pointer" onClick={() => setIsPlaying(true)}>
            {storyDetail.thumbnailUrl && <img src={storyDetail.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover opacity-70" />}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[16px] border-l-white border-b-8 border-b-transparent ml-1"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      title="รายละเอียดวิดีโอสตอรี่"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden
    >
      {isLoading ? (
        <div className="flex justify-center p-8"><Spin size="large" /></div>
      ) : storyDetail ? (
        <div className="flex flex-col md:flex-row gap-6 mt-4">
          <div className="w-full md:w-[320px] flex-shrink-0">
            {renderPlayer()}
          </div>
          <div className="flex-1">
            <Descriptions column={1} bordered size="small" layout="vertical">
              <Descriptions.Item label="ID">{storyDetail.id}</Descriptions.Item>
              <Descriptions.Item label="สถานะ (Status)">{storyDetail.status}</Descriptions.Item>
              <Descriptions.Item label="สถานะแสดงผล (Display)">{storyDetail.displayStatus}</Descriptions.Item>
              <Descriptions.Item label="เปิดให้แสดงผล (Active)">
                <Switch 
                  checked={storyDetail.publishStatus === 'active'} 
                  onChange={handleStatusChange} 
                  loading={updateMutation.isPending}
                />
              </Descriptions.Item>
              <Descriptions.Item label="ระยะเวลา">
                <DatePicker.RangePicker 
                  showTime
                  defaultValue={
                    storyDetail.startDate && storyDetail.endDate ? 
                    [dayjs(storyDetail.startDate), dayjs(storyDetail.endDate)] : undefined
                  }
                  onChange={handleDateChange}
                  disabled={updateMutation.isPending}
                  className="w-full"
                />
              </Descriptions.Item>
              <Descriptions.Item label="สถิติ">
                ยอดวิว: {storyDetail.viewCount} | ถูกใจ: {storyDetail.likeCount} | คอมเมนต์: {storyDetail.commentCount}
              </Descriptions.Item>
            </Descriptions>

            <div className="mt-6 flex flex-col gap-3">
              <Button type="primary" block onClick={() => setIsLinksModalOpen(true)}>
                จัดการปุ่มลิงก์ (CTA)
              </Button>
              <Button block onClick={() => setIsInsightsModalOpen(true)}>
                ดูข้อมูลเชิงลึก (Insights & Viewers)
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 text-red-500">ไม่พบข้อมูลสตอรี่</div>
      )}

      {isLinksModalOpen && (
        <StoryManageLinksModal
          open={isLinksModalOpen}
          onCancel={() => setIsLinksModalOpen(false)}
          storyItemId={storyItemId}
        />
      )}

      {isInsightsModalOpen && (
        <StoryInsightsModal
          isOpen={isInsightsModalOpen}
          onClose={() => setIsInsightsModalOpen(false)}
          storyItemId={storyItemId}
        />
      )}
    </Modal>
  );
}
