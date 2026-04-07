'use client';

import { useEffect, useState } from 'react';
import { trimWhiteEdgesFromImageSrc } from '@/utils/frameImageUtils';

const isGifSource = (src: string): boolean => {
  if (!src) return false;
  if (src.startsWith('data:image/gif')) return true;
  return /\.gif($|\?)/i.test(src);
};

export const useTrimmedFrameSrc = (src?: string | null): string => {
  const normalized = typeof src === 'string' ? src.trim() : '';
  const [resolvedSrc, setResolvedSrc] = useState(normalized);

  useEffect(() => {
    let isCancelled = false;

    if (!normalized || isGifSource(normalized)) {
      setResolvedSrc(normalized);
      return () => {
        isCancelled = true;
      };
    }

    setResolvedSrc(normalized);

    trimWhiteEdgesFromImageSrc(normalized)
      .then((trimmedSrc) => {
        if (isCancelled) return;
        setResolvedSrc(trimmedSrc || normalized);
      })
      .catch(() => {
        if (isCancelled) return;
        setResolvedSrc(normalized);
      });

    return () => {
      isCancelled = true;
    };
  }, [normalized]);

  return resolvedSrc;
};
