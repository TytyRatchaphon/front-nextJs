import { describe, expect, it, vi } from 'vitest';

import { createReaderLifecycle } from './readerLifecycle';
import { createReadingProgress } from './readingProgress';
import { createReadingSession } from './readingSession';

const createBrowser = () => {
  const listeners = new Map<string, Set<() => void>>();
  const intervals = new Map<number, () => void>();
  const timeouts = new Map<number, () => void>();
  let nextTimerId = 1;
  let isDocumentActive = true;
  const addEventListener = vi.fn((event: string, listener: () => void) => {
    const eventListeners = listeners.get(event) ?? new Set();
    eventListeners.add(listener);
    listeners.set(event, eventListeners);
  });
  const removeEventListener = vi.fn((event: string, listener: () => void) => {
    listeners.get(event)?.delete(listener);
  });

  return {
    adapter: {
      addEventListener,
      removeEventListener,
      clearInterval: vi.fn((handle: unknown) => intervals.delete(Number(handle))),
      clearTimeout: vi.fn((handle: unknown) => timeouts.delete(Number(handle))),
      isDocumentActive: () => isDocumentActive,
      setInterval: vi.fn((callback: () => void) => {
        const id = nextTimerId++;
        intervals.set(id, callback);
        return id;
      }),
      setTimeout: vi.fn((callback: () => void) => {
        const id = nextTimerId++;
        timeouts.set(id, callback);
        return id;
      }),
    },
    emit: (event: string) => listeners.get(event)?.forEach((listener) => listener()),
    intervalCount: () => intervals.size,
    listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
    runIntervals: () => intervals.forEach((callback) => callback()),
    runTimeouts: () => {
      const callbacks = [...timeouts.values()];
      timeouts.clear();
      callbacks.forEach((callback) => callback());
    },
    setDocumentActive: (active: boolean) => {
      isDocumentActive = active;
    },
    timeoutCount: () => timeouts.size,
  };
};

const createSocket = () => {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  return {
    adapter: {
      on: vi.fn((event: string, listener: (payload: unknown) => void) => {
        const eventListeners = listeners.get(event) ?? new Set();
        eventListeners.add(listener);
        listeners.set(event, eventListeners);
      }),
      off: vi.fn((event: string, listener: (payload: unknown) => void) => {
        listeners.get(event)?.delete(listener);
      }),
    },
    emit: (event: string, payload: unknown) => (
      listeners.get(event)?.forEach((listener) => listener(payload))
    ),
    listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
  };
};

describe('Reader lifecycle', () => {
  it('opens and closes one Reader lifecycle across competing browser events', async () => {
    const browser = createBrowser();
    const restore = vi.fn().mockResolvedValue(null);
    const save = vi.fn().mockResolvedValue(undefined);
    const end = vi.fn().mockResolvedValue(undefined);
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: { read: () => null, scrollTo: vi.fn() },
      persistence: { restore, save },
    });
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: {
        end,
        fetchActive: vi.fn().mockResolvedValue(null),
        takeover: vi.fn().mockResolvedValue(undefined),
      },
    });
    const lifecycle = createReaderLifecycle({
      browser: browser.adapter,
      progress,
      session,
    });

    await Promise.all([lifecycle.start(), lifecycle.start()]);

    expect(restore).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledOnce();
    expect(browser.listenerCount('scroll')).toBe(1);
    expect(browser.listenerCount('beforeunload')).toBe(1);
    expect(browser.listenerCount('pagehide')).toBe(1);

    browser.emit('beforeunload');
    browser.emit('pagehide');
    await Promise.all([lifecycle.stop(), lifecycle.stop()]);

    expect(end).toHaveBeenCalledOnce();
    expect(browser.listenerCount('scroll')).toBe(0);
    expect(browser.listenerCount('beforeunload')).toBe(0);
    expect(browser.listenerCount('pagehide')).toBe(0);
  });

  it('persists one throttled scroll update and heartbeats the latest progress', async () => {
    const browser = createBrowser();
    const save = vi.fn().mockResolvedValue(undefined);
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: {
        read: () => ({
          elementTop: 0,
          elementHeight: 1500,
          viewportHeight: 500,
          scrollY: 500,
        }),
        scrollTo: vi.fn(),
      },
      persistence: {
        restore: vi.fn().mockResolvedValue(null),
        save,
      },
    });
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: {
        end: vi.fn().mockResolvedValue(undefined),
        fetchActive: vi.fn().mockResolvedValue(null),
        takeover: vi.fn().mockResolvedValue(undefined),
      },
    });
    const lifecycle = createReaderLifecycle({ browser: browser.adapter, progress, session });

    await lifecycle.start();
    browser.emit('scroll');
    browser.emit('scroll');

    expect(browser.timeoutCount()).toBe(1);
    browser.runTimeouts();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save).toHaveBeenLastCalledWith('4007', '1574150', 0.5);

    expect(browser.intervalCount()).toBe(1);
    browser.runIntervals();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(3));
    expect(save).toHaveBeenLastCalledWith('4007', '1574150', 0.5);

    browser.setDocumentActive(false);
    browser.runIntervals();
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(3);
  });

  it('suspends pending progress on a remote conflict and resumes after takeover', async () => {
    const browser = createBrowser();
    const socket = createSocket();
    const save = vi.fn().mockResolvedValue(undefined);
    const takeover = vi.fn().mockResolvedValue(undefined);
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: {
        end: vi.fn().mockResolvedValue(undefined),
        fetchActive: vi.fn().mockResolvedValue(null),
        takeover,
      },
    });
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: {
        read: () => ({
          elementTop: 0,
          elementHeight: 1500,
          viewportHeight: 500,
          scrollY: 750,
        }),
        scrollTo: vi.fn(),
      },
      persistence: {
        restore: vi.fn().mockResolvedValue(null),
        save,
      },
    });
    const lifecycle = createReaderLifecycle({ browser: browser.adapter, progress, session });

    lifecycle.setSocket(socket.adapter);
    await lifecycle.start();
    browser.emit('scroll');
    socket.emit('reading:conflict', {
      source_device_id: 'other-device',
      active_devices: [{ device_id: 'other-device', is_reading: true }],
    });

    expect(lifecycle.getState().isConflict).toBe(true);
    expect(browser.timeoutCount()).toBe(0);
    browser.runTimeouts();
    browser.runIntervals();
    await Promise.resolve();
    expect(save).toHaveBeenCalledOnce();

    await lifecycle.takeover();
    expect(takeover).toHaveBeenCalledWith('4007', '1574150');
    expect(lifecycle.getState().isConflict).toBe(false);
    browser.emit('scroll');
    browser.runTimeouts();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save).toHaveBeenLastCalledWith('4007', '1574150', 0.75);
    expect(browser.listenerCount('scroll')).toBe(1);
  });

  it('keeps progress suspended when takeover fails', async () => {
    const browser = createBrowser();
    const socket = createSocket();
    const save = vi.fn().mockResolvedValue(undefined);
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: {
        end: vi.fn().mockResolvedValue(undefined),
        fetchActive: vi.fn().mockResolvedValue(null),
        takeover: vi.fn().mockRejectedValue(new Error('takeover failed')),
      },
    });
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: { read: () => null, scrollTo: vi.fn() },
      persistence: {
        restore: vi.fn().mockResolvedValue(null),
        save,
      },
    });
    const lifecycle = createReaderLifecycle({ browser: browser.adapter, progress, session });

    lifecycle.setSocket(socket.adapter);
    await lifecycle.start();
    socket.emit('reading:conflict', {
      source_device_id: 'other-device',
      active_devices: [{ device_id: 'other-device', is_reading: true }],
    });
    await lifecycle.takeover();
    browser.emit('scroll');
    browser.runIntervals();
    await Promise.resolve();

    expect(lifecycle.getState().isConflict).toBe(true);
    expect(browser.timeoutCount()).toBe(0);
    expect(save).toHaveBeenCalledOnce();
  });

  it('routes an HTTP progress conflict into the shared session boundary', async () => {
    const browser = createBrowser();
    const conflictData = {
      active_devices: [{ device_id: 'other-device', is_reading: true }],
    };
    const save = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce({ error_code: 'READING_CONFLICT', data: conflictData });
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: {
        end: vi.fn().mockResolvedValue(undefined),
        fetchActive: vi.fn().mockResolvedValue(null),
        takeover: vi.fn().mockResolvedValue(undefined),
      },
    });
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: {
        read: () => ({
          elementTop: 0,
          elementHeight: 1500,
          viewportHeight: 500,
          scrollY: 500,
        }),
        scrollTo: vi.fn(),
      },
      persistence: {
        restore: vi.fn().mockResolvedValue(null),
        save,
      },
      onConflict: session.reportConflict,
    });
    const lifecycle = createReaderLifecycle({ browser: browser.adapter, progress, session });

    await lifecycle.start();
    browser.emit('scroll');
    browser.runTimeouts();
    await vi.waitFor(() => expect(lifecycle.getState().isConflict).toBe(true));

    expect(lifecycle.getState().conflictData).toEqual({
      current_device: expect.objectContaining({ device_id: 'other-device' }),
      active_devices: [expect.objectContaining({
        device_id: 'other-device',
        is_current_device: false,
        is_reading: true,
      })],
    });
    browser.emit('scroll');
    browser.runIntervals();
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('moves socket subscriptions without duplicating the active lifecycle', async () => {
    const browser = createBrowser();
    const firstSocket = createSocket();
    const secondSocket = createSocket();
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: { read: () => null, scrollTo: vi.fn() },
      persistence: {
        restore: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockResolvedValue(undefined),
      },
    });
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: {
        end: vi.fn().mockResolvedValue(undefined),
        fetchActive: vi.fn().mockResolvedValue(null),
        takeover: vi.fn().mockResolvedValue(undefined),
      },
    });
    const lifecycle = createReaderLifecycle({ browser: browser.adapter, progress, session });

    lifecycle.setSocket(firstSocket.adapter);
    await lifecycle.start();
    lifecycle.setSocket(secondSocket.adapter);
    lifecycle.setSocket(secondSocket.adapter);

    expect(firstSocket.listenerCount('reading:conflict')).toBe(0);
    expect(secondSocket.listenerCount('reading:conflict')).toBe(1);
    expect(secondSocket.listenerCount('reading:session_taken_over')).toBe(1);
    expect(secondSocket.listenerCount('auth:device_logged_out')).toBe(1);

    await lifecycle.stop();
    expect(secondSocket.listenerCount('reading:conflict')).toBe(0);
    expect(secondSocket.listenerCount('reading:session_taken_over')).toBe(0);
    expect(secondSocket.listenerCount('auth:device_logged_out')).toBe(0);
    lifecycle.setSocket(null);
    expect(secondSocket.adapter.off).toHaveBeenCalledTimes(3);
  });

  it('cancels stale restore work when the active episode lifecycle is replaced', async () => {
    const browser = createBrowser();
    let finishOldRestore: (progress: number) => void = () => undefined;
    const oldRestore = new Promise<number>((resolve) => {
      finishOldRestore = resolve;
    });
    const oldScrollTo = vi.fn();
    const oldEnd = vi.fn().mockResolvedValue(undefined);
    const oldProgress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: {
        read: () => ({
          elementTop: 0,
          elementHeight: 1500,
          viewportHeight: 500,
          scrollY: 0,
        }),
        scrollTo: oldScrollTo,
      },
      persistence: {
        restore: vi.fn().mockReturnValue(oldRestore),
        save: vi.fn().mockResolvedValue(undefined),
      },
    });
    const oldSession = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: {
        end: oldEnd,
        fetchActive: vi.fn().mockResolvedValue(null),
        takeover: vi.fn().mockResolvedValue(undefined),
      },
    });
    const nextRestore = vi.fn().mockResolvedValue(null);
    const nextProgress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574151',
      viewport: { read: () => null, scrollTo: vi.fn() },
      persistence: {
        restore: nextRestore,
        save: vi.fn().mockResolvedValue(undefined),
      },
    });
    const nextSession = createReadingSession({
      bookId: '4007',
      episodeId: '1574151',
      currentDeviceId: 'this-device',
      gateway: {
        end: vi.fn().mockResolvedValue(undefined),
        fetchActive: vi.fn().mockResolvedValue(null),
        takeover: vi.fn().mockResolvedValue(undefined),
      },
    });
    const oldLifecycle = createReaderLifecycle({
      browser: browser.adapter,
      progress: oldProgress,
      session: oldSession,
    });
    const nextLifecycle = createReaderLifecycle({
      browser: browser.adapter,
      progress: nextProgress,
      session: nextSession,
    });

    const openingOldEpisode = oldLifecycle.start();
    await oldLifecycle.stop();
    const openingNextEpisode = oldLifecycle.finishStop().then(() => nextLifecycle.start());
    finishOldRestore(0.5);
    await Promise.all([openingOldEpisode, openingNextEpisode]);

    expect(oldEnd).toHaveBeenCalledOnce();
    expect(oldEnd.mock.invocationCallOrder[0]).toBeLessThan(
      nextRestore.mock.invocationCallOrder[0],
    );
    expect(oldScrollTo).not.toHaveBeenCalled();
    expect(browser.listenerCount('scroll')).toBe(1);
    expect(browser.intervalCount()).toBe(1);
  });

  it('reopens cleanly when React replays an effect lifecycle', async () => {
    const browser = createBrowser();
    const end = vi.fn().mockResolvedValue(undefined);
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: { read: () => null, scrollTo: vi.fn() },
      persistence: {
        restore: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockResolvedValue(undefined),
      },
    });
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: {
        end,
        fetchActive: vi.fn().mockResolvedValue(null),
        takeover: vi.fn().mockResolvedValue(undefined),
      },
    });
    const lifecycle = createReaderLifecycle({ browser: browser.adapter, progress, session });

    await lifecycle.start();
    await lifecycle.stop();
    expect(browser.timeoutCount()).toBe(1);
    await lifecycle.start();

    expect(browser.timeoutCount()).toBe(0);
    expect(browser.listenerCount('scroll')).toBe(1);
    expect(browser.listenerCount('beforeunload')).toBe(1);
    expect(browser.intervalCount()).toBe(1);

    await lifecycle.stop();
    browser.runTimeouts();
    await Promise.resolve();
    expect(end).toHaveBeenCalledOnce();
    expect(browser.listenerCount('scroll')).toBe(0);
    expect(browser.intervalCount()).toBe(0);
  });
});
