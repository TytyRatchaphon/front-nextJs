import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import '@/stores/formStore';
import Cookies from 'js-cookie'
import { parseJwtToken, decodeAndMapUserFromToken } from '@/utils/jwtParser';

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
        set({ user: userData, token: token, isLoggedIn: true });
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Immediately refine data from token to ensure user_id is correct
        get().updateToken(token);
      },

      logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        Cookies.remove('token');
        Cookies.remove('tk');
        set({ user: null, token: null, isLoggedIn: false });
        window.location.reload();
      },

      updateUserBalance: (updates: Partial<UserData>) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates };
        set({ user: updatedUser });
        try { localStorage.setItem('userData', JSON.stringify(updatedUser)) } catch { }
      },

      updateToken: (newToken: string) => {
        const cleaned = parseJwtToken(newToken);
        if (!cleaned) return;

        set({ token: cleaned, isLoggedIn: true });
        try { localStorage.setItem('authToken', cleaned); } catch { }

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
             try { localStorage.setItem('userData', JSON.stringify(updatedUser)); } catch { }
          }
        } catch (error) {
          console.error("Token update logic failed", error);
        }
      },

      setMounted: () => {
        const state = get();
        if (!state.user && !state.token && !state.isLoggedIn) {
          const backupToken = localStorage.getItem('authToken');
          const backupUserData = localStorage.getItem('userData');
          if (backupToken && backupUserData) {
            try {
              const userData = JSON.parse(backupUserData);
              set({ user: userData, token: backupToken, isLoggedIn: true });
            } catch { }
          }
        }
        set({ hasMounted: true });
      }
    }),
    {
      name: 'auth-storage',
      skipHydration: false,
      onRehydrateStorage: () => () => {
      }
    }
  )
)