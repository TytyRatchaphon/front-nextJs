'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, App, Button, Input, Modal, Radio, Spin } from 'antd';

import { useUIStore } from '@/stores/uiStore';
import { storyApi, VideoReportApiError } from '../services/storyApi';
import type { StoryItem, VideoReportPreset } from '../types/storyTypes';

interface StoryReportModalProps {
  open: boolean;
  item: StoryItem | null;
  onClose: () => void;
  onReported: () => void;
}

const getReportErrorMessage = (error: VideoReportApiError): string => {
  if (error.httpStatus === 429) {
    return error.retryAfterSeconds
      ? `ส่งคำขอถี่เกินไป กรุณาลองใหม่ใน ${error.retryAfterSeconds} วินาที`
      : 'ส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่';
  }
  if (error.message === 'VIDEO_REPORT_PRESET_NOT_FOUND') return 'เหตุผลนี้ไม่พร้อมใช้งานแล้ว กรุณาเลือกใหม่';
  if (error.message === 'VIDEO_REPORT_TARGET_NOT_FOUND') return 'ไม่พบวิดีโอนี้ หรือวิดีโอถูกลบแล้ว';
  if (error.message === 'VIDEO_REQUEST_INVALID') return 'ข้อมูลรายงานไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่';
  return 'ส่งรายงานไม่สำเร็จ กรุณาลองใหม่ภายหลัง';
};

export default function StoryReportModal({ open, item, onClose, onReported }: StoryReportModalProps) {
  const { message } = App.useApp();
  const openLoginModal = useUIStore((state) => state.openLoginModal);
  const [presets, setPresets] = useState<VideoReportPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [detail, setDetail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setPresets(await storyApi.fetchVideoReportPresets());
    } catch (error) {
      setPresets([]);
      setErrorMessage(getReportErrorMessage(error as VideoReportApiError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelectedPresetId(null);
    setDetail('');
    void loadPresets();
  }, [open, item?.type, item?.ref_id, loadPresets]);

  const handleSubmit = async () => {
    if (!item || selectedPresetId == null || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await storyApi.submitVideoReport({
        type: item.type,
        ref_id: item.ref_id,
        preset_id: selectedPresetId,
        detail,
      });

      if (result.already_reported) {
        message.info('คุณได้รายงานวิดีโอนี้ไปแล้ว');
      } else {
        message.success('ส่งรายงานแล้ว');
      }
      onReported();
      onClose();
    } catch (error) {
      const reportError = error as VideoReportApiError;
      setErrorMessage(getReportErrorMessage(reportError));

      if (reportError.httpStatus === 202 || /TOKEN|AUTH|LOGIN|EXPIRED/i.test(reportError.message)) {
        onClose();
        openLoginModal();
      } else if (reportError.message === 'VIDEO_REPORT_PRESET_NOT_FOUND') {
        setSelectedPresetId(null);
        await loadPresets();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="รายงานวิดีโอ"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isSubmitting}>ยกเลิก</Button>,
        <Button
          key="submit"
          type="primary"
          danger
          loading={isSubmitting}
          disabled={selectedPresetId == null || isLoading || presets.length === 0}
          onClick={handleSubmit}
        >
          ส่งรายงาน
        </Button>,
      ]}
      centered
      destroyOnHidden
      zIndex={10000}
    >
      <div className="space-y-4 pt-2">
        {errorMessage && <Alert type="error" showIcon message={errorMessage} />}

        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center"><Spin /></div>
        ) : presets.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message="ยังไม่มีเหตุผลสำหรับรายงาน"
            action={<Button size="small" onClick={() => void loadPresets()}>ลองใหม่</Button>}
          />
        ) : (
          <Radio.Group
            className="flex w-full flex-col gap-3"
            value={selectedPresetId}
            onChange={(event) => setSelectedPresetId(event.target.value)}
          >
            {presets.map((preset) => (
              <Radio key={preset.id} value={preset.id}>{preset.title}</Radio>
            ))}
          </Radio.Group>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="story-report-detail">
            รายละเอียดเพิ่มเติม (ไม่บังคับ)
          </label>
          <Input.TextArea
            id="story-report-detail"
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            maxLength={2000}
            showCount
            rows={4}
            placeholder="อธิบายปัญหาที่พบ"
          />
        </div>
      </div>
    </Modal>
  );
}
