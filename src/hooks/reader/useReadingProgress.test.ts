import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSyncReadingProgress = vi.fn();
const mockUpdateReadingProgress = vi.fn();
const pendingEffects: Array<() => void | (() => void)> = [];

vi.mock('react', () => ({
  useEffect: (effect: () => void | (() => void)) => pendingEffects.push(effect),
  useMemo: (factory: () => unknown) => factory(),
  useRef: (initial: unknown) => ({ current: initial }),
  useState: (initial: unknown) => [initial, vi.fn()],
}));

vi.mock('@/services/apiServices', () => ({
  syncReadingProgress: (...args: unknown[]) => mockSyncReadingProgress(...args),
  updateReadingProgress: (...args: unknown[]) => mockUpdateReadingProgress(...args),
}));

import { useReadingProgress } from './useReadingProgress';

const runEffects = () => pendingEffects
  .splice(0)
  .map((effect) => effect())
  .filter((cleanup): cleanup is () => void => typeof cleanup === 'function');

describe('useReadingProgress lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pendingEffects.length = 0;
    mockSyncReadingProgress.mockResolvedValue(null);
    mockUpdateReadingProgress.mockResolvedValue(undefined);

    (globalThis as any).window = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo: vi.fn(),
      scrollY: 0,
      innerHeight: 500,
    };
    (globalThis as any).document = {
      visibilityState: 'visible',
      hasFocus: () => true,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('removes its scroll listener when the reader unmounts', () => {
    useReadingProgress('4007', '1574150', { user_id: 64689 });
    const cleanups = runEffects();
    const scrollHandler = (globalThis as any).window.addEventListener.mock.calls
      .find(([event]: [string]) => event === 'scroll')?.[1];

    cleanups.forEach((cleanup) => cleanup());

    expect(scrollHandler).toBeTypeOf('function');
    expect((globalThis as any).window.removeEventListener)
      .toHaveBeenCalledWith('scroll', scrollHandler);
  });

  it('does not track progress while reading is disabled by a conflict', () => {
    useReadingProgress('4007', '1574150', { user_id: 64689 }, vi.fn(), false);
    runEffects();

    expect((globalThis as any).window.addEventListener).not.toHaveBeenCalled();
  });
});
