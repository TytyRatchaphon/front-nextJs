import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.enjoybook.co',
        port: '',
        pathname: '/**', // อนุญาตทุก path ภายใต้ hostname นี้
      },
    ],
  },
};

export default nextConfig;
