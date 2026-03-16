import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  allowedDevOrigins: ['192.168.220.172'],
  experimental: {
    optimizePackageImports: [
      'antd',
      '@ant-design/icons',
      'lucide-react',
      'recharts',
      'apexcharts',
      'swiper'
    ],
  },
  images: {
    qualities: [100, 70, 70, 70, 70, 70, 70, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.enjoybook.co',
        port: '',
        pathname: '**', // อนุญาตทุก path ภายใต้ hostname นี้
      },
      {
        protocol: 'https',
        hostname: 'image.enjoybook.co',
        port: '',
        pathname: '**',
      }
    ],
  },
};

export default nextConfig;
