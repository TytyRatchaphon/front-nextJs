import axios from "axios";

// API Response Interface
export interface ApiResponse<T = any> {
  code: number;
  status: string;
  message: string;
  data: T;
}

//สร้าง  BaseUrl ไว้ส่วนกลางจะได้ไม่ต้องเขียนใหม่
const apiClient = axios.create({
    baseURL : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.214:3331',
    headers : {
        "Content-Type" : "application/json",
    },
});

// Request Interceptor - เพิ่ม token ใน header
apiClient.interceptors.request.use(
    (config) => {
    // Log method/url and request body (headers may be augmented below)
    console.log('🔵 REQUEST:', config.method?.toUpperCase(), config.url);
    console.log(' Request Data:', config.data);
        
        // เช็คว่าอยู่ใน browser environment
        if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('authToken');
            if (raw) {
                // Sanitize stored token: remove any accidental 'Bearer ' prefix and trim whitespace
                const tokenValue = raw.replace(/^Bearer\s+/i, '').trim();
                if (tokenValue) {
                    config.headers.Authorization = `${tokenValue}`;
                    console.log('🔑 Added token from localStorage (sanitized)');
                    console.log('🔐 Authorization header set:', config.headers.Authorization);
                } else {
                    console.warn('⚠️ authToken in localStorage is empty after sanitization');
                }
            }
        }
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Response Interceptor - จัดการ error แบบรวม
// apiClient.interceptors.response.use(
//     (response) => {
//         console.log('🟢 RESPONSE:', response.status, response.config.url);
//         console.log('📥 Response Data:', response.data);
        
//         // อนุญาตให้ response ทุกแบบผ่าน ไม่ว่าจะเป็น success, successwarning, หรือ warning
//         return response;
//     },
//     (error) => {
//         console.error('🔴 RESPONSE ERROR:', error.response?.status, error.config?.url);
//         console.error('📛 Error Data:', error.response?.data);

//         // For 401, do NOT forcibly clear auth or redirect from the client here.
//         // Backend may respond invalid token; let caller decide how to handle (show message, logout, etc.).
//         if (error.response?.status === 401) {
//             console.warn('🔒 Unauthorized (401) received from server. Not auto-logging out.');
//         }

//         return Promise.reject(error);
//     }
// );

export default apiClient;