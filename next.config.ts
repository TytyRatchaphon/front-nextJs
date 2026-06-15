import type { NextConfig } from "next";

const noStoreHeaders = [
  { key: "Cache-Control", value: "private, no-store, no-cache, max-age=0, must-revalidate" },
  { key: "CDN-Cache-Control", value: "no-store" },
  { key: "Surrogate-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.220.172'],
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
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://t.contentsquare.net https://accounts.google.com https://apis.google.com https://appleid.cdn-apple.com https://static.line-scdn.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' https://img.enjoybook.co https://image.enjoybook.co https://www.facebook.com https://www.google-analytics.com https://*.googleusercontent.com data: blob:",
              "connect-src 'self' https://*.enjoybook.co http://192.168.220.214:4005 ws://192.168.220.214:4005 https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://t.contentsquare.net https://accounts.google.com https://apis.google.com https://appleid.apple.com https://liff.line.me https://api.line.me wss://*.enjoybook.co",
              "frame-src 'self' https://www.facebook.com https://www.google.com https://accounts.google.com https://appleid.apple.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://appleid.apple.com",
            ].join("; "),
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
