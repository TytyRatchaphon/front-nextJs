import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.220.172'],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
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
    loader: 'custom',
    loaderFile: './src/utils/next-image-loader.ts',
    qualities: [100, 70, 70, 70, 70, 70, 70, 75, 80],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.enjoybook.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.enjoybook.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
