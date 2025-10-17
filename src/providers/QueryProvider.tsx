'use client';

import { QueryClient, QueryClientProvider,  } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

const makeQueryClient = () => {
    return new QueryClient({
        defaultOptions : {
            queries : {
                staleTime: 60 * 1000,
            },
        },
    });
};

let browserQueryClient: QueryClient | undefined = undefined;

const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: สร้างใหม่ทุกครั้ง
    return makeQueryClient();
  } else {
    // Browser: ใช้ client เดิม
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
};

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // ใช้ getQueryClient() เพื่อให้แน่ใจว่า Client/Server ทำงานถูกต้อง
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools สำหรับช่วย Debug ตอน Dev*/}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}