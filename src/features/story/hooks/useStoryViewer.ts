import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStoryStore } from '../stores/storyStore';
import { storyApi } from '../services/storyApi';
import { StoryGroup } from '../types/storyTypes';

const STORY_GROUP_STALE_TIME = 1000 * 60 * 5;

export const storyGroupItemsQueryKey = (group: StoryGroup) => [
  'story-group-items',
  group.groupType,
  group.groupId,
  group.preview.ref_id,
] as const;

const fetchStoryGroupItems = (group: StoryGroup) => storyApi.fetchGroupItems(
  group.groupType,
  group.groupId,
  group.preview.ref_id
);

export const useStoryViewer = () => {
  const isViewerOpen = useStoryStore((state) => state.isViewerOpen);
  const currentGroupIndex = useStoryStore((state) => state.currentGroupIndex);
  const currentItemIndex = useStoryStore((state) => state.currentItemIndex);
  const groups = useStoryStore((state) => state.groups);
  const viewerItems = useStoryStore((state) => state.viewerItems);
  const setViewerItems = useStoryStore((state) => state.setViewerItems);
  const queryClient = useQueryClient();

  const currentGroup = groups[currentGroupIndex];
  const currentItem = viewerItems[currentItemIndex] || null;

  const groupItemsQuery = useQuery({
    queryKey: currentGroup ? storyGroupItemsQueryKey(currentGroup) : ['story-group-items', 'inactive'],
    queryFn: () => fetchStoryGroupItems(currentGroup!),
    enabled: isViewerOpen && Boolean(currentGroup),
    staleTime: STORY_GROUP_STALE_TIME,
  });

  useEffect(() => {
    if (!isViewerOpen || !groupItemsQuery.data) return;
    setViewerItems(groupItemsQuery.data.items, groupItemsQuery.data.startIndex);
  }, [currentGroupIndex, groupItemsQuery.data, isViewerOpen, setViewerItems]);

  useEffect(() => {
    if (!isViewerOpen) return;

    const adjacentGroups = [groups[currentGroupIndex - 1], groups[currentGroupIndex + 1]];
    adjacentGroups.forEach((group) => {
      if (!group) return;
      void queryClient.prefetchQuery({
        queryKey: storyGroupItemsQueryKey(group),
        queryFn: () => fetchStoryGroupItems(group),
        staleTime: STORY_GROUP_STALE_TIME,
      });
    });
  }, [currentGroupIndex, groups, isViewerOpen, queryClient]);

  return {
    isViewerOpen,
    currentGroup,
    currentItem,
    viewerItems,
    currentItemIndex,
    isLoadingItems: isViewerOpen && Boolean(currentGroup) && groupItemsQuery.isPending
  };
};
