import type { QueryClient } from '@tanstack/react-query';

import { QUERY_CONFIG, queryKeys } from '@/constants/query';
import { storyApi } from './services/storyApi';
import type { StoryGroup, StoryGroupItemsResponse, StoryGroupType } from './types/storyTypes';
import type { StoryGroupItemsCache } from './storyViewerSession';

type FetchStoryGroupItems = (
  groupType: StoryGroupType,
  groupId: string,
  startRefId?: number,
) => Promise<StoryGroupItemsResponse>;

export const createStoryGroupItemsCache = (
  queryClient: QueryClient,
  fetchStoryGroupItems: FetchStoryGroupItems = storyApi.fetchGroupItems,
): StoryGroupItemsCache => {
  const queryOptions = (group: StoryGroup) => ({
    queryKey: queryKeys.story.groupItems(
      group.groupType,
      group.groupId,
      group.preview.ref_id,
    ),
    queryFn: () => fetchStoryGroupItems(
      group.groupType,
      group.groupId,
      group.preview.ref_id,
    ),
    staleTime: QUERY_CONFIG.STALE_TIME_VERY_LONG,
  });

  return {
    get: (group) => queryClient.getQueryData<StoryGroupItemsResponse>(
      queryKeys.story.groupItems(group.groupType, group.groupId, group.preview.ref_id),
    ),
    load: (group) => queryClient.fetchQuery(queryOptions(group)),
    prefetch: (group) => queryClient.prefetchQuery(queryOptions(group)),
    set: (group, response, startRefId = group.preview.ref_id) => {
      queryClient.setQueryData(
        queryKeys.story.groupItems(group.groupType, group.groupId, startRefId),
        response,
      );
    },
  };
};
