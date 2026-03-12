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

const pickPersistedProfileForm = (form: UserProfileForm): Partial<UserProfileForm> => ({
  gender: form.gender,
  cat1: form.cat1,
  cat2: form.cat2,
  des: form.des,
  facebook: form.facebook,
  twitter: form.twitter,
  frame_id: form.frame_id,
  aka_id: form.aka_id,
});

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
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as { userProfileForm?: UserProfileForm } | undefined;
        return {
          userProfileForm: state?.userProfileForm ? { ...initialUserProfile, ...pickPersistedProfileForm(state.userProfileForm) } : initialUserProfile,
        };
      },
      partialize: (state) => ({ 
        userProfileForm: pickPersistedProfileForm(state.userProfileForm) 
      })
    }
  )
)
