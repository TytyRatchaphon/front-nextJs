import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserProfileForm {
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
  img?: string | null;           // รูปโปรไฟล์
  frame_id?: number | null;      // ID กรอบ
  aka_id?: number | null;        // ID อักษรแสดงชื่อ
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

export const initialUserProfile: UserProfileForm = {
  fullname: "",
  birthday: "2000-01-01",
  gender: "ชาย",
  cat1: "",
  cat2: "",
  phone: "",
  des: "",
  address_main: "",
  facebook: "",
  twitter: "",
  frame_id: null,
  aka_id: null,
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
