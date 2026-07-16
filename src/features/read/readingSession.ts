import type { ActiveDevice, ReadingSessionActiveData } from '@/services/apiServices';

interface ReadingSessionGateway {
  end: (bookId: string, episodeId: string) => Promise<unknown>;
  fetchActive: () => Promise<ReadingSessionActiveData | null>;
  takeover: (bookId: string, episodeId: string) => Promise<unknown>;
}

interface CreateReadingSessionOptions {
  bookId: string;
  episodeId: string;
  currentDeviceId: string;
  gateway: ReadingSessionGateway;
  onLogout?: () => Promise<unknown>;
}

interface ReadingSessionState {
  isConflict: boolean;
  conflictData: ReadingSessionActiveData | null;
}

type ConflictPayload = {
  active_device?: unknown;
  active_devices?: unknown;
  current_device?: unknown;
  source_device_id?: unknown;
};

const asConflictPayload = (payload: unknown): ConflictPayload => (
  payload && typeof payload === 'object' ? payload as ConflictPayload : {}
);

const normalizeDevice = (
  device: unknown,
  currentDeviceId: string,
): ActiveDevice | null => {
  if (!device || typeof device !== 'object') return null;
  const value = device as Partial<ActiveDevice>;
  const deviceId = typeof value.device_id === 'string' || typeof value.device_id === 'number'
    ? String(value.device_id)
    : '';
  if (!deviceId) return null;

  const normalizeId = (id: unknown) => (
    typeof id === 'string' || typeof id === 'number' ? id : null
  );
  const normalizeString = (text: unknown) => typeof text === 'string' ? text : '';

  return {
    device_id: deviceId,
    user_agent: normalizeString(value.user_agent),
    book_id: normalizeId(value.book_id),
    ep_id: normalizeId(value.ep_id),
    started_at: normalizeString(value.started_at),
    last_seen_at: normalizeString(value.last_seen_at),
    is_current_device: deviceId === currentDeviceId,
    can_logout: deviceId !== currentDeviceId && value.can_logout !== false,
    is_reading: value.is_reading === true,
  };
};

const normalizeConflict = (
  payload: ConflictPayload | null | undefined,
  currentDeviceId: string,
): ReadingSessionActiveData => {
  const activeDevices = (Array.isArray(payload?.active_devices) ? payload.active_devices : [])
    .map((device) => normalizeDevice(device, currentDeviceId))
    .filter((device): device is ActiveDevice => device !== null);
  const currentDevice = payload?.current_device || payload?.active_device
    || activeDevices.find((device) => device.is_reading)
    || null;

  return {
    current_device: currentDevice ? normalizeDevice(currentDevice, currentDeviceId) : null,
    active_devices: activeDevices,
  };
};

export const createReadingSession = ({
  bookId,
  episodeId,
  currentDeviceId,
  gateway,
  onLogout,
}: CreateReadingSessionOptions) => {
  let state: ReadingSessionState = {
    isConflict: false,
    conflictData: null,
  };
  let endPromise: Promise<unknown> | null = null;
  let logoutPromise: Promise<unknown> | null = null;
  let conflictRevision = 0;
  let refreshRequestId = 0;
  const listeners = new Set<() => void>();

  const setState = (nextState: ReadingSessionState) => {
    state = nextState;
    listeners.forEach((listener) => listener());
  };

  const reportConflict = (payload: unknown) => {
    conflictRevision += 1;
    setState({
      isConflict: true,
      conflictData: normalizeConflict(asConflictPayload(payload), currentDeviceId),
    });
  };

  const receiveRemoteConflict = (rawPayload: unknown) => {
  const payload = asConflictPayload(rawPayload);
    const sourceDeviceId = typeof payload.source_device_id === 'string'
      ? payload.source_device_id
      : null;
    if (
      sourceDeviceId
      && currentDeviceId
      && sourceDeviceId === currentDeviceId
    ) {
      return;
    }

    reportConflict(payload);
  };

  const receiveDeviceLogout = (payload: unknown) => {
    const targetDeviceId = payload && typeof payload === 'object'
      ? (payload as { target_device_id?: unknown }).target_device_id
      : null;
    if (!currentDeviceId || targetDeviceId !== currentDeviceId) return Promise.resolve();

    if (!logoutPromise) {
      conflictRevision += 1;
      setState({ ...state, isConflict: true });
      logoutPromise = (async () => {
        try {
          await onLogout?.();
        } catch {
          // Socket logout failures are contained here so callers do not reject.
        } finally {
          logoutPromise = null;
        }
      })();
    }
    return logoutPromise;
  };

  const refresh = async () => {
    const requestId = ++refreshRequestId;
    const revisionAtStart = conflictRevision;
    const activeSessions = await gateway.fetchActive();
    if (
      !activeSessions
      || requestId !== refreshRequestId
      || revisionAtStart !== conflictRevision
    ) return;

    setState({
      ...state,
      conflictData: normalizeConflict(activeSessions, currentDeviceId),
    });
  };

  const takeover = async () => {
    const revisionAtStart = conflictRevision;
    try {
      await gateway.takeover(bookId, episodeId);
    } catch {
      return;
    }
    if (revisionAtStart !== conflictRevision) return;

    conflictRevision += 1;
    refreshRequestId += 1;
    setState({ isConflict: false, conflictData: null });
  };

  const end = () => {
    if (state.isConflict) return Promise.resolve();
    endPromise ??= gateway.end(bookId, episodeId);
    return endPromise;
  };

  const reopen = () => {
    endPromise = null;
  };

  return {
    end,
    getState: () => state,
    refresh,
    receiveDeviceLogout,
    receiveRemoteConflict,
    reportConflict,
    reopen,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    takeover,
  };
};
