'use client';

import '@ant-design/v5-patch-for-react-19';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { useWebsiteStore } from '@/stores/websiteStore'; // Direct import
import BlockedUserModal from '@/components/auth/BlockedUserModal';

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
    useWebsiteStore.getState().fetchSettings();
    try {
      localStorage.removeItem('searchHistory');
      localStorage.removeItem('search_history');
    } catch {
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
      <BlockedUserModal />
    </QueryClientProvider>
  );
}
