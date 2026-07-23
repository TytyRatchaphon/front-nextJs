/**
 * Video Playback Utilities
 *
 * Utility functions for managing HLS video trailer playback,
 * URL expiration checks, and source selection.
 */

import type { BookDetailTrailer, BookDetailVideoSource } from '@/types/book';

/**
 * Select the best HLS source URL from a trailer object.
 * Priority: preferredSource → HLS in sources → hlsUrl
 */
export function getTrailerSource(trailer: BookDetailTrailer): string | null {
  if (trailer.preferredSource?.url) {
    return trailer.preferredSource.url;
  }

  if (Array.isArray(trailer.sources)) {
    const hlsSource = trailer.sources.find(
      (s: BookDetailVideoSource) => s.type === 'hls' || s.mimeType === 'application/vnd.apple.mpegurl',
    );
    if (hlsSource?.url) return hlsSource.url;
  }

  return trailer.hlsUrl ?? null;
}

/**
 * Check if a signed playback URL is still usable.
 * Returns true if the URL expires more than 30 seconds from now.
 */
export function isPlaybackUrlUsable(expiresAt?: number | null): boolean {
  if (!expiresAt) return true; // If no expiration is specified, assume it's usable
  return expiresAt > Math.floor(Date.now() / 1000) + 30;
}

/**
 * Check if the browser supports native HLS playback.
 * Safari and iOS browsers support HLS natively.
 */
export function isHlsNativelySupported(): boolean {
  if (typeof document === 'undefined') return false;
  const video = document.createElement('video');
  return video.canPlayType('application/vnd.apple.mpegurl') !== '';
}

/**
 * Format a duration in seconds to a human-readable string (mm:ss).
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Select the best cover image from a book data object.
 * Priority: img_gif_full → img_gif → img_full → img
 */
export function selectCoverImage(book: {
  img_gif_full?: string | null;
  img_gif?: string | null;
  img_full?: string | null;
  img?: string | null;
}): string | null {
  return book.img_gif_full || book.img_gif || book.img_full || book.img || null;
}
