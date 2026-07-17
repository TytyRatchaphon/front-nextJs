import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { createStoryGroupItemsCache } from '../storyGroupItemsCache';
import {
  createStoryViewerSession,
  type StoryItemIdentity,
  type StoryViewerSessionState,
} from '../storyViewerSession';
import { useStoryStore } from '../stores/storyStore';
import type { StoryGroup, StoryItem } from '../types/storyTypes';

interface StoryViewerIntentSession {
  close: () => void;
  getState: () => StoryViewerSessionState;
  setGroups: (groups: StoryGroup[]) => void;
  open: (
    groups: StoryGroup[],
    groupIndex: number,
    items?: StoryItem[],
    requestedItem?: StoryItemIdentity,
  ) => Promise<void>;
  selectGroup: (
    groupIndex: number,
    items?: StoryItem[],
    requestedItem?: StoryItemIdentity,
  ) => Promise<void>;
}

interface SyncStoryViewerIntentOptions {
  session: StoryViewerIntentSession;
  isOpen: boolean;
  requestId: number;
  handledRequestId: number;
  groups: StoryGroup[];
  groupIndex: number;
  fallbackItems: StoryItem[];
  requestedItem?: StoryItemIdentity;
}

export const syncStoryViewerIntent = ({
  session,
  isOpen,
  requestId,
  handledRequestId,
  groups,
  groupIndex,
  fallbackItems,
  requestedItem,
}: SyncStoryViewerIntentOptions) => {
  if (!isOpen) {
    session.close();
    return handledRequestId;
  }

  const isPendingOpen = session.getState().status === 'closed' && groups.length > 0;
  if (handledRequestId === requestId && !isPendingOpen) return handledRequestId;

  if (session.getState().status === 'closed') {
    void session.open(groups, groupIndex, fallbackItems, requestedItem);
  } else {
    void session.selectGroup(groupIndex, fallbackItems, requestedItem);
  }
  return requestId;
};

export const syncStoryViewerGroups = (
  session: Pick<ReturnType<typeof createStoryViewerSession>, 'getState' | 'setGroups'>,
  groups: StoryGroup[],
) => {
  if (session.getState().status !== 'closed') session.setGroups(groups);
};

interface StoryViewerStoreIntent {
  isViewerOpen: boolean;
  viewerRequestId: number;
  currentGroupIndex: number;
  viewerStartItem: { refId: number; type: StoryItem['type'] } | null;
}

export const syncStoryViewerBinding = ({
  session,
  groups,
  handledRequestId,
  getIntent,
}: {
  session: StoryViewerIntentSession;
  groups: StoryGroup[];
  handledRequestId: number;
  getIntent: () => StoryViewerStoreIntent;
}) => {
  syncStoryViewerGroups(session, groups);
  const intent = getIntent();
  const requestedGroup = groups[intent.currentGroupIndex];
  const requestedItem = intent.viewerStartItem
    ? { ref_id: intent.viewerStartItem.refId, type: intent.viewerStartItem.type }
    : requestedGroup?.preview;
  const fallbackItems = requestedGroup
    && requestedItem?.ref_id === requestedGroup.preview.ref_id
    && requestedItem.type === requestedGroup.preview.type
    ? [requestedGroup.preview]
    : [];

  return syncStoryViewerIntent({
    session,
    isOpen: intent.isViewerOpen,
    requestId: intent.viewerRequestId,
    handledRequestId,
    groups,
    groupIndex: intent.currentGroupIndex,
    fallbackItems,
    requestedItem,
  });
};

interface UseStoryViewerOptions {
  groups: StoryGroup[];
  fetchNextGroups: () => Promise<StoryGroup[]>;
  hasNextPage: boolean;
}

export const useStoryViewer = ({
  groups,
  fetchNextGroups,
  hasNextPage,
}: UseStoryViewerOptions) => {
  const queryClient = useQueryClient();
  const isViewerOpenIntent = useStoryStore((state) => state.isViewerOpen);
  const viewerRequestId = useStoryStore((state) => state.viewerRequestId);
  const feedStateRef = useRef({ fetchNextGroups, hasNextPage });
  const handledRequestIdRef = useRef(-1);
  feedStateRef.current = { fetchNextGroups, hasNextPage };

  const cache = useMemo(() => createStoryGroupItemsCache(queryClient), [queryClient]);
  const session = useMemo(() => createStoryViewerSession({
    cache,
    feed: {
      hasNextPage: () => feedStateRef.current.hasNextPage,
      requestNextPage: () => feedStateRef.current.fetchNextGroups(),
    },
    onClosed: () => {
      if (useStoryStore.getState().isViewerOpen) {
        useStoryStore.getState().closeViewer();
      }
    },
  }), [cache]);
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getState,
    session.getState,
  );

  useEffect(() => {
    handledRequestIdRef.current = syncStoryViewerBinding({
      session,
      handledRequestId: handledRequestIdRef.current,
      groups,
      getIntent: useStoryStore.getState,
    });
  }, [groups, isViewerOpenIntent, session, viewerRequestId]);

  return {
    closeViewer: session.close,
    currentGroup: snapshot.groups[snapshot.currentGroupIndex],
    currentGroupIndex: snapshot.currentGroupIndex,
    currentItem: snapshot.items[snapshot.currentItemIndex] ?? null,
    currentItemIndex: snapshot.currentItemIndex,
    groups: snapshot.groups,
    isLoadingItems: snapshot.status === 'loading',
    isViewerOpen: snapshot.status !== 'closed',
    loadError: snapshot.status === 'error' ? snapshot.error : null,
    markItemViewed: session.markItemViewed,
    nextGroup: session.nextGroup,
    nextItem: session.nextItem,
    prevGroup: session.prevGroup,
    prevItem: session.prevItem,
    replaceItems: session.replaceItems,
    retry: session.retry,
    selectGroup: session.selectGroup,
    toggleItemLike: session.toggleItemLike,
    updateItemLinks: session.updateItemLinks,
    viewerItems: snapshot.items,
  };
};
