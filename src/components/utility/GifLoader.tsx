import React from 'react'
import Image from 'next/image'

interface GifLoaderProps {
  className?: string; // Allow overriding container styles
  width?: number;
  height?: number;
}

function GifLoader({ className = "h-screen", width = 300, height = 300 }: GifLoaderProps) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
        <Image src="/images/ejb_gif.gif" alt="loader" width={width} height={height} unoptimized />
    </div>
  )
}

export default GifLoader