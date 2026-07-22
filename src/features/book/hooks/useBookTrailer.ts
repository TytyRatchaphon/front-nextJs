"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import type { BookDetailTrailer, BookDetailPresentation } from "@/types/book";
import { getTrailerSource, isPlaybackUrlUsable, isHlsNativelySupported } from "@/utils/videoPlayback";
import { fetchTrailerPlayback } from "@/features/video/services/videoApi";

export type TrailerMediaMode = "cover" | "trailer";
export type TrailerPlayerState = "idle" | "loading" | "playing" | "buffering" | "error" | "unsupported";

interface UseBookTrailerOptions {
  trailer: BookDetailTrailer | undefined | null;
  presentation: BookDetailPresentation | undefined | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useBookTrailer({ trailer, presentation, videoRef }: UseBookTrailerOptions) {
  const [mediaMode, setMediaMode] = useState<TrailerMediaMode>("cover");
  const [playerState, setPlayerState] = useState<TrailerPlayerState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hlsInstanceRef = useRef<Hls | null>(null);
  const videojsInstanceRef = useRef<Player | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);
  const retryCountRef = useRef(0);

  const currentSourceRef = useRef<string | null>(null);
  const currentExpiresAtRef = useRef<number | null>(null);
  const currentTrailerIdRef = useRef<number | null>(null);

  const hasTrailer = Boolean(trailer?.hasTrailer);
  const usesTrailer = presentation?.detailUsesTrailer !== false;
  const delayMs = presentation?.detailAutoplayDelayMs ?? 3000;

  const handleHlsError = useCallback((event: any, data: any) => {
    const hls = hlsInstanceRef.current;
    if (data.fatal) {
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          if (data.response?.code === 403 || data.response?.code === 404) {
            refreshAndResume();
          } else {
            hls?.startLoad();
          }
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          hls?.recoverMediaError();
          break;
        default:
          setPlayerState("error");
          setErrorMessage("เกิดข้อผิดพลาดในการเล่นวิดีโอ");
          break;
      }
    }
  }, []);

  const refreshAndResume = useCallback(async () => {
    if (isRefreshingRef.current || !currentTrailerIdRef.current) return;
    if (retryCountRef.current >= 2) {
      setPlayerState("error");
      setErrorMessage("ไม่สามารถเล่นวิดีโอได้ (เกินจำนวน Retry)");
      return;
    }

    isRefreshingRef.current = true;
    retryCountRef.current += 1;

    try {
      const playback = await fetchTrailerPlayback(currentTrailerIdRef.current);
      const newSource = playback.preferredSource?.url || playback.hlsUrl;

      if (!newSource) {
        setPlayerState("error");
        setErrorMessage("ไม่พบ URL สำหรับเล่นวิดีโอ");
        return;
      }

      currentExpiresAtRef.current = playback.expiresAt;
      if (videojsInstanceRef.current) {
        videojsInstanceRef.current.dispose();
        videojsInstanceRef.current = null;
      }
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }

      attachSource(newSource);
    } catch (err: any) {
      console.error("fetchTrailerPlayback Error:", err);
      setPlayerState("error");
      setErrorMessage("ไม่สามารถโหลด URL ใหม่ได้");
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  const attachSource = useCallback((source: string) => {
    const video = videoRef.current;
    if (!video) return;

    // --- PROXY INTERCEPTOR FOR CORS BYPASS ---
    // Rewrite absolute backend URLs to use our Next.js API proxy
    let proxiedSource = source;
    if (proxiedSource.includes("192.168.220.214:4005/video")) {
      proxiedSource = proxiedSource.replace("http://192.168.220.214:4005/video", "/api/proxy-video");
    }
    // -----------------------------------------

    currentSourceRef.current = proxiedSource;
    setPlayerState("loading");

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 30,        // Buffer up to 30s for smoother playback
        maxBufferLength: 15,           // Target 15s buffer before quality upgrade
        maxBufferSize: 30 * 1000000,   // 30MB max buffer
        startLevel: -1,                // Auto (overridden below via MANIFEST_PARSED)
        capLevelToPlayerSize: false,   // Disable capping to prevent stuck at 144p on small cards
        abrEwmaDefaultEstimate: 2000000, // Assume 2Mbps bandwidth initially (medium quality)
      });

      hls.loadSource(proxiedSource);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels;
        const availableQualities = levels.map((l) => l.height);

        video.setAttribute('muted', 'true');
        video.setAttribute('playsinline', 'true');

        if (!videojsInstanceRef.current && video) {
          videojsInstanceRef.current = videojs(video, {
            controls: true,
            muted: true,
            autoplay: "muted",
            playsinline: true,
            playbackRates: [0.5, 1, 1.25, 1.5, 2],
            controlBar: {
              pictureInPictureToggle: true,
            }
          });
        }
        
        const player = videojsInstanceRef.current;
        if (player) {
          player.ready(() => {
            player.muted(true);
            const playPromise = player.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => setPlayerState("idle"));
            }
          });
        }
      });

      hls.on(Hls.Events.ERROR, handleHlsError);

      hlsInstanceRef.current = hls;
    } else if (isHlsNativelySupported()) {
      video.setAttribute('muted', 'true');
      video.setAttribute('playsinline', 'true');
      video.src = proxiedSource;
      video.load();
      
      if (!videojsInstanceRef.current && video) {
        videojsInstanceRef.current = videojs(video, {
          controls: true,
          muted: true,
          autoplay: "muted",
          playsinline: true,
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          controlBar: {
            pictureInPictureToggle: true,
          }
        });
      }
      
      const player = videojsInstanceRef.current;
      if (player) {
        player.ready(() => {
          player.muted(true);
          const playPromise = player.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => setPlayerState("idle"));
          }
        });
      }
    } else {
      setPlayerState("unsupported");
    }
  }, [videoRef, handleHlsError]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    setErrorMessage(null);

    if (!trailer) return;

    if (isPlaybackUrlUsable(currentExpiresAtRef.current)) {
      const source = currentSourceRef.current || getTrailerSource(trailer);
      if (source) {
        attachSource(source);
        return;
      }
    }

    if (currentTrailerIdRef.current) {
      refreshAndResume();
    }
  }, [trailer, attachSource, refreshAndResume]);

  useEffect(() => {
    if (!hasTrailer || !usesTrailer || !trailer) {
      setMediaMode("cover");
      setPlayerState("idle");
      return;
    }

    const video = videoRef.current;
    if (video) {
      const onPlaying = () => setPlayerState("playing");
      const onWaiting = () => setPlayerState("buffering");
      const onError = () => {
        if (isHlsNativelySupported()) {
          refreshAndResume();
        }
      };

      video.addEventListener("playing", onPlaying);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("error", onError);

      return () => {
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("error", onError);
      };
    }
  }, [hasTrailer, usesTrailer, trailer, videoRef, refreshAndResume]);

  useEffect(() => {
    if (!hasTrailer || !usesTrailer || !trailer) return;

    setMediaMode("cover");
    setPlayerState("idle");
    currentTrailerIdRef.current = trailer.id;
    currentExpiresAtRef.current = trailer.expiresAt ?? null;
    currentSourceRef.current = null;

    delayTimerRef.current = setTimeout(() => {
      setMediaMode("trailer");
      if (!isPlaybackUrlUsable(currentExpiresAtRef.current)) {
        refreshAndResume();
        return;
      }

      const source = getTrailerSource(trailer);
      if (source) {
        attachSource(source);
      } else {
        refreshAndResume();
      }
    }, delayMs);

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (videojsInstanceRef.current) {
        videojsInstanceRef.current.dispose();
        videojsInstanceRef.current = null;
      }
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [trailer?.id, hasTrailer, usesTrailer, delayMs, attachSource, refreshAndResume]);

  return { mediaMode, playerState, errorMessage, retry };
}
