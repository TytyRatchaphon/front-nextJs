import React, { useState, useEffect } from 'react';
import { Modal, Input, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

interface CTA {
  label: string;
  url: string;
}

interface StoryUploadModalProps {
  open: boolean;
  onCancel: () => void;
  onUpload: (links: { label: string; url: string; orderBy?: number }[]) => void;
  file: File | null;
  maxLinks?: number;
}

const StoryUploadModal: React.FC<StoryUploadModalProps> = ({
  open,
  onCancel,
  onUpload,
  file,
  maxLinks = 3
}) => {
  const [links, setLinks] = useState<CTA[]>([]);

  useEffect(() => {
    if (open) {
      setLinks([]);
    }
  }, [open]);

  const handleAddLink = () => {
    if (links.length < maxLinks) {
      setLinks([...links, { label: '', url: '' }]);
    }
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };

  const handleLinkChange = (index: number, field: keyof CTA, value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const handleSubmit = () => {
    // Filter out empty links
    const validLinks = links
      .filter(l => l.label.trim() && l.url.trim())
      .map((l, idx) => ({ ...l, orderBy: idx }));
    onUpload(validLinks);
  };

  return (
    <Modal
      title="ตั้งค่าอัปโหลดสตอรี่"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="อัปโหลด"
      cancelText="ยกเลิก"
      width={600}
      centered
    >
      <div className="mb-4 text-sm text-gray-500">
        ไฟล์ที่เลือก: {file?.name || 'ไม่มีไฟล์'}
      </div>

      <div className="mt-6 border-t pt-4 border-gray-100">
        <h3 className="text-base font-medium text-gray-800 mb-2">
          CTA Links (แนบไปพร้อมกับวิดีโอสตอรี่ - สูงสุด {maxLinks} ลิงก์)
        </h3>

        {links.length === 0 && (
          <p className="text-sm text-gray-400 mb-4">
            ยังไม่ได้แนบลิงก์ (สามารถสร้างเพิ่มทีหลังได้)
          </p>
        )}

        <div className="space-y-3 mb-4">
          {links.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
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
            เพิ่ม
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default StoryUploadModal;
