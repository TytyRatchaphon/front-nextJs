import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserData {
  fullname: string;
  email: string;
  role: string;
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
