import { beforeEach, describe, expect, it, vi } from 'vitest';

const pendingEffects: Array<() => void | (() => void)> = [];
const mockSyncReadingProgress = vi.fn();
const mockUpdateReadingProgress = vi.fn();
const mockEndReadingSession = vi.fn();
let addEventListener = vi.fn<(event: string, listener: () => void) => void>();
let removeEventListener = vi.fn<(event: string, listener: () => void) => void>();
let timeoutCallbacks: Array<() => void> = [];
let refIndex = 0;
let refSlots: Array<{ current: unknown }> = [];

vi.mock('react', () => ({
  useEffect: (effect: () => void | (() => void)) => pendingEffects.push(effect),
  useMemo: (factory: () => unknown) => factory(),
  useRef: (initial: unknown) => {
    const slot = refSlots[refIndex] ?? { current: initial };
    refSlots[refIndex] = slot;
    refIndex += 1;
    return slot;
  },
  useState: (initial: unknown) => [initial, vi.fn()],
  useSyncExternalStore: (
    _subscribe: (listener: () => void) => () => void,
    getSnapshot: () => unknown,
  ) => getSnapshot(),
}));

vi.mock('@/providers/SocketProvider', () => ({
  useSocket: () => ({ socket: null }),
}));

vi.mock('@/services/apiServices', () => ({
  endReadingSession: (...args: unknown[]) => mockEndReadingSession(...args),
  fetchActiveReadingSessions: vi.fn().mockResolvedValue(null),
  syncReadingProgress: (...args: unknown[]) => mockSyncReadingProgress(...args),
  takeoverReadingSession: vi.fn().mockResolvedValue(undefined),
  updateReadingProgress: (...args: unknown[]) => mockUpdateReadingProgress(...args),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: { getState: () => ({ logout: vi.fn() }) },
}));

import { useReaderLifecycle } from './useReaderLifecycle';

const runEffects = () => pendingEffects
  .splice(0)
  .map((effect) => effect())
  .filter((cleanup): cleanup is () => void => typeof cleanup === 'function');

const LifecycleRender = ({ episodeId }: { episodeId: string }) => (
  useReaderLifecycle('4007', episodeId, { user_id: 64689 })
);

const renderLifecycle = (episodeId: string) => {
  refIndex = 0;
  return LifecycleRender({ episodeId });
};

describe('Reader lifecycle hook', () => {
  beforeEach(() => {
    pendingEffects.length = 0;
    refIndex = 0;
    refSlots = [];
    vi.clearAllMocks();
    mockSyncReadingProgress.mockResolvedValue(null);
    mockUpdateReadingProgress.mockResolvedValue(undefined);
    mockEndReadingSession.mockResolvedValue(undefined);
    addEventListener = vi.fn<(event: string, listener: () => void) => void>();
    removeEventListener = vi.fn<(event: string, listener: () => void) => void>();
    timeoutCallbacks = [];

    vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue('this-device') });
    vi.stubGlobal('document', {
      hasFocus: () => true,
      visibilityState: 'visible',
    });
    vi.stubGlobal('window', {
      addEventListener,
      clearInterval: vi.fn(),
      clearTimeout: vi.fn(),
      innerHeight: 500,
      removeEventListener,
      scrollTo: vi.fn(),
      scrollY: 0,
      setInterval: vi.fn(),
      setTimeout: vi.fn((callback: () => void) => {
        timeoutCallbacks.push(callback);
        return timeoutCallbacks.length;
      }),
    });
  });

  it('does not start authenticated lifecycle side effects for a guest reader', () => {
    useReaderLifecycle('4007', '1574150', null);
    runEffects();

    expect(addEventListener).not.toHaveBeenCalled();
    expect(mockSyncReadingProgress).not.toHaveBeenCalled();
    expect(mockUpdateReadingProgress).not.toHaveBeenCalled();
    expect(mockEndReadingSession).not.toHaveBeenCalled();
  });

  it('binds and cleans one authenticated lifecycle at the Reader boundary', async () => {
    renderLifecycle('1574150');
    const cleanups = runEffects();

    await vi.waitFor(() => expect(mockSyncReadingProgress).toHaveBeenCalledOnce());
    expect(addEventListener.mock.calls.map(([event]) => event))
      .toEqual(['scroll', 'beforeunload', 'pagehide']);

    cleanups.forEach((cleanup) => cleanup());

    expect(removeEventListener.mock.calls.map(([event]) => event))
      .toEqual(['scroll', 'beforeunload', 'pagehide']);
    expect(mockEndReadingSession).not.toHaveBeenCalled();
    timeoutCallbacks.forEach((callback) => callback());
    expect(mockEndReadingSession).toHaveBeenCalledOnce();
  });

  it('serializes rapid episode replacement and skips a lifecycle that never started', async () => {
    let rejectOldEnd: (error: Error) => void = () => undefined;
    mockEndReadingSession.mockReturnValue(new Promise((_, reject) => {
      rejectOldEnd = reject;
    }));

    renderLifecycle('1574150');
    const firstCleanups = runEffects();
    await vi.waitFor(() => expect(mockSyncReadingProgress).toHaveBeenCalledWith('1574150'));

    renderLifecycle('1574151');
    firstCleanups.forEach((cleanup) => cleanup());
    const secondCleanups = runEffects();
    await vi.waitFor(() => expect(mockEndReadingSession).toHaveBeenCalledOnce());

    renderLifecycle('1574152');
    secondCleanups.forEach((cleanup) => cleanup());
    runEffects();

    expect(mockSyncReadingProgress).not.toHaveBeenCalledWith('1574151');
    expect(mockSyncReadingProgress).not.toHaveBeenCalledWith('1574152');
    expect(mockEndReadingSession).toHaveBeenCalledOnce();

    rejectOldEnd(new Error('old session end failed'));
    await vi.waitFor(() => expect(mockSyncReadingProgress).toHaveBeenCalledWith('1574152'));

    expect(mockSyncReadingProgress).not.toHaveBeenCalledWith('1574151');
    expect(mockEndReadingSession).toHaveBeenCalledOnce();
  });
});
