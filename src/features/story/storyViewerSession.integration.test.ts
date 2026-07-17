import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { createStoryGroupItemsCache } from './storyGroupItemsCache';
import { createStoryViewerSession } from './storyViewerSession';
import type {
  StoryGroup,
  StoryGroupItemsResponse,
  StoryGroupType,
  StoryItem,
} from './types/storyTypes';

const createItem = (refId: number): StoryItem => ({
  type: 'video_story_items',
  ref_id: refId,
  thumbnail_url: '',
  hls_url: '',
  dash_url: '',
  is_viewed: false,
  is_liked: false,
  links: [],
});

const createGroup = (groupId: string, previewRefId: number): StoryGroup => ({
  groupType: 'user',
  groupId,
  section: 'following',
  user_id: Number(groupId),
  user: {
    user_id: Number(groupId),
    userID: groupId,
    fullname: groupId,
    writer_name: groupId,
    display_name: groupId,
    profile_image: '',
  },
  hasUnseen: true,
  totalItems: 1,
  preview: createItem(previewRefId),
});

describe('Story viewer session with React Query cache', () => {
  it('reuses an adjacent prefetched group when navigation makes it active', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21), createGroup('3', 31)];
    const fetchGroupItems = vi.fn(async (
      groupType: StoryGroupType,
      groupId: string,
      startRefId = 0,
    ): Promise<StoryGroupItemsResponse> => ({
      groupType,
      groupId,
      startRefId,
      startIndex: 0,
      items: [createItem(startRefId)],
    }));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const cache = createStoryGroupItemsCache(queryClient, fetchGroupItems);
    const session = createStoryViewerSession({ cache });

    await session.open(groups, 1);
    await Promise.all([
      cache.load(groups[0]),
      cache.load(groups[2]),
    ]);

    expect(fetchGroupItems).toHaveBeenCalledTimes(3);

    await session.selectGroup(2);

    expect(session.getState()).toMatchObject({
      status: 'ready',
      currentGroupIndex: 2,
      currentItemIndex: 0,
    });
    expect(session.getState().items[0]?.ref_id).toBe(31);
    expect(fetchGroupItems).toHaveBeenCalledTimes(3);
  });
});
