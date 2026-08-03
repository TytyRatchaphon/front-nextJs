import { create } from 'zustand'
import { decodeAndMapUserFromToken } from '@/utils/jwtParser';
import {
  clearAuthTokenCookies,
  clearLegacyLocalAuthStorage,
  getAuthSession,
  setAuthTokenCookie,
} from '@/services/authPersistence';
import {
  createAuthSessionLifecycle,
  type AuthSessionErrorCode,
  type AuthSessionStatus,
} from '@/features/auth/authSessionLifecycle';

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
  status: AuthSessionStatus;
  error: AuthSessionErrorCode | null;

  // Actions
  login: (userData: UserData, token: string) => Promise<boolean>;
  logout: (options?: { navigate?: boolean }) => Promise<void>;
  setMounted: () => Promise<void>;
  updateToken: (newToken: string) => Promise<boolean>;
  refreshSession: (loadToken: (currentToken: string) => Promise<string | null>) => Promise<boolean>;
  updateUserBalance: (updates: Partial<UserData>) => void;
}

export const createAuthStore = () => create<AuthState>()(
    (set, get) => {
      const lifecycle = createAuthSessionLifecycle<UserData>({
        persistence: {
          read: async () => (await getAuthSession())?.token ?? null,
          write: setAuthTokenCookie,
          clear: clearAuthTokenCookies,
        },
        mapUser: (token, fallback) => decodeAndMapUserFromToken(token, fallback ?? {
          fullname: '',
          email: '',
          role: 'user',
        }),
      });
      let logoutNavigationPromise: Promise<void> | null = null;

      lifecycle.subscribe((session) => {
        set({
          user: session.user,
          token: session.token,
          isLoggedIn: session.status === 'authenticated' || session.status === 'refreshing',
          hasMounted: session.hasHydrated,
          status: session.status,
          error: session.error,
        });
      });

      return {
      user: null,
      token: null,
      isLoggedIn: false,
      hasMounted: false,
      status: 'guest',
      error: null,

      // Actions
      login: async (userData: UserData, token: string) => {
        clearLegacyLocalAuthStorage();
        return lifecycle.completeLogin(userData, token);
      },

      logout: async (options) => {
        const shouldNavigate = options?.navigate ?? true;
        if (logoutNavigationPromise) {
          await logoutNavigationPromise;
          if (shouldNavigate && typeof window !== 'undefined') window.location.href = '/';
          return;
        }
        if (lifecycle.getState().status === 'guest' && lifecycle.getState().hasHydrated) {
          if (shouldNavigate && typeof window !== 'undefined') window.location.href = '/';
          return;
        }
        clearLegacyLocalAuthStorage();
        logoutNavigationPromise = lifecycle.logout().finally(() => {
          logoutNavigationPromise = null;
        });
        await logoutNavigationPromise;
        if (shouldNavigate && typeof window !== 'undefined') window.location.href = '/';
      },

      updateUserBalance: (updates: Partial<UserData>) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates };
        set({ user: updatedUser });
      },

      updateToken: async (newToken: string) => {
        clearLegacyLocalAuthStorage();
        return lifecycle.applyCredential(newToken);
      },

      refreshSession: (loadToken) => {
        clearLegacyLocalAuthStorage();
        return lifecycle.refresh(loadToken);
      },

      setMounted: async () => {
        clearLegacyLocalAuthStorage();

        await lifecycle.hydrate();
      },
      };
    }
);

export const useAuthStore = createAuthStore();
