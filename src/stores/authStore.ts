import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

// ✅ อัปเดต Interface ให้ครบถ้วนตามที่ใช้จริงใน Sprofile และ Token
export interface UserData {
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

interface AuthState {
  user: UserData | null;
  token: string | null;
  isLoggedIn: boolean;
  hasMounted: boolean;
  
  // Actions
  login: (userData: UserData, token: string) => void;
  logout: () => void;
  setMounted: () => void;
  updateToken: (newToken: string) => void;
  
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
        set({ user: userData, token: token, isLoggedIn: true });
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('✅ Login successful');
      },
      
      logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        set({ user: null, token: null, isLoggedIn: false });
        window.location.reload();
      },
      
      updateToken: (newToken: string) => {
        console.log('🔄 Updating token...');
        const normalize = (t?: string | null) => {
          if (!t) return undefined
          let s = String(t).trim()
          if (s.toLowerCase().startsWith('bearer ')) s = s.split(' ')[1]
          if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1)
          return s || undefined
        }

        const cleaned = normalize(newToken)
        if (!cleaned) return

        set({ token: cleaned, isLoggedIn: true })

        try { localStorage.setItem('authToken', cleaned) } catch (e) { }
        try { axios.defaults.headers.common['Authorization'] = cleaned } catch (e) { }

        try {
          const base64Url = cleaned.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          }).join(''))

          const decodedToken = JSON.parse(jsonPayload)
          console.log('Decoded new token payload:', decodedToken)

          const currentUser = get().user
          if (currentUser) {
            // Helper to safely pick numbers
            const pickNumber = (paths: any[], fallback = 0) => {
              for (const p of paths) {
                try {
                  const parts = Array.isArray(p) ? p : [p]
                  let v: any = decodedToken
                  for (const key of parts) {
                    if (v == null) { v = undefined; break }
                    v = v[key]
                  }
                  if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v)
                } catch (e) { }
              }
              return fallback
            }

            const flower = pickNumber([ 'flower', ['user','flower'], ['data','flower'], 'flowers', ['user','flowers'] ], Number(currentUser.flower ?? 0))
            const heart = pickNumber([ 'heart', ['user','heart'], ['data','heart'], 'hearts', ['user','hearts'] ], Number(currentUser.heart ?? 0))
            const stamp = pickNumber([ 'stamp', ['user','stamp'], ['data','stamp'] ], Number(currentUser.stamp ?? 0))
            const coupon = pickNumber([ 'coupon', ['user','coupon'], ['data','coupon'], 'coupons', ['user','coupons'] ], Number(currentUser.coupon ?? 0))
            const coin = pickNumber([ 'coin', ['user','coin'], ['data','coin'], 'coins', ['user','coins'] ], Number(currentUser.coin ?? 0))
            const freecoin = pickNumber([ 'freecoin', ['user','freecoin'], ['data','freecoin'], 'free_coin', ['user','free_coin'] ], Number(currentUser.freecoin ?? 0))

            // ✅ เพิ่มการอัปเดต Field ใหม่ๆ จาก Token
            const updatedUser: UserData = {
              ...currentUser,
              
              writer_name: decodedToken.writer_name !== undefined ? decodedToken.writer_name : currentUser.writer_name,
              fullname: decodedToken.fullname !== undefined ? decodedToken.fullname : currentUser.fullname,
              email: decodedToken.email !== undefined ? decodedToken.email : currentUser.email,
              
              // Map fields (ยอมรับ null)
              phone: decodedToken.phone !== undefined ? decodedToken.phone : currentUser.phone,
              address_main: decodedToken.address_main !== undefined ? decodedToken.address_main : currentUser.address_main,
              des: decodedToken.des !== undefined ? decodedToken.des : currentUser.des,
              facebook: decodedToken.facebook !== undefined ? decodedToken.facebook : currentUser.facebook,
              twitter: decodedToken.twitter !== undefined ? decodedToken.twitter : currentUser.twitter,
              gender: decodedToken.gender !== undefined ? decodedToken.gender : currentUser.gender,
              birthday: decodedToken.birthday !== undefined ? decodedToken.birthday : currentUser.birthday,
              cat1: decodedToken.cat1 !== undefined ? decodedToken.cat1 : currentUser.cat1,
              cat2: decodedToken.cat2 !== undefined ? decodedToken.cat2 : currentUser.cat2,
              
              // Images & Frames (ยอมรับ null)
              banner: decodedToken.banner !== undefined ? decodedToken.banner : currentUser.banner,
              img: decodedToken.img !== undefined ? decodedToken.img : currentUser.img, 
              
              // *** จุดสำคัญที่แก้ ***
              frame_id: decodedToken.frame_id !== undefined ? decodedToken.frame_id : currentUser.frame_id,
              aka_id: decodedToken.aka_id !== undefined ? decodedToken.aka_id : currentUser.aka_id,
              frame: decodedToken.frame !== undefined ? decodedToken.frame : currentUser.frame,
              aka: decodedToken.aka !== undefined ? decodedToken.aka : currentUser.aka,

              flower, heart, stamp, coupon, coin, freecoin,
            }
            
            set({ user: updatedUser })
            try { localStorage.setItem('userData', JSON.stringify(updatedUser)) } catch (e) { }
            console.log('✅ User data updated from token:', updatedUser)
          }
        } catch (error) {
          console.error('❌ Error decoding token:', error)
        }
        console.log('✅ Token updated successfully')
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
            } catch (e) { }
          }
        }
        set({ hasMounted: true });
      },
      
      get isAuthenticated() {
        return get().isLoggedIn && get().user !== null && get().token !== null;
      }
    }),
    { 
      name: 'auth-storage',
      skipHydration: false,
      onRehydrateStorage: () => (state) => {
        console.log('🔄 Hydration complete');
      }
    }
  )
)