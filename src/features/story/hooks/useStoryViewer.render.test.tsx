// @vitest-environment happy-dom

import React, { act, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { storyApi } from '../services/storyApi';
import { useStoryStore } from '../stores/storyStore';
import type { StoryGroup, StoryItem } from '../types/storyTypes';
import { useStoryViewer } from './useStoryViewer';

vi.mock('../services/storyApi', () => ({
  storyApi: {
    fetchGroupItems: vi.fn(),
  },
}));

const item = (refId: number): StoryItem => ({
  type: 'video_story_items',
  ref_id: refId,
  thumbnail_url: `thumb-${refId}`,
  hls_url: `hls-${refId}`,
  dash_url: `dash-${refId}`,
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

interface HarnessProps {
  groups: StoryGroup[];
  fetchNextGroups: () => Promise<StoryGroup[]>;
  onChange: (viewer: ViewerHook) => void;
}

type ViewerHook = ReturnType<typeof useStoryViewer>;
let latestViewer: ViewerHook | null = null;

const Harness = ({ groups, fetchNextGroups, onChange }: HarnessProps) => {
  const viewer = useStoryViewer({
    groups,
    fetchNextGroups,
    hasNextPage: false,
  });
  useEffect(() => onChange(viewer), [onChange, viewer]);
  return null;
};

const captureViewer = (viewer: ViewerHook) => {
  latestViewer = viewer;
};

describe('useStoryViewer rendered integration', () => {
  let queryClient: QueryClient;
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    latestViewer = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useStoryStore.setState({
      isViewerOpen: false,
      currentGroupIndex: 0,
      viewerStartItem: null,
      viewerRequestId: 0,
    });
    vi.mocked(storyApi.fetchGroupItems).mockImplementation(async (groupType, groupId, startRefId) => ({
      groupType,
      groupId,
      startRefId: startRefId ?? 0,
      startIndex: 0,
      items: [item(startRefId ?? Number(groupId) * 10 + 1)],
    }));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('connects open intent, feed refresh, public navigation, and close propagation', async () => {
    const first = group('1', 11);
    const second = group('2', 21);
    const fetchNextGroups = vi.fn(async () => [first, second]);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Harness groups={[first]} fetchNextGroups={fetchNextGroups} onChange={captureViewer} />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      useStoryStore.getState().openViewer(0, [first.preview]);
    });

    expect(latestViewer).toMatchObject({
      isViewerOpen: true,
      currentGroupIndex: 0,
      currentItemIndex: 0,
    });
    expect(latestViewer?.currentItem?.ref_id).toBe(11);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Harness
            groups={[first, second]}
            fetchNextGroups={fetchNextGroups}
            onChange={captureViewer}
          />
        </QueryClientProvider>,
      );
    });
    expect(latestViewer?.groups.map((candidate) => candidate.groupId)).toEqual(['1', '2']);

    await act(async () => {
      await latestViewer?.selectGroup(1);
    });
    expect(latestViewer).toMatchObject({ currentGroupIndex: 1, currentItemIndex: 0 });
    expect(latestViewer?.currentItem?.ref_id).toBe(21);

    act(() => latestViewer?.closeViewer());
    expect(useStoryStore.getState().isViewerOpen).toBe(false);
    expect(latestViewer?.isViewerOpen).toBe(false);
  });
});
