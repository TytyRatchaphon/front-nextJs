import { create } from 'zustand'
import { parseJwtToken, decodeAndMapUserFromToken } from '@/utils/jwtParser';
import {
  clearAuthTokenCookies,
  clearLegacyLocalAuthStorage,
  getAuthSession,
  getAuthTokenCookie,
  setAuthTokenCookie,
} from '@/services/authPersistence';

const LOGOUT_FLAG = 'auth_logout_pending';

const setLogoutFlag = () => {
  try { sessionStorage.setItem(LOGOUT_FLAG, '1'); } catch {}
};

const clearLogoutFlag = () => {
  try { sessionStorage.removeItem(LOGOUT_FLAG); } catch {}
};

const hasLogoutFlag = () => {
  try { return sessionStorage.getItem(LOGOUT_FLAG) === '1'; } catch { return false; }
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
  logout: () => Promise<void>;
  setMounted: () => Promise<void>;
  updateToken: (newToken: string) => Promise<void>;
  updateUserBalance: (updates: Partial<UserData>) => void;
}

export const useAuthStore = create<AuthState>()(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      hasMounted: false,

      // Actions
      login: (userData: UserData, token: string) => {
        clearLegacyLocalAuthStorage();
        set({ user: userData, token: token, isLoggedIn: true });

        // Immediately refine data from token to ensure user_id is correct
        get().updateToken(token);
      },

      logout: async () => {
        setLogoutFlag();
        clearLegacyLocalAuthStorage();
        await clearAuthTokenCookies();
        set({ user: null, token: null, isLoggedIn: false });
        window.location.href = '/';
      },

      updateUserBalance: (updates: Partial<UserData>) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates };
        set({ user: updatedUser });
      },

      updateToken: async (newToken: string) => {
        const cleaned = parseJwtToken(newToken);
        if (!cleaned) return;

        clearLegacyLocalAuthStorage();
        set({ token: cleaned, isLoggedIn: true });
        const cookieWrite = setAuthTokenCookie(cleaned);

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

        await cookieWrite;
      },

      setMounted: async () => {
        clearLegacyLocalAuthStorage();

        // If logout was just performed, skip auto-recovery from cookies/session.
        if (hasLogoutFlag()) {
          clearLogoutFlag();
          set({ hasMounted: true });
          return;
        }

        const state = get();

        if (state.user || state.token || state.isLoggedIn) {
          set({ hasMounted: true });
          return;
        }

        // 1) Try client-readable cookie first (fast, synchronous read)
        const cookieToken = getAuthTokenCookie();
        if (cookieToken) {
          try {
            await get().updateToken(cookieToken);
          } catch (error) {
            console.error('[authStore] setMounted: cookie token update failed', error);
          } finally {
            set({ hasMounted: true });
          }
          return;
        }

        // 2) Fall back to httpOnly session cookie via API
        try {
          const session = await getAuthSession();
          if (session?.authenticated && session.token) {
            const latestState = get();
            if (!latestState.user && !latestState.token && !latestState.isLoggedIn) {
              await get().updateToken(session.token);
            }
          }
        } catch (error) {
          console.error('[authStore] setMounted: session check failed', error);
        } finally {
          set({ hasMounted: true });
        }
      }
    })
)
