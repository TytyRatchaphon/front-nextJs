import React from 'react';
import { Modal, Tabs, List, Avatar } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { storyApi } from '../services/storyApi';
import { EyeOutlined, HeartFilled, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

interface StoryInsightsModalProps {
  storyItemId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const StoryInsightsModal: React.FC<StoryInsightsModalProps> = ({ storyItemId, isOpen, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['storyInsights', storyItemId],
    queryFn: () => storyItemId ? storyApi.fetchStoryInsights(storyItemId) : Promise.reject('No ID'),
    enabled: !!storyItemId && isOpen,
  });

  const renderUserList = (users: any[]) => (
    <List
      loading={isLoading}
      dataSource={users}
      className="max-h-96 overflow-y-auto"
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            avatar={
              <Avatar 
                src={item.user?.profile_image} 
                icon={!item.user?.profile_image && <UserOutlined />} 
              />
            }
            title={item.user?.display_name || 'ผู้เข้าชมทั่วไป'}
            description={
              <span className="text-xs text-gray-500">
                {dayjs(item.viewed_at || item.reacted_at).format('D MMM BB HH:mm')}
              </span>
            }
          />
        </List.Item>
      )}
      locale={{ emptyText: 'ยังไม่มีข้อมูล' }}
    />
  );

  return (
    <Modal
      title="ข้อมูลเชิงลึกของสตอรี่"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
    >
      {data && (
        <div className="mb-6 flex gap-8 justify-center mt-4 border-b border-gray-100 dark:border-zinc-800 pb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2">
              <EyeOutlined className="text-blue-500" /> {data.total_viewers}
            </div>
            <div className="text-sm text-gray-500 mt-1">ผู้ชม</div>
          </div>
          <div className="text-center border-l border-gray-200 dark:border-zinc-700 pl-8">
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2">
              <HeartFilled className="text-red-500" /> {data.total_likers}
            </div>
            <div className="text-sm text-gray-500 mt-1">ถูกใจ</div>
          </div>
        </div>
      )}

      <Tabs
        defaultActiveKey="viewers"
        items={[
          {
            key: 'viewers',
            label: `ผู้ชม (${data?.viewers?.length || 0})`,
            children: renderUserList(data?.viewers || []),
          },
          {
            key: 'likers',
            label: `ถูกใจ (${data?.likers?.length || 0})`,
            children: renderUserList(data?.likers || []),
          },
        ]}
      />
    </Modal>
  );
};

export default StoryInsightsModal;
