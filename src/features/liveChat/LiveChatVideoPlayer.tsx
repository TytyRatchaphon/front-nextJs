"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import apiClient from "@/services/apiClient";
import { resolveLiveChatMediaUrl } from "./liveChatModel";

interface LiveChatVideoPlayerProps {
  src: string;
  onMediaLoad?: () => void;
  className?: string;
}

export function LiveChatVideoPlayer({
  src,
  onMediaLoad,
  className = "",
}: LiveChatVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const rawResolvedUrl = resolveLiveChatMediaUrl(src);
  const isHls = rawResolvedUrl.toLowerCase().includes(".m3u8");

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    setHasError(false);
    setErrorMessage(null);
    setIsLoading(true);

    if (!rawResolvedUrl) {
      setIsLoading(false);
      return;
    }

    if (
      rawResolvedUrl.startsWith("blob:") ||
      rawResolvedUrl.startsWith("data:") ||
      isHls
    ) {
      setBlobUrl(rawResolvedUrl);
      setIsLoading(false);
      return;
    }

    // Load video through apiClient to include Auth tokens and handle proxy/CORS
    apiClient
      .get(rawResolvedUrl, {
        responseType: "blob",
      })
      .then((res) => {
        if (!active) return;
        const blob = res.data as Blob;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setBlobUrl(rawResolvedUrl);
        setIsLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl && createdUrl.startsWith("blob:")) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [rawResolvedUrl, isHls, retryKey]);

  useEffect(() => {
    const video = videoRef.current;
    const activeUrl = blobUrl || rawResolvedUrl;
    if (!video || !activeUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 30,
        enableWorker: true,
      });
      hlsRef.current = hls;

      hls.loadSource(activeUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        onMediaLoad?.();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อวิดีโอ");
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              return;
            default:
              setErrorMessage("ไม่สามารถเล่นวิดีโอได้");
              break;
          }
          setHasError(true);
        }
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [blobUrl, rawResolvedUrl, isHls, retryKey, onMediaLoad]);

  const handleRetry = () => {
    setHasError(false);
    setRetryKey((prev) => prev + 1);
  };

  const handleOpenInNewTab = () => {
    const activeUrl = blobUrl || rawResolvedUrl;
    if (activeUrl) {
      window.open(activeUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!rawResolvedUrl) {
    return (
      <div className="flex h-36 w-full items-center justify-center rounded-xl bg-stone-900 text-xs text-stone-400">
        ไม่พบ URL วิดีโอ
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-stone-900 p-4 text-center text-white min-w-[220px] max-w-full">
        <AlertCircle className="size-8 text-amber-400" />
        <p className="text-xs text-stone-300 font-medium">
          {errorMessage || "ไม่สามารถเล่นวิดีโอนี้ในเบราว์เซอร์ได้"}
        </p>
        <div className="mt-1 flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#dc2626] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#b91c1c] transition"
          >
            <ExternalLink className="size-3.5" /> เปิดดูวิดีโอ
          </button>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-600 bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-200 hover:bg-stone-700 transition"
          >
            <RefreshCw className="size-3.5" /> โหลดใหม่
          </button>
        </div>
      </div>
    );
  }

  const activeVideoSrc = blobUrl || rawResolvedUrl;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-black ${className}`}>
      {isLoading && (
        <div className="flex h-36 w-full items-center justify-center text-xs text-stone-400">
          กำลังโหลดวิดีโอ...
        </div>
      )}
      <video
        key={`${activeVideoSrc}-${retryKey}`}
        ref={videoRef}
        src={isHls ? undefined : activeVideoSrc}
        controls
        preload="metadata"
        playsInline
        onLoadedData={onMediaLoad}
        onLoadedMetadata={onMediaLoad}
        onError={(e) => {
          const videoElem = e.currentTarget;
          if (videoElem.error && videoElem.error.code !== 1) {
            setHasError(true);
          }
        }}
        className={`block max-h-[20rem] w-auto max-w-full rounded-xl ${
          isLoading ? "hidden" : "block"
        }`}
        style={{
          maxWidth: "100%",
          maxHeight: "20rem",
        }}
      />
    </div>
  );
}
