import { getJwtIdentity, validateJwtToken } from "@/utils/jwtParser";

export type AuthSessionStatus =
  | "guest"
  | "hydrating"
  | "authenticating"
  | "authenticated"
  | "refreshing"
  | "logging_out";

export type AuthSessionErrorCode =
  | "INVALID_SESSION"
  | "SESSION_PERSIST_FAILED"
  | "SESSION_READ_FAILED"
  | "REFRESH_SESSION_MISMATCH"
  | "REFRESH_USER_INVALID"
  | "SESSION_REFRESH_FAILED";

export interface AuthSessionState<TUser> {
  status: AuthSessionStatus;
  user: TUser | null;
  token: string | null;
  hasHydrated: boolean;
  error: AuthSessionErrorCode | null;
}

export interface AuthSessionPersistence {
  read: () => Promise<string | null>;
  write: (token: string) => Promise<void>;
  clear: () => Promise<void>;
}

interface CreateAuthSessionLifecycleOptions<TUser> {
  persistence: AuthSessionPersistence;
  mapUser: (token: string, fallback: TUser | null) => TUser | null;
  now?: () => number;
}

export const createAuthSessionLifecycle = <TUser>({
  persistence,
  mapUser,
  now = Date.now,
}: CreateAuthSessionLifecycleOptions<TUser>) => {
  let state: AuthSessionState<TUser> = {
    status: "guest",
    user: null,
    token: null,
    hasHydrated: false,
    error: null,
  };
  let generation = 0;
  let hydrationPromise: Promise<void> | null = null;
  let loginAttempt: { token: string; promise: Promise<boolean> } | null = null;
  let logoutPromise: Promise<void> | null = null;
  let refreshAttempt: {
    generation: number;
    identity: string;
    promise: Promise<boolean>;
  } | null = null;
  let persistenceWritePromise: Promise<void> | null = null;
  let persistenceTail: Promise<void> = Promise.resolve();
  const listeners = new Set<(state: AuthSessionState<TUser>) => void>();

  const publish = (patch: Partial<AuthSessionState<TUser>>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  };

  const persist = (token: string) => {
    const write = persistenceTail.catch(() => undefined).then(() => persistence.write(token)).finally(() => {
      if (persistenceWritePromise === write) persistenceWritePromise = null;
    });
    persistenceTail = write;
    persistenceWritePromise = write;
    return write;
  };

  const completeLogin = async (fallbackUser: TUser, rawToken: string) => {
    if (state.status === "logging_out") return false;
    const token = validateJwtToken(rawToken, now());
    const user = token ? mapUser(token, fallbackUser) : null;
    if (!token || !user) {
      publish(state.token && state.user
        ? { status: "authenticated", error: "INVALID_SESSION" }
        : { status: "guest", user: null, token: null, hasHydrated: true, error: "INVALID_SESSION" });
      return false;
    }
    if (loginAttempt?.token === token) return loginAttempt.promise;

    const currentGeneration = ++generation;
    publish({ status: "authenticating", error: null });
    const currentLogin = (async () => {
      try {
        await persist(token);
        if (currentGeneration !== generation) return false;
        publish({ status: "authenticated", user, token, hasHydrated: true, error: null });
        return true;
      } catch {
        if (currentGeneration === generation) {
          await persistence.clear().catch(() => undefined);
          if (currentGeneration === generation) {
            publish({ status: "guest", user: null, token: null, hasHydrated: true, error: "SESSION_PERSIST_FAILED" });
          }
        }
        return false;
      }
    })().finally(() => {
      if (loginAttempt?.promise === currentLogin) loginAttempt = null;
    });
    loginAttempt = { token, promise: currentLogin };
    return currentLogin;
  };

  const hydrate = () => {
    if (state.hasHydrated) return Promise.resolve();
    if (hydrationPromise) return hydrationPromise;
    const currentGeneration = generation;
    publish({ status: "hydrating", error: null });
    const currentHydration = (async () => {
      try {
        const rawToken = await persistence.read();
        if (currentGeneration !== generation) return;
        const token = validateJwtToken(rawToken, now());
        const user = token ? mapUser(token, null) : null;
        if (!token || !user) {
          publish({ status: "guest", user: null, token: null, hasHydrated: true, error: null });
          return;
        }
        publish({ status: "authenticated", user, token, hasHydrated: true, error: null });
      } catch {
        if (currentGeneration === generation) {
          publish({ status: "guest", user: null, token: null, hasHydrated: true, error: "SESSION_READ_FAILED" });
        }
      }
    })().finally(() => {
      if (hydrationPromise === currentHydration) hydrationPromise = null;
    });
    hydrationPromise = currentHydration;
    return currentHydration;
  };

  const logout = () => {
    if (logoutPromise) return logoutPromise;
    const currentGeneration = ++generation;
    publish({ status: "logging_out", user: null, token: null, hasHydrated: true, error: null });
    const currentLogout = (async () => {
      try {
        await persistenceWritePromise?.catch(() => undefined);
        await persistence.clear();
      } catch {
        // Local authenticated state remains cleared even when remote/browser cleanup fails.
      } finally {
        if (currentGeneration === generation) {
          publish({ status: "guest", user: null, token: null, hasHydrated: true, error: null });
        }
      }
    })().finally(() => {
      if (logoutPromise === currentLogout) logoutPromise = null;
    });
    logoutPromise = currentLogout;
    return currentLogout;
  };

  const refresh = (loadToken: (currentToken: string) => Promise<string | null>) => {
    if (!state.token || !state.user || state.status === "logging_out") return Promise.resolve(false);
    const currentGeneration = generation;
    const currentToken = state.token;
    const currentIdentity = getJwtIdentity(currentToken);
    if (!currentIdentity) return Promise.resolve(false);
    if (
      refreshAttempt?.generation === currentGeneration &&
      refreshAttempt.identity === currentIdentity
    ) return refreshAttempt.promise;
    publish({ status: "refreshing", error: null });
    const currentRefresh = (async () => {
      try {
        const rawToken = await loadToken(currentToken);
        if (currentGeneration !== generation) return false;
        const token = validateJwtToken(rawToken, now());
        if (!token || !currentIdentity || getJwtIdentity(token) !== currentIdentity) {
          publish({ status: "authenticated", error: "REFRESH_SESSION_MISMATCH" });
          return false;
        }
        const user = mapUser(token, state.user);
        if (!user) {
          publish({ status: "authenticated", error: "REFRESH_USER_INVALID" });
          return false;
        }
        await persist(token);
        if (currentGeneration !== generation) return false;
        publish({ status: "authenticated", user, token, error: null });
        return true;
      } catch {
        if (currentGeneration === generation) {
          publish({ status: "authenticated", error: "SESSION_REFRESH_FAILED" });
        }
        return false;
      }
    })().finally(() => {
      if (refreshAttempt?.promise === currentRefresh) refreshAttempt = null;
    });
    refreshAttempt = {
      generation: currentGeneration,
      identity: currentIdentity,
      promise: currentRefresh,
    };
    return currentRefresh;
  };

  const applyCredential = async (rawToken: string) => {
    if (!state.token || !state.user || state.status === "logging_out") return false;
    const currentIdentity = getJwtIdentity(state.token);
    const token = validateJwtToken(rawToken, now());
    if (!token || !currentIdentity || getJwtIdentity(token) !== currentIdentity) return false;
    const user = mapUser(token, state.user);
    if (!user) return false;
    const currentGeneration = ++generation;
    try {
      await persist(token);
      if (currentGeneration !== generation) return false;
      publish({ status: "authenticated", user, token, error: null });
      return true;
    } catch {
      if (currentGeneration === generation) publish({ status: "authenticated", error: "SESSION_PERSIST_FAILED" });
      return false;
    }
  };

  return {
    getState: () => state,
    subscribe: (listener: (state: AuthSessionState<TUser>) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    completeLogin,
    hydrate,
    logout,
    refresh,
    applyCredential,
  };
};
