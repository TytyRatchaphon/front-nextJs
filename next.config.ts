import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Suppress React version warning from Ant Design
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.enjoybook.co',
        port: '',
        pathname: '/**', // อนุญาตทุก path ภายใต้ hostname นี้
      },
      {
        protocol: 'https',
        hostname: 'image.enjoybook.co',
        port: '',
        pathname: '/**', // อนุญาตทุก path ภายใต้ hostname นี้
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://192.168.220.214:3331/:path*',
      },
    ];
  },
};

export default nextConfig;
