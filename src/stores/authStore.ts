import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import '@/stores/formStore';
import Cookies from 'js-cookie'
import { parseJwtToken, decodeAndMapUserFromToken } from '@/utils/jwtParser';

const DEFAULT_TOKEN_COOKIE_DAYS = 365;

const getTokenCookieExpireDays = () => {
  const raw = Number(process.env.NEXT_PUBLIC_TOKEN_COOKIE_DAYS);
  if (Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  return DEFAULT_TOKEN_COOKIE_DAYS;
};

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

const getTokenCookieOptions = () => {
  const isSecureContext = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const domain = getTokenCookieDomain();

  return {
    sameSite: 'lax' as const,
    secure: isSecureContext,
    path: '/',
    expires: getTokenCookieExpireDays(),
    ...(domain ? { domain } : {}),
  };
};

const getTokenCookieRemoveOptions = () => {
  const domain = getTokenCookieDomain();
  return {
    path: '/',
    ...(domain ? { domain } : {}),
  };
};

const clearLegacyLocalAuthStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
  } catch { }
};

const clearAuthTokenCookies = () => {
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
    // Host-only / default path variants
    removeCookieSafely(cookieName);
    removeCookieSafely(cookieName, { path: '/' });
    removeCookieSafely(cookieName, removeOptions as Record<string, unknown>);

    // Domain-bound variants
    domainCandidates.forEach((domain) => {
      removeCookieSafely(cookieName, { path: '/', domain });
    });
  });

  if (typeof document === 'undefined') return;

  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
  cookieNames.forEach((cookieName) => {
    // Host-only
    document.cookie = `${cookieName}=; expires=${expires}; path=/`;
    // Domain-bound
    domainCandidates.forEach((domain) => {
      document.cookie = `${cookieName}=; expires=${expires}; path=/; domain=${domain}`;
    });
  });
};

// ✅ อัปเดต Interface ให้ครบถ้วนตามที่ใช้จริงใน Sprofile และ Token
export interface UserData {
  user_id?: number;
  fullname: string;
  email: string;
  role: string;
  writer_name?: string | null;
  profileImage?: string; // รูปโปรไฟล์ผู้ใช้ (บางทีใช้ img)
  img?: string | null;   // รูปโปรไฟล์ (บางทีใช้ img)

  // Stats
  flower?: number;
  heart?: number;
  stamp?: number;
  coupon?: number;
  coin?: number;
  freecoin?: number;
  fast_ticket?: number;
  exp?: number;
  current_rp?: number;
  total_rp?: number;

  // Additional Profile Data (ที่ใช้ใน Sprofile)
  phone?: string | null;
  address_main?: string | null;
  des?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  gender?: string | null;
  birthday?: string | null;
  cat1?: string | null;
  cat2?: string | null;

  // Frame & Aka & Banner
  banner?: string | null;
  frame_id?: number | null;
  aka_id?: number | null;

  frame?: {
    frame_id: number;
    name: string;
    img: string;
  } | null;

  aka?: {
    aka_id: number;
    name: string;
    img: string;
  } | null;
}

export interface AuthState {
  user: UserData | null;
  token: string | null;
  isLoggedIn: boolean;
  hasMounted: boolean;

  // Actions
  login: (userData: UserData, token: string) => void;
  logout: () => void;
  setMounted: () => void;
  updateToken: (newToken: string) => void;
  updateUserBalance: (updates: Partial<UserData>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      hasMounted: false,

      // Actions
      login: (userData: UserData, token: string) => {
        clearLegacyLocalAuthStorage();
        set({ user: userData, token: token, isLoggedIn: true });
        const cleaned = parseJwtToken(token);
        if (cleaned) {
          clearAuthTokenCookies();
          Cookies.set('token', cleaned, getTokenCookieOptions());
        }
        
        // Immediately refine data from token to ensure user_id is correct
        get().updateToken(token);
      },

      logout: () => {
        clearLegacyLocalAuthStorage();
        clearAuthTokenCookies();
        set({ user: null, token: null, isLoggedIn: false });
        window.location.reload();
      },

      updateUserBalance: (updates: Partial<UserData>) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates };
        set({ user: updatedUser });
      },

      updateToken: (newToken: string) => {
        const cleaned = parseJwtToken(newToken);
        if (!cleaned) return;

        clearLegacyLocalAuthStorage();
        clearAuthTokenCookies();
        set({ token: cleaned, isLoggedIn: true });
        Cookies.set('token', cleaned, getTokenCookieOptions());

        try {
          const currentUser = get().user;
          // If no current user, initialize a fresh one
          const baseUser = currentUser || {
             fullname: '',
             email: '',
             role: 'user', 
          } as UserData;

          const updatedUser = decodeAndMapUserFromToken(cleaned, baseUser);
          if (updatedUser) {
             set({ user: updatedUser });
          }
        } catch (error) {
          console.error("Token update logic failed", error);
        }
      },

      setMounted: () => {
        clearLegacyLocalAuthStorage();
        const state = get();
        if (!state.user && !state.token && !state.isLoggedIn) {
          const cookieToken = parseJwtToken(Cookies.get('token'));
          if (cookieToken) {
            get().updateToken(cookieToken);
          }
        }
        set({ hasMounted: true });
      }
    }),
    {
      name: 'auth-storage',
      skipHydration: false,
      version: 1,
      partialize: () => ({}),
      migrate: () => ({} as Partial<AuthState>),
      onRehydrateStorage: () => () => {
      }
    }
  )
)
