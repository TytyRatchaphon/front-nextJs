import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
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

export default bundleAnalyzer(nextConfig);
