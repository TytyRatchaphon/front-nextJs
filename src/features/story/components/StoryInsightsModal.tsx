"use client";

import { EyeOutlined, HeartFilled } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { List, Modal, Tabs } from "antd";
import dayjs from "dayjs";

import { storyApi } from "../services/storyApi";
import StoryAvatar from "./StoryAvatar";

interface StoryInsightsModalProps {
  storyItemId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

type InsightUser = {
  user?: { profile_image?: string | null; display_name?: string | null };
  viewed_at?: string;
  reacted_at?: string;
};

export default function StoryInsightsModal({ storyItemId, isOpen, onClose }: StoryInsightsModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["storyInsights", storyItemId],
    queryFn: () => storyApi.fetchStoryInsights(storyItemId as number),
    enabled: storyItemId !== null && isOpen,
  });

  const renderUsers = (users: InsightUser[]) => (
    <List
      loading={isLoading}
      dataSource={users}
      className="max-h-96 overflow-y-auto"
      locale={{ emptyText: "ยังไม่มีข้อมูล" }}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            avatar={(
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                <StoryAvatar src={item.user?.profile_image} alt={item.user?.display_name || ""} />
              </div>
            )}
            title={item.user?.display_name || "ผู้เข้าชมทั่วไป"}
            description={dayjs(item.viewed_at || item.reacted_at).format("D MMM YYYY HH:mm")}
          />
        </List.Item>
      )}
    />
  );

  return (
    <Modal title="ข้อมูลเชิงลึกของสตอรี่" open={isOpen} onCancel={onClose} footer={null} destroyOnHidden centered>
      <div className="mb-6 mt-4 flex justify-center gap-8 border-b border-gray-100 pb-6">
        <div className="text-center">
          <div className="flex items-center gap-2 text-3xl font-bold"><EyeOutlined className="text-blue-500" />{data?.total_viewers || 0}</div>
          <div className="mt-1 text-sm text-gray-500">ผู้ชม</div>
        </div>
        <div className="border-l border-gray-200 pl-8 text-center">
          <div className="flex items-center gap-2 text-3xl font-bold"><HeartFilled className="text-red-500" />{data?.total_likers || 0}</div>
          <div className="mt-1 text-sm text-gray-500">ถูกใจ</div>
        </div>
      </div>
      <Tabs
        defaultActiveKey="viewers"
        items={[
          { key: "viewers", label: `ผู้ชม (${data?.viewers?.length || 0})`, children: renderUsers(data?.viewers || []) },
          { key: "likers", label: `ถูกใจ (${data?.likers?.length || 0})`, children: renderUsers(data?.likers || []) },
        ]}
      />
    </Modal>
  );
}
