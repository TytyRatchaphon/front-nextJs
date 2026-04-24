'use client';

import * as React from "react";

import '@ant-design/v5-patch-for-react-19';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { prefetchWebsiteSettings } from '@/hooks/useWebsiteSettings';
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

  React.useEffect(() => {
    void prefetchWebsiteSettings(queryClient);
    try {
      localStorage.removeItem('searchHistory');
      localStorage.removeItem('search_history');
    } catch {
    }
  }, [queryClient]);

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

