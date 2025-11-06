import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserData {
  user_id: number;
  userID: string;
  fullname: string;
  writer_name: string | null;
  phone: string | null;
  address_main: string | null;
  email: string;
  banner: string;
  img: string;
  des: string | null;
  facebook: string | null;
  twitter: string | null;
  coin: string;
  freecoin: string;
  heart: number;
  flower: number;
  coupon: number;
  exp_point: number;
  stamp: number;
  wheel: number;
  fast_ticket: number;
  coinIncome: string;
  gender: string;
  birthday: string | null;
  percent: number;
  percent_donate: number;
  publish: string;
  registerDate: string;
  cat1: number;
  cat2: number;
  mail_sub: string;
  frame_id: number | null;
  aka_id: number | null;
  frame: string | null;
  aka: string | null;
  iat?: number;
  role?: string; // เพิ่มเพื่อ backward compatibility
}

interface AuthState {
  user: UserData | null;
  isLoggedIn: boolean;
  hasMounted: boolean;
  
  // Actions
  login: (userData: UserData, token: string) => void;
  logout: () => void;
  setMounted: () => void;
  
  // Computed
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      hasMounted: false,
      
      // Actions
      login: (userData: UserData, token: string) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        set({ user: userData, isLoggedIn: true });
      },
      
      logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        set({ user: null, isLoggedIn: false });
        window.location.reload();
      },
      
      setMounted: () => set({ hasMounted: true }),
      
      // Computed
      get isAuthenticated() {
        return get().isLoggedIn && get().user !== null;
      }
    }),
    { 
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isLoggedIn: state.isLoggedIn 
      })
    }
  )
)
