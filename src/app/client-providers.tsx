"use client";

import "@ant-design/v5-patch-for-react-19";
import { type ReactNode } from "react";
import type { DehydratedState } from "@tanstack/react-query";
import { App, ConfigProvider } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import TanstackProvider from "./providers";
import SocketProvider from "@/providers/SocketProvider";

type ClientProvidersProps = {
  children: ReactNode;
  dehydratedState?: DehydratedState;
};

export default function ClientProviders({ children, dehydratedState }: ClientProvidersProps) {
  const content = (
    <StyleProvider layer>
      <ConfigProvider theme={{ token: { colorPrimary: "#f5222d" } }}>
        <App>
          {children}
        </App>
      </ConfigProvider>
    </StyleProvider>
  );

  return (
    <TanstackProvider dehydratedState={dehydratedState}>
      <SocketProvider>{content}</SocketProvider>
    </TanstackProvider>
  );
}
