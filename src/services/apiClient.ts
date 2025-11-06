import axios from "axios";

//สร้าง  BaseUrl ไว้ส่วนกลางจะได้ไม่ต้องเขียนใหม่
const apiClient = axios.create({
    baseURL : process.env.NEXT_PUBLIC_API_URL || "http://192.168.220.214:3331",
    headers : {
        "Content-Type" : "application/json",
    },
    timeout: 10000, // timeout 10 วินาที
});

// เพิ่ม interceptor เพื่อ log request และเพิ่ม token
apiClient.interceptors.request.use(
    (config) => {
        console.log('🌐 API Request:', config.method?.toUpperCase(), config.url, config.params);
        
        // เพิ่ม token ถ้ามี
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 Token added to request');
        }
        
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// เพิ่ม interceptor เพื่อ log response
apiClient.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.config.url, response.status);
        return response;
    },
    (error) => {
        console.error('❌ Response Error:', error.message);
        if (error.response) {
            console.error('❌ Status:', error.response.status);
            console.error('❌ Data:', error.response.data);
        }
        return Promise.reject(error);
    }
);

export default apiClient;