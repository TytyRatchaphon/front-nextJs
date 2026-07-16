export interface ReadingProgressViewport {
  waitUntilStable?: () => Promise<void>;
  read: () => {
    elementTop: number;
    elementHeight: number;
    viewportHeight: number;
    scrollY: number;
  } | null;
  scrollTo: (top: number) => void;
}

export interface ReadingProgressPersistence {
  restore: (episodeId: string) => Promise<number | null | undefined>;
  save: (bookId: string, episodeId: string, progress: number) => Promise<unknown>;
}

interface CreateReadingProgressOptions {
  bookId: string;
  episodeId: string;
  viewport: ReadingProgressViewport;
  persistence: ReadingProgressPersistence;
  onConflict?: (data: unknown) => void;
}

export const createReadingProgress = ({
  bookId,
  episodeId,
  viewport,
  persistence,
  onConflict,
}: CreateReadingProgressOptions) => {
  let currentProgress = 0;
  let isCancelled = false;
  let isReady = false;
  let isSuspended = false;
  let restorePromise: Promise<void> | null = null;

  const persistCurrent = async () => {
    if (isCancelled || isSuspended) return;

    try {
      await persistence.save(bookId, episodeId, currentProgress);
    } catch (error: any) {
      if (error?.code === 409001 || error?.error_code === 'READING_CONFLICT') {
        isSuspended = true;
        onConflict?.(error.data);
        return;
      }
      throw error;
    }
  };

  const performRestore = async () => {
    const savedProgress = await persistence.restore(episodeId);
    if (isCancelled || savedProgress === undefined) return;

    isReady = true;
    if (savedProgress === null || savedProgress < 0) return;

    currentProgress = savedProgress;
    if (savedProgress === 0) return;

    await viewport.waitUntilStable?.();
    if (isCancelled) return;

    const metrics = viewport.read();
    if (!metrics) return;

    const totalScrollable = Math.max(metrics.elementHeight - metrics.viewportHeight, 0);
    viewport.scrollTo(metrics.elementTop + savedProgress * totalScrollable);
  };

  const restore = () => {
    restorePromise ??= performRestore();
    return restorePromise;
  };

  const captureAndSave = async () => {
    const metrics = viewport.read();
    if (!metrics) return currentProgress;

    const totalScrollable = metrics.elementHeight - metrics.viewportHeight;
    const rawProgress = totalScrollable <= 0
      ? 1
      : (metrics.scrollY - metrics.elementTop) / totalScrollable;
    currentProgress = Number(Math.min(Math.max(rawProgress, 0), 1).toFixed(4));
    isReady = true;
    await persistCurrent();
    return currentProgress;
  };

  const saveCurrent = async () => {
    if (isCancelled || !isReady) return;
    await persistCurrent();
  };

  const cancel = () => {
    isCancelled = true;
  };

  const resume = () => {
    isCancelled = false;
    isSuspended = false;
  };

  const suspend = () => {
    isSuspended = true;
  };

  return { cancel, captureAndSave, restore, resume, saveCurrent, suspend };
};
