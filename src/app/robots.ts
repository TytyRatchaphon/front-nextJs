import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://enjoybook.co';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/checkout',
        '/cart',
        '/sprofile',
        '/wallet',
        '/redeem',
        '/coupon',
        '/mprofile',
        '/api/',
        '/login',
        '/resetpassword',
        '/linecallback',
        '/test-notifications',
        '/achievement',
        '/all-quest',
        '/reader-pass',
        '/wheel',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
