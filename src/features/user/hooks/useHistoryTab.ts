import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface UseHistoryTabOptions<TData> {
  queryKey: string;
  pageSize: number;
  enabled: boolean;
  fetcher: (params: { page: number; limit: number }) => Promise<TData>;
}

export const useHistoryTab = <TData = any>({
  queryKey,
  pageSize,
  enabled,
  fetcher,
}: UseHistoryTabOptions<TData>) => {
  const [page, setPage] = React.useState(1);

  const query = useQuery<TData>(({
    queryKey: [queryKey, page, pageSize],
    queryFn: () => fetcher({ page, limit: pageSize }),
    enabled,
    placeholderData: (previousData: TData | undefined) => previousData,
  } as any));

  return {
    page,
    setPage,
    query,
  };
};
