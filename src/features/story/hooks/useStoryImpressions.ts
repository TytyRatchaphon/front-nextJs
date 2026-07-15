import { useRef, useCallback } from 'react';
import { storyApi } from '../services/storyApi';
import { StoryGroupType } from '../types/storyTypes';

export const useStoryImpressions = () => {
  // Store pending impressions
  const pendingImpressions = useRef<{ groupType: StoryGroupType; user_id: number }[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const registerImpression = useCallback((groupType: StoryGroupType, user_id: number) => {
    // According to spec, only send impressions for trailer discovery
    if (groupType !== 'trailer') return;

    // Add to queue if not already there
    const exists = pendingImpressions.current.some(
      (imp) => imp.groupType === groupType && imp.user_id === user_id
    );

    if (!exists) {
      pendingImpressions.current.push({ groupType, user_id });
    }

    // Debounce the API call
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const impressionsToSend = [...pendingImpressions.current];
      if (impressionsToSend.length === 0) return;

      try {
        await storyApi.sendImpressions(impressionsToSend);
        // Clear only what we sen
        pendingImpressions.current = pendingImpressions.current.filter(
          (imp) => !impressionsToSend.includes(imp)
        );
      } catch (error) {
        console.error('Failed to send story impressions', error);
      }
    }, 2000); // Wait 2 seconds before sending batch
  }, []);

  return { registerImpression };
};
