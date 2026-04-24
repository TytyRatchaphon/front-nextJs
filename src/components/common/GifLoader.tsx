"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

interface GifLoaderProps {
  className?: string; // Allow overriding container styles
  width?: number;
  height?: number;
}

function GifLoader({ className = "h-screen", width = 300, height = 300 }: GifLoaderProps) {
  const settings = useWebsiteSettings((state) => state.settings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const imageSrc = (mounted && settings?.loading_gif) ? settings.loading_gif : "/images/loading_gif.gif";

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Image src={imageSrc} alt="loader" width={width} height={height} unoptimized />
    </div>
  )
}

export default GifLoader
