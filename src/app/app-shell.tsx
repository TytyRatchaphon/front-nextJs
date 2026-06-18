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
      <Suspense 
        fallback={
          <div className="sticky top-0 z-[1200] w-full flex flex-col">
            <div className="flex justify-between items-center h-[60px] lg:h-[80px] bg-white text-gray-700 shadow-sm w-full px-4 lg:px-8">
              <div className="w-24 lg:w-32 h-8 bg-gray-200 animate-pulse rounded-md" />
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full hidden lg:block" />
                <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full" />
                <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        }
      >
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
