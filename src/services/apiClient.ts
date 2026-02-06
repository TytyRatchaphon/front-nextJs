import axios from "axios";
import { useUIStore } from "@/stores/uiStore";
import { getDeviceId } from "@/utils/deviceUtils";

// API Response Interface
export interface ApiResponse<T = any> {
    code: number;
    status: string;
    message: string;
    data: T;
}

//สร้าง  BaseUrl ไว้ส่วนกลางจะได้ไม่ต้องเขียนใหม่
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});


// Request Interceptor - เพิ่ม token ใน header
apiClient.interceptors.request.use( 
    async (config) => {
        // Log method/url and request body (headers may be augmented below)
        const fullUrl = `${config.baseURL || ''}${config.url}`;


        // เช็คว่าอยู่ใน browser environment
        if (typeof window !== 'undefined') {
            // Add device ID header
            try {
                const deviceId = await getDeviceId();
                if (deviceId) {
                    config.headers['x-device-id'] = deviceId;
                }
            } catch (error) {
                console.error('Error getting device ID:', error);
            }

            const raw = localStorage.getItem('authToken');
            if (raw) {
                // Sanitize stored token: remove any accidental 'Bearer ' prefix and trim whitespace
                const tokenValue = raw.replace(/^Bearer\s+/i, '').trim();
                if (tokenValue) {
                    config.headers.Authorization = `${tokenValue}`;
                } else {
                }
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor - จัดการ error แบบรวม
apiClient.interceptors.response.use(
    (response) => {
        // อนุญาตให้ response ทุกแบบผ่าน ไม่ว่าจะเป็น success, successwarning, หรือ warning
        return response;
    },
    (error) => {
        // Handle Duplicate Login (400 + specific message)

        if (error.response?.status === 400 && error.response?.data?.message === "มีการเข้าสู่ระบบจากอุปกรณ์อื่น") {

            if (typeof window !== 'undefined') {
                useUIStore.getState().openDuplicateLoginModal();
            }
            // Return a dummy resolved promise to prevent error propagation (and other toasts)
            return { data: null, status: 200, headers: {}, config: error.config };
        }

        // Debug Error Response
        // Debug Error Response
        /* console.log('API Error Interceptor:', {
            status: error.response?.status,
            code: error.response?.data?.code,
            message: error.response?.data?.message,
            url: error.config?.url
        }); */

        // Handle Blocked User (401001 or specific message)
        const isBlocked = error.response?.data?.code === 401001 || 
                          error.response?.data?.message === "บัญชีของคุณถูกระงับการใช้งาน" ||
                          (error.response?.status === 401 && error.response?.data?.code === "401001"); // In case it's a string

        if (isBlocked) {
            if (typeof window !== 'undefined') {
                 useUIStore.getState().openBlockedUserModal();
            }
             // Return a dummy resolved promise to prevent error propagation
            return { data: null, status: 200, headers: {}, config: error.config };
        }

        // For 401, do NOT forcibly clear auth or redirect from the client here.
        // Backend may respond invalid token; let caller decide how to handle (show message, logout, etc.).
        if (error.response?.status === 401) {

        }

        return Promise.reject(error);
    }
);

export default apiClient;