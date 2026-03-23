'use client';

import Image from 'next/image';
import Link from 'next/link';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

const DEFAULT_AVATAR = '/images/default-avatar.png';

export const normalizeProfileAssetSrc = (
  src?: string | null,
  fallback = DEFAULT_AVATAR,
  cdnPath = 'https://img.enjoybook.co/img/profile/',
) => {
  if (!src || src === 'null' || src === 'undefined') return fallback;
  if (src.startsWith('http') || src.startsWith('data:')) return src.replace('http:', 'https:');
  if (src.startsWith('/')) return src;
  if (src.startsWith('img/')) return `https://img.enjoybook.co/${src}`;
  return `${cdnPath}${src}`;
};

export const extractFrameSrc = (user?: {
  frame_img?: string | null;
  frame?: string | { img?: string | null } | null;
} | null) => {
  const frameValue = user?.frame_img || (typeof user?.frame === 'string' ? user.frame : user?.frame?.img) || null;
  return frameValue ? normalizeProfileAssetSrc(frameValue, '', 'https://img.enjoybook.co/') : '';
};

interface ProfileAvatarLinkProps {
  userId?: string | number | null;
  name?: string | null;
  avatarSrc?: string | null;
  frameSrc?: string | null;
  sizeClassName?: string;
  frameScaleClassName?: string;
  className?: string;
  imageClassName?: string;
  stopPropagation?: boolean;
  disabled?: boolean;
}

export default function ProfileAvatarLink({
  userId,
  name,
  avatarSrc,
  frameSrc,
  sizeClassName = 'h-10 w-10',
  frameScaleClassName = '-inset-1',
  className = '',
  imageClassName = 'object-cover',
  stopPropagation = false,
  disabled = false,
}: ProfileAvatarLinkProps) {
  const normalizedAvatar = normalizeProfileAssetSrc(avatarSrc);
  const normalizedFrame = frameSrc ? normalizeProfileAssetSrc(frameSrc, '', 'https://img.enjoybook.co/') : '';
  const href = userId ? `/profile/${userId}` : undefined;

  const avatarNode = (
    <div className={`relative ${sizeClassName} ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-full border border-white/80 bg-gray-100">
        <ImageWithFallback
          src={normalizedAvatar}
          fallbackSrc={DEFAULT_AVATAR}
          alt={name || 'User'}
          fill
          className={imageClassName}
        />
      </div>
      {normalizedFrame && (
        <div className={`pointer-events-none absolute ${frameScaleClassName} z-10`}>
          <Image
            src={normalizedFrame}
            alt={`${name || 'User'} frame`}
            fill
            className="object-contain"
            unoptimized={normalizedFrame.endsWith('.gif')}
          />
        </div>
      )}
    </div>
  );

  if (!href || disabled) {
    return avatarNode;
  }

  return (
    <Link
      href={href}
      onClick={stopPropagation ? (event) => event.stopPropagation() : undefined}
      className="inline-flex shrink-0"
      aria-label={name ? `Open profile of ${name}` : 'Open profile'}
    >
      {avatarNode}
    </Link>
  );
}
