import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { StoryItem } from "../types/storyTypes";
import { isHlsNativelySupported, isPlaybackUrlUsable } from "@/utils/videoPlayback";
import { storyApi } from "../services/storyApi";

export type StoryPlayerState = "idle" | "loading" | "playing" | "paused" | "buffering" | "error" | "unsupported";

interface UseStoryPlayerOptions {
  item: StoryItem | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlay?: () => void;
}

export function useStoryPlayer({ item, videoRef, onEnded, onTimeUpdate, onPlay }: UseStoryPlayerOptions) {
  const [playerState, setPlayerState] = useState<StoryPlayerState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const itemType = item?.type;
  const itemRefId = item?.ref_id;
  const itemHlsUrl = item?.hls_url;
  const itemDashUrl = item?.dash_url;
  const itemExpiresAt = item?.playback_expires_at;

  const hlsInstanceRef = useRef<Hls | null>(null);
  const isRefreshingRef = useRef(false);
  const currentExpiresAtRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const activeItemRef = useRef<{ type: StoryItem['type']; refId: number } | null>(null);
  const callbacksRef = useRef({ onEnded, onTimeUpdate, onPlay });

  useEffect(() => {
    callbacksRef.current = { onEnded, onTimeUpdate, onPlay };
  }, [onEnded, onTimeUpdate, onPlay]);

  useEffect(() => {
    activeItemRef.current = itemType && itemRefId
      ? { type: itemType, refId: itemRefId }
      : null;
  }, [itemRefId, itemType]);

  const refreshAndResume = useCallback(async () => {
    if (isRefreshingRef.current || !itemType || !itemRefId) return;

    if (retryCountRef.current >= 2) {
      setPlayerState("error");
      setErrorMessage("ไม่สามารถเล่นวิดีโอได้ (เกินจำนวน Retry)");
      return;
    }

    isRefreshingRef.current = true;
    retryCountRef.current += 1;
    try {
      const playback = await storyApi.refreshPlayback(itemType, itemRefId);
      const activeItem = activeItemRef.current;
      if (activeItem?.type !== itemType || activeItem.refId !== itemRefId) return;

      const hasPlaybackSource = playback.hlsUrl || playback.dashUrl;

      if (!hasPlaybackSource) {
        setPlayerState("error");
        setErrorMessage("ไม่พบ URL สำหรับเล่นวิดีโอ");
        return;
      }

      currentExpiresAtRef.current = playback.expiresAt;
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }

      attachSource(playback.hlsUrl, playback.dashUrl);
    } catch (err: any) {
      setPlayerState("error");
      setErrorMessage("ไม่สามารถโหลด URL ใหม่ได้");
    } finally {
      isRefreshingRef.current = false;
    }
  }, [itemType, itemRefId]);

  const attachSource = useCallback((hlsSource?: string, dashSource?: string) => {
    const video = videoRef.current;
    if (!video) return;

    setPlayerState("loading");
    setErrorMessage(null);

    video.autoplay = true;
    video.playsInline = true;

    const playNativeDash = () => {
      if (!dashSource || !video.canPlayType('application/dash+xml')) return false;

      hlsInstanceRef.current?.destroy();
      hlsInstanceRef.current = null;
      video.src = dashSource;
      video.load();
      video.play().catch(() => setPlayerState("idle"));
      return true;
    };

    if (hlsSource && Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 30,
        maxBufferLength: 15,
        maxBufferSize: 30 * 1000000,
        startLevel: -1,
        capLevelToPlayerSize: false,
      });

      hls.loadSource(hlsSource);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.playsInline = true;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => setPlayerState("idle"));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.response?.code === 403 || data.response?.code === 404) {
                refreshAndResume();
              } else if (!playNativeDash()) {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (!playNativeDash()) hls.recoverMediaError();
              break;
            default:
              if (!playNativeDash()) {
                setPlayerState("error");
                setErrorMessage("เกิดข้อผิดพลาดในการเล่นวิดีโอ");
              }
              break;
          }
        }
      });

      hlsInstanceRef.current = hls;
    } else if (hlsSource && isHlsNativelySupported()) {
      video.playsInline = true;
      video.src = hlsSource;
      video.load();

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setPlayerState("idle"));
      }
    } else if (!playNativeDash()) {
      setPlayerState("unsupported");
      setErrorMessage("เบราว์เซอร์นี้ไม่รองรับรูปแบบวิดีโอ");
    }
  }, [videoRef, refreshAndResume]);

  useEffect(() => {
    if (!itemType || !itemRefId) {
      setPlayerState("idle");
      return;
    }

    const video = videoRef.current;
    if (video) {
      const handlePlaying = () => {
        setPlayerState("playing");
        callbacksRef.current.onPlay?.();
      };
      const handlePause = () => setPlayerState("paused");
      const handleWaiting = () => setPlayerState("buffering");
      const handleError = () => {
        if (isHlsNativelySupported()) {
          refreshAndResume();
        }
      };
      const handleEnded = () => callbacksRef.current.onEnded?.();
      const handleTimeUpdate = () => {
        if (video.duration) {
          callbacksRef.current.onTimeUpdate?.(video.currentTime, video.duration);
        }
      };

      video.addEventListener("playing", handlePlaying);
      video.addEventListener("pause", handlePause);
      video.addEventListener("waiting", handleWaiting);
      video.addEventListener("error", handleError);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        video.removeEventListener("playing", handlePlaying);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("waiting", handleWaiting);
        video.removeEventListener("error", handleError);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [itemType, itemRefId, videoRef, refreshAndResume]);

  useEffect(() => {
    if (!itemType || !itemRefId) return;

    retryCountRef.current = 0;
    currentExpiresAtRef.current = itemExpiresAt ?? null;

    if (!isPlaybackUrlUsable(currentExpiresAtRef.current)) {
      refreshAndResume();
      return;
    }

    if (itemHlsUrl || itemDashUrl) {
      attachSource(itemHlsUrl, itemDashUrl);
    } else {
      refreshAndResume();
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [itemType, itemRefId, itemHlsUrl, itemDashUrl, itemExpiresAt, attachSource, refreshAndResume]);

  return { playerState, errorMessage };
}
