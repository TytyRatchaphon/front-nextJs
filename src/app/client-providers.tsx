"use client";

import { type ReactNode } from "react";
import type { DehydratedState } from "@tanstack/react-query";
import { App, ConfigProvider } from "antd";
import TanstackProvider from "./providers";
import SocketProvider from "@/providers/SocketProvider";

type ClientProvidersProps = {
  children: ReactNode;
  dehydratedState?: DehydratedState;
};

export default function ClientProviders({ children, dehydratedState }: ClientProvidersProps) {
  const content = (
    <ConfigProvider theme={{ token: { colorPrimary: "#f5222d" } }}>
      <App>{children}</App>
    </ConfigProvider>
  );

  return (
    <TanstackProvider dehydratedState={dehydratedState}>
      <SocketProvider>{content}</SocketProvider>
    </TanstackProvider>
  );
}
