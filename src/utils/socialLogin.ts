// src/utils/socialLogin.ts
// Helper functions สำหรับ Social Login

/**
 * ฟังก์ชันถอดรหัส JWT token จาก Google
 */
export const parseJwt = (token: string) => {
  try {
    console.log('🔓 Decoding JWT token...');
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    console.log('✅ JWT decoded successfully');
    console.log('👤 User Data:', {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      sub: decoded.sub
    });
    return decoded;
  } catch (error) {
    console.error('❌ Error parsing JWT:', error);
    return null;
  }
};

/**
 * โหลด Google Sign-In Script
 */
export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // ตรวจสอบว่ามี script อยู่แล้วหรือไม่
    if (document.getElementById('google-signin-script')) {
      console.log('✅ Google Sign-In script already loaded');
      resolve();
      return;
    }

    console.log('⏳ Loading Google Sign-In script...');
    const script = document.createElement('script');
    script.id = 'google-signin-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Google Sign-In script loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('❌ Failed to load Google Sign-In script');
      reject(new Error('Failed to load Google Sign-In script'));
    };
    document.head.appendChild(script);
  });
};

/**
 * โหลด LINE LIFF Script
 */
export const loadLIFFScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // ตรวจสอบว่ามี script อยู่แล้วหรือไม่
    if (document.getElementById('liff-script')) {
      console.log('✅ LINE LIFF script already loaded');
      resolve();
      return;
    }

    console.log('⏳ Loading LINE LIFF script...');
    const script = document.createElement('script');
    script.id = 'liff-script';
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ LINE LIFF script loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('❌ Failed to load LINE LIFF script');
      reject(new Error('Failed to load LINE LIFF script'));
    };
    document.head.appendChild(script);
  });
};

/**
 * Initialize LINE LIFF
 */
export const initializeLIFF = async (liffId: string): Promise<boolean> => {
  try {
    console.log('⏳ Initializing LINE LIFF...');
    console.log('🔑 LIFF ID:', liffId);
    
    if (typeof window !== 'undefined' && window.liff) {
      await window.liff.init({ liffId });
      console.log('✅ LIFF initialized successfully');
      console.log('📱 LIFF Login Status:', window.liff.isLoggedIn() ? 'Logged In' : 'Not Logged In');
      return true;
    }
    
    console.warn('⚠️ LIFF object not found in window');
    return false;
  } catch (error) {
    console.error('❌ LIFF initialization failed:', error);
    return false;
  }
};

/**
 * Initialize Google Sign-In
 */
export const initializeGoogleSignIn = (clientId: string, callback: (response: any) => void) => {
  console.log('⏳ Initializing Google Sign-In...');
  console.log('🔑 Client ID:', clientId);
  
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: callback,
    });
    console.log('✅ Google Sign-In initialized successfully');
  } else {
    console.warn('⚠️ Google object not found in window');
  }
};
