import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Input, Button, App, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { storyApi } from '../services/storyApi';
import { StoryLink, StoryLinkResponse } from '../types/storyTypes';

interface EditableStoryLink {
  id?: number;
  label: string;
  url: string;
  orderBy?: number;
}

interface StoryManageLinksModalProps {
  open: boolean;
  onCancel: () => void;
  storyItemId: number;
  maxLinks?: number;
  onSuccess?: (links: StoryLink[]) => void | Promise<void>;
}

const toViewerLinks = (links: StoryLinkResponse[]): StoryLink[] => links.map((link) => ({
  label: link.label,
  url: link.url,
  order_by: link.orderBy,
}));

const StoryManageLinksModal: React.FC<StoryManageLinksModalProps> = ({
  open,
  onCancel,
  storyItemId,
  maxLinks = 3,
  onSuccess
}) => {
  const { message } = App.useApp();
  const [links, setLinks] = useState<EditableStoryLink[]>([]);
  const [originalLinks, setOriginalLinks] = useState<StoryLinkResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await storyApi.fetchStoryLinks(storyItemId);
      const nextLinks = data.links || [];
      setOriginalLinks(nextLinks);
      setLinks(nextLinks);
    } catch {
      message.error("ไม่สามารถโหลดลิงก์ได้");
    } finally {
      setIsLoading(false);
    }
  }, [message, storyItemId]);

  useEffect(() => {
    if (open && storyItemId) {
      fetchLinks();
    }
  }, [fetchLinks, open, storyItemId]);

  const handleAddLink = () => {
    if (links.length < maxLinks) {
      setLinks([...links, { label: '', url: '' }]);
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinks((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    setLinks((current) => current.map((link, currentIndex) => (
      currentIndex === index ? { ...link, [field]: value } : link
    )));
  };

  const handleMoveLink = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= links.length) return;

    setLinks((current) => {
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
      return reordered;
    });
  };

  const handleSubmit = async () => {
    const validLinks = links
      .filter((link) => link.label.trim() || link.url.trim())
      .map((link, index) => ({
        ...link,
        label: link.label.trim(),
        url: link.url.trim(),
        orderBy: index,
      }));

    if (validLinks.some((link) => !link.label || !link.url)) {
      message.error('กรุณากรอกชื่อและ URL ของทุกลิงก์ให้ครบ');
      return;
    }

    if (validLinks.some((link) => !/^https?:\/\//i.test(link.url))) {
      message.error('URL ต้องขึ้นต้นด้วย http:// หรือ https://');
      return;
    }

    try {
      setIsSaving(true);
      const desiredExistingIds = new Set(
        validLinks.flatMap((link) => link.id === undefined ? [] : [link.id])
      );
      const originalById = new Map(originalLinks.map((link) => [link.id, link]));
      const removedLinks = originalLinks.filter((link) => !desiredExistingIds.has(link.id));
      const changedLinks = validLinks.filter((link) => {
        if (link.id === undefined) return false;
        const original = originalById.get(link.id);
        return original && (original.label !== link.label || original.url !== link.url);
      });
      const newLinks = validLinks.filter((link) => link.id === undefined);

      await Promise.all([
        ...removedLinks.map((link) => storyApi.deleteManageLink(storyItemId, link.id)),
        ...changedLinks.map((link) => storyApi.updateManageLinkSingle(
          storyItemId,
          link.id!,
          { label: link.label, url: link.url }
        )),
      ]);

      if (newLinks.length > 0) {
        await storyApi.createManageLink(storyItemId, {
          links: newLinks.map((link) => ({ label: link.label, url: link.url })),
        });
      }

      const afterMutations = await storyApi.fetchStoryLinks(storyItemId);
      const originalIds = new Set(originalLinks.map((link) => link.id));
      const createdLinks = afterMutations.links
        .filter((link) => !originalIds.has(link.id))
        .sort((left, right) => left.orderBy - right.orderBy);
      let createdIndex = 0;
      const orderedIds = validLinks.map((link) => (
        link.id ?? createdLinks[createdIndex++]?.id
      ));

      if (orderedIds.some((id) => id === undefined)) {
        throw new Error('VIDEO_STORY_LINK_ORDER_MISMATCH');
      }

      if (orderedIds.length > 0) {
        await storyApi.reorderManageLinks(storyItemId, orderedIds);
      }

      const savedLinks = await storyApi.fetchStoryLinks(storyItemId);
      message.success("อัปเดตลิงก์สำเร็จ");
      await onSuccess?.(toViewerLinks(savedLinks.links));
      onCancel();
    } catch {
      message.error("บันทึกลิงก์ไม่สำเร็จ");
      await fetchLinks();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title="จัดการลิงก์ในสตอรี่"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="บันทึก"
      cancelText="ยกเลิก"
      confirmLoading={isSaving}
      width={600}
      centered
      zIndex={10005}
    >
      <div className="mt-4">
        <h3 className="text-base font-medium text-gray-800 mb-2">
          CTA Links (แนบไปพร้อมกับวิดีโอสตอรี่ - สูงสุด {maxLinks} ลิงก์)
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-4">กำลังโหลด...</div>
        ) : (
          <>
            {links.length === 0 && (
              <p className="text-sm text-gray-400 mb-4">
                ยังไม่ได้แนบลิงก์
              </p>
            )}

            <div className="space-y-3 mb-4">
              {links.map((link, index) => (
                <div key={link.id ?? `new-${index}`} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-center text-sm font-medium text-gray-500">
                    {index + 1}
                  </span>
                  <div className="flex flex-col shrink-0">
                    <Tooltip title="เลื่อนขึ้น">
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => handleMoveLink(index, -1)}
                      />
                    </Tooltip>
                    <Tooltip title="เลื่อนลง">
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === links.length - 1}
                        onClick={() => handleMoveLink(index, 1)}
                      />
                    </Tooltip>
                  </div>
                  <Input
                    placeholder="ข้อความลิงก์ (เช่น อ่านต่อ)"
                    value={link.label}
                    onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                    maxLength={80}
                  />
                  <Input
                    placeholder="URL (เช่น https://...)"
                    value={link.url}
                    onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    title="ลบลิงก์"
                    onClick={() => handleRemoveLink(index)}
                  />
                </div>
              ))}
            </div>

            {links.length < maxLinks && (
              <Button
                type="dashed"
                onClick={handleAddLink}
                icon={<PlusOutlined />}
                className="w-full flex items-center justify-center text-gray-500"
              >
                เพิ่มลิงก์
              </Button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default StoryManageLinksModal;
