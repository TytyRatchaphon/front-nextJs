import Cookies from 'js-cookie';
import { parseJwtToken } from '@/utils/jwtParser';

const AUTH_SESSION_ENDPOINT = '/api/auth/session';

export interface AuthSessionResponse {
  authenticated: boolean;
  token: string | null;
}

const getTokenCookieDomain = () => {
  const configuredDomain = process.env.NEXT_PUBLIC_TOKEN_COOKIE_DOMAIN?.trim();
  if (configuredDomain) {
    return configuredDomain;
  }

  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname.toLowerCase();
  const isIpv4Host = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);

  if (hostname === 'localhost' || isIpv4Host) {
    return undefined;
  }

  if (hostname === 'enjoybook.co' || hostname.endsWith('.enjoybook.co')) {
    return '.enjoybook.co';
  }

  return undefined;
};

const getTokenCookieRemoveOptions = () => {
  const domain = getTokenCookieDomain();
  return {
    path: '/',
    ...(domain ? { domain } : {}),
  };
};

export const clearLegacyLocalAuthStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
  } catch { }
};

const clearClientReadableAuthTokenCookies = () => {
  if (typeof window === 'undefined') return;

  const cookieNames = ['token', 'tk'];
  const removeOptions = getTokenCookieRemoveOptions();
  const hostname = window.location.hostname.toLowerCase();
  const isIpv4Host = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
  const domainCandidates = new Set<string>();

  if (typeof removeOptions.domain === 'string' && removeOptions.domain.trim()) {
    domainCandidates.add(removeOptions.domain.trim());
  }

  if (hostname && hostname !== 'localhost' && !isIpv4Host) {
    domainCandidates.add(hostname);

    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const rootDomain = parts.slice(-2).join('.');
      domainCandidates.add(rootDomain);
      domainCandidates.add(`.${rootDomain}`);
    }
  }

  const removeCookieSafely = (name: string, options?: Record<string, unknown>) => {
    try {
      if (options) {
        Cookies.remove(name, options as never);
      } else {
        Cookies.remove(name);
      }
    } catch { }
  };

  cookieNames.forEach((cookieName) => {
    removeCookieSafely(cookieName);
    removeCookieSafely(cookieName, { path: '/' });
    removeCookieSafely(cookieName, removeOptions as Record<string, unknown>);

    domainCandidates.forEach((domain) => {
      removeCookieSafely(cookieName, { path: '/', domain });
    });
  });

  if (typeof document === 'undefined') return;

  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
  cookieNames.forEach((cookieName) => {
    document.cookie = `${cookieName}=; expires=${expires}; path=/`;
    domainCandidates.forEach((domain) => {
      document.cookie = `${cookieName}=; expires=${expires}; path=/; domain=${domain}`;
    });
  });
};

export const clearAuthTokenCookies = async (): Promise<void> => {
  clearClientReadableAuthTokenCookies();

  if (typeof window === 'undefined') return;
  await fetch(AUTH_SESSION_ENDPOINT, {
    method: 'DELETE',
    credentials: 'same-origin',
    cache: 'no-store',
    keepalive: true,
  }).catch(() => undefined);
};

export const setAuthTokenCookie = async (token: string): Promise<void> => {
  clearClientReadableAuthTokenCookies();

  if (typeof window === 'undefined') return;
  const response = await fetch(AUTH_SESSION_ENDPOINT, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error('AUTH_SESSION_WRITE_FAILED');
};

export const getAuthSession = async (): Promise<AuthSessionResponse | null> => {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch(AUTH_SESSION_ENDPOINT, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const data = await response.json();
    const token = parseJwtToken(data?.token);

    return {
      authenticated: Boolean(data?.authenticated && token),
      token: token || null,
    };
  } catch {
    return null;
  }
};
