import axios from "axios";
import { useUIStore } from "@/stores/uiStore";
import { getDeviceId } from "@/utils/deviceUtils";
import Cookies from "js-cookie";
import { useAuthStore } from "@/stores/authStore";
import { parseJwtToken } from "@/utils/jwtParser";

let cachedDeviceId: string | null = null;
let deviceIdRequest: Promise<string | null> | null = null;

const resolveDeviceId = async (): Promise<string | null> => {
    if (cachedDeviceId) return cachedDeviceId;
    if (deviceIdRequest) return deviceIdRequest;

    deviceIdRequest = getDeviceId()
        .then((deviceId) => {
            cachedDeviceId = deviceId || null;
            return cachedDeviceId;
        })
        .catch(() => null)
        .finally(() => {
            deviceIdRequest = null;
        });

    return deviceIdRequest;
};


//สร้าง  BaseUrl ไว้ส่วนกลางจะได้ไม่ต้องเขียนใหม่
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});


// Request Interceptor - เพิ่ม token ใน header
apiClient.interceptors.request.use( 
    async (config) => {
        // Log method/url and request body (headers may be augmented below)
        if (typeof window === 'undefined') {
            (config as any).metadata = { startTime: new Date() };
        }

        // เช็คว่าอยู่ใน browser environment
        if (typeof window !== 'undefined') {
            // Add device ID header
            const deviceId = await resolveDeviceId();
            if (deviceId) {
                config.headers['x-device-id'] = deviceId;
            }

            const stateToken = useAuthStore.getState().token;
            const tokenValue = parseJwtToken(stateToken || Cookies.get('token'));
            if (tokenValue) {
                config.headers.Authorization = `${tokenValue}`;
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
        if (typeof window === 'undefined') {
            const config = response.config as any;
            if (config.metadata?.startTime) {
                const duration = new Date().getTime() - config.metadata.startTime.getTime();
                console.log(`[SSR Fetch API] ${config.method?.toUpperCase()} ${config.url} - ${duration}ms`);
            }
        }
        // อนุญาตให้ response ทุกแบบผ่าน ไม่ว่าจะเป็น success, successwarning, หรือ warning
        return response;
    },
    (error) => {
        if (typeof window === 'undefined') {
            const config = error.config as any;
            if (config?.metadata?.startTime) {
                const duration = new Date().getTime() - config.metadata.startTime.getTime();
                console.error(`[SSR Fetch API ERROR] ${config?.method?.toUpperCase()} ${config?.url} - ${duration}ms - ${error.message}`);
            }
        }
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
