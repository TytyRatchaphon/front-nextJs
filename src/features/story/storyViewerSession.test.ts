import { describe, expect, it, vi } from 'vitest';

import type { StoryGroup, StoryGroupItemsResponse, StoryItem } from './types/storyTypes';
import {
  createStoryViewerSession,
  type StoryGroupItemsCache,
} from './storyViewerSession';

const createItem = (refId: number): StoryItem => ({
  type: 'video_story_items',
  ref_id: refId,
  thumbnail_url: `thumb-${refId}`,
  hls_url: `hls-${refId}`,
  dash_url: `dash-${refId}`,
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
    fullname: `User ${groupId}`,
    writer_name: `Writer ${groupId}`,
    display_name: `User ${groupId}`,
    profile_image: '',
  },
  hasUnseen: true,
  totalItems: 2,
  preview: createItem(previewRefId),
});

const createResponse = (group: StoryGroup, refs: number[]): StoryGroupItemsResponse => ({
  groupType: group.groupType,
  groupId: group.groupId,
  startRefId: group.preview.ref_id,
  startIndex: Math.max(0, refs.indexOf(group.preview.ref_id)),
  items: refs.map(createItem),
});

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const createCache = () => {
  const entries = new Map<string, StoryGroupItemsResponse>();
  const pending = new Map<string, ReturnType<typeof deferred<StoryGroupItemsResponse>>>();
  const keyFor = (group: StoryGroup) => `${group.groupType}:${group.groupId}:${group.preview.ref_id}`;

  const cache: StoryGroupItemsCache = {
    get: vi.fn((group) => entries.get(keyFor(group))),
    load: vi.fn((group) => {
      const key = keyFor(group);
      const request = pending.get(key) ?? deferred<StoryGroupItemsResponse>();
      pending.set(key, request);
      return request.promise.then((response) => {
        entries.set(key, response);
        return response;
      });
    }),
    prefetch: vi.fn(async (group) => {
      const cached = entries.get(keyFor(group));
      if (cached) return cached;
      return cache.load(group);
    }),
    set: vi.fn((group, response, startRefId = group.preview.ref_id) => {
      entries.set(`${group.groupType}:${group.groupId}:${startRefId}`, response);
    }),
  };

  return {
    cache,
    entries,
    pending,
    resolve(group: StoryGroup, response: StoryGroupItemsResponse) {
      pending.get(keyFor(group))?.resolve(response);
    },
  };
};

describe('Story viewer session', () => {
  it('opens cached content immediately and refreshes it without clearing the active item', async () => {
    const group = createGroup('1', 11);
    const fixture = createCache();
    fixture.entries.set('user:1:11', createResponse(group, [10, 11]));
    const session = createStoryViewerSession({ cache: fixture.cache });

    const opening = session.open([group], 0);

    expect(session.getState()).toMatchObject({
      status: 'refreshing',
      currentGroupIndex: 0,
      currentItemIndex: 1,
    });
    expect(session.getState().items.map((item) => item.ref_id)).toEqual([10, 11]);

    fixture.resolve(group, createResponse(group, [10, 11, 12]));
    await opening;

    expect(session.getState()).toMatchObject({ status: 'ready', currentItemIndex: 1 });
    expect(session.getState().items.map((item) => item.ref_id)).toEqual([10, 11, 12]);
  });

  it('keeps only the latest group authoritative when A, B, and C resolve out of order', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21), createGroup('3', 31)];
    const fixture = createCache();
    const session = createStoryViewerSession({ cache: fixture.cache });

    const openA = session.open(groups, 0);
    const openB = session.selectGroup(1);
    const openC = session.selectGroup(2);

    fixture.resolve(groups[1], createResponse(groups[1], [20, 21]));
    fixture.resolve(groups[0], createResponse(groups[0], [10, 11]));
    await flushPromises();

    expect(session.getState()).toMatchObject({ status: 'loading', currentGroupIndex: 2 });
    expect(session.getState().items).toEqual([]);

    fixture.resolve(groups[2], createResponse(groups[2], [30, 31]));
    await Promise.all([openA, openB, openC]);

    expect(session.getState()).toMatchObject({
      status: 'ready',
      currentGroupIndex: 2,
      currentItemIndex: 1,
    });
    expect(session.getState().items.map((item) => item.ref_id)).toEqual([30, 31]);
  });

  it('prefetches adjacent groups after accepting the active response without changing visible state', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21), createGroup('3', 31)];
    const fixture = createCache();
    const session = createStoryViewerSession({ cache: fixture.cache });

    const opening = session.open(groups, 1);
    fixture.resolve(groups[1], createResponse(groups[1], [20, 21]));
    await opening;

    expect(fixture.cache.prefetch).toHaveBeenCalledWith(groups[0]);
    expect(fixture.cache.prefetch).toHaveBeenCalledWith(groups[2]);
    expect(session.getState()).toMatchObject({ status: 'ready', currentGroupIndex: 1 });

    fixture.pending.get('user:1:11')?.reject(new Error('prefetch failed'));
    await flushPromises();

    expect(session.getState()).toMatchObject({ status: 'ready', currentGroupIndex: 1 });
    expect(session.getState().error).toBeNull();
  });

  it('uses one navigation path within and across groups', async () => {
    const groups = [createGroup('1', 10), createGroup('2', 20)];
    const fixture = createCache();
    const session = createStoryViewerSession({ cache: fixture.cache });

    const opening = session.open(groups, 0);
    fixture.resolve(groups[0], createResponse(groups[0], [10, 11]));
    await opening;

    await session.nextItem();
    expect(session.getState().currentItemIndex).toBe(1);

    const nextGroup = session.nextItem();
    expect(session.getState()).toMatchObject({ status: 'loading', currentGroupIndex: 1 });
    fixture.resolve(groups[1], createResponse(groups[1], [20, 21]));
    await nextGroup;

    expect(session.getState()).toMatchObject({ status: 'ready', currentGroupIndex: 1 });

    const previousGroup = session.prevItem();
    fixture.resolve(groups[0], createResponse(groups[0], [10, 11]));
    await previousGroup;
    expect(session.getState()).toMatchObject({ status: 'ready', currentGroupIndex: 0 });
  });

  it('ignores a closed session result and protects a reopened session from old work', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21)];
    const fixture = createCache();
    const session = createStoryViewerSession({ cache: fixture.cache });

    const oldOpening = session.open(groups, 0);
    session.close();
    const newOpening = session.open(groups, 1);

    fixture.resolve(groups[0], createResponse(groups[0], [10, 11]));
    await oldOpening;
    expect(session.getState()).toMatchObject({ status: 'loading', currentGroupIndex: 1 });

    fixture.resolve(groups[1], createResponse(groups[1], [20, 21]));
    await newOpening;
    expect(session.getState()).toMatchObject({ status: 'ready', currentGroupIndex: 1 });
    expect(session.getState().items.map((item) => item.ref_id)).toEqual([20, 21]);
  });

  it('exposes an active-load error and retries the same destination', async () => {
    const group = createGroup('1', 11);
    const fixture = createCache();
    const session = createStoryViewerSession({ cache: fixture.cache });

    const opening = session.open([group], 0);
    fixture.pending.get('user:1:11')?.reject(new Error('load failed'));
    await opening;

    expect(session.getState()).toMatchObject({ status: 'error', currentGroupIndex: 0 });
    expect(session.getState().error).toBeInstanceOf(Error);

    fixture.pending.delete('user:1:11');
    const retrying = session.retry();
    fixture.resolve(group, createResponse(group, [10, 11]));
    await retrying;

    expect(session.getState()).toMatchObject({ status: 'ready', currentItemIndex: 1 });
  });

  it('preserves active group identity while deduplicating appended groups', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21)];
    const fixture = createCache();
    const session = createStoryViewerSession({ cache: fixture.cache });

    const opening = session.open(groups, 1, [groups[1].preview]);
    expect(session.getState().items).toEqual([groups[1].preview]);
    fixture.resolve(groups[1], createResponse(groups[1], [20, 21]));
    await opening;

    session.setGroups([
      groups[0],
      groups[1],
      createGroup('2', 21),
      createGroup('3', 31),
    ]);

    expect(session.getState().groups.map((group) => group.groupId)).toEqual(['1', '2', '3']);
    expect(session.getState()).toMatchObject({ currentGroupIndex: 1, status: 'ready' });
  });

  it('requests the next Story Bar page at most once while a request is in flight', async () => {
    const group = createGroup('1', 11);
    const fixture = createCache();
    const nextPage = deferred<StoryGroup[] | void>();
    const feed = {
      hasNextPage: vi.fn(() => true),
      requestNextPage: vi.fn(() => nextPage.promise),
    };
    const session = createStoryViewerSession({ cache: fixture.cache, feed });

    const opening = session.open([group], 0);
    fixture.resolve(group, createResponse(group, [10, 11]));
    await opening;
    session.setGroups([group]);
    session.setGroups([group]);

    expect(feed.requestNextPage).toHaveBeenCalledTimes(1);

    nextPage.resolve(undefined);
    await flushPromises();
    session.setGroups([group]);
    expect(feed.requestNextPage).toHaveBeenCalledTimes(2);
  });

  it('waits for the next Story Bar page before deciding the viewer reached the end', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21)];
    const fixture = createCache();
    const nextPage = deferred<StoryGroup[] | void>();
    const feed = {
      hasNextPage: vi.fn(() => true),
      requestNextPage: vi.fn(() => nextPage.promise),
    };
    const session = createStoryViewerSession({ cache: fixture.cache, feed });

    const opening = session.open([groups[0]], 0);
    fixture.resolve(groups[0], createResponse(groups[0], [10, 11]));
    await opening;

    const advancing = session.nextGroup();
    expect(session.getState().status).not.toBe('closed');

    nextPage.resolve(groups);
    await flushPromises();
    fixture.resolve(groups[1], createResponse(groups[1], [20, 21]));
    await advancing;

    expect(session.getState()).toMatchObject({ status: 'ready', currentGroupIndex: 1 });
  });

  it('keeps navigation intent while the current destination is still loading', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21), createGroup('3', 31)];
    const fixture = createCache();
    const session = createStoryViewerSession({ cache: fixture.cache });

    const opening = session.open(groups, 1);
    const advancing = session.nextItem();
    expect(session.getState()).toMatchObject({ status: 'loading', currentGroupIndex: 2 });

    fixture.resolve(groups[1], createResponse(groups[1], [20, 21]));
    fixture.resolve(groups[2], createResponse(groups[2], [30, 31]));
    await Promise.all([opening, advancing]);

    expect(session.getState()).toMatchObject({ status: 'ready', currentGroupIndex: 2 });
  });

  it('preserves viewed and liked presentation state when cached groups are revisited', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21)];
    const fixture = createCache();
    fixture.entries.set('user:1:11', createResponse(groups[0], [10, 11]));
    fixture.entries.set('user:2:21', createResponse(groups[1], [20, 21]));
    const session = createStoryViewerSession({ cache: fixture.cache });

    const opening = session.open(groups, 0);
    fixture.resolve(groups[0], createResponse(groups[0], [10, 11]));
    await opening;
    session.markItemViewed(11, 'video_story_items');
    session.toggleItemLike(11, 'video_story_items', true, 7);

    const next = session.selectGroup(1);
    fixture.resolve(groups[1], createResponse(groups[1], [20, 21]));
    await next;
    const previous = session.selectGroup(0);
    fixture.resolve(groups[0], createResponse(groups[0], [10, 11]));
    await previous;

    expect(session.getState().items[1]).toMatchObject({
      is_viewed: true,
      is_liked: true,
      like_count: 7,
    });
  });

  it('does not publish an empty frame while selecting a cached group', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21)];
    const fixture = createCache();
    fixture.entries.set('user:1:11', createResponse(groups[0], [10, 11]));
    fixture.entries.set('user:2:21', createResponse(groups[1], [20, 21]));
    const session = createStoryViewerSession({ cache: fixture.cache });
    const snapshots: number[][] = [];
    session.subscribe((state) => snapshots.push(state.items.map((item) => item.ref_id)));

    const opening = session.open(groups, 0);
    fixture.resolve(groups[0], createResponse(groups[0], [10, 11]));
    await opening;
    snapshots.length = 0;

    const selecting = session.selectGroup(1);
    fixture.resolve(groups[1], createResponse(groups[1], [20, 21]));
    await selecting;

    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots.every((items) => items.length > 0)).toBe(true);
    expect(session.getState().items.map((item) => item.ref_id)).toEqual([20, 21]);
  });

  it('preserves a newer reverse-navigation intent when boundary pagination resolves', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21), createGroup('3', 31)];
    const fixture = createCache();
    fixture.entries.set('user:1:11', createResponse(groups[0], [10, 11]));
    fixture.entries.set('user:2:21', createResponse(groups[1], [20, 21]));
    const nextPage = deferred<StoryGroup[] | void>();
    const session = createStoryViewerSession({
      cache: fixture.cache,
      feed: {
        hasNextPage: () => true,
        requestNextPage: () => nextPage.promise,
      },
    });

    const opening = session.open(groups.slice(0, 2), 1);
    fixture.resolve(groups[1], createResponse(groups[1], [20, 21]));
    await opening;

    const advancing = session.nextGroup();
    const reversing = session.prevGroup();
    fixture.resolve(groups[0], createResponse(groups[0], [10, 11]));
    await reversing;
    nextPage.resolve(groups);
    await advancing;

    expect(session.getState()).toMatchObject({ status: 'ready', currentGroupIndex: 0 });
    expect(session.getState().items.map((candidate) => candidate.ref_id)).toEqual([10, 11]);
  });

  it('honors a nonzero direct-open item index after the full response arrives', async () => {
    const group = createGroup('1', 11);
    const fixture = createCache();
    const fallbackItems = [createItem(10), createItem(11), createItem(12)];
    const session = createStoryViewerSession({ cache: fixture.cache });

    const opening = session.open([group], 0, fallbackItems, fallbackItems[2]);
    expect(session.getState().currentItemIndex).toBe(2);
    fixture.resolve(group, createResponse(group, [10, 11, 12]));
    await opening;

    expect(session.getState()).toMatchObject({ status: 'ready', currentItemIndex: 2 });
  });

  it('ignores pagination from a closed generation after the viewer reopens', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21), createGroup('3', 31)];
    const fixture = createCache();
    const oldPage = deferred<StoryGroup[] | void>();
    let hasNextPage = true;
    const session = createStoryViewerSession({
      cache: fixture.cache,
      feed: {
        hasNextPage: () => hasNextPage,
        requestNextPage: () => oldPage.promise,
      },
    });

    const firstOpen = session.open([groups[0]], 0);
    fixture.resolve(groups[0], createResponse(groups[0], [10, 11]));
    await firstOpen;
    hasNextPage = false;
    session.close();

    const secondOpen = session.open([groups[1]], 0);
    fixture.resolve(groups[1], createResponse(groups[1], [20, 21]));
    await secondOpen;
    oldPage.resolve([groups[0], groups[2]]);
    await flushPromises();

    expect(session.getState().groups.map((candidate) => candidate.groupId)).toEqual(['2']);
    expect(session.getState()).toMatchObject({ status: 'ready', currentGroupIndex: 0 });
  });

  it('accepts a response at the active identity after groups are reordered', async () => {
    const groups = [createGroup('1', 11), createGroup('2', 21), createGroup('3', 31)];
    const fixture = createCache();
    const session = createStoryViewerSession({ cache: fixture.cache });

    const opening = session.open(groups, 1);
    session.setGroups([groups[1], groups[2], groups[0]]);
    fixture.resolve(groups[1], createResponse(groups[1], [20, 21, 22]));
    await opening;

    expect(session.getState()).toMatchObject({ status: 'ready', currentGroupIndex: 0 });
    expect(session.getState().groups[0]).toMatchObject({ groupId: '2', totalItems: 3 });
    expect(session.getState().items.map((candidate) => candidate.ref_id)).toEqual([20, 21, 22]);
    expect(fixture.cache.prefetch).toHaveBeenCalledWith(groups[2]);
  });

  it('uses the newest direct-open item intent while the same group is loading', async () => {
    const group = createGroup('1', 11);
    const fixture = createCache();
    const session = createStoryViewerSession({ cache: fixture.cache });
    const target = createItem(12);

    const opening = session.open([group], 0, [group.preview], group.preview);
    const selecting = session.selectGroup(0, [], target);
    fixture.resolve(group, createResponse(group, [10, 11, 12]));
    await Promise.all([opening, selecting]);

    expect(session.getState()).toMatchObject({ status: 'ready', currentItemIndex: 2 });
  });

  it('keeps the newest same-group item intent when its fallback item is already visible', async () => {
    const group = createGroup('1', 10);
    const fixture = createCache();
    const fallbackItems = [createItem(10), createItem(11)];
    const session = createStoryViewerSession({ cache: fixture.cache });

    const opening = session.open([group], 0, fallbackItems, fallbackItems[0]);
    const selecting = session.selectGroup(0, fallbackItems, fallbackItems[1]);
    expect(session.getState().currentItemIndex).toBe(1);
    fixture.resolve(group, createResponse(group, [10, 11]));
    await Promise.all([opening, selecting]);

    expect(session.getState()).toMatchObject({ status: 'ready', currentItemIndex: 1 });
  });

  it('reconciles stale Story Bar viewed metadata with local item overrides', async () => {
    const group = createGroup('1', 11);
    const fixture = createCache();
    const session = createStoryViewerSession({ cache: fixture.cache });

    const opening = session.open([group], 0);
    fixture.resolve(group, createResponse(group, [10, 11]));
    await opening;
    session.markItemViewed(10, 'video_story_items');
    session.markItemViewed(11, 'video_story_items');

    session.setGroups([{ ...group, hasUnseen: true, preview: createItem(11) }]);

    expect(session.getState().groups[0]).toMatchObject({
      hasUnseen: false,
      preview: { is_viewed: true },
    });
  });
});
