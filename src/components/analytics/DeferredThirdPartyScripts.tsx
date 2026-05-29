"use client";

import * as React from "react";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";

const GOOGLE_ADS_ID = "AW-16724162319";
const FACEBOOK_PIXEL_ID = "1597109174593241";
const CONTENTSQUARE_SRC = "https://t.contentsquare.net/uxa/c765809e7d7ef.js";
const DEFER_TIMEOUT_MS = 12000;

const isTestLikeHost = (hostname: string) => {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized.startsWith("test-") ||
    normalized.includes("test-ejbwebfont")
  );
};

export default function DeferredThirdPartyScripts() {
  const [shouldLoadScripts, setShouldLoadScripts] = React.useState(false);

  React.useEffect(() => {
    if (isTestLikeHost(window.location.hostname) && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_ON_TEST !== "true") {
      return;
    }

    const loadScripts = () => setShouldLoadScripts(true);
    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    const cleanupEvents = () => {
      events.forEach((eventName) => window.removeEventListener(eventName, loadScripts));
    };

    events.forEach((eventName) => {
      window.addEventListener(eventName, loadScripts, { once: true, passive: true });
    });

    const timeoutId = window.setTimeout(loadScripts, DEFER_TIMEOUT_MS);

    return () => {
      cleanupEvents();
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!shouldLoadScripts) return null;

  return (
    <>
      <Script src={CONTENTSQUARE_SRC} strategy="lazyOnload" />
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="lazyOnload" />
      <Script id="google-ads-tag" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
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
          fbq('init', '${FACEBOOK_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "G-RTWVKZ2MVF"} />
    </>
  );
}
