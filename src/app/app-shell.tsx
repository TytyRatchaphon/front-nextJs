// Server Component — composes client islands (Navbar, TokenUpdater, etc.) without needing 'use client'

import type { ReactNode } from "react";
import { Suspense } from "react";

import TokenUpdater from "@/components/auth/TokenUpdater";
import CookieConsentBanner from "@/components/common/CookieConsentBanner";
import FooterWrapper from "@/components/home/FooterWrapper";
import Navbar from "@/components/navbar/navbar";
import NotificationAlertSocketListener from "@/components/socket/NotificationAlertSocketListener";
import RpQuestSocketListener from "@/components/socket/RpQuestSocketListener";
import GlobalLogger from "@/components/utility/GlobalLogger";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Suspense fallback={null}>
        <TokenUpdater />
      </Suspense>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <Suspense fallback={null}>
        <GlobalLogger />
      </Suspense>
      <Suspense fallback={null}>
        <RpQuestSocketListener />
      </Suspense>
      <Suspense fallback={null}>
        <NotificationAlertSocketListener />
      </Suspense>
      {children}
      <FooterWrapper />
      <CookieConsentBanner />
    </>
  );
}
