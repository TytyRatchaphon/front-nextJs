import React from 'react';
import Image from 'next/image';

interface BookCoverImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  imgClassName?: string;
  /** Content rendered inside the cover container (overlays, badges, etc.) */
  children?: React.ReactNode;
}

/**
 * Book cover image with built-in error fallback.
 * Replaces the duplicated `imgError` state + conditional render
 * that was copy-pasted across 6+ card components.
 */
export function BookCoverImage({
  src,
  alt,
  width,
  height,
  fill,
  className = '',
  imgClassName = '',
  children,
}: BookCoverImageProps) {
  const [imgError, setImgError] = React.useState(false);
  const resolvedSrc = imgError ? '/images/ejb.png' : src;

  return (
    <div className={`relative ${className}`}>
      <Image
        src={resolvedSrc}
        alt={alt}
        {...(fill
          ? { fill: true }
          : { width: width ?? 168, height: height ?? 237 })}
        className={imgClassName}
        loading="lazy"
        onError={() => setImgError(true)}
      />
      {children}
    </div>
  );
}
