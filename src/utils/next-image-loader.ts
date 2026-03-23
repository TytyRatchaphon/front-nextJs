import type { ImageLoaderProps } from 'next/image';
import { imageLoader } from './imageUtils';

export default function nextImageLoader({ src, width, quality }: ImageLoaderProps): string {
  return imageLoader({ src, width, quality });
}
