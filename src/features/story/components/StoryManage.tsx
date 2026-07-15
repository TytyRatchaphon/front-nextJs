"use client";

import React, { useState } from 'react';
import { Tabs, Table, Tag, Button, Space, Image, Tooltip, Dropdown, MenuProps, Typography, Modal } from 'antd';
import { DeleteOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useManageStories, useDeleteStory, useUpdateStory } from '../hooks/useStoryManagement';
import { StoryDisplayStatus, StoryManageItem } from '../types/storyTypes';
import StoryManageDetailModal from './StoryManageDetailModal';
import StoryUploader from './StoryUploader';

const { Text } = Typography;

export default function StoryManage() {
  const [activeTab, setActiveTab] = useState<StoryDisplayStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedStory, setSelectedStory] = useState<StoryManageItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data, isLoading } = useManageStories(currentPage, pageSize, activeTab);
  const deleteMutation = useDeleteStory();
  const updateMutation = useUpdateStory();

  const handleTabChange = (key: string) => {
    setActiveTab(key as StoryDisplayStatus);
    setCurrentPage(1);
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'ยืนยันการลบสตอรี่?',
      content: 'คุณต้องการลบวิดีโอสตอรี่นี้ใช่หรือไม่? การลบจะไม่สามารถกู้คืนได้',
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: () => {
        deleteMutation.mutate(id);
      },
    });
  };

  const handleToggleVisibility = (item: StoryManageItem) => {
    const newStatus = item.publishStatus === 'active' ? 'hidden' : 'active';
    updateMutation.mutate({
      storyItemId: item.id,
      data: { publishStatus: newStatus }
    });
  };

  const openDetailModal = (item: StoryManageItem) => {
    setSelectedStory(item);
    setIsDetailModalOpen(true);
  };

  const getStatusTag = (status: StoryManageItem['status'], displayStatus: StoryDisplayStatus) => {
    if (displayStatus === 'showing') return <Tag color="success">กำลังแสดง</Tag>;
    if (displayStatus === 'scheduled') return <Tag color="processing">รอแสดงผล</Tag>;
    if (displayStatus === 'ended') return <Tag color="default">สิ้นสุด</Tag>;
    if (displayStatus === 'hidden') return <Tag color="warning">ซ่อน</Tag>;
    if (status === 'processing' || status === 'queued') return <Tag color="processing">กำลังประมวลผล</Tag>;
    if (status === 'failed') return <Tag color="error">ล้มเหลว</Tag>;
    return <Tag>{displayStatus || status}</Tag>;
  };

  const getActionMenu = (record: StoryManageItem): MenuProps => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        label: 'ดูรายละเอียด',
        icon: <EyeOutlined />,
        onClick: () => openDetailModal(record),
      },
      {
        key: 'toggle-visibility',
        label: record.publishStatus === 'active' ? 'ซ่อนวิดีโอ' : 'แสดงวิดีโอ',
        icon: <EyeOutlined />,
        onClick: () => handleToggleVisibility(record),
      },
      {
        key: 'delete',
        label: <span className="text-red-500">ลบวิดีโอ</span>,
        icon: <DeleteOutlined className="text-red-500" />,
        onClick: () => handleDelete(record.id),
      },
    ];

    return { items };
  };

  const columns = [
    {
      title: 'วิดีโอ',
      key: 'video',
      render: (_: any, record: StoryManageItem) => (
        <div className="flex items-center gap-3">
          <div className="w-16 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
            {record.thumbnailUrl ? (
              <Image
                src={record.thumbnailUrl}
                alt="thumbnail"
                width="100%"
                height="100%"
                className="object-cover"
                preview={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
          </div>
          <div>
            <Text className="block text-sm font-medium line-clamp-1">{record.originalFileName || 'Story Video'}</Text>
            <Text type="secondary" className="text-xs">ID: {record.id}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'สถานะ',
      key: 'status',
      render: (_: any, record: StoryManageItem) => getStatusTag(record.status, record.displayStatus),
    },
    {
      title: 'สถิติ',
      key: 'stats',
      render: (_: any, record: StoryManageItem) => (
        <Space size="middle">
          <Tooltip title="ยอดวิว">
            <span><EyeOutlined className="mr-1" />{record.viewCount || 0}</span>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'ระยะเวลาแสดงผล',
      key: 'duration',
      render: (_: any, record: StoryManageItem) => (
        <div className="text-xs">
          <div>เริ่ม: {record.startDate ? dayjs(record.startDate).format('DD MMM YYYY HH:mm') : '-'}</div>
          <div>สิ้นสุด: {record.endDate ? dayjs(record.endDate).format('DD MMM YYYY HH:mm') : '-'}</div>
        </div>
      ),
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: StoryManageItem) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const tabs = [
    { key: 'all', label: `ทั้งหมด (${data?.counts?.all || 0})` },
    { key: 'showing', label: `กำลังแสดง (${data?.counts?.showing || 0})` },
    { key: 'scheduled', label: `รอแสดงผล (${data?.counts?.scheduled || 0})` },
    { key: 'processing', label: `กำลังประมวลผล (${data?.counts?.processing || 0})` },
    { key: 'ended', label: `สิ้นสุด (${data?.counts?.ended || 0})` },
    { key: 'hidden', label: `ซ่อน (${data?.counts?.hidden || 0})` },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold m-0">จัดการวิดีโอสตอรี่</h1>
        <StoryUploader>
          <Button type="primary">อัปโหลดวิดีโอ</Button>
        </StoryUploader>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabs}
        className="mb-4"
      />

      <Table
        columns={columns}
        dataSource={data?.items || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: data?.pagination?.total || 0,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
        scroll={{ x: 800 }}
      />

      {isDetailModalOpen && selectedStory && (
        <StoryManageDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedStory(null);
          }}
          storyItemId={selectedStory.id}
        />
      )}
    </div>
  );
}
