import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // ปิด strict mode เพื่อลด warning
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.enjoybook.co',
        port: '',
        pathname: '**', // อนุญาตทุก path ภายใต้ hostname นี้
      }
    ],
  },
};

export default nextConfig;
