import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button, Upload, Progress, Modal, message } from 'antd';
import {
  InboxOutlined,
  UploadOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  SwapOutlined,
  StopOutlined,
} from '@ant-design/icons';
import Hls from 'hls.js';
import { useTrailerUpload } from '@/features/video/hooks/useTrailerUpload';
import type { BookVideoStatus } from '@/features/video/services/videoApi';

// =============================================
// Simple HLS Video Player for Edit Page
// =============================================

function MiniHlsPlayer({ hlsUrl, className }: { hlsUrl: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playerError, setPlayerError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    setPlayerError(false);

    // Proxy rewrite (same logic as useBookTrailer)
    let src = hlsUrl;
    if (src.includes('192.168.220.214:4005/video')) {
      src = src.replace('http://192.168.220.214:4005/video', '/api/proxy-video');
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ maxMaxBufferLength: 10, startLevel: -1 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setPlayerError(true);
          hls.destroy();
        }
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = src;
    } else {
      setPlayerError(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

  if (playerError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-xl text-slate-500 text-sm ${className || 'h-[200px]'}`}>
        <div className="text-center">
          <PlayCircleOutlined className="text-2xl mb-2 block" />
          <p>ไม่สามารถเล่นวิดีโอตัวอย่างได้</p>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      className={`w-full rounded-xl bg-black ${className || ''}`}
      style={{ maxHeight: 300 }}
    />
  );
}

// =============================================
// Status Label Helpers
// =============================================

function getPendingStatusText(status: string): string {
  switch (status) {
    case 'uploading': return 'กำลังอัปโหลด...';
    case 'completing': return 'กำลังรวมไฟล์...';
    case 'queued': return 'รอคิวประมวลผล...';
    case 'processing': return 'กำลังแปลงไฟล์วิดีโอ...';
    default: return 'กำลังดำเนินการ...';
  }
}

function getUploadStateText(state: string): string {
  switch (state) {
    case 'initiating': return 'กำลังเตรียมการอัปโหลด...';
    case 'uploading': return 'กำลังอัปโหลดไฟล์วิดีโอ...';
    case 'completing': return 'กำลังรวมไฟล์...';
    case 'queued': return 'รอคิวประมวลผล...';
    case 'processing': return 'กำลังประมวลผลวิดีโอในระบบ...';
    default: return 'กำลังดำเนินการ...';
  }
}

// =============================================
// TrailerUploader Component
// =============================================

interface TrailerUploaderProps {
  bookId?: number;
  initialFile?: File | null;
  autoStart?: boolean;
  mode?: 'normal' | 'select-only';
  videoStatus?: BookVideoStatus | null;
  onVideoStatusChange?: (status: BookVideoStatus) => void;
  onFileSelect?: (file: File | null) => void;
  onSuccess?: (hlsUrl: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function TrailerUploader({
  bookId,
  initialFile,
  autoStart,
  mode = 'normal',
  videoStatus: externalVideoStatus,
  onVideoStatusChange,
  onFileSelect,
  onSuccess,
  onError,
  onCancel,
}: TrailerUploaderProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile || null);
  const [showReplaceUpload, setShowReplaceUpload] = useState(false);

  const {
    uploadState,
    progress,
    estimatedSeconds,
    errorMessage,
    config,
    videoStatus,
    startUpload,
    deleteVideo,
    retryVideo,
    cancelUpload,
    resetUpload,
  } = useTrailerUpload({
    bookId: bookId || 0,
    initialVideoStatus: externalVideoStatus,
    onVideoStatusChange,
  });

  // --- Auto-start upload (for Newbook modal) ---
  useEffect(() => {
    if (mode !== 'select-only' && autoStart && initialFile && uploadState === 'idle' && config && bookId) {
      startUpload(initialFile, {
        onSuccess: (url) => { messageApi.success('อัปโหลดวิดีโอสำเร็จ!'); onSuccess?.(url); },
        onError: (err) => { messageApi.error(err); onError?.(err); },
      });
    }
  }, [mode, autoStart, initialFile, uploadState, config, bookId, startUpload, messageApi, onSuccess, onError]);

  // --- File Selection Validation ---
  const handleFileSelect = (file: File): false => {
    if (!config) {
      messageApi.error('ระบบยังไม่พร้อมใช้งาน กรุณารอสักครู่');
      return false;
    }

    if (file.size > config.maxUploadBytes) {
      messageApi.error(`ขนาดไฟล์เกินที่กำหนด (${Math.round(config.maxUploadBytes / 1024 / 1024)}MB)`);
      return false;
    }

    const allowedTypes = config.supportedMimeTypes || ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      messageApi.error('นามสกุลไฟล์ไม่รองรับ');
      return false;
    }

    // Validate duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > config.maxDurationSeconds) {
        messageApi.error(`ความยาววิดีโอเกินที่กำหนด (${config.maxDurationSeconds} วินาที)`);
        setSelectedFile(null);
        onFileSelect?.(null);
      } else {
        setSelectedFile(file);
        onFileSelect?.(file);
      }
    };
    video.src = URL.createObjectURL(file);

    return false;
  };

  // --- Select-only mode (for Newbook) ---
  if (mode === 'select-only') {
    return (
      <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 mb-6 relative overflow-hidden">
        {contextHolder}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-red-50 rounded-full blur-2xl opacity-60 pointer-events-none" />
        <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2 relative z-10">
          <div className="bg-red-50 text-red-500 p-2 rounded-lg"><VideoCameraOutlined /></div>
          อัปโหลดวิดีโอโปรโมท (Trailer)
        </h3>
        <div className="relative z-10">
          {!selectedFile ? (
            <Upload.Dragger
              accept={config?.supportedMimeTypes?.join(',') || 'video/mp4,video/quicktime,video/webm'}
              beforeUpload={(file) => handleFileSelect(file)}
              showUploadList={false}
              disabled={!config}
              className="!bg-gray-50/50 hover:!bg-red-50/30 !border-gray-200 hover:!border-red-300 transition-colors rounded-xl"
            >
              <p className="ant-upload-drag-icon pt-4"><InboxOutlined className="!text-red-400" /></p>
              <p className="ant-upload-text font-medium text-gray-700">คลิกหรือลากไฟล์วิดีโอมาวางที่นี่</p>
              {config && (
                <p className="ant-upload-hint text-gray-400 pb-4">
                  รองรับ {config.supportedMimeTypes?.map(m => m.split('/')[1]).join(', ') || 'mp4, quicktime, webm'}
                  <br />
                  ขนาดไม่เกิน {Math.round((config.maxUploadBytes || 0) / 1024 / 1024)}MB, ความยาวไม่เกิน {config.maxDurationSeconds || 0} วินาที
                </p>
              )}
            </Upload.Dragger>
          ) : (
            <FileCard
              file={selectedFile}
              onRemove={() => { setSelectedFile(null); onFileSelect?.(null); }}
            />
          )}
        </div>
      </div>
    );
  }

  // --- Start Upload ---
  const handleStartUpload = () => {
    if (!selectedFile || !bookId) return;
    startUpload(selectedFile, {
      onSuccess: (url) => { messageApi.success('อัปโหลดวิดีโอสำเร็จ!'); onSuccess?.(url); },
      onError: (err) => { messageApi.error(err); onError?.(err); },
    });
  };

  // --- Delete with confirmation ---
  const handleDelete = () => {
    Modal.confirm({
      title: 'ลบวิดีโอ',
      icon: <ExclamationCircleOutlined />,
      content: 'คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        await deleteVideo();
        messageApi.success('ลบวิดีโอเรียบร้อยแล้ว');
      },
    });
  };

  // --- Cancel upload with confirmation ---
  const handleCancelUpload = () => {
    Modal.confirm({
      title: 'ยกเลิกการอัปโหลด',
      icon: <ExclamationCircleOutlined />,
      content: 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการอัปโหลด?',
      okText: 'ยกเลิกการอัปโหลด',
      okType: 'danger',
      cancelText: 'อัปโหลดต่อ',
      onOk: async () => {
        await cancelUpload();
        setSelectedFile(null);
        messageApi.info('ยกเลิกการอัปโหลดแล้ว');
      },
    });
  };

  // --- Hide if no permission ---
  if (videoStatus && !videoStatus.canManage) {
    return null;
  }

  // Determine what to render
  const hasCurrent = Boolean(videoStatus?.current);
  const hasPending = Boolean(videoStatus?.pending);
  const hasFailed = Boolean(videoStatus?.lastFailed);
  const canUpload = videoStatus?.canUpload !== false; // default true if no videoStatus
  const isUploading = ['initiating', 'uploading', 'completing', 'queued', 'processing'].includes(uploadState);

  return (
    <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 mb-6 relative overflow-hidden">
      {contextHolder}

      {/* Decorative background */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-red-50 rounded-full blur-2xl opacity-60 pointer-events-none" />

      <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2 relative z-10">
        <div className="bg-red-50 text-red-500 p-2 rounded-lg"><VideoCameraOutlined /></div>
        วิดีโอโปรโมท (Trailer)
      </h3>

      <div className="space-y-4 relative z-10">

        {/* ============================== */}
        {/* STATE: Has current video       */}
        {/* ============================== */}
        {hasCurrent && videoStatus!.current!.hlsUrl && (
          <div className="space-y-3">
            <MiniHlsPlayer hlsUrl={videoStatus!.current!.hlsUrl!} />

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                <CheckCircleOutlined className="text-green-500" />
                วิดีโอพร้อมเล่น
                {videoStatus!.current!.durationSeconds && (
                  <span>• {Math.round(videoStatus!.current!.durationSeconds)}s</span>
                )}
                {videoStatus!.current!.width && videoStatus!.current!.height && (
                  <span>• {videoStatus!.current!.width}x{videoStatus!.current!.height}</span>
                )}
              </div>

              <div className="flex gap-2">
                {canUpload && !hasPending && !isUploading && (
                  <Button
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={() => setShowReplaceUpload(!showReplaceUpload)}
                    className="rounded-lg font-medium"
                  >
                    เปลี่ยนวิดีโอ
                  </Button>
                )}
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  loading={uploadState === 'deleting'}
                  className="rounded-lg font-medium"
                >
                  ลบ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================== */}
        {/* STATE: Pending (server-side)   */}
        {/* ============================== */}
        {hasPending && !isUploading && (
          <div className="space-y-4 py-4 px-4 bg-orange-50/50 rounded-xl border border-orange-100">
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-base mb-1">
                {hasCurrent ? '🔄 กำลังเปลี่ยนวิดีโอใหม่...' : getPendingStatusText(videoStatus!.pending!.status)}
              </p>
              <p className="text-blue-600 text-xs font-medium bg-blue-50 inline-block px-3 py-1 rounded-full border border-blue-100">
                ✅ คุณสามารถปิดหรือไปหน้าอื่นได้ ระบบกำลังทำงานอยู่เบื้องหลัง
              </p>
            </div>
            <Progress
              percent={videoStatus!.pending!.progressPercent || 0}
              status="active"
              strokeColor={{ '0%': '#ff7875', '100%': '#ff4d4f' }}
              trailColor="#f5f5f5"
              className="drop-shadow-sm w-full"
            />
          </div>
        )}

        {/* ============================== */}
        {/* STATE: Local Upload In Progress*/}
        {/* ============================== */}
        {isUploading && (
          <div className="space-y-4 py-4 px-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-base mb-1">
                {getUploadStateText(uploadState)}
              </p>

              {estimatedSeconds !== null && (uploadState === 'uploading' || (uploadState === 'processing' && progress > 0)) && (
                <p className="text-red-500 font-medium text-sm flex items-center justify-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  เหลือเวลาประมาณ {estimatedSeconds < 60
                    ? `${estimatedSeconds} วินาที`
                    : `${Math.floor(estimatedSeconds / 60)} นาที ${estimatedSeconds % 60} วินาที`
                  }
                </p>
              )}

              {(uploadState === 'initiating' || uploadState === 'uploading') && (
                <p className="text-orange-500 text-xs mt-2 font-medium bg-orange-50 inline-block px-3 py-1 rounded-full border border-orange-100">
                  ⚠️ กำลังอัปโหลดไฟล์ กรุณาอย่าเพิ่งปิดหรือรีเฟรชหน้านี้
                </p>
              )}

              {(uploadState === 'queued' || uploadState === 'processing' || uploadState === 'completing') && (
                <p className="text-blue-500 text-xs mt-2 font-medium bg-blue-50 inline-block px-3 py-1 rounded-full border border-blue-100">
                  ✅ อัปโหลดไฟล์เสร็จสิ้น คุณสามารถไปหน้าอื่นได้
                </p>
              )}
            </div>

            <Progress
              percent={progress}
              status={['queued', 'processing'].includes(uploadState) ? 'active' : 'normal'}
              strokeColor={{ '0%': '#ff7875', '100%': '#ff4d4f' }}
              trailColor="#f5f5f5"
              className="drop-shadow-sm w-full"
            />

            {['initiating', 'uploading'].includes(uploadState) && (
              <div className="text-center">
                <Button
                  size="small"
                  danger
                  ghost
                  icon={<StopOutlined />}
                  onClick={handleCancelUpload}
                  className="rounded-lg font-medium"
                >
                  ยกเลิก
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ============================== */}
        {/* STATE: Completed               */}
        {/* ============================== */}
        {uploadState === 'completed' && (
          <div className="text-center space-y-2 py-4">
            <CheckCircleOutlined className="text-green-500 text-4xl" />
            <p className="font-medium text-green-600">ประมวลผลวิดีโอเสร็จสิ้น!</p>
            {onSuccess && (
              <Button type="primary" onClick={() => onSuccess?.('')}>ดำเนินการต่อ</Button>
            )}
          </div>
        )}

        {/* ============================== */}
        {/* STATE: Error (local upload)    */}
        {/* ============================== */}
        {uploadState === 'error' && !hasFailed && (
          <div className="text-center space-y-4 py-4 px-4 bg-red-50/50 rounded-xl border border-red-100">
            <CloseCircleOutlined className="text-red-500 text-4xl" />
            <p className="font-medium text-red-600 text-sm">{errorMessage}</p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => { setSelectedFile(null); resetUpload(); }} className="rounded-lg font-medium">
                เปลี่ยนไฟล์
              </Button>
              <Button type="primary" icon={<ReloadOutlined />} onClick={handleStartUpload} className="rounded-lg font-medium">
                ลองใหม่
              </Button>
            </div>
          </div>
        )}

        {/* ============================== */}
        {/* STATE: Last Failed (server)    */}
        {/* ============================== */}
        {hasFailed && uploadState !== 'processing' && (
          <div className="py-4 px-4 bg-red-50/50 rounded-xl border border-red-100 space-y-3">
            <div className="flex items-center gap-3">
              <CloseCircleOutlined className="text-red-500 text-2xl shrink-0" />
              <div>
                <p className="font-semibold text-red-700 text-sm">การประมวลผลวิดีโอล้มเหลว</p>
                <p className="text-red-500 text-xs mt-0.5">
                  {videoStatus!.lastFailed!.errorMessage || videoStatus!.lastFailed!.errorCode || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="primary"
                danger
                icon={<ReloadOutlined />}
                onClick={retryVideo}
                className="rounded-lg font-medium"
              >
                ลองใหม่อีกครั้ง
              </Button>
              {canUpload && (
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => setShowReplaceUpload(true)}
                  className="rounded-lg font-medium"
                >
                  อัปโหลดไฟล์ใหม่
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ============================== */}
        {/* STATE: Upload Box              */}
        {/* (no video, can upload, idle)   */}
        {/* ============================== */}
        {((!hasCurrent && !hasPending && !hasFailed && !isUploading && uploadState !== 'completed' && uploadState !== 'error' && canUpload)
          || showReplaceUpload
        ) && (
          <div className="space-y-4">
            {showReplaceUpload && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">เลือกวิดีโอใหม่</p>
                <Button size="small" onClick={() => { setShowReplaceUpload(false); setSelectedFile(null); }} className="rounded-lg">
                  ยกเลิก
                </Button>
              </div>
            )}

            {!selectedFile ? (
              <Upload.Dragger
                accept={config?.supportedMimeTypes?.join(',') || 'video/mp4,video/quicktime,video/webm'}
                beforeUpload={(file) => handleFileSelect(file)}
                showUploadList={false}
                disabled={!config}
                className="!bg-gray-50/50 hover:!bg-red-50/30 !border-gray-200 hover:!border-red-300 transition-colors rounded-xl"
              >
                <p className="ant-upload-drag-icon pt-4"><InboxOutlined className="!text-red-400" /></p>
                <p className="ant-upload-text font-medium text-gray-700">คลิกหรือลากไฟล์วิดีโอมาวางที่นี่</p>
                {config && (
                  <p className="ant-upload-hint text-gray-400 pb-4">
                    รองรับ {config.supportedMimeTypes?.map(m => m.split('/')[1]).join(', ') || 'mp4, quicktime, webm'}
                    <br />
                    ขนาดไม่เกิน {Math.round((config.maxUploadBytes || 0) / 1024 / 1024)}MB, ความยาวไม่เกิน {config.maxDurationSeconds || 0} วินาที
                  </p>
                )}
              </Upload.Dragger>
            ) : (
              <FileCard
                file={selectedFile}
                onRemove={() => { setSelectedFile(null); onFileSelect?.(null); }}
                onUpload={handleStartUpload}
                showUploadButton
              />
            )}
          </div>
        )}

        {/* Cannot upload message */}
        {!canUpload && !hasCurrent && !hasPending && !hasFailed && !isUploading && (
          <div className="text-center py-4 text-gray-500 text-sm">
            ไม่สามารถอัปโหลดวิดีโอได้ในขณะนี้
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// File Card Sub-component
// =============================================

function FileCard({
  file,
  onRemove,
  onUpload,
  showUploadButton,
}: {
  file: File;
  onRemove: () => void;
  onUpload?: () => void;
  showUploadButton?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-red-200 transition-colors gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
          <VideoCameraOutlined className="text-xl" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-[300px]" title={file.name}>
            {file.name}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto justify-end">
        <Button danger className="rounded-lg font-medium" onClick={onRemove}>ลบ</Button>
        {showUploadButton && onUpload && (
          <Button type="primary" className="rounded-lg font-medium shadow-md shadow-red-200" icon={<UploadOutlined />} onClick={onUpload}>
            เริ่มอัปโหลด
          </Button>
        )}
      </div>
    </div>
  );
}
