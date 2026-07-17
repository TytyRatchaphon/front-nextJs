import { describe, expect, it, vi } from 'vitest';

import type { StoryGroup, StoryItem } from '../types/storyTypes';
import type { StoryViewerSessionState } from '../storyViewerSession';
import {
  syncStoryViewerBinding,
  syncStoryViewerGroups,
  syncStoryViewerIntent,
} from './useStoryViewer';

const item: StoryItem = {
  type: 'video_story_items',
  ref_id: 11,
  thumbnail_url: '',
  hls_url: '',
  dash_url: '',
  is_viewed: false,
  is_liked: false,
  links: [],
};

const group: StoryGroup = {
  groupType: 'user',
  groupId: '1',
  section: 'following',
  user_id: 1,
  user: {
    user_id: 1,
    userID: '1',
    fullname: 'One',
    writer_name: 'One',
    display_name: 'One',
    profile_image: '',
  },
  hasUnseen: true,
  totalItems: 1,
  preview: item,
};

const state = (status: StoryViewerSessionState['status']): StoryViewerSessionState => ({
  status,
  groups: status === 'closed' ? [] : [group],
  currentGroupIndex: 0,
  currentItemIndex: 0,
  items: status === 'closed' ? [] : [item],
  error: null,
});

const createSession = (status: StoryViewerSessionState['status']) => ({
  close: vi.fn(),
  getState: vi.fn(() => state(status)),
  open: vi.fn(async () => undefined),
  selectGroup: vi.fn(async () => undefined),
  setGroups: vi.fn(),
});

describe('Story viewer intent adapter', () => {
  it('opens once for a request and ignores a repeated render of the same request', () => {
    const session = createSession('closed');
    const handledRequestId = syncStoryViewerIntent({
      session,
      isOpen: true,
      requestId: 4,
      handledRequestId: -1,
      groups: [group],
      groupIndex: 0,
      fallbackItems: [item],
      requestedItem: item,
    });
    session.getState.mockReturnValue(state('loading'));

    const repeatedRequestId = syncStoryViewerIntent({
      session,
      isOpen: true,
      requestId: 4,
      handledRequestId,
      groups: [group],
      groupIndex: 0,
      fallbackItems: [item],
      requestedItem: item,
    });

    expect(session.open).toHaveBeenCalledTimes(1);
    expect(session.selectGroup).not.toHaveBeenCalled();
    expect(repeatedRequestId).toBe(4);
  });

  it('selects the requested group for a new intent while the session is open', () => {
    const session = createSession('ready');

    const handledRequestId = syncStoryViewerIntent({
      session,
      isOpen: true,
      requestId: 5,
      handledRequestId: 4,
      groups: [group],
      groupIndex: 0,
      fallbackItems: [item],
      requestedItem: item,
    });

    expect(session.selectGroup).toHaveBeenCalledWith(0, [item], item);
    expect(handledRequestId).toBe(5);
  });

  it('closes the session when the external viewer intent closes', () => {
    const session = createSession('ready');

    const handledRequestId = syncStoryViewerIntent({
      session,
      isOpen: false,
      requestId: 5,
      handledRequestId: 5,
      groups: [group],
      groupIndex: 0,
      fallbackItems: [item],
      requestedItem: item,
    });

    expect(session.close).toHaveBeenCalledTimes(1);
    expect(handledRequestId).toBe(5);
  });

  it('passes the requested starting item index into a direct open', () => {
    const session = createSession('closed');
    const secondItem = { ...item, ref_id: 12 };

    syncStoryViewerIntent({
      session,
      isOpen: true,
      requestId: 6,
      handledRequestId: 5,
      groups: [group],
      groupIndex: 0,
      fallbackItems: [item, secondItem],
      requestedItem: secondItem,
    });

    expect(session.open).toHaveBeenCalledWith([group], 0, [item, secondItem], secondItem);
  });

  it('refreshes groups in an open session without creating another viewer intent', () => {
    const session = createSession('ready');
    const refreshedGroups = [group, { ...group, groupId: '2', user_id: 2 }];

    syncStoryViewerGroups(session, refreshedGroups);

    expect(session.setGroups).toHaveBeenCalledWith(refreshedGroups);
    expect(session.open).not.toHaveBeenCalled();
    expect(session.selectGroup).not.toHaveBeenCalled();
  });

  it('does not reopen when a group refresh closes the current viewer intent', () => {
    const session = createSession('ready');
    let isViewerOpen = true;
    session.setGroups.mockImplementation(() => {
      isViewerOpen = false;
      session.getState.mockReturnValue(state('closed'));
    });

    syncStoryViewerBinding({
      session,
      groups: [],
      handledRequestId: 8,
      getIntent: () => ({
        isViewerOpen,
        viewerRequestId: 8,
        currentGroupIndex: 0,
        viewerStartItem: null,
      }),
    });

    expect(session.close).toHaveBeenCalledTimes(1);
    expect(session.open).not.toHaveBeenCalled();
    expect(session.selectGroup).not.toHaveBeenCalled();
  });
});
