import apiClient from "./apiClient";
import type { BookTrans, BookDetail, BookDetailResponse} from "@/types/api";

export const fetchBookTrans = async (): Promise<BookTrans[]> => {
  try {
    // เรียก endpoint ใหม่
    const response = await apiClient.get<{ data: BookTrans[] }>("/getAllBookHome");
    console.log('getAllBookHome API Response:', response.data);
    // ตรวจสอบว่า data มีอยู่และเป็น array
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('API response data is not an array:', response.data);
      return [];
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching books:', error);
    return [];
  }
}

export const fetchBookTransById = async (id: string): Promise<BookTrans> => {
  try {
    const response = await apiClient.get(`/book/${id}`);
    
    console.log('API Response for /book/:id:', response.data);
    
    // ตรวจสอบ response structure
    if (!response.data) {
      throw new Error('ไม่พบข้อมูลจาก API');
    }
    
    // ถ้า data เป็น array (ตามที่เห็นในรูปก่อนหน้า)
    if (Array.isArray(response.data.data)) {
      if (response.data.data.length === 0) {
        throw new Error('ไม่พบข้อมูลหนังสือ');
      }
      return response.data.data[0];
    }
    
    // ถ้า data เป็น object ที่มี book property
    if (response.data.data && response.data.data.book) {
      return response.data.data.book;
    }
    
    // ถ้า data เป็น object โดยตรง
    if (response.data.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
    
  } catch (error) {
    console.error('Error fetching book by ID:', error);
    throw error;
  }
};

// Register as writer - รื้อใหม่หมด
export interface WriterRegistrationData {
  writer_name: string;
  fullname: string;
  user_id?: string; // Optional - include user_id if backend requires it
  email?: string; // Optional - Backend ควรดึงจาก JWT Token
  phone?: string;
  address?: string;
  moo?: string;
  soi?: string;
  road?: string;
  district?: string;
  amphoe?: string;
  province?: string;
  zipcode?: string;
}

export const registerWriter = async (data: WriterRegistrationData, token: string) => {
  console.log('🚀 apiServices.registerWriter called');
  console.log('📋 Request Data:', JSON.stringify(data, null, 2));
  console.log('🔐 Token:', token.substring(0, 50) + '...');
  
  try {
    const response = await apiClient.post('/user/writer', data, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('📦 Response Data:', response.data);
    
    // Response จาก backend: { code: 200, status: "success", message: "...", data: { token } }
    return response.data;
  } catch (error: any) {
    console.error('❌ API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Update writer information (reuse same endpoint if backend supports PUT)
export const updateWriter = async (data: Partial<WriterRegistrationData>, token: string) => {
  console.log('🚀 apiServices.updateWriter called (POST /user/writer)');
  console.log('📋 Request Data:', JSON.stringify(data, null, 2));
  console.log('🔐 Token (prefix):', typeof token === 'string' ? token.substring(0, 50) + '...' : token);

  try {
    // Use POST since backend appears to expose POST /user/writer (register endpoint)
    const response = await apiClient.post('/user/writer', data, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ updateWriter Response Status:', response.status);
    console.log('📦 updateWriter Response Data:', response.data);
    return response.data;
  } catch (err: any) {
    console.error('❌ updateWriter API Error:', err.response?.status, err.response?.data || err.message);
    throw err;
  }
};

export const fetchBookEpisodes = async (bookId: string | number) => {
  try {
  const token = localStorage.getItem('authToken');
    
    // TODO: ชั่วคราว - รอระบบ login จาก frontend อีกคน
    // ใส่ token demo เพื่อทดสอบ (ลบออกเมื่อมีระบบ login แล้ว)
    if (!token) {
      console.warn('⚠️ No auth token found - using demo mode (episodes may show as locked)');
      // API จะคืนข้อมูล episodes แต่ isBuy จะเป็น false ทั้งหมด
    }
    
    console.log('🔑 Fetching episodes with bookId:', bookId, 'type:', typeof bookId);
    console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : '❌ NO TOKEN (demo mode)');
    
    const response = await apiClient.get(`/bookgroup/${bookId}`);
    
    console.log('🔍 BookEpisodes API Response:', response.data);
    
    if (response.data && response.data.code === 200 && response.data.data) {
      const groups = response.data.data.groups || [];
      console.log('✅ Episodes loaded:', groups.length, 'groups');
      
      // Log ตัวอย่างตอนแรกเพื่อเช็คสถานะ isBuy
      if (groups.length > 0 && groups[0].list && groups[0].list.length > 0) {
        const firstEpisode = groups[0].list[0];
        console.log('📝 First episode sample:', {
          name: firstEpisode.name,
          coin: firstEpisode.coin,
          isBuy: firstEpisode.isBuy,
        });
      }
      
      return response.data.data;
    }
    
    throw new Error('ไม่พบข้อมูลตอน');
  } catch (error: any) {
    console.error('❌ Error fetching book episodes:', error);
    
    // Log detailed error from API response
    if (error.response) {
      console.error('📛 API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        message: error.response.data?.message,
      });
    }
    
    throw error;
  }
};

export const fetchBookDetail = async (bookId: string): Promise<BookDetail> => {
  try {
    const response = await apiClient.get<BookDetailResponse>(`/bookdetail/${bookId}`);
    
    console.log('🔍 BookDetail API Response:', response.data);
    
    if (response.data && response.data.data) {
      console.log('✅ Book detail loaded:', response.data.data.name);
      return response.data.data;
    }
    
    throw new Error('ไม่พบข้อมูลหนังสือ');
  } catch (error) {
    console.error('❌ Error fetching book detail:', error);
    throw error;
  }
};

// export const fetchUserWallet = async () => {
//   try {
//     const token = localStorage.getItem('authToken');
//     if (!token) {
//       throw new Error('ไม่พบ token กรุณาเข้าสู่ระบบ');
//     }
    
//     // ดึงข้อมูล user profile ซึ่งจะรวม wallet ด้วย
//     const response = await apiClient.get('/user/profile');
    
//     console.log('💰 User Profile/Wallet Response:', response.data);
    
//     if (response.data && response.data.code === 200 && response.data.data) {
//       const userData = response.data.data;
      
//       // แปลง coin และ freecoin จาก string เป็น number
//       return {
//         coin: parseFloat(userData.coin) || 0,
//         freecoin: parseFloat(userData.freecoin) || 0,
//         heart: userData.heart || 0,
//         flower: userData.flower || 0,
//         coupon: userData.coupon || 0,
//         exp_point: userData.exp_point || 0,
//         stamp: userData.stamp || 0,
//         wheel: userData.wheel || 0,
//         fast_ticket: userData.fast_ticket || 0,
//         coinIncome: parseFloat(userData.coinIncome) || 0,
//       };
//     }
    
//     throw new Error('ไม่สามารถดึงข้อมูล wallet ได้');
//   } catch (error) {
//     console.error('❌ Error fetching user wallet:', error);
//     throw error;
//   }
// };