import {
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { QUERY_CONFIG, queryKeys } from '@/constants/query';
import { storyApi } from '../services/storyApi';
import type { StoryBarResponse, StoryGroup } from '../types/storyTypes';

const groupIdentity = (group: StoryGroup) => `${group.groupType}:${group.groupId}`;

export const flattenUniqueGroups = (pages: StoryBarResponse[]): StoryGroup[] => {
  const groups = pages.flatMap((page) => page?.items ?? []);
  return groups.filter((group, index, allGroups) => (
    index === allGroups.findIndex((candidate) => groupIdentity(candidate) === groupIdentity(group))
  ));
};

export const useStoryBar = () => {
  const query = useInfiniteQuery({
    queryKey: queryKeys.story.bar(),
    queryFn: ({ pageParam }) => storyApi.fetchStoryBar(20, pageParam || undefined),
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextCursor,
    initialPageParam: null as string | null,
    staleTime: QUERY_CONFIG.STALE_TIME_VERY_LONG,
  });
  const groups = useMemo(
    () => flattenUniqueGroups(query.data?.pages ?? []),
    [query.data?.pages],
  );
  const { fetchNextPage } = query;

  const fetchNextGroups = useCallback(async () => {
    const result = await fetchNextPage();
    return flattenUniqueGroups(result.data?.pages ?? []);
  }, [fetchNextPage]);

  return {
    groups,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextGroups,
    refetch: query.refetch,
  };
};
