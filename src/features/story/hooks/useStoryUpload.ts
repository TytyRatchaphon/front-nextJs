import { useState } from 'react';
import { storyApi } from '../services/storyApi';
import { useStoryStore } from '../stores/storyStore';
import { App } from 'antd';
import { useQuery } from '@tanstack/react-query';

export const useStoryUpload = () => {
  const setUploadState = useStoryStore((state) => state.setUploadState);
  const setActiveUploadId = useStoryStore((state) => state.setActiveUploadId);
  const resetUpload = useStoryStore((state) => state.resetUpload);
  const { message } = App.useApp();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch config for validation
  const { data: config } = useQuery({
    queryKey: ['storyConfig'],
    queryFn: storyApi.fetchStoryConfig,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const validateFile = async (file: File): Promise<string | null> => {
    if (!config) return "ยังไม่สามารถอัปโหลดได้ โปรดลองอีกครั้ง";

    if (file.size > config.maxUploadBytes) {
      return `ไฟล์ใหญ่เกินไป (จำกัด ${Math.floor(config.maxUploadBytes / (1024 * 1024))}MB)`;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.allowedExtensions.includes(fileExtension) || !config.allowedMimeTypes.includes(file.type)) {
      return `รองรับเฉพาะไฟล์ ${config.allowedExtensions.join(', ')}`;
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const duration = await new Promise<number>((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => resolve(video.duration);
        video.onerror = () => reject(new Error('VIDEO_METADATA_UNREADABLE'));
        video.src = objectUrl;
      });

      if (!Number.isFinite(duration)) {
        return 'ไม่สามารถอ่านความยาววิดีโอได้ กรุณาเลือกไฟล์ใหม่';
      }

      if (duration > config.maxDurationSeconds) {
        return `วิดีโอยาวเกินกำหนด (สูงสุด ${config.maxDurationSeconds} วินาที)`;
      }
    } catch {
      return 'ไม่สามารถอ่านข้อมูลวิดีโอได้ กรุณาเลือกไฟล์ใหม่';
    } finally {
      URL.revokeObjectURL(objectUrl);
    }

    return null;
  };

  const uploadStory = async (
    file: File,
    sourceType: 'user' | 'admin' = 'user',
    startDate?: string,
    endDate?: string,
    links?: { label: string; url: string; orderBy?: number }[]
  ) => {
    try {
      setUploadState('validating', 0, 'กำลังตรวจสอบไฟล์...');
      const error = await validateFile(file);
      if (error) {
        message.error(error);
        resetUpload();
        return false;
      }

      setIsUploading(true);
      setUploadState('uploading', 0, 'กำลังอัปโหลดไฟล์...');

      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).substring(2);

      const response = await storyApi.uploadStory(file, idempotencyKey, sourceType, startDate, endDate, links);

      setUploadState('queued', 100, 'อัปโหลดสำเร็จ รอการประมวลผล...');

      // Fallback for different possible backend ID field names
      const activeId = typeof response === 'number'
        ? response
        : (response?.storyItem?.id || response?.id || response?.storyItemId || response?.story_item_id);

      if (!activeId) {
        throw new Error(`ไม่พบ ID ของวิดีโอจากเซิร์ฟเวอร์: ${JSON.stringify(response).substring(0, 150)}`);
      }

      setActiveUploadId(activeId);

      message.success('อัปโหลดสำเร็จ กำลังประมวลผลวิดีโอ');
      return true;
    } catch (err: any) {
      console.error("Upload error", err);
      // Handle the specific date range invalid error
      const errorCode = err.response?.data?.code;
      const errorMessage = errorCode === 'VIDEO_STORY_DATE_RANGE_INVALID'
        ? 'ช่วงเวลาที่ตั้งค่าไม่ถูกต้อง โปรดตรวจสอบ Start Date และ End Date อีกครั้ง'
        : (err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการอัปโหลด');

      message.error(errorMessage);
      setUploadState('failed', 0, errorMessage);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadStory,
    isUploading,
    config,
    resetUpload,
  };
};
