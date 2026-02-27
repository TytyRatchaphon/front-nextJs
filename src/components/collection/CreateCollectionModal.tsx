'use client';

import React, { useState, useRef } from 'react';
import { Modal, Input, Switch } from 'antd';
import Image from 'next/image';

const { TextArea } = Input;

export interface CollectionFormData {
  name: string;
  description: string;
  coverFile: File | null;     // actual file for API upload
  coverPreview: string;       // data URL for preview
  isPublished: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CollectionFormData) => void;
  loading?: boolean;
  initialData?: Partial<CollectionFormData>;
}

export default function CreateCollectionModal({ open, onClose, onSave, loading, initialData }: Props) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [coverFile, setCoverFile] = useState<File | null>(initialData?.coverFile || null);
  const [coverPreview, setCoverPreview] = useState(initialData?.coverPreview || '');
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      coverFile,
      coverPreview,
      isPublished,
    });
    // Reset
    setName('');
    setDescription('');
    setCoverFile(null);
    setCoverPreview('');
    setIsPublished(true);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={initialData ? 'แก้ไขคอลเลคชั่น' : 'เพิ่มคอลเลคชั่น'}
      centered
      okText="บันทึก"
      cancelText="ยกเลิก"
      onOk={handleSave}
      confirmLoading={loading}
      okButtonProps={{
        disabled: !name.trim(),
        style: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
      }}
      width={480}
    >
      <div className="flex flex-col gap-5 py-4">
        {/* Cover Image */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative w-full h-[180px] rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-red-400 cursor-pointer transition-colors flex items-center justify-center group"
            onClick={() => fileRef.current?.click()}
          >
            {coverPreview ? (
              <Image src={coverPreview} alt="Cover" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-red-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span className="text-sm font-medium">คลิกเพื่ออัปโหลดปกคอลเลคชั่น</span>
              </div>
            )}
            {coverPreview && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">เปลี่ยนรูปปก</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อคอลเลคชั่น <span className="text-red-500">*</span></label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ตั้งชื่อคอลเลคชั่นของคุณ"
            maxLength={100}
            showCount
            size="large"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">รายละเอียด</label>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="เพิ่มรายละเอียดเกี่ยวกับคอลเลคชั่นนี้..."
            rows={3}
            maxLength={500}
            showCount
          />
        </div>

        {/* Publish Toggle */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">สถานะเผยแพร่</p>
            <p className="text-xs text-gray-400">{isPublished ? 'คอลเลคชั่นนี้จะแสดงให้ผู้อื่นเห็น' : 'เฉพาะคุณเท่านั้นที่เห็น'}</p>
          </div>
          <Switch
            checked={isPublished}
            onChange={setIsPublished}
            checkedChildren="เผยแพร่"
            unCheckedChildren="ไม่เผยแพร่"
            style={{ backgroundColor: isPublished ? '#dc2626' : undefined }}
          />
        </div>
      </div>
    </Modal>
  );
}
