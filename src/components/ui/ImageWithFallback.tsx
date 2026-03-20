"use client";

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string;
}

const ImageWithFallback = (props: ImageWithFallbackProps) => {
  const { src, fallbackSrc = '/images/default-avatar.png', ...rest } = props;
  
  // URL ที่มีปัญหา 404 จาก server (เพื่อลด error logs ใน terminal)
  const isBrokenUrl = typeof src === 'string' && src.includes('ejb-profile.png');
  const initialSrc = isBrokenUrl ? fallbackSrc : src;

  const [imgSrc, setImgSrc] = useState(initialSrc);

  useEffect(() => {
    setImgSrc(isBrokenUrl ? fallbackSrc : src);
  }, [src, isBrokenUrl, fallbackSrc]);

  return (
    <Image
      {...rest}
      src={imgSrc}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
};

export default ImageWithFallback;
