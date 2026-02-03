import { create } from 'zustand'

interface UIState {
  // Modal states
  isLoginModalOpen: boolean;
  isRegisterModalOpen: boolean;
  isDailyPopupOpen: boolean;
  isDuplicateLoginModalOpen: boolean;

  // Animation states
  loginAnimationClass: string;
  registerAnimationClass: string;

  // View modes
  loginViewMode: 'login' | 'register' | 'forgot-password';

  // Actions
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  setLoginViewMode: (mode: 'login' | 'register' | 'forgot-password') => void;
  setLoginAnimation: (animation: string) => void;
  setRegisterAnimation: (animation: string) => void;

  // Daily popup actions
  openDailyPopup: () => void;
  closeDailyPopup: () => void;
  isDailyPopupProcessComplete: boolean;
  setDailyPopupProcessComplete: (isComplete: boolean) => void;

  // Duplicate login actions
  openDuplicateLoginModal: () => void;
  closeDuplicateLoginModal: () => void;

  // Blocked User actions
  isBlockedUserModalOpen: boolean;
  openBlockedUserModal: () => void;
  closeBlockedUserModal: () => void;

  // Checkin modal actions
  isCheckinModalOpen: boolean;
  openCheckinModal: () => void;
  closeCheckinModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial states
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isDailyPopupOpen: false,
  isDuplicateLoginModalOpen: false,
  loginAnimationClass: 'fade-in',
  registerAnimationClass: 'fade-in',
  loginViewMode: 'login',

  // Modal actions
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),

  openRegisterModal: () => set({ isRegisterModalOpen: true }),
  closeRegisterModal: () => set({ isRegisterModalOpen: false }),

  // View mode actions
  setLoginViewMode: (mode: 'login' | 'register' | 'forgot-password') =>
    set({ loginViewMode: mode }),

  // Animation actions
  setLoginAnimation: (animation: string) =>
    set({ loginAnimationClass: animation }),

  setRegisterAnimation: (animation: string) =>
    set({ registerAnimationClass: animation }),

  // Daily popup actions
  openDailyPopup: () => set({ isDailyPopupOpen: true }),
  closeDailyPopup: () => set({ isDailyPopupOpen: false, isDailyPopupProcessComplete: true }),
  
  isDailyPopupProcessComplete: false,
  setDailyPopupProcessComplete: (isComplete: boolean) => set({ isDailyPopupProcessComplete: isComplete }),

  openDuplicateLoginModal: () => set({ isDuplicateLoginModalOpen: true }),
  closeDuplicateLoginModal: () => set({ isDuplicateLoginModalOpen: false }),

  // Blocked User actions
  isBlockedUserModalOpen: false,
  openBlockedUserModal: () => set({ isBlockedUserModalOpen: true }),
  closeBlockedUserModal: () => set({ isBlockedUserModalOpen: false }),

  // Checkin modal actions
  isCheckinModalOpen: false,
  openCheckinModal: () => set({ isCheckinModalOpen: true }),
  closeCheckinModal: () => set({ isCheckinModalOpen: false }),
}))
