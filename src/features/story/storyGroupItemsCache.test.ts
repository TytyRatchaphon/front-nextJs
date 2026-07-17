import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/constants/query';
import type { StoryGroup, StoryGroupItemsResponse, StoryItem } from './types/storyTypes';
import { createStoryGroupItemsCache } from './storyGroupItemsCache';

const item = (refId: number): StoryItem => ({
  type: 'video_story_items',
  ref_id: refId,
  thumbnail_url: '',
  hls_url: '',
  dash_url: '',
  is_viewed: false,
  is_liked: false,
  links: [],
});

const group: StoryGroup = {
  groupType: 'user',
  groupId: '7',
  section: 'following',
  user_id: 7,
  user: {
    user_id: 7,
    userID: '7',
    fullname: 'Seven',
    writer_name: 'Seven',
    display_name: 'Seven',
    profile_image: '',
  },
  hasUnseen: true,
  totalItems: 1,
  preview: item(71),
};

const response: StoryGroupItemsResponse = {
  groupType: 'user',
  groupId: '7',
  startRefId: 71,
  startIndex: 0,
  items: [item(71)],
};

describe('Story group items cache', () => {
  it('uses group identity and effective starting reference as the canonical query key', () => {
    expect(queryKeys.story.groupItems(group.groupType, group.groupId, group.preview.ref_id)).toEqual([
      'story-group-items',
      'user',
      '7',
      '71',
    ]);
  });

  it('deduplicates active loads and exposes the accepted response through the same cache', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const fetchGroupItems = vi.fn(async () => response);
    const cache = createStoryGroupItemsCache(queryClient, fetchGroupItems);

    const [first, second] = await Promise.all([cache.load(group), cache.load(group)]);

    expect(fetchGroupItems).toHaveBeenCalledTimes(1);
    expect(fetchGroupItems).toHaveBeenCalledWith('user', '7', 71);
    expect(first).toEqual(response);
    expect(second).toEqual(response);
    expect(cache.get(group)).toEqual(response);
  });

  it('prefetches through the same query policy used by active loads', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const fetchGroupItems = vi.fn(async () => response);
    const cache = createStoryGroupItemsCache(queryClient, fetchGroupItems);

    await cache.prefetch(group);
    await cache.load(group);

    expect(fetchGroupItems).toHaveBeenCalledTimes(1);
    expect(cache.get(group)).toEqual(response);
  });

  it('writes refreshed responses under the same start reference used by the request', () => {
    const queryClient = new QueryClient();
    const cache = createStoryGroupItemsCache(queryClient, vi.fn());

    cache.set(group, { ...response, startRefId: 72 }, 72);

    expect(queryClient.getQueryData(queryKeys.story.groupItems('user', '7', 72))).toEqual({
      ...response,
      startRefId: 72,
    });
    expect(cache.get(group)).toBeUndefined();
  });
});
