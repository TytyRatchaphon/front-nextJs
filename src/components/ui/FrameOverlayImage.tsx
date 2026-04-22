"use client";
import * as React from "react";
import Image from 'next/image';
import { useTrimmedFrameSrc } from '@/hooks/useTrimmedFrameSrc';
import { resolveImageSrc } from '@/utils/imageUtils';

interface FrameOverlayImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

const isGifLike = (src: string): boolean => {
  if (!src) return false;
  if (src.startsWith('data:image/gif')) return true;
  return /\.gif($|\?)/i.test(src);
};

export default function FrameOverlayImage({
  src,
  alt,
  className = 'object-contain',
  style,
}: FrameOverlayImageProps) {
  const normalized = resolveImageSrc(src, '', 'https://img.enjoybook.co');
  const trimmed = useTrimmedFrameSrc(normalized);

  if (!trimmed) return null;

  const isUnoptimized = trimmed.startsWith('blob:') || trimmed.startsWith('data:') || isGifLike(trimmed);

  return (
    <Image
      src={trimmed}
      alt={alt}
      fill
      className={className}
      style={style}
      unoptimized={isUnoptimized}
    />
  );
}
