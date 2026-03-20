'use client';

import '@ant-design/v5-patch-for-react-19';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useWebsiteStore } from '@/stores/websiteStore'; // Direct import
import BlockedUserModal from '@/components/auth/BlockedUserModal';

const ReactQueryDevtoolsLazy = React.lazy(() =>
  import('@tanstack/react-query-devtools').then((d) => ({
    default: d.ReactQueryDevtools,
  }))
);

export default function TanstackProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            retryDelay: 3000,
            gcTime: 5 * 60 * 1000,
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
      {process.env.NODE_ENV === 'development' && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtoolsLazy initialIsOpen={false} />
        </React.Suspense>
      )}
      <BlockedUserModal />
    </QueryClientProvider>
  );
}
