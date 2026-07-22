'use client';

import * as React from "react";

import '@ant-design/v5-patch-for-react-19';
import { useState } from 'react';
import { HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DehydratedState } from "@tanstack/react-query";

import ApiAuthEventBridge from '@/features/auth/components/ApiAuthEventBridge';
import BlockedUserModal from '@/features/auth/components/BlockedUserModal';

const ReactQueryDevtoolsLazy = React.lazy(() =>
  import('@tanstack/react-query-devtools').then((d) => ({
    default: d.ReactQueryDevtools,
  }))
);

export default function TanstackProvider({
  children,
  dehydratedState,
}: {
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
}) {
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
    try {
      localStorage.removeItem('searchHistory');
      localStorage.removeItem('search_history');
    } catch {
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiAuthEventBridge />
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
      {process.env.NODE_ENV === 'development' && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtoolsLazy initialIsOpen={false} buttonPosition="bottom-left" />
        </React.Suspense>
      )}
      <BlockedUserModal />
    </QueryClientProvider>
  );
}
