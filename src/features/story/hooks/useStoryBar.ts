import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { storyApi } from '../services/storyApi';
import { useStoryStore } from '../stores/storyStore';
import { StoryGroup } from '../types/storyTypes';

export const useStoryBar = () => {
  const setGroups = useStoryStore((state) => state.setGroups);
  const setBarLoading = useStoryStore((state) => state.setBarLoading);

  const query = useInfiniteQuery({
    queryKey: ['storyBar'],
    queryFn: ({ pageParam }) => storyApi.fetchStoryBar(20, pageParam || undefined),
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextCursor,
    initialPageParam: null as string | null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (query.data) {
      // Flatten all pages into a single array of groups
      const allGroups: StoryGroup[] = query.data.pages.flatMap((page) => page?.items || []);
      
      // Deduplicate by groupType and groupId
      const uniqueGroups = allGroups.filter((group, index, self) =>
        index === self.findIndex((g) => g.groupType === group.groupType && g.groupId === group.groupId)
      );
      
      setGroups(uniqueGroups);
    }
    setBarLoading(query.isLoading);
  }, [query.data, query.isLoading, setGroups, setBarLoading]);

  return {
    groups: useStoryStore((state) => state.groups),
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
};
