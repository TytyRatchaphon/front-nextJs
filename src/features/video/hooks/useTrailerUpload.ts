import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getTrailerConfig,
  initiateTrailerUpload,
  uploadTrailerPart,
  completeTrailerUpload,
  getTrailerStatus,
  deleteTrailer,
  retryTrailer,
  cancelUploadSession,
  getBookVideoStatus,
  isTerminalStatus,
  TrailerConfigResponse,
  BookVideoStatus,
} from '@/features/video/services/videoApi';

export type UploadState =
  | 'idle'
  | 'initiating'
  | 'uploading'
  | 'completing'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'error'
  | 'deleting';

/** Maps backend error codes to user-friendly Thai messages */
const ERROR_MESSAGES: Record<string, string> = {
  VIDEO_MANAGEMENT_PERMISSION_DENIED: 'คุณไม่มีสิทธิ์จัดการวิดีโอ',
  BOOK_NOT_FOUND_OR_PERMISSION_DENIED: 'ไม่พบหนังสือ หรือคุณไม่มีสิทธิ์เข้าถึง',
  VIDEO_FILE_SIZE_LIMIT_EXCEEDED: 'ขนาดไฟล์เกินที่กำหนด',
  VIDEO_MIME_TYPE_NOT_ALLOWED: 'ชนิดไฟล์ไม่รองรับ',
  VIDEO_UPLOAD_ALREADY_IN_PROGRESS: 'มีการอัปโหลดค้างอยู่แล้ว กรุณารอให้เสร็จก่อน',
  VIDEO_UPLOAD_SESSION_EXPIRED: 'เซสชันอัปโหลดหมดอายุ กรุณาเริ่มใหม่',
  VIDEO_UPLOAD_PARTS_INCOMPLETE: 'อัปโหลดไม่ครบทุกส่วน กรุณาลองใหม่',
  VIDEO_SERVICE_UNAVAILABLE: 'ระบบวิดีโอไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่ภายหลัง',
  VIDEO_OPERATION_CONFLICT: 'ไม่สามารถดำเนินการได้ เนื่องจากมีการอัปโหลดอื่นค้างอยู่',
  VIDEO_TRANSCODE_FAILED: 'การแปลงไฟล์วิดีโอล้มเหลว',
};

function getErrorMessage(err: any): string {
  const code = err?.response?.data?.message || err?.response?.data?.errorCode || '';
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (typeof code === 'string' && code.length > 0 && code.length < 100) return code;
  return err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
}

export interface UseTrailerUploadOptions {
  bookId: number;
  initialVideoStatus?: BookVideoStatus | null;
  onVideoStatusChange?: (status: BookVideoStatus) => void;
}

export function useTrailerUpload({ bookId, initialVideoStatus, onVideoStatusChange }: UseTrailerUploadOptions) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<TrailerConfigResponse | null>(null);
  const [videoStatus, setVideoStatus] = useState<BookVideoStatus | null>(initialVideoStatus ?? null);

  // Refs
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);
  const bookIdRef = useRef(bookId);
  bookIdRef.current = bookId;

  // --- Config Loading ---
  useEffect(() => {
    getTrailerConfig()
      .then(setConfig)
      .catch((err) => console.error('Failed to load video config', err));
  }, []);



  // --- Helpers ---

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const refreshVideoStatus = useCallback(async () => {
    try {
      const fresh = await getBookVideoStatus(bookIdRef.current);
      setVideoStatus(fresh);
      onVideoStatusChange?.(fresh);
      return fresh;
    } catch (err) {
      console.error('Failed to refresh video status', err);
      return null;
    }
  }, [onVideoStatusChange]);

  // --- Sync initial video status or fetch on mount ---
  useEffect(() => {
    if (initialVideoStatus !== undefined) {
      setVideoStatus(initialVideoStatus);
    } else if (bookId > 0) {
      refreshVideoStatus();
    }
  }, [initialVideoStatus, bookId, refreshVideoStatus]);

  const startPolling = useCallback((trailerId: number) => {
    stopPolling();
    setUploadState('processing');
    const processingStartTime = Date.now();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusResp = await getTrailerStatus(bookIdRef.current, trailerId);

        if (statusResp.status === 'processing' || statusResp.status === 'queued') {
          setUploadState(statusResp.status);
          const currentProgress = statusResp.progressPercent || 0;
          setProgress(currentProgress);

          // Estimate remaining time
          if (currentProgress > 0 && currentProgress < 100) {
            const elapsed = Date.now() - processingStartTime;
            const msPerPercent = elapsed / currentProgress;
            const remaining = (100 - currentProgress) * msPerPercent;
            setEstimatedSeconds(Math.round(remaining / 1000));
          } else {
            setEstimatedSeconds(null);
          }
        } else if (isTerminalStatus(statusResp.status)) {
          stopPolling();

          if (statusResp.status === 'completed') {
            setUploadState('completed');
            setProgress(100);
            setEstimatedSeconds(null);
          } else if (statusResp.status === 'failed') {
            setUploadState('error');
            setErrorMessage(statusResp.errorMessage || 'การประมวลผลวิดีโอล้มเหลว');
          }

          // Refresh book video status for all terminal states
          await refreshVideoStatus();
        }
      } catch (err: any) {
        // Network hiccup during poll — keep trying
        console.error('Polling error:', err);
      }
    }, 3000);
  }, [refreshVideoStatus, stopPolling]);

  // --- Auto-poll if pending exists on mount ---
  useEffect(() => {
    if (!videoStatus?.pending) return;

    const { trailerId, status } = videoStatus.pending;

    // If pending is in a server-side processing state, start polling
    if (['queued', 'processing', 'completing'].includes(status)) {
      setUploadState(status as UploadState);
      setProgress(videoStatus.pending.progressPercent ?? 0);
      startPolling(trailerId);
    }

    return () => stopPolling();
  }, [videoStatus?.pending, startPolling]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      stopPolling();
      abortRef.current = true;
    };
  }, []);


  // --- Upload Flow ---

  const uploadFileChunks = async (
    file: File,
    currentBookId: number,
    sessionId: string,
    partSize: number,
    totalParts: number,
  ) => {
    const startTime = Date.now();
    let bytesUploaded = 0;

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      if (abortRef.current) throw new Error('Upload cancelled');

      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      // Upload part binary ผ่าน API โดยตรง
      await uploadTrailerPart(currentBookId, sessionId, partNumber, blob);

      bytesUploaded += blob.size;

      // Update progress
      setProgress(Math.round((partNumber / totalParts) * 100));

      // Calculate ETA
      const timeElapsed = Date.now() - startTime;
      if (timeElapsed > 0 && bytesUploaded > 0 && partNumber < totalParts) {
        const bytesPerMs = bytesUploaded / timeElapsed;
        const bytesRemaining = file.size - bytesUploaded;
        setEstimatedSeconds(Math.round((bytesRemaining / bytesPerMs) / 1000));
      } else if (partNumber === totalParts) {
        setEstimatedSeconds(null);
      }
    }
  };

  const startUpload = useCallback(async (file: File, callbacks?: { onSuccess?: (hlsUrl: string) => void; onError?: (error: string) => void }) => {
    try {
      abortRef.current = false;
      stopPolling();
      setUploadState('initiating');
      setProgress(0);
      setEstimatedSeconds(null);
      setErrorMessage(null);

      const currentBookId = bookIdRef.current;

      // 1. Initiate
      const session = await initiateTrailerUpload(currentBookId, {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      setUploadState('uploading');

      // 2. Upload chunks
      await uploadFileChunks(file, currentBookId, session.sessionId, session.partSize, session.totalParts);

      // 3. Complete
      setUploadState('completing');
      await completeTrailerUpload(currentBookId, session.sessionId);

      // 4. Start polling
      startPolling(session.trailerId);

    } catch (err: any) {
      if (abortRef.current) return; // Don't update state if cancelled
      console.error('Upload error:', err);
      stopPolling();
      setUploadState('error');
      const msg = getErrorMessage(err);
      setErrorMessage(msg);
      callbacks?.onError?.(msg);
    }
  }, [startPolling]);

  // --- Delete ---

  const deleteVideo = useCallback(async () => {
    const trailerId = videoStatus?.current?.trailerId;
    if (!trailerId) return;

    try {
      setUploadState('deleting');
      await deleteTrailer(bookIdRef.current, trailerId);
      await refreshVideoStatus();
      setUploadState('idle');
      setProgress(0);
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      setUploadState('idle');
      setErrorMessage(getErrorMessage(err));
    }
  }, [videoStatus, refreshVideoStatus]);

  // --- Retry ---

  const retryVideo = useCallback(async () => {
    const trailerId = videoStatus?.lastFailed?.trailerId;
    if (!trailerId) return;

    try {
      setErrorMessage(null);
      await retryTrailer(bookIdRef.current, trailerId);
      startPolling(trailerId);
    } catch (err: any) {
      console.error('Retry error:', err);
      setErrorMessage(getErrorMessage(err));
    }
  }, [videoStatus, startPolling]);

  // --- Cancel Upload ---

  const cancelUpload = useCallback(async () => {
    const sessionId = videoStatus?.pending?.session?.sessionId;
    
    // Also abort local upload if in progress
    abortRef.current = true;
    stopPolling();

    if (sessionId) {
      try {
        await cancelUploadSession(bookIdRef.current, sessionId);
      } catch (err: any) {
        console.error('Cancel error:', err);
      }
    }

    await refreshVideoStatus();
    setUploadState('idle');
    setProgress(0);
    setEstimatedSeconds(null);
    setErrorMessage(null);
  }, [videoStatus, refreshVideoStatus]);

  // --- Reset ---

  const resetUpload = useCallback(() => {
    abortRef.current = true;
    stopPolling();
    setUploadState('idle');
    setProgress(0);
    setEstimatedSeconds(null);
    setErrorMessage(null);
  }, []);

  return {
    // State
    uploadState,
    progress,
    estimatedSeconds,
    errorMessage,
    config,
    videoStatus,

    // Actions
    startUpload,
    deleteVideo,
    retryVideo,
    cancelUpload,
    resetUpload,
    refreshVideoStatus,
  };
}
