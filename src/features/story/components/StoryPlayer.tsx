import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

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

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      playsInline
      loop
    />
  );
}
