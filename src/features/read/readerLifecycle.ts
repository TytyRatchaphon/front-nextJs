import type { createReadingProgress } from './readingProgress';
import type { createReadingSession } from './readingSession';

type ReadingProgressController = ReturnType<typeof createReadingProgress>;
type ReadingSessionController = ReturnType<typeof createReadingSession>;

export interface ReaderLifecycleBrowser {
  addEventListener: (event: string, listener: () => void) => void;
  removeEventListener: (event: string, listener: () => void) => void;
  clearInterval: (handle: unknown) => void;
  clearTimeout: (handle: unknown) => void;
  isDocumentActive: () => boolean;
  setInterval: (callback: () => void, delay: number) => unknown;
  setTimeout: (callback: () => void, delay: number) => unknown;
}

export interface ReaderLifecycleSocket {
  on: (event: string, listener: (payload: unknown) => void) => void;
  off: (event: string, listener: (payload: unknown) => void) => void;
}

interface CreateReaderLifecycleOptions {
  browser: ReaderLifecycleBrowser;
  onProgressCaptured?: (progress: number) => void;
  progress: ReadingProgressController;
  session: ReadingSessionController;
}

export const createReaderLifecycle = ({
  browser,
  onProgressCaptured,
  progress,
  session,
}: CreateReaderLifecycleOptions) => {
  let isStarted = false;
  let startPromise: Promise<void> | null = null;
  let lifecycleRevision = 0;
  let heartbeatHandle: unknown = null;
  let pendingEndHandle: unknown = null;
  let scrollTimeoutHandle: unknown = null;
  let socket: ReaderLifecycleSocket | null = null;
  let isSocketBound = false;
  let hasEnded = false;
  let hasStarted = false;

  const clearPendingScroll = () => {
    if (scrollTimeoutHandle === null) return;
    browser.clearTimeout(scrollTimeoutHandle);
    scrollTimeoutHandle = null;
  };

  const suspendProgress = () => {
    clearPendingScroll();
    progress.suspend();
  };

  const handleScroll = () => {
    if (scrollTimeoutHandle !== null || session.getState().isConflict) return;

    scrollTimeoutHandle = browser.setTimeout(() => {
      void progress.captureAndSave()
        .then((currentProgress) => onProgressCaptured?.(currentProgress))
        .finally(() => {
          scrollTimeoutHandle = null;
        });
    }, 500);
  };
  const handleHeartbeat = () => {
    if (!browser.isDocumentActive() || session.getState().isConflict) return;
    void progress.saveCurrent();
  };
  const endSession = async () => {
    pendingEndHandle = null;
    hasEnded = true;
    try {
      return await session.end();
    } catch {
      return undefined;
    }
  };
  const handleRemoteConflict = (payload: unknown) => {
    session.receiveRemoteConflict(payload);
    if (session.getState().isConflict) suspendProgress();
  };
  const handleDeviceLogout = (payload: unknown) => {
    void session.receiveDeviceLogout(payload);
    if (session.getState().isConflict) suspendProgress();
  };

  const bindSocket = () => {
    if (!socket || !isStarted || isSocketBound) return;
    socket.on('reading:conflict', handleRemoteConflict);
    socket.on('reading:session_taken_over', handleRemoteConflict);
    socket.on('auth:device_logged_out', handleDeviceLogout);
    isSocketBound = true;
  };

  const unbindSocket = () => {
    if (!socket || !isSocketBound) return;
    socket.off('reading:conflict', handleRemoteConflict);
    socket.off('reading:session_taken_over', handleRemoteConflict);
    socket.off('auth:device_logged_out', handleDeviceLogout);
    isSocketBound = false;
  };

  const start = () => {
    if (startPromise) return startPromise;

    isStarted = true;
    hasStarted = true;
    const revision = ++lifecycleRevision;
    if (pendingEndHandle !== null) {
      browser.clearTimeout(pendingEndHandle);
      pendingEndHandle = null;
    }
    if (hasEnded) {
      session.reopen();
      hasEnded = false;
    }
    progress.resume();
    browser.addEventListener('scroll', handleScroll);
    browser.addEventListener('beforeunload', endSession);
    browser.addEventListener('pagehide', endSession);
    heartbeatHandle = browser.setInterval(handleHeartbeat, 30000);
    bindSocket();

    startPromise = progress.restore().then(async () => {
      if (!isStarted || revision !== lifecycleRevision) return;
      await progress.saveCurrent();
    });
    return startPromise;
  };

  const stop = () => {
    if (isStarted) {
      isStarted = false;
      lifecycleRevision += 1;
      startPromise = null;
      progress.cancel();
      browser.removeEventListener('scroll', handleScroll);
      browser.removeEventListener('beforeunload', endSession);
      browser.removeEventListener('pagehide', endSession);
      unbindSocket();
      if (heartbeatHandle !== null) {
        browser.clearInterval(heartbeatHandle);
        heartbeatHandle = null;
      }
      clearPendingScroll();
    }

    if (hasStarted && pendingEndHandle === null && !hasEnded) {
      pendingEndHandle = browser.setTimeout(endSession, 0);
    }
    return Promise.resolve();
  };

  const finishStop = () => {
    if (!hasStarted) return Promise.resolve();
    if (pendingEndHandle !== null) {
      browser.clearTimeout(pendingEndHandle);
      pendingEndHandle = null;
    }
    return endSession();
  };

  const setSocket = (nextSocket: ReaderLifecycleSocket | null) => {
    if (socket === nextSocket) return;
    unbindSocket();
    socket = nextSocket;
    bindSocket();
  };

  const takeover = async () => {
    await session.takeover();
    if (!session.getState().isConflict) progress.resume();
  };

  return {
    finishStop,
    getState: session.getState,
    setSocket,
    start,
    stop,
    takeover,
  };
};
