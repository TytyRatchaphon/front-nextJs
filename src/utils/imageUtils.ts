/**
 * Image loader utility for Next.js Image component
 * Centralized to avoid duplication across components
 */

import { readGifModePreference } from '@/utils/gifPreference';

export interface ImageLoaderParams {
  src: string;
  width?: number;
  quality?: number;
}

export interface BookCoverSource {
  img?: string | null;
  img_full?: string | null;
  imgtn?: string | null;
  thumb?: string | null;
  image?: string | null;
  cover?: string | null;
  img_gif?: string | null;
  img_gif_full?: string | null;
}

const INVALID_IMAGE_VALUES = new Set(['', 'null', 'undefined']);

const ensureHttps = (src: string): string => {
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('http://')) return src.replace('http://', 'https://');
  if (src.startsWith('img.enjoybook.co/')) return `https://${src}`;
  if (src.startsWith('image.enjoybook.co/')) return `https://${src}`;
  return src;
};

const appendImageParams = (src: string, width?: number, quality?: number): string => {
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  const requestedWidth = Math.max(1, Math.round(width || 1));
  const requestedQuality = Math.max(1, Math.round(quality || 75));

  if (src.startsWith('http://') || src.startsWith('https://')) {
    const url = new URL(src);
    url.searchParams.set('w', String(requestedWidth));
    url.searchParams.set('q', String(requestedQuality));
    return url.toString();
  }

  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}w=${requestedWidth}&q=${requestedQuality}`;
};

const isGifAsset = (src: string): boolean => {
  if (!src) return false;
  if (src.startsWith('data:image/gif')) return true;
  try {
    const parsed = new URL(src, 'https://enjoybook.local');
    return /\.gif$/i.test(parsed.pathname);
  } catch {
    return /\.gif($|\?)/i.test(src);
  }
};

const toStaticGifFrameSrc = (src: string): string => {
  if (!isGifAsset(src)) return src;
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;

  try {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      const url = new URL(src.startsWith('//') ? `https:${src}` : src);
      url.searchParams.set('frame', '1');
      url.searchParams.set('still', '1');
      url.searchParams.set('fm', 'webp');
      return url.toString();
    }

    const hashIndex = src.indexOf('#');
    const path = hashIndex >= 0 ? src.slice(0, hashIndex) : src;
    const hash = hashIndex >= 0 ? src.slice(hashIndex) : '';
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}frame=1&still=1&fm=webp${hash}`;
  } catch {
    return src;
  }
};

const applyBookGifPreference = (src: string, forceShowGif?: boolean): string => {
  if (!isGifAsset(src)) return src;
  const showGif = forceShowGif ?? readGifModePreference(true);
  return showGif ? src : toStaticGifFrameSrc(src);
};

const pickValidBookCoverSource = (...candidates: Array<string | null | undefined>): string | undefined => {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (INVALID_IMAGE_VALUES.has(trimmed)) continue;
    return trimmed;
  }
  return undefined;
};

export const resolveBookCoverImageSrc = (
  book: BookCoverSource | null | undefined,
  fallback = '/images/ejb.png',
  variant: 'tn' | 'thumbnail' | 'book' = 'tn',
  forceShowGif?: boolean,
): string => {
  const showGif = forceShowGif ?? readGifModePreference(true);
  const gifSource = pickValidBookCoverSource(book?.img_gif_full, book?.img_gif);
  const staticSource = pickValidBookCoverSource(
    book?.img,
    book?.img_full,
    book?.imgtn,
    book?.cover,
    book?.thumb,
    book?.image,
  );

  const selectedSource = showGif ? (gifSource || staticSource) : (staticSource || gifSource);
  return resolveBookImageSrc(selectedSource, fallback, variant, forceShowGif);
};

export const resolveImageSrc = (
  src: string | null | undefined,
  fallback = '/images/ejb.png',
  basePath?: string,
): string => {
  const raw = typeof src === 'string' ? src.trim() : '';

  if (INVALID_IMAGE_VALUES.has(raw)) return fallback;
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
  if (raw.startsWith('/')) return raw;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
    return ensureHttps(raw);
  }
  if (raw.startsWith('img.enjoybook.co/') || raw.startsWith('image.enjoybook.co/')) {
    return ensureHttps(raw);
  }
  if (raw.startsWith('img/')) {
    return `https://img.enjoybook.co/${raw}`;
  }
  if (raw.startsWith('enjoybook.image/')) {
    return `https://image.enjoybook.co/${raw}`;
  }

  const normalizedBase = basePath?.replace(/\/+$/, '');
  const cleaned = raw.replace(/^\/+/, '');
  return normalizedBase ? `${normalizedBase}/${cleaned}` : `https://img.enjoybook.co/${cleaned}`;
};

export const resolveBookImageSrc = (
  src: string | null | undefined,
  fallback = '/images/ejb.png',
  variant: 'tn' | 'thumbnail' | 'book' = 'tn',
  forceShowGif?: boolean,
): string => {
  const bookBaseMap = {
    tn: 'https://img.enjoybook.co/img/book/tn',
    thumbnail: 'https://img.enjoybook.co/img/book/thumbnail',
    book: 'https://img.enjoybook.co/img/book',
  } as const;

  const resolved = resolveImageSrc(src, fallback, bookBaseMap[variant]);
  return applyBookGifPreference(resolved, forceShowGif);
};

export const resolveBannerImageSrc = (
  src: string | null | undefined,
  fallback = '/images/hero-banner.png',
): string => {
  return resolveImageSrc(src, fallback, 'https://img.enjoybook.co/img/banner');
};

export const resolveStoreImageSrc = (
  src: string | null | undefined,
  fallback = '/images/ejb.png',
): string => {
  return resolveImageSrc(src, fallback, 'https://img.enjoybook.co/img/store');
};

export const resolveSettingsImageSrc = (
  src: string | null | undefined,
  fallback: string,
): string => {
  return resolveImageSrc(src, fallback, 'https://img.enjoybook.co/img/smn');
};

/**
 * Custom image loader used to bypass Next's remote optimizer in production.
 * This keeps browser-side loading while normalizing inconsistent CDN paths.
 */
export const imageLoader = ({ src, width, quality }: ImageLoaderParams): string => {
  const resolvedSrc = resolveImageSrc(src, src || '/images/ejb.png');
  return appendImageParams(resolvedSrc, width, quality);
};

/**
 * Simple image loader for components that only need src
 */
export const simpleImageLoader = ({ src }: { src: string }): string => {
  return src;
};
