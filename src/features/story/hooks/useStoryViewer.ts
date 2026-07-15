import { useEffect, useState } from 'react';
import { useStoryStore } from '../stores/storyStore';
import { storyApi } from '../services/storyApi';

export const useStoryViewer = () => {
  const isViewerOpen = useStoryStore((state) => state.isViewerOpen);
  const currentGroupIndex = useStoryStore((state) => state.currentGroupIndex);
  const currentItemIndex = useStoryStore((state) => state.currentItemIndex);
  const groups = useStoryStore((state) => state.groups);
  const viewerItems = useStoryStore((state) => state.viewerItems);
  const setViewerItems = useStoryStore((state) => state.setViewerItems);

  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const currentGroup = groups[currentGroupIndex];
  const currentItem = viewerItems[currentItemIndex] || null;

  useEffect(() => {
    if (!isViewerOpen || !currentGroup) return;

    let isMounted = true;

    const fetchItems = async () => {
      setIsLoadingItems(true);
      try {
        const response = await storyApi.fetchGroupItems(
          currentGroup.groupType,
          currentGroup.groupId,
          currentGroup.preview.ref_id
        );
        if (isMounted) {
          setViewerItems(response.items, response.startIndex);
        }
      } catch (error) {
        console.error("Failed to fetch story items", error);
      } finally {
        if (isMounted) {
          setIsLoadingItems(false);
        }
      }
    };

    fetchItems();

    return () => {
      isMounted = false;
    };
  }, [isViewerOpen, currentGroup?.groupId, currentGroup?.groupType, currentGroup?.preview.ref_id, setViewerItems]);

  return {
    isViewerOpen,
    currentGroup,
    currentItem,
    viewerItems,
    currentItemIndex,
    isLoadingItems
  };
};
