

// /**
//  * ฟังก์ชันถอดรหัส JWT token จาก Google
//  */
// export const parseJwt = (token: string) => {
//   try {
//     const base64Url = token.split('.')[1];
//     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     const jsonPayload = decodeURIComponent(
//       atob(base64)
//         .split('')
//         .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
//         .join('')
//     );
//     const decoded = JSON.parse(jsonPayload);
//     return decoded;
//   } catch (error) {
//     return null;
//   }
// };

// /**
//  * โหลด Google Sign-In Script
//  */
// export const loadGoogleScript = (): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     // ตรวจสอบว่ามี script อยู่แล้วหรือไม่
//     if (document.getElementById('google-signin-script')) {
//       resolve();
//       return;
//     }

//     const script = document.createElement('script');
//     script.id = 'google-signin-script';
//     script.src = 'https://accounts.google.com/gsi/client';
//     script.async = true;
//     script.defer = true;
//     script.onload = () => {
//       resolve();
//     };
//     script.onerror = () => {
//       reject(new Error('Failed to load Google Sign-In script'));
//     };
//     document.head.appendChild(script);
//   });
// };

// /**
//  * โหลด LINE LIFF Script
//  */
// export const loadLIFFScript = (): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     // ตรวจสอบว่ามี script อยู่แล้วหรือไม่
//     if (document.getElementById('liff-script')) {
//       resolve();
//       return;
//     }

//     const script = document.createElement('script');
//     script.id = 'liff-script';
//     script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
//     script.async = true;
//     script.onload = () => {
//       resolve();
//     };
//     script.onerror = () => {
//       reject(new Error('Failed to load LINE LIFF script'));
//     };
//     document.head.appendChild(script);
//   });
// };

// /**
//  * Initialize LINE LIFF
//  */
// export const initializeLIFF = async (liffId: string): Promise<boolean> => {
//   try {
    
//     if (typeof window !== 'undefined' && window.liff) {
//       await window.liff.init({ liffId });
//       return true;
//     }
    
//     return false;
//   } catch (error) {
//     return false;
//   }
// };

// /**
//  * Initialize Google Sign-In
//  */
// export const initializeGoogleSignIn = (clientId: string, callback: (response: any) => void) => {
  
//   if (typeof window !== 'undefined' && window.google) {
//     window.google.accounts.id.initialize({
//       client_id: clientId,
//       callback: callback,
//     });
//   } else {
//   }
// };
