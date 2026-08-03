'use client';

import * as React from "react";

import '@ant-design/v5-patch-for-react-19';
import { useState } from 'react';
import { HydrationBoundary, QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import type { DehydratedState } from "@tanstack/react-query";

import ApiAuthEventBridge from '@/components/auth/ApiAuthEventBridge';
import BlockedUserModal from '@/components/auth/BlockedUserModal';
import DuplicateLoginModal from '@/components/auth/DuplicateLoginModal';
import { useAuthStore } from '@/stores/authStore';
import { getJwtIdentity } from '@/utils/jwtParser';

function AuthCacheBoundary() {
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);
  const identity = getJwtIdentity(token);
  const previousIdentity = React.useRef<string | null>(null);

  React.useEffect(() => {
    const identityChanged = previousIdentity.current !== null && previousIdentity.current !== identity;
    if (status === 'logging_out' || identityChanged) queryClient.clear();
    previousIdentity.current = identity;
  }, [identity, queryClient, status]);

  return null;
}

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
      <AuthCacheBoundary />
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
      {process.env.NODE_ENV === 'development' && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtoolsLazy initialIsOpen={false} />
        </React.Suspense>
      )}
      <BlockedUserModal />
      <DuplicateLoginModal />
    </QueryClientProvider>
  );
}
