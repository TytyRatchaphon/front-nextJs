import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserData {
  fullname: string;
  email: string;
  role: string;
}

interface AuthState {
  user: UserData | null;
  token: string | null;
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
      token: null,
      isLoggedIn: false,
      hasMounted: false,
      
      // Actions
      login: (userData: UserData, token: string) => {
        console.log('🔐 authStore.login() called with:', { userData, token });
        
        // Update state
        set({ user: userData, token: token, isLoggedIn: true });
        
        // Also save to localStorage directly as backup
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        console.log('✅ Login successful:', { userData, token });
        
        // Verify state was updated
        const newState = get();
        console.log('🔍 State after login:', { 
          user: newState.user, 
          token: newState.token, 
          isLoggedIn: newState.isLoggedIn 
        });
      },
      
      logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        set({ user: null, token: null, isLoggedIn: false });
        window.location.reload();
      },
      
      setMounted: () => {
        const state = get();
        console.log('🔍 Setting mounted, current state before:', { 
          user: state.user, 
          token: state.token, 
          isLoggedIn: state.isLoggedIn 
        });
        
        // Check if we need to restore from backup localStorage
        if (!state.user && !state.token && !state.isLoggedIn) {
          const backupToken = localStorage.getItem('authToken');
          const backupUserData = localStorage.getItem('userData');
          
          if (backupToken && backupUserData) {
            try {
              const userData = JSON.parse(backupUserData);
              console.log('🔄 Restoring from backup localStorage:', { userData, token: backupToken });
              set({ user: userData, token: backupToken, isLoggedIn: true });
            } catch (e) {
              console.error('❌ Failed to restore from backup:', e);
            }
          }
        }
        
        set({ hasMounted: true });
        
        // Re-check state after setting mounted
        const newState = get();
        console.log('🔍 State after mounted:', { 
          user: newState.user, 
          token: newState.token, 
          isLoggedIn: newState.isLoggedIn,
          hasMounted: newState.hasMounted
        });
      },
      
      // Computed
      get isAuthenticated() {
        return get().isLoggedIn && get().user !== null && get().token !== null;
      }
    }),
    { 
      name: 'auth-storage',
      // Remove partialize and custom storage to use defaults
      skipHydration: false,
      // Add onRehydrateStorage to handle hydration
      onRehydrateStorage: () => (state) => {
        console.log('🔄 Hydration complete:', state);
        if (state) {
          // Verify the stored data is valid
          if (state.user && state.token && state.isLoggedIn) {
            console.log('✅ Valid session found');
          } else {
            console.log('⚠️ Invalid session data');
          }
        }
      }
    }
  )
)
