"use client";

import Hls from "hls.js";
import { useEffect, useRef } from "react";

interface StoryPlayerProps {
  src: string;
  isActive: boolean;
  isMuted: boolean;
}

export default function StoryPlayer({ src, isActive, isMuted }: StoryPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || !isActive) return;

    let hls: Hls | null = null;
    const play = () => {
      void video.play().catch(() => {
        video.muted = true;
        void video.play().catch(() => undefined);
      });
    };

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, play);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", play);
    }

    return () => {
      video.removeEventListener("loadedmetadata", play);
      hls?.destroy();
    };
  }, [isActive, src]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  return <video ref={videoRef} className="h-full w-full object-cover" playsInline loop />;
}
