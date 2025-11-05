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
    baseURL : "https://rs3xqjb7-3331.asse.devtunnels.ms",
    headers : {
        "Content-Type" : "application/json",
    },
});

// Request Interceptor - เพิ่ม token ใน header
apiClient.interceptors.request.use(
    (config) => {
        // เช็คว่าอยู่ใน browser environment
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
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
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;