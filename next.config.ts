import type { NextConfig } from "next";

const noStoreHeaders = [
  { key: "Cache-Control", value: "private, no-store, no-cache, max-age=0, must-revalidate" },
  { key: "CDN-Cache-Control", value: "no-store" },
  { key: "Surrogate-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.220.172', '192.168.220.172:4005', '192.168.220.172:3009', '*', '192.168.250.73:4005'],
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "query", key: "_rsc" }],
        headers: noStoreHeaders,
      },
      {
        source: "/:path*",
        has: [{ type: "header", key: "rsc", value: "1" }],
        headers: noStoreHeaders,
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/video/trailers/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy-video/:path*",
        destination: "http://192.168.220.214:4005/video/:path*",
      },
      {
        source: "/api/proxy-media/:path*",
        destination: "http://192.168.220.214:4005/media/:path*",
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
