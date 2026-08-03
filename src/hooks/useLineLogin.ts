import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import { completeProviderSession } from '@/features/auth/providerSession';

declare global {
  interface Window {
    liff: any;
  }
}

const LIFF_ID = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const LINE_LOGIN_PROCESSING_KEY = 'is_line_login_processing';
const LINE_LOGIN_IN_FLIGHT_KEY = 'is_line_login_in_flight';
const LINE_LOGIN_LOCK_TTL_MS = 15_000;
const LINE_LOGIN_WAIT_MAX_MS = 8_000;
const LINE_LOGIN_WAIT_STEP_MS = 120;
const LIFF_SCRIPT_URL = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
const LIFF_READY_TIMEOUT_MS = 2_000;
const LIFF_READY_STEP_MS = 50;

let backendLoginPromise: Promise<void> | null = null;
let activeLineLoginLockId: string | null = null;

interface LineLoginLockPayload {
  lockId: string;
  startedAt: number;
}

// Helper to set cookies
const setCookie = (name: string, value: string, days: number = 365) => {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "") + ";" + expires + ";path=/";
};


const clearLineLoginProcessingFlag = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LINE_LOGIN_PROCESSING_KEY);
};

const hasLineCallbackParams = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('code') || params.has('state') || params.has('liff.state');
};

const consumeLoginProcessingFlag = (): boolean => {
  if (typeof window === 'undefined') return false;

  const current = localStorage.getItem(LINE_LOGIN_PROCESSING_KEY);
  if (current === 'processing') return true;
  if (current !== 'true') return false;

  localStorage.setItem(LINE_LOGIN_PROCESSING_KEY, 'processing');
  return true;
};

const parseLineLoginLock = (raw: string | null): LineLoginLockPayload | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LineLoginLockPayload>;
    if (
      typeof parsed?.lockId === 'string' &&
      typeof parsed?.startedAt === 'number' &&
      Number.isFinite(parsed.startedAt)
    ) {
      return { lockId: parsed.lockId, startedAt: parsed.startedAt };
    }
    return null;
  } catch {
    const legacyStartedAt = Number(raw);
    if (!Number.isFinite(legacyStartedAt)) return null;

    return {
      lockId: 'legacy-lock',
      startedAt: legacyStartedAt,
    };
  }
};

const acquireLineLoginLock = (): boolean => {
  if (typeof window === 'undefined') return true;

  const now = Date.now();
  const currentLock = parseLineLoginLock(localStorage.getItem(LINE_LOGIN_IN_FLIGHT_KEY));
  const hasValidLock = !!currentLock && now - currentLock.startedAt < LINE_LOGIN_LOCK_TTL_MS;

  if (hasValidLock) return false;

  const nextLock: LineLoginLockPayload = {
    lockId: `${now}-${Math.random().toString(36).slice(2, 10)}`,
    startedAt: now,
  };

  localStorage.setItem(LINE_LOGIN_IN_FLIGHT_KEY, JSON.stringify(nextLock));

  const confirmLock = parseLineLoginLock(localStorage.getItem(LINE_LOGIN_IN_FLIGHT_KEY));
  const isOwnedByThisAttempt = confirmLock?.lockId === nextLock.lockId;
  if (!isOwnedByThisAttempt) return false;

  activeLineLoginLockId = nextLock.lockId;
  return true;
};

const releaseLineLoginLock = () => {
  if (typeof window === 'undefined') return;

  const currentLock = parseLineLoginLock(localStorage.getItem(LINE_LOGIN_IN_FLIGHT_KEY));
  if (activeLineLoginLockId && currentLock?.lockId === activeLineLoginLockId) {
    localStorage.removeItem(LINE_LOGIN_IN_FLIGHT_KEY);
  }

  activeLineLoginLockId = null;
};

const sleep = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const waitForExistingBackendLogin = async () => {
  if (typeof window === 'undefined') return;
  const processing = localStorage.getItem(LINE_LOGIN_PROCESSING_KEY);
  const shouldWait = hasLineCallbackParams() || processing === 'true' || processing === 'processing';
  if (!shouldWait) return;

  const started = Date.now();
  while (Date.now() - started < LINE_LOGIN_WAIT_MAX_MS) {
    if (useAuthStore.getState().isLoggedIn) return;

    const lock = parseLineLoginLock(localStorage.getItem(LINE_LOGIN_IN_FLIGHT_KEY));
    const hasValidLock = !!lock && Date.now() - lock.startedAt < LINE_LOGIN_LOCK_TTL_MS;
    if (!hasValidLock) return;

    await sleep(LINE_LOGIN_WAIT_STEP_MS);
  }
};

const waitForLiffReady = async () => {
  if (typeof window === 'undefined') return;
  if (window.liff) return;

  const started = Date.now();
  while (Date.now() - started < LIFF_READY_TIMEOUT_MS) {
    if (window.liff) return;
    await sleep(LIFF_READY_STEP_MS);
  }

  throw new Error('LINE_LIFF_NOT_READY');
};

export const useLineLogin = () => {
  const { login, isLoggedIn } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleBackendLogin = async () => {
    if (backendLoginPromise) {
      await backendLoginPromise;
      return;
    }

    backendLoginPromise = (async () => {
      let hasLock = false;

      try {
        hasLock = acquireLineLoginLock();
        if (!hasLock) {
          await waitForExistingBackendLogin();
          return;
        }

        setLoading(true);
        const profile = await window.liff.getProfile();
        const decoded = window.liff.getDecodedIDToken();

        const linePayload = {
          name: profile.displayName,
          email: decoded?.email || '',
          userId: profile.userId,
          picture: profile.pictureUrl,
        };

        const response = await axios.post(`${API_BASE_URL}/login/line`, linePayload);
        const responseBody = response.data ?? {};

        if (responseBody) {
          const userData = responseBody.data ?? responseBody;
          let token = '';
          let userInfo = {
            fullname: profile.displayName,
            email: decoded?.email || '',
            role: 'user',
            userId: ''
          };

          if (typeof userData === 'string') {
            token = userData;
          } else if (userData && typeof userData === 'object') {
            userInfo = {
              fullname: userData.fullname || userData.name || profile.displayName,
              email: userData.email || decoded?.email,
              role: userData.role || 'user',
              userId: userData.user_id || userData.userID
            };
            token =
              userData.token ||
              userData.access_token ||
              userData.jwt ||
              userData.pws ||
              responseBody.token ||
              responseBody.access_token ||
              response.headers?.authorization ||
              response.headers?.['x-auth-token'];
          }

          if (token) {
            // Set non-auth cookies only (auth token is managed centrally in authStore)
            setCookie('closePopupPolicy', '', 365);

            await completeProviderSession(login, userInfo, token, 'LINE');

            // Clear LINE login flags before navigation to avoid stale "processing" state
            // if the browser interrupts finally during page transition.
            clearLineLoginProcessingFlag();
            if (hasLock) {
              releaseLineLoginLock();
              hasLock = false;
            }

            if (hasLineCallbackParams()) {
              window.location.replace('/');
            } else {
              window.location.reload();
            }

            return;
          }

          throw new Error('LINE_TOKEN_MISSING');
        }
        throw new Error('LINE_LOGIN_EMPTY_RESPONSE');
      } catch {
        throw new Error('LINE_BACKEND_LOGIN_FAILED');
      } finally {
        clearLineLoginProcessingFlag();
        if (hasLock) {
          releaseLineLoginLock();
        }
        setLoading(false);
      }
    })();

    try {
      await backendLoginPromise;
    } finally {
      backendLoginPromise = null;
    }
  };

  const initializeLIFF = async (allowBackendLogin: boolean = true) => {
    try {
      if (!window.liff) {
        throw new Error('LIFF_UNAVAILABLE');
      }

      // Check if already initialized (liff.id is set after init)
      if (!window.liff.id) {
        if (!LIFF_ID) {
          throw new Error('LIFF_ID_MISSING');
        }
        await window.liff.init({ liffId: LIFF_ID });
      }

      // Check if returning from a login redirect initiated by us
      const shouldHandleBackendLogin =
        allowBackendLogin &&
        window.liff.isLoggedIn() &&
        !isLoggedIn &&
        (consumeLoginProcessingFlag() || hasLineCallbackParams());

      if (shouldHandleBackendLogin) {
        await handleBackendLogin();
      }
    } catch (error) {
      throw error;
    }
  };

  const initLIFF = (options?: { allowBackendLogin?: boolean }) => {
    const allowBackendLogin = options?.allowBackendLogin ?? true;

    return new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined') { resolve(); return; }

      if (window.liff) {
        initializeLIFF(allowBackendLogin).then(resolve).catch(reject);
        return;
      }

      if (document.querySelector(`script[src="${LIFF_SCRIPT_URL}"]`)) {
        waitForLiffReady()
          .then(() => initializeLIFF(allowBackendLogin))
          .then(resolve)
          .catch(reject);
        return;
      }

      const script = document.createElement('script');
      script.src = LIFF_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        initializeLIFF(allowBackendLogin).then(resolve).catch(reject);
      };
      script.onerror = (e) => {
        reject(e);
      };
      document.head.appendChild(script);
    });
  };

  const loginWithLine = async () => {
    if (typeof window === 'undefined') return;

    try {
      await initLIFF({ allowBackendLogin: true });

      if (!window.liff.isLoggedIn()) {
        // Set flag before redirecting
        localStorage.setItem(LINE_LOGIN_PROCESSING_KEY, 'true');
        const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/linecallback`;
        window.liff.login({ redirectUri });
      } else {
        await handleBackendLogin();
      }
    } catch (error) {
      clearLineLoginProcessingFlag();
      throw error;
    }
  };

  return { initLIFF, loginWithLine, loading };
};
