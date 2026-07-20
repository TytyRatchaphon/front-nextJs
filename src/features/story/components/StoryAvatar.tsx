"use client";

import Image from "next/image";
import { useState } from "react";

const DEFAULT_AVATAR_SRC = "/images/default-avatar.png";

interface StoryAvatarProps {
  src?: string | null;
  alt?: string;
  sizes?: string;
  className?: string;
}

const StoryAvatar = ({
  src,
  alt = "",
  sizes = "40px",
  className = "object-cover",
}: StoryAvatarProps) => {
  const candidateSrc = src?.trim() || null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = candidateSrc && failedSrc !== candidateSrc ? candidateSrc : DEFAULT_AVATAR_SRC;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => {
        if (candidateSrc && imageSrc !== DEFAULT_AVATAR_SRC) setFailedSrc(candidateSrc);
      }}
    />
  );
};

export default StoryAvatar;
