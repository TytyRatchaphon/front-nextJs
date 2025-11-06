import apiClient from "./apiClient";
import type { BookTrans, AllBooksHomeResponse, BookDetail, BookDetailResponse, AllBooksResponse, BookItem } from "@/types/api";

// ดึงข้อมูลหนังสือทั้งหมดสำหรับหน้าแรก (รวมทุกหมวดหมู่)
export const fetchAllBooksHome = async (): Promise<any[]> => {
    try {
        const response = await apiClient.get<AllBooksHomeResponse>("/getAllBookHome");
        
        console.log('🔍 getAllBookHome API Response:', response.data);
        
        if (response.data && response.data.data) {
            const data = response.data.data;
            console.log('🔍 Data keys:', Object.keys(data));
            
            // รวมข้อมูลจากทุกหมวดหมู่
            const allBooks: any[] = [];
            
            // เพิ่มหนังสือจาก groupBookHome (ถ้าเป็น array ของ arrays)
            if (data.groupBookHome && Array.isArray(data.groupBookHome)) {
                data.groupBookHome.forEach((group: any) => {
                    if (Array.isArray(group)) {
                        allBooks.push(...group);
                    } else if (group.books && Array.isArray(group.books)) {
                        allBooks.push(...group.books);
                    }
                });
            }
            
            // เพิ่มหนังสือใหม่
            if (data.bookNew && Array.isArray(data.bookNew)) {
                allBooks.push(...data.bookNew);
            }
            
            // เพิ่มหนังสือแนะนำ
            if (data.recommend && Array.isArray(data.recommend)) {
                allBooks.push(...data.recommend);
            }
            
            // เพิ่ม top10
            if (data.top10 && Array.isArray(data.top10)) {
                allBooks.push(...data.top10);
            }
            
            // เพิ่ม bestseller
            if (data.bestseller && Array.isArray(data.bestseller)) {
                allBooks.push(...data.bestseller);
            }
            
            // ลบรายการซ้ำ (ใช้ book_trans_id เป็น unique key)
            const uniqueBooks = allBooks.reduce((acc: any[], book: any) => {
                const bookId = book.book_trans_id || book.bookID || book.book_id;
                if (!acc.find((b: any) => (b.book_trans_id || b.bookID || b.book_id) === bookId)) {
                    acc.push(book);
                }
                return acc;
            }, []);
            
            console.log('✅ Total books collected:', allBooks.length);
            console.log('✅ Unique books after dedup:', uniqueBooks.length);
            console.log('📚 First book sample:', uniqueBooks[0]);
            
            return uniqueBooks;
        }
        
        console.warn('⚠️ API response data is not in expected format:', response.data);
        return [];
    } catch (error) {
        console.error('❌ Error fetching books from /getAllBookHome:', error);
        throw error;
    }
};

export const fetchBookTrans = async (): Promise<BookTrans[]> => {
    try {
        // ลอง endpoint ต่างๆ
        const response = await apiClient.get<{ data: BookTrans[] }>("/books");
        
        console.log('getBooks API Response:', response.data);
        
        // ตรวจสอบว่า data มีอยู่และเป็น array
        if (!response.data || !Array.isArray(response.data)) {
            console.warn('API response data is not an array:', response.data);
            return [];
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching books:', error);
        // ลอง endpoint อื่น
        try {
            const response2 = await apiClient.get<{ data: BookTrans[] }>("/book/getBooks");
            console.log('getBooks API Response (fallback):', response2.data);
            return response2.data.data || [];
        } catch (error2) {
            console.error('Fallback also failed:', error2);
            return [];
        }
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

// ดึงข้อมูลรายละเอียดหนังสือสำหรับหน้า detail
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

// ดึงข้อมูลตอนของหนังสือ (episodes/chapters) พร้อม token เพื่อเช็คสถานะการซื้อ
export const fetchBookEpisodes = async (bookId: string | number) => {
  try {
    let token = localStorage.getItem('authToken');
    
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

// ดึงข้อมูล wallet/coins ของ user
export const fetchUserWallet = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('ไม่พบ token กรุณาเข้าสู่ระบบ');
    }
    
    // ดึงข้อมูล user profile ซึ่งจะรวม wallet ด้วย
    const response = await apiClient.get('/user/profile');
    
    console.log('💰 User Profile/Wallet Response:', response.data);
    
    if (response.data && response.data.code === 200 && response.data.data) {
      const userData = response.data.data;
      
      // แปลง coin และ freecoin จาก string เป็น number
      return {
        coin: parseFloat(userData.coin) || 0,
        freecoin: parseFloat(userData.freecoin) || 0,
        heart: userData.heart || 0,
        flower: userData.flower || 0,
        coupon: userData.coupon || 0,
        exp_point: userData.exp_point || 0,
        stamp: userData.stamp || 0,
        wheel: userData.wheel || 0,
        fast_ticket: userData.fast_ticket || 0,
        coinIncome: parseFloat(userData.coinIncome) || 0,
      };
    }
    
    throw new Error('ไม่สามารถดึงข้อมูล wallet ได้');
  } catch (error) {
    console.error('❌ Error fetching user wallet:', error);
    throw error;
  }
};

// ดึงข้อมูลหนังสือทั้งหมดพร้อม pagination สำหรับหน้า search
export const fetchAllBooks = async (page: number = 1, limit: number = 20): Promise<{
  items: BookItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> => {
  try {
    console.log('🚀 Calling API: /getAllBook with params:', { page, limit });
    
    const response = await apiClient.get<AllBooksResponse>(`/getAllBook`, {
      params: { page, limit }
    });
    
    console.log('� Raw Response:', response);
    console.log('🔍 Response Status:', response.status);
    console.log('🔍 Response Data:', response.data);
    console.log('🔍 Response Code:', response.data?.code);
    console.log('🔍 Response Status Text:', response.data?.status);
    console.log('🔍 Response Message:', response.data?.message);
    
    // ตรวจสอบว่า response สำเร็จและมีข้อมูล
    if (response.data && response.data.code === 200 && response.data.data) {
      const result = response.data.data;
      console.log('🔍 Result Data:', result);
      console.log('🔍 Result has items?:', 'items' in result);
      console.log('🔍 Result is array?:', Array.isArray(result));
      
      // ตรวจสอบว่ามี items หรือไม่
      if (result.items && Array.isArray(result.items)) {
        const items = result.items;
        const total = result.total || items.length;
        const calculatedTotalPages = result.totalPages || Math.ceil(total / limit);
        
        console.log('✅ Books loaded successfully');
        console.log('📊 Page:', page, '| Items:', items.length, '| Total:', total, '| Total Pages:', calculatedTotalPages);
        
        return {
          items: items,
          page: result.page || page,
          limit: result.limit || limit,
          total: total,
          totalPages: calculatedTotalPages
        };
      }
      
      // ถ้า data เป็น array โดยตรง (กรณี API ไม่ wrap ใน items)
      if (Array.isArray(result)) {
        console.log('✅ Books loaded as direct array - Items:', result.length);
        return {
          items: result,
          page: page,
          limit: limit,
          total: result.length,
          totalPages: Math.ceil(result.length / limit)
        };
      }
    }
    
    console.warn('⚠️ Unexpected response structure');
    console.warn('⚠️ Full response.data:', JSON.stringify(response.data, null, 2));
    
    // Return empty result แทนการ throw error เพื่อให้ UI แสดงว่า "ไม่พบข้อมูล"
    return {
      items: [],
      page: page,
      limit: limit,
      total: 0,
      totalPages: 0
    };
  } catch (error: any) {
    console.error('❌ Error fetching all books');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Full error:', error);
    
    // Return empty result แทน throw เพื่อให้ UI ยังแสดงได้
    return {
      items: [],
      page: page,
      limit: limit,
      total: 0,
      totalPages: 0
    };
  }
};
