import { describe, expect, it } from 'vitest';

import type { StoryBarResponse, StoryGroup, StoryItem } from '../types/storyTypes';
import { flattenUniqueGroups } from './useStoryBar';

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

const group = (groupId: string, refId: number): StoryGroup => ({
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
  preview: item(refId),
});

const page = (items: StoryGroup[], nextCursor: string | null): StoryBarResponse => ({
  items,
  pagination: { limit: 20, nextCursor, hasMore: Boolean(nextCursor) },
  sections: { admin: 0, following: items.length, trailerDiscovery: 0 },
});

describe('Story Bar query adapters', () => {
  it('flattens pages and removes duplicate group identities without a Zustand copy', () => {
    const first = group('1', 11);
    const second = group('2', 21);

    expect(flattenUniqueGroups([
      page([first, second], 'next'),
      page([second, group('3', 31)], null),
    ]).map((candidate) => candidate.groupId)).toEqual(['1', '2', '3']);
  });
});
