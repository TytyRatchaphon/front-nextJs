import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserData {
  fullname: string;
  email: string;
  role: string;
  writer_name?: string | null; // เพิ่ม writer_name
  profileImage?: string; // รูปโปรไฟล์ผู้ใช้
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
  updateToken: (newToken: string) => void; // เพิ่มฟังก์ชัน update token
  
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
      
      updateToken: (newToken: string) => {
        console.log('🔄 Updating token...');
        console.log('Old token:', get().token);
        console.log('New token:', newToken);

        // Update token in state and mark as logged in
        set({ token: newToken, isLoggedIn: true });

        // Update token in localStorage
        localStorage.setItem('authToken', newToken);
        
        // Decode and update user data from new token
        try {
          const base64Url = newToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const decodedToken = JSON.parse(jsonPayload);
          console.log('Decoded new token:', decodedToken);
          
          // Update user data with writer_name from new token
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              writer_name: decodedToken.writer_name,
              fullname: decodedToken.fullname || currentUser.fullname,
              email: decodedToken.email || currentUser.email,
            };
            set({ user: updatedUser });
            localStorage.setItem('userData', JSON.stringify(updatedUser));
            console.log('✅ User data updated:', updatedUser);
          }
        } catch (error) {
          console.error('❌ Error decoding token:', error);
        }
        
        console.log('✅ Token updated successfully');
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
