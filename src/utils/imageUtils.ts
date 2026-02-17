/**
 * Image loader utility for Next.js Image component
 * Centralized to avoid duplication across components
 */

export interface ImageLoaderParams {
  src: string;
  width?: number;
  quality?: number;
}

/**
 * Custom image loader for Next.js Image component
 * Handles both external URLs and local paths
 * @param src - Image source URL or path
 * @param width - Requested image width (required by Next.js)
 * @returns The image URL
 */
export const imageLoader = ({ src, width }: { src: string; width?: number }): string => {
  // For external URLs (http/https), return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // For local paths, return as-is (Next.js will handle them)
  return src;
};

/**
 * Simple image loader for components that only need src
 */
export const simpleImageLoader = ({ src }: { src: string }): string => {
  return src;
};
