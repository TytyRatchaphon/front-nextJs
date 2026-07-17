import type {
  StoryGroup,
  StoryGroupItemsResponse,
  StoryItem,
  StoryItemType,
  StoryLink,
} from './types/storyTypes';

export type StoryViewerSessionStatus = 'closed' | 'loading' | 'refreshing' | 'ready' | 'error';

export interface StoryViewerSessionState {
  status: StoryViewerSessionStatus;
  groups: StoryGroup[];
  currentGroupIndex: number;
  currentItemIndex: number;
  items: StoryItem[];
  error: unknown | null;
}

export interface StoryGroupItemsCache {
  get: (group: StoryGroup) => StoryGroupItemsResponse | undefined;
  load: (group: StoryGroup) => Promise<StoryGroupItemsResponse>;
  prefetch: (group: StoryGroup) => Promise<unknown>;
  set: (
    group: StoryGroup,
    response: StoryGroupItemsResponse,
    startRefId?: number,
  ) => void;
}

export interface StoryViewerFeedGateway {
  hasNextPage: () => boolean;
  requestNextPage: () => Promise<StoryGroup[] | void>;
}

interface CreateStoryViewerSessionOptions {
  cache: StoryGroupItemsCache;
  feed?: StoryViewerFeedGateway;
  onClosed?: () => void;
}

type StoryViewerSessionListener = (state: StoryViewerSessionState) => void;
export type StoryItemIdentity = Pick<StoryItem, 'ref_id' | 'type'>;
type StoryItemOverride = Partial<Pick<
  StoryItem,
  'is_viewed' | 'is_liked' | 'like_count' | 'view_count' | 'links'
>>;

const groupIdentity = (group: StoryGroup) => `${group.groupType}:${group.groupId}`;
const itemIdentity = (refId: number, type: StoryItemType) => `${type}:${refId}`;

const uniqueGroups = (groups: StoryGroup[]) => groups.filter((group, index, allGroups) => (
  index === allGroups.findIndex((candidate) => groupIdentity(candidate) === groupIdentity(group))
));

const itemIndexForResponse = (
  group: StoryGroup,
  response: StoryGroupItemsResponse,
  requestedItem?: StoryItemIdentity,
) => {
  if (response.items.length === 0) return 0;
  const requestedItemIndex = requestedItem ? response.items.findIndex((item) => (
    item.ref_id === requestedItem.ref_id && item.type === requestedItem.type
  )) : -1;
  const previewItemIndex = response.items.findIndex((item) => (
    item.ref_id === group.preview.ref_id && item.type === group.preview.type
  ));
  const candidateIndex = requestedItemIndex >= 0
    ? requestedItemIndex
    : previewItemIndex >= 0
      ? previewItemIndex
      : response.startIndex;
  return Math.min(Math.max(candidateIndex, 0), response.items.length - 1);
};

export const createStoryViewerSession = ({
  cache,
  feed,
  onClosed,
}: CreateStoryViewerSessionOptions) => {
  let state: StoryViewerSessionState = {
    status: 'closed',
    groups: [],
    currentGroupIndex: 0,
    currentItemIndex: 0,
    items: [],
    error: null,
  };
  let transitionRevision = 0;
  let sessionGeneration = 0;
  let pageRequest: Promise<StoryGroup[] | void> | null = null;
  const itemOverrides = new Map<string, StoryItemOverride>();
  const listeners = new Set<StoryViewerSessionListener>();

  const publish = (nextState: StoryViewerSessionState) => {
    state = nextState;
    listeners.forEach((listener) => listener(state));
  };

  const patchState = (patch: Partial<StoryViewerSessionState>) => {
    publish({ ...state, ...patch });
  };

  const applyItemOverrides = (items: StoryItem[]) => items.map((item) => ({
    ...item,
    ...itemOverrides.get(itemIdentity(item.ref_id, item.type)),
  }));

  const setItemOverride = (refId: number, type: StoryItemType, patch: StoryItemOverride) => {
    const key = itemIdentity(refId, type);
    itemOverrides.set(key, { ...itemOverrides.get(key), ...patch });
    patchState({
      items: state.items.map((item) => (
        item.ref_id === refId && item.type === type ? { ...item, ...patch } : item
      )),
    });
  };

  const isActiveTransition = (revision: number, group: StoryGroup) => {
    const activeGroup = state.groups[state.currentGroupIndex];
    return state.status !== 'closed'
      && revision === transitionRevision
      && Boolean(activeGroup)
      && groupIdentity(activeGroup) === groupIdentity(group);
  };

  const reconcileGroup = (group: StoryGroup) => {
    const preview = applyItemOverrides([group.preview])[0];
    const activeGroup = state.groups[state.currentGroupIndex];
    const isActiveGroup = activeGroup && groupIdentity(activeGroup) === groupIdentity(group);
    const knownItems = isActiveGroup ? state.items : cache.get(group)?.items;
    return {
      ...group,
      preview,
      hasUnseen: knownItems
        ? applyItemOverrides(knownItems).some((item) => !item.is_viewed)
        : group.hasUnseen,
    };
  };

  const setGroups = (groups: StoryGroup[]) => {
    const nextGroups = uniqueGroups(groups).map(reconcileGroup);
    const activeGroup = state.groups[state.currentGroupIndex];
    const activeGroupIndex = activeGroup
      ? nextGroups.findIndex((group) => groupIdentity(group) === groupIdentity(activeGroup))
      : -1;

    if (state.status !== 'closed' && activeGroupIndex < 0) {
      close();
      publish({ ...state, groups: nextGroups });
      return;
    }

    patchState({
      groups: nextGroups,
      currentGroupIndex: activeGroupIndex >= 0 ? activeGroupIndex : state.currentGroupIndex,
    });
    void requestMoreGroupsIfNeeded();
  };

  const requestMoreGroupsIfNeeded = (force = false) => {
    if (pageRequest) return pageRequest;
    if (!feed || !feed.hasNextPage()) return null;
    if (!force && state.currentGroupIndex < state.groups.length - 2) return null;

    const generation = sessionGeneration;
    const request = feed.requestNextPage()
      .then((groups) => {
        if (groups && generation === sessionGeneration && state.status !== 'closed') {
          setGroups(groups);
        }
        return groups;
      })
      .catch(() => undefined)
      .finally(() => {
        if (pageRequest === request) pageRequest = null;
      });
    pageRequest = request;
    return request;
  };

  const prefetchAdjacentGroups = (groupIndex: number) => {
    const adjacentGroups = [state.groups[groupIndex - 1], state.groups[groupIndex + 1]];
    adjacentGroups.forEach((group) => {
      if (!group) return;
      void cache.prefetch(group).catch(() => undefined);
    });
  };

  const acceptResponse = (
    requestedGroup: StoryGroup,
    response: StoryGroupItemsResponse,
    requestedItem?: StoryItemIdentity,
  ) => {
    const groupIndex = state.groups.findIndex((group) => (
      groupIdentity(group) === groupIdentity(requestedGroup)
    ));
    if (groupIndex < 0) return null;
    const groups = [...state.groups];
    const currentGroup = groups[groupIndex];
    if (response.items.length > 0 && currentGroup.totalItems !== response.items.length) {
      groups[groupIndex] = { ...currentGroup, totalItems: response.items.length };
    }

    const items = applyItemOverrides(response.items);
    publish({
      ...state,
      status: 'ready',
      groups,
      currentGroupIndex: groupIndex,
      currentItemIndex: itemIndexForResponse(requestedGroup, { ...response, items }, requestedItem),
      items,
      error: null,
    });
    return groupIndex;
  };

  const loadGroup = async (
    groupIndex: number,
    fallbackItems: StoryItem[] = [],
    requestedItem: StoryItemIdentity | undefined = fallbackItems[0],
  ) => {
    const group = state.groups[groupIndex];
    if (!group || state.status === 'closed') return;

    const revision = ++transitionRevision;
    const cached = cache.get(group);

    if (cached) {
      acceptResponse(group, cached, requestedItem);
      patchState({ status: 'refreshing' });
    } else {
      const items = applyItemOverrides(fallbackItems);
      patchState({
        status: 'loading',
        currentGroupIndex: groupIndex,
        currentItemIndex: Math.max(items.findIndex((item) => (
          item.ref_id === requestedItem?.ref_id && item.type === requestedItem.type
        )), 0),
        items,
        error: null,
      });
    }

    try {
      const response = await cache.load(group);
      if (!isActiveTransition(revision, group)) return;
      const acceptedGroupIndex = acceptResponse(group, response, requestedItem);
      if (acceptedGroupIndex !== null) prefetchAdjacentGroups(acceptedGroupIndex);
      void requestMoreGroupsIfNeeded();
    } catch (error) {
      if (!isActiveTransition(revision, group)) return;
      if (cached) {
        patchState({ status: 'ready', error: null });
        return;
      }
      patchState({ status: 'error', error });
    }
  };

  const open = (
    groups: StoryGroup[],
    groupIndex: number,
    fallbackItems: StoryItem[] = [],
    requestedItem: StoryItemIdentity | undefined = fallbackItems[0],
  ) => {
    if (state.status === 'closed') {
      itemOverrides.clear();
      sessionGeneration += 1;
      pageRequest = null;
    }
    transitionRevision += 1;
    const nextGroups = uniqueGroups(groups);
    const safeGroupIndex = Math.min(Math.max(groupIndex, 0), Math.max(nextGroups.length - 1, 0));
    publish({
      status: nextGroups.length > 0 ? 'loading' : 'closed',
      groups: nextGroups,
      currentGroupIndex: safeGroupIndex,
      currentItemIndex: 0,
      items: applyItemOverrides(fallbackItems),
      error: null,
    });
    return nextGroups.length > 0
      ? loadGroup(safeGroupIndex, fallbackItems, requestedItem)
      : Promise.resolve();
  };

  function close() {
    if (state.status === 'closed') return;
    transitionRevision += 1;
    sessionGeneration += 1;
    pageRequest = null;
    publish({
      ...state,
      status: 'closed',
      currentItemIndex: 0,
      items: [],
      error: null,
    });
    onClosed?.();
  }

  const selectGroup = (
    groupIndex: number,
    fallbackItems: StoryItem[] = [],
    requestedItem: StoryItemIdentity | undefined = fallbackItems[0],
  ) => {
    if (state.status === 'closed' || groupIndex < 0 || groupIndex >= state.groups.length) {
      return Promise.resolve();
    }
    if (groupIndex === state.currentGroupIndex && state.status !== 'error') {
      const requestedItemIndex = requestedItem ? state.items.findIndex((item) => (
        item.ref_id === requestedItem.ref_id && item.type === requestedItem.type
      )) : -1;
      if (requestedItemIndex >= 0 && requestedItemIndex !== state.currentItemIndex) {
        patchState({ currentItemIndex: requestedItemIndex });
      }
      if (requestedItem && (state.status === 'loading' || state.status === 'refreshing')) {
        return loadGroup(groupIndex, fallbackItems, requestedItem);
      }
      return requestedItem
        ? loadGroup(groupIndex, fallbackItems, requestedItem)
        : Promise.resolve();
    }
    return loadGroup(groupIndex, fallbackItems, requestedItem);
  };

  const nextGroup = async () => {
    if (state.status === 'closed') return;
    if (state.currentGroupIndex < state.groups.length - 1) {
      await selectGroup(state.currentGroupIndex + 1);
      return;
    }

    const canLoadMore = Boolean(pageRequest) || Boolean(feed?.hasNextPage());
    if (canLoadMore) {
      const revision = transitionRevision;
      const originGroup = state.groups[state.currentGroupIndex];
      await (pageRequest ?? requestMoreGroupsIfNeeded(true));
      const activeGroup = state.groups[state.currentGroupIndex];
      if (
        revision !== transitionRevision
        || !originGroup
        || !activeGroup
        || groupIdentity(activeGroup) !== groupIdentity(originGroup)
      ) return;
      if (state.status !== 'closed' && state.currentGroupIndex < state.groups.length - 1) {
        await selectGroup(state.currentGroupIndex + 1);
      }
      return;
    }

    close();
  };

  const prevGroup = () => {
    if (state.status === 'closed' || state.currentGroupIndex === 0) return Promise.resolve();
    return selectGroup(state.currentGroupIndex - 1);
  };

  const nextItem = () => {
    if (state.status === 'closed') return Promise.resolve();
    if (state.status === 'loading' || state.status === 'error') return nextGroup();
    if (state.currentItemIndex < state.items.length - 1) {
      patchState({ currentItemIndex: state.currentItemIndex + 1 });
      return Promise.resolve();
    }
    return nextGroup();
  };

  const prevItem = () => {
    if (state.status === 'closed') return Promise.resolve();
    if (state.status === 'loading' || state.status === 'error') return prevGroup();
    if (state.currentItemIndex > 0) {
      patchState({ currentItemIndex: state.currentItemIndex - 1 });
      return Promise.resolve();
    }
    return prevGroup();
  };

  const retry = () => {
    if (state.status !== 'error') return Promise.resolve();
    return loadGroup(state.currentGroupIndex);
  };

  const markItemViewed = (refId: number, type: StoryItemType) => {
    setItemOverride(refId, type, { is_viewed: true });
    const groups = state.groups.map((group, index) => {
      if (index !== state.currentGroupIndex) return group;
      const preview = group.preview.ref_id === refId && group.preview.type === type
        ? { ...group.preview, is_viewed: true }
        : group.preview;
      return {
        ...group,
        preview,
        hasUnseen: state.items.some((item) => !item.is_viewed),
      };
    });
    patchState({ groups });
  };

  const toggleItemLike = (
    refId: number,
    type: StoryItemType,
    isLiked: boolean,
    likeCount?: number | null,
  ) => {
    const currentItem = state.items.find((item) => item.ref_id === refId && item.type === type);
    setItemOverride(refId, type, {
      is_liked: isLiked,
      like_count: likeCount !== undefined ? likeCount : currentItem?.like_count,
    });
  };

  const updateItemLinks = (refId: number, type: StoryItemType, links: StoryLink[]) => {
    setItemOverride(refId, type, { links });
  };

  const replaceItems = (
    items: StoryItem[],
    startIndex = state.currentItemIndex,
    startRefId?: number,
  ) => {
    const nextItems = applyItemOverrides(items);
    const currentGroup = state.groups[state.currentGroupIndex];
    if (currentGroup) {
      cache.set(currentGroup, {
        groupType: currentGroup.groupType,
        groupId: currentGroup.groupId,
        startRefId: startRefId ?? currentGroup.preview.ref_id,
        startIndex,
        items: nextItems,
      }, startRefId);
    }
    patchState({
      status: 'ready',
      items: nextItems,
      currentItemIndex: nextItems.length === 0
        ? 0
        : Math.min(Math.max(startIndex, 0), nextItems.length - 1),
      error: null,
    });
  };

  return {
    close,
    getState: () => state,
    markItemViewed,
    nextGroup,
    nextItem,
    open,
    prevGroup,
    prevItem,
    replaceItems,
    retry,
    selectGroup,
    setGroups,
    subscribe: (listener: StoryViewerSessionListener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    toggleItemLike,
    updateItemLinks,
  };
};
