import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserProfileForm {
  fullname: string;
  birthday: string;
  gender: string;
  cat1: string;
  cat2: string;
  phone: string;
  des: string;
  address_main: string;
  facebook: string;
  twitter: string;
}

interface FormState {
  // User profile form
  userProfileForm: UserProfileForm;
  
  // Form errors
  formErrors: Record<string, string>;
  
  // Actions
  updateUserProfile: (field: keyof UserProfileForm, value: string) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  clearFormErrors: () => void;
  resetUserProfile: () => void;
}

const initialUserProfile: UserProfileForm = {
  fullname: "YoungTYEIEEI",
  birthday: "2000-01-01",
  gender: "ชาย",
  cat1: "โรแมนติก",
  cat2: "โรแมนติก",
  phone: "",
  des: "",
  address_main: "",
  facebook: "",
  twitter: "",
};

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      // Initial states
      userProfileForm: initialUserProfile,
      formErrors: {},
      
      // Actions
      updateUserProfile: (field: keyof UserProfileForm, value: string) => 
        set((state) => ({
          userProfileForm: {
            ...state.userProfileForm,
            [field]: value
          }
        })),
      
      setFormErrors: (errors: Record<string, string>) => 
        set({ formErrors: errors }),
      
      clearFormErrors: () => set({ formErrors: {} }),
      
      resetUserProfile: () => set({
        userProfileForm: initialUserProfile,
        formErrors: {}
      }),
    }),
    { 
      name: 'form-storage',
      partialize: (state) => ({ 
        userProfileForm: state.userProfileForm 
      })
    }
  )
)
