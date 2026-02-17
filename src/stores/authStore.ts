import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { useFormStore } from '@/stores/formStore';
import Cookies from 'js-cookie'

// ✅ อัปเดต Interface ให้ครบถ้วนตามที่ใช้จริงใน Sprofile และ Token
export interface UserData {
  user_id?: number;
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
  exp?: number;

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

export interface AuthState {
  user: UserData | null;
  token: string | null;
  isLoggedIn: boolean;
  hasMounted: boolean;

  // Actions
  login: (userData: UserData, token: string) => void;
  logout: () => void;
  setMounted: () => void;
  updateToken: (newToken: string) => void;
  updateUserBalance: (updates: Partial<UserData>) => void;
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
        set({ user: userData, token: token, isLoggedIn: true });
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Immediately refine data from token to ensure user_id is correct
        get().updateToken(token);
      },

      logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        Cookies.remove('token');
        Cookies.remove('tk');
        set({ user: null, token: null, isLoggedIn: false });
        window.location.reload();
      },

      updateUserBalance: (updates: Partial<UserData>) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates };
        set({ user: updatedUser });
        try { localStorage.setItem('userData', JSON.stringify(updatedUser)) } catch (e) { }
      },

      updateToken: (newToken: string) => {
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
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          }).join(''))

          const decodedToken = JSON.parse(jsonPayload)

          const currentUser = get().user
          
          // If no current user, initialize a fresh one
          const baseUser = currentUser || {
             fullname: '',
             email: '',
             role: 'user', 
          } as UserData;

            // Helper to safely parse numbers
            const getNumber = (key: string, fallback: number) => {
              const v = decodedToken[key]
              if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v)
              return fallback
            }

            const flower = getNumber('flower', Number(baseUser.flower ?? 0))
            const heart = getNumber('heart', Number(baseUser.heart ?? 0))
            const stamp = getNumber('stamp', Number(baseUser.stamp ?? 0))
            const coupon = getNumber('coupon', Number(baseUser.coupon ?? 0))

            // Check multiple keys for coin
            const coinRaw = decodedToken.coin ?? decodedToken.coins ?? decodedToken.goldCoins ?? decodedToken.gold_coin;
            const coin = (coinRaw !== undefined && coinRaw !== null && !Number.isNaN(Number(coinRaw)))
              ? Number(coinRaw)
              : Number(baseUser.coin ?? 0);

            // Check multiple keys for freecoin
            const freecoinRaw = decodedToken.freecoin ?? decodedToken.free_coin;
            const freecoin = (freecoinRaw !== undefined && freecoinRaw !== null && !Number.isNaN(Number(freecoinRaw)))
              ? Number(freecoinRaw)
              : Number(baseUser.freecoin ?? 0);
            const exp = getNumber('exp_point', Number(baseUser.exp ?? 0)) // Token key is exp_point based on JSON
            
            // Prioritize userId from token as confirmed by debugging
            const userIdRaw = decodedToken.userId ?? decodedToken.user_id ?? decodedToken.id ?? decodedToken.sub;
            const user_id = (userIdRaw !== undefined && userIdRaw !== null && !Number.isNaN(Number(userIdRaw)))
              ? Number(userIdRaw)
              : Number(baseUser.user_id ?? 0);

            // ✅ เพิ่มการอัปเดต Field ใหม่ๆ จาก Token
            const updatedUser: UserData = {
              ...baseUser,
              user_id: decodedToken.user_id ?? decodedToken.userId ?? decodedToken.id ?? decodedToken.sub ?? baseUser.user_id,

              writer_name: decodedToken.writer_name !== undefined ? decodedToken.writer_name : baseUser.writer_name,
              fullname: decodedToken.fullname !== undefined ? decodedToken.fullname : baseUser.fullname,
              email: decodedToken.email !== undefined ? decodedToken.email : baseUser.email,

              // Map fields (ยอมรับ null)
              phone: decodedToken.phone !== undefined ? decodedToken.phone : baseUser.phone,
              address_main: decodedToken.address_main !== undefined ? decodedToken.address_main : baseUser.address_main,
              des: decodedToken.des !== undefined ? decodedToken.des : baseUser.des,
              facebook: decodedToken.facebook !== undefined ? decodedToken.facebook : baseUser.facebook,
              twitter: decodedToken.twitter !== undefined ? decodedToken.twitter : baseUser.twitter,
              gender: decodedToken.gender !== undefined ? decodedToken.gender : baseUser.gender,
              birthday: decodedToken.birthday !== undefined ? decodedToken.birthday : baseUser.birthday,
              cat1: decodedToken.cat1 !== undefined ? decodedToken.cat1 : baseUser.cat1,
              cat2: decodedToken.cat2 !== undefined ? decodedToken.cat2 : baseUser.cat2,

              // Images & Frames (ยอมรับ null)
              banner: decodedToken.banner !== undefined ? decodedToken.banner : baseUser.banner,
              img: decodedToken.img !== undefined ? decodedToken.img : baseUser.img,

              // *** จุดสำคัญที่แก้ ***
              frame_id: decodedToken.frame_id !== undefined ? decodedToken.frame_id : baseUser.frame_id,
              aka_id: decodedToken.aka_id !== undefined ? decodedToken.aka_id : baseUser.aka_id,
              frame: decodedToken.frame !== undefined ? decodedToken.frame : baseUser.frame,
              aka: decodedToken.aka !== undefined ? decodedToken.aka : baseUser.aka,

              flower, heart, stamp, coupon, coin, freecoin, exp,
            }

            set({ user: updatedUser })
            try { localStorage.setItem('userData', JSON.stringify(updatedUser)) } catch (e) { }
        } catch (error) {
        }
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
      }
    }),
    {
      name: 'auth-storage',
      skipHydration: false,
      onRehydrateStorage: () => (state) => {
      }
    }
  )
)