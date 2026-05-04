import React from 'react';
import { Modal, Spin } from 'antd';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { sanitizeUserGeneratedHtml } from '@/utils/sanitizeHtml';

interface PolicyModalProps {
  open: boolean;
  onCancel: () => void;
  type: 'privacy' | 'conditions' | null;
}

export default function PolicyModal({ open, onCancel, type }: PolicyModalProps) {
  const { settings, isLoading } = useWebsiteSettings();

  let htmlContent = '';
  let title = '';

  if (type === 'privacy') {
    title = 'นโยบายความเป็นส่วนตัว';
    htmlContent = settings?.policy || settings?.privacy_policy || '';
  } else if (type === 'conditions') {
    title = 'ข้อตกลงการใช้งาน';
    htmlContent = settings?.condition || settings?.conditions || '';
  }

  const safeHtml = sanitizeUserGeneratedHtml(htmlContent);

  return (
    <Modal
      title={<div className="text-xl font-bold font-primary text-gray-900 border-b border-gray-100 pb-3 mb-2">{title}</div>}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
      zIndex={1700} // Higher than Login modal (1600)
      styles={{
        body: { maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }
      }}
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      ) : safeHtml ? (
        <div
          className="prose prose-sm md:prose-base max-w-none prose-headings:font-primary prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-red-600 hover:prose-a:text-red-700 prose-li:text-gray-600 fonts-sarabun"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <div className="text-center text-gray-400 py-20">ไม่พบข้อมูล</div>
      )}
    </Modal>
  );
}
