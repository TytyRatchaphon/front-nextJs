'use client';

import '@ant-design/v5-patch-for-react-19';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function TanstackProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  // Initial fetch for website settings
  React.useEffect(() => {
    // Dynamically import to avoid server-side issues if store is not ssr-ready, 
    // though zustand usually handles it. 
    // Or just call it directly if it's safe.
    // For simplicity, we'll assume client-side execution here.
    import('@/stores/websiteStore').then(({ useWebsiteStore }) => {
        useWebsiteStore.getState().fetchSettings();
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
