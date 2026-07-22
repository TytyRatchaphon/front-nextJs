import * as React from "react";
import type { Metadata } from "next";
import { GoogleAnalytics } from '@next/third-parties/google';
import { dehydrate, QueryClient } from "@tanstack/react-query";
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import "./globals.css";
import { Bai_Jamjuree } from "next/font/google";
import ClientProviders from "./client-providers";

const baiJamjuree = Bai_Jamjuree({
  weight: ["500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-bai-jamjuree",
  display: "swap",
});
import Image from 'next/image'
import { unstable_cache } from 'next/cache';
import { queryKeys } from "@/constants/query";
import { WEBSITE_SETTINGS_CACHE_TTL_MS } from "@/hooks/useWebsiteSettings";
import { fetchWebsiteSettingsQuery } from '@/services/websiteSettingsQuery';

const getCachedSettings = unstable_cache(
  fetchWebsiteSettingsQuery,
  ['website-settings'],
  { revalidate: 300 } // cache 5 minutes
);

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedSettings();

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://enjoybook.co'),
    verification: {
      google: 's6Eb1YsalJ_H50bHYWUGV8bsZXQhrg_GdplUZjFRsfk',
    },
    title: {
      default: settings?.seo_title || 'Enjoybook - อ่านนิยายออนไลน์ นิยายแปล นิยายจีน แฟนตาซี',
      template: '%s | Enjoybook',
    },
    description: settings?.seo_description || 'Enjoybook แหล่งรวมนิยาย อ่านนิยายออนไลน์ นิยายแปล นิยายจีน แฟนตาซี กำลังภายใน โรแมนติก อ่านฟรี',
    keywords: settings?.seo_keyword || 'นิยาย, อ่านนิยาย, นิยายแปล, นิยายจีน, นิยายออนไลน์, อ่านนิยายฟรี, Enjoybook',
    openGraph: {
      type: 'website',
      siteName: 'Enjoybook',
      locale: 'th_TH',
      images: [
        {
          url: 'https://image.enjoybook.co/enjoybook.image/web/2026021217054495nw.png',
          width: 1200,
          height: 630,
          alt: 'Enjoybook - แหล่งรวมนิยายออนไลน์',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['https://image.enjoybook.co/enjoybook.image/web/2026021217054495nw.png'],
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
        { url: '/icon.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    // NOTE: Do NOT set a global canonical here — each page must define its own.
    // A root-level canonical: '/' causes Google to treat ALL pages as duplicates of the homepage.
  };
}

import Script from 'next/script';

// ... (existing imports)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.website.settings(),
    queryFn: getCachedSettings,
    staleTime: WEBSITE_SETTINGS_CACHE_TTL_MS,
    gcTime: WEBSITE_SETTINGS_CACHE_TTL_MS,
  });

  return (
    <html lang="th" className={`${baiJamjuree.variable} font-bai-jamjuree font-medium`}>
      <Script src="https://t.contentsquare.net/uxa/c765809e7d7ef.js" strategy="lazyOnload" />
      
      {/* Google Ads Tag */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-16724162319"
        strategy="lazyOnload"
      />
      <Script id="google-ads-tag" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-16724162319');
        `}
      </Script>
      {/* Facebook Pixel */}
      <Script id="facebook-pixel" strategy="lazyOnload">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1597109174593241');
          fbq('track', 'PageView');
        `}
      </Script>

      <body
        className={`flex flex-col w-full min-h-[100vh] font-bai-jamjuree font-medium`}>
        {/* Organization Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([{
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Enjoybook',
              url: 'https://enjoybook.co',
              logo: 'https://enjoybook.co/icon.png',
              description: 'แหล่งรวมนิยายออนไลน์ นิยายแปล นิยายจีน แฟนตาซี กำลังภายใน อ่านฟรี',
              sameAs: [
                'https://www.facebook.com/webenjoybook',
                'https://www.instagram.com/enjoybook_official',
                'https://www.tiktok.com/@enjoybook.official'
              ],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Enjoybook',
              url: 'https://enjoybook.co/',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://enjoybook.co/search?q={search_term_string}',
                'query-input': 'required name=search_term_string'
              }
            },
            {
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              itemListElement: [
                {
                  '@type': 'SiteNavigationElement',
                  position: 1,
                  name: 'จัดอันดับ',
                  url: 'https://enjoybook.co/ranking'
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 2,
                  name: 'เข้าสู่ระบบ',
                  url: 'https://enjoybook.co/login'
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 3,
                  name: 'นิยายทั้งหมด',
                  url: 'https://enjoybook.co/allnovel'
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 4,
                  name: 'บทความ',
                  url: 'https://enjoybook.co/article'
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 5,
                  name: 'แคมเปญ',
                  url: 'https://enjoybook.co/campaign'
                }
              ]
            }]),
          }}
        />
        {/* Facebook Pixel NoScript */}
        <noscript>
          <Image
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1597109174593241&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        
        <ClientProviders dehydratedState={dehydrate(queryClient)}>{children}</ClientProviders>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "G-RTWVKZ2MVF"} />
      </body>
    </html>
  );
}
