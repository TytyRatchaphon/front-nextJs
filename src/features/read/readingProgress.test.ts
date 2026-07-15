import { describe, expect, it, vi } from 'vitest';

import { createReadingProgress } from './readingProgress';

describe('Reading progress', () => {
  it('restores the saved progress to the matching document position', async () => {
    const scrollTo = vi.fn();
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: {
        read: () => ({
          elementTop: 150,
          elementHeight: 2000,
          viewportHeight: 500,
          scrollY: 50,
        }),
        scrollTo,
      },
      persistence: {
        restore: vi.fn().mockResolvedValue(0.5),
        save: vi.fn(),
      },
    });

    await progress.restore();

    expect(scrollTo).toHaveBeenCalledWith(900);
  });

  it('preserves restored progress when the viewport is not ready yet', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: { read: () => null, scrollTo: vi.fn() },
      persistence: {
        restore: vi.fn().mockResolvedValue(0.6),
        save,
      },
    });

    await progress.restore();
    await progress.saveCurrent();

    expect(save).toHaveBeenCalledWith('4007', '1574150', 0.6);
  });

  it('does not become persistable when restoration fails', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: { read: () => null, scrollTo: vi.fn() },
      persistence: {
        restore: vi.fn().mockResolvedValue(undefined),
        save,
      },
    });

    await progress.restore();
    await progress.saveCurrent();

    expect(save).not.toHaveBeenCalled();
  });

  it('calculates the restore target after the viewport layout stabilizes', async () => {
    let finishLayout: () => void = () => undefined;
    let elementHeight = 1500;
    const layoutReady = new Promise<void>((resolve) => {
      finishLayout = resolve;
    });
    const scrollTo = vi.fn();
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: {
        waitUntilStable: () => layoutReady,
        read: () => ({
          elementTop: 100,
          elementHeight,
          viewportHeight: 500,
          scrollY: 0,
        }),
        scrollTo,
      },
      persistence: {
        restore: vi.fn().mockResolvedValue(0.5),
        save: vi.fn(),
      },
    });

    const restoring = progress.restore();
    elementHeight = 2500;
    finishLayout();
    await restoring;

    expect(scrollTo).toHaveBeenCalledWith(1100);
  });

  it('captures scroll progress once and reuses it for heartbeat persistence', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: {
        read: () => ({
          elementTop: 100,
          elementHeight: 1500,
          viewportHeight: 500,
          scrollY: 1095,
        }),
        scrollTo: vi.fn(),
      },
      persistence: {
        restore: vi.fn().mockResolvedValue(null),
        save,
      },
    });

    await progress.captureAndSave();
    await progress.saveCurrent();

    expect(save).toHaveBeenNthCalledWith(1, '4007', '1574150', 0.995);
    expect(save).toHaveBeenNthCalledWith(2, '4007', '1574150', 0.995);
  });

  it('reports a reading conflict raised while persisting progress', async () => {
    const conflictData = { active_devices: [{ device_id: 'other-device' }] };
    const onConflict = vi.fn();
    const progressSave = vi.fn().mockRejectedValueOnce({
      error_code: 'READING_CONFLICT',
      data: conflictData,
    }).mockResolvedValue(undefined);
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
        save: progressSave,
      },
      onConflict,
    });

    await expect(progress.captureAndSave()).resolves.toBe(0.5);
    await progress.saveCurrent();

    expect(onConflict).toHaveBeenCalledWith(conflictData);
    expect(progressSave).toHaveBeenCalledOnce();

    progress.resume();
    await progress.saveCurrent();
    expect(progressSave).toHaveBeenCalledTimes(2);
  });

  it('does not overwrite server progress before restoration completes', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: {
        read: () => null,
        scrollTo: vi.fn(),
      },
      persistence: {
        restore: vi.fn().mockResolvedValue(null),
        save,
      },
    });

    await progress.saveCurrent();
    expect(save).not.toHaveBeenCalled();

    await progress.restore();
    await progress.saveCurrent();
    expect(save).toHaveBeenCalledWith('4007', '1574150', 0);
  });

  it('restores each episode only once when callers rerender', async () => {
    const restore = vi.fn().mockResolvedValue(0.25);
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: {
        read: () => ({
          elementTop: 0,
          elementHeight: 1500,
          viewportHeight: 500,
          scrollY: 0,
        }),
        scrollTo: vi.fn(),
      },
      persistence: {
        restore,
        save: vi.fn(),
      },
    });

    await progress.restore();
    await progress.restore();

    expect(restore).toHaveBeenCalledOnce();
  });

  it('cancels an in-flight restore before it can scroll newer content', async () => {
    let finishRestore: (progress: number) => void = () => undefined;
    const restore = new Promise<number>((resolve) => {
      finishRestore = resolve;
    });
    const scrollTo = vi.fn();
    const progress = createReadingProgress({
      bookId: '4007',
      episodeId: '1574150',
      viewport: {
        read: () => ({
          elementTop: 0,
          elementHeight: 1500,
          viewportHeight: 500,
          scrollY: 0,
        }),
        scrollTo,
      },
      persistence: {
        restore: vi.fn().mockReturnValue(restore),
        save: vi.fn(),
      },
    });

    const pendingRestore = progress.restore();
    progress.cancel();
    finishRestore(0.5);
    await pendingRestore;

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
