import { create } from 'zustand'

interface UIState {
  // Modal states
  isLoginModalOpen: boolean;
  isRegisterModalOpen: boolean;
  isDailyPopupOpen: boolean;
  
  // Animation states
  loginAnimationClass: string;
  registerAnimationClass: string;
  
  // View modes
  loginViewMode: 'login' | 'register';
  
  // Actions
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  setLoginViewMode: (mode: 'login' | 'register') => void;
  setLoginAnimation: (animation: string) => void;
  setRegisterAnimation: (animation: string) => void;
  
  // Daily popup actions
  openDailyPopup: () => void;
  closeDailyPopup: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial states
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isDailyPopupOpen: false,
  loginAnimationClass: 'fade-in',
  registerAnimationClass: 'fade-in',
  loginViewMode: 'login',
  
  // Modal actions
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  
  openRegisterModal: () => set({ isRegisterModalOpen: true }),
  closeRegisterModal: () => set({ isRegisterModalOpen: false }),
  
  // View mode actions
  setLoginViewMode: (mode: 'login' | 'register') => 
    set({ loginViewMode: mode }),
  
  // Animation actions
  setLoginAnimation: (animation: string) => 
    set({ loginAnimationClass: animation }),
  
  setRegisterAnimation: (animation: string) => 
    set({ registerAnimationClass: animation }),
  
  // Daily popup actions
  openDailyPopup: () => set({ isDailyPopupOpen: true }),
  closeDailyPopup: () => set({ isDailyPopupOpen: false }),
}))
