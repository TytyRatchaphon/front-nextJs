import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    liff: any;
  }
}

const LIFF_ID = process.env.NEXT_PUBLIC_LINE_LIFF_ID || '2008384593-5BLnp8gx';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.194:3331';

export const useLineLogin = () => {
  const { login, updateToken, isLoggedIn } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBackendLogin = async () => {
    try {
      setLoading(true);
      const profile = await window.liff.getProfile();
      const decoded = window.liff.getDecodedIDToken();
      
      console.log('LINE Profile (Auto):', profile);

      const linePayload = {
        name: profile.displayName,
        email: decoded?.email || '',
        userId: profile.userId,
        picture: profile.pictureUrl,
      };

      const response = await axios.post(`${API_BASE_URL}/login/line`, linePayload);
      
      if (response.data && response.data.data) {
        const userData = response.data.data;
        let token = '';
        let userInfo = {
            fullname: profile.displayName,
            email: decoded?.email || '',
            role: 'user',
            userId: ''
        };

        if (typeof userData === 'string') {
            token = userData;
        } else {
            userInfo = {
                fullname: userData.fullname || userData.name || profile.displayName,
                email: userData.email || decoded?.email,
                role: userData.role || 'user',
                userId: userData.user_id || userData.userID
            };
            token = userData.token || userData.pws || response.headers?.authorization || response.headers?.['x-auth-token'];
        }

        if (token) {
            console.log('✅ Auto Login Success');
            login(userInfo, token);
            updateToken(token);
            localStorage.removeItem('is_line_login_processing');
        }
      }
    } catch (error) {
      console.error('Backend Login Error (Auto):', error);
      localStorage.removeItem('is_line_login_processing');
    } finally {
      setLoading(false);
    }
  };

  const initializeLIFF = async () => {
    try {
      // Check if already initialized (liff.id is set after init)
      if (!window.liff.id) {
          await window.liff.init({ liffId: LIFF_ID });
      }
      
      // Check if returning from a login redirect initiated by us
      const isLoginProcessing = localStorage.getItem('is_line_login_processing');
      console.log('LIFF Debug:', { 
        liffLoggedIn: window.liff.isLoggedIn(), 
        appLoggedIn: isLoggedIn, 
        isProcessing: isLoginProcessing 
      });
      
      if (window.liff.isLoggedIn() && !isLoggedIn && isLoginProcessing === 'true') {
          console.log('🔄 Returning from LINE Login redirect...');
          // Flag is cleared in handleBackendLogin
          await handleBackendLogin();
      }
    } catch (error) {
      console.error('LIFF Initialize Error:', error);
    }
  };

  const initLIFF = () => {
    return new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined') { resolve(); return; }
        
        if (window.liff) {
            initializeLIFF().then(resolve).catch(reject);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
        script.async = true;
        script.onload = () => {
            initializeLIFF().then(resolve).catch(reject);
        };
        script.onerror = (e) => {
            console.error('Failed to load LIFF script', e);
            reject(e);
        };
        document.head.appendChild(script);
    });
  };

  const loginWithLine = async () => {
      if (typeof window === 'undefined') return;
      
      try {
          await initLIFF();
          
          if (!window.liff.isLoggedIn()) {
              // Set flag before redirecting
              localStorage.setItem('is_line_login_processing', 'true');
              window.liff.login();
          } else {
              return await handleBackendLogin();
          }
      } catch (error) {
          console.error('Login with LINE failed:', error);
      }
  };

  return { initLIFF, loginWithLine, loading };
};
