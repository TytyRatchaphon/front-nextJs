"use client";

import type { ReactNode } from "react";
import type { DehydratedState } from "@tanstack/react-query";
import { App, ConfigProvider } from "antd";
import TanstackProvider from "./providers";
import SocketProvider from "@/providers/SocketProvider";

type ClientProvidersProps = {
  children: ReactNode;
  dehydratedState?: DehydratedState;
};

export default function ClientProviders({ children, dehydratedState }: ClientProvidersProps) {
  return (
    <TanstackProvider dehydratedState={dehydratedState}>
      <SocketProvider>
        <ConfigProvider theme={{ token: { colorPrimary: "#f5222d" } }}>
          <App>{children}</App>
        </ConfigProvider>
      </SocketProvider>
    </TanstackProvider>
  );
}
