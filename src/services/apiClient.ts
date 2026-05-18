import axios from "axios";
import { getDeviceId } from "@/utils/deviceUtils";
import Cookies from "js-cookie";
import { useAuthStore } from "@/stores/authStore";
import { parseJwtToken } from "@/utils/jwtParser";
import { emitApiClientEvent } from "@/services/apiEvents";
import { getAuthSession } from "@/services/authPersistence";

let cachedDeviceId: string | null = null;
let deviceIdRequest: Promise<string | null> | null = null;
const DUPLICATE_LOGIN_MESSAGE = "มีการเข้าสู่ระบบจากอุปกรณ์อื่น";

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
        const skipAuth = config.headers['x-skip-auth'] === 'true';
        if (skipAuth) {
            delete config.headers['x-skip-auth'];
            delete config.headers.Authorization;
        }

        if (typeof window !== 'undefined') {
            // Add device ID header
            const deviceId = await resolveDeviceId();
            if (deviceId) {
                config.headers['x-device-id'] = deviceId;
            }

            if (!skipAuth) {
                const stateToken = useAuthStore.getState().token;
                let tokenValue: string | null | undefined = parseJwtToken(stateToken || Cookies.get('token'));
                if (!tokenValue) {
                    tokenValue = (await getAuthSession())?.token || undefined;
                }
                if (tokenValue) {
                    config.headers.Authorization = `${tokenValue}`;
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

        if (error.response?.status === 400 && error.response?.data?.message === DUPLICATE_LOGIN_MESSAGE) {

            if (typeof window !== 'undefined') {
                emitApiClientEvent('duplicate-login');
            }
        }

        // Handle Blocked User (401001 or specific message)
        const isBlocked = error.response?.data?.code === 401001 || 
                          error.response?.data?.message === "บัญชีของคุณถูกระงับการใช้งาน" ||
                          (error.response?.status === 401 && error.response?.data?.code === "401001"); // In case it's a string

        if (isBlocked) {
            if (typeof window !== 'undefined') {
                 emitApiClientEvent('blocked-user');
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
