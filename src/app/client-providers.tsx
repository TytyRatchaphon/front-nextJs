"use client";

import { type ReactNode, lazy, Suspense } from "react";
import type { DehydratedState } from "@tanstack/react-query";
import { App, ConfigProvider } from "antd";
import TanstackProvider from "./providers";
import { useAuthStore } from "@/stores/authStore";

// Lazy-load SocketProvider — only downloaded when an authenticated user mounts it.
const SocketProvider = lazy(() => import("@/providers/SocketProvider"));

type ClientProvidersProps = {
  children: ReactNode;
  dehydratedState?: DehydratedState;
};

export default function ClientProviders({ children, dehydratedState }: ClientProvidersProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const content = (
    <ConfigProvider theme={{ token: { colorPrimary: "#f5222d" } }}>
      <App>{children}</App>
    </ConfigProvider>
  );

  return (
    <TanstackProvider dehydratedState={dehydratedState}>
      {isLoggedIn ? (
        <Suspense fallback={content}>
          <SocketProvider>{content}</SocketProvider>
        </Suspense>
      ) : (
        content
      )}
    </TanstackProvider>
  );
}
