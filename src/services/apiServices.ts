import apiClient from "./apiClient";
import type { Banner, RecNovel, ExclusiveNovel, Novel, NodeBook} from "@/types/api";

export const fetchBanners = async (): Promise<Banner[]> => {
    const response = await apiClient.get<Banner[]>("/banners");
    return response.data
};

export const fetchRecNovels = async (): Promise<RecNovel[]> => {
    const response = await apiClient.get<RecNovel[]>("/recNovels");
    return response.data
};

export const fetchExclusiveNovels = async (): Promise<ExclusiveNovel[]> => {
    const response = await apiClient.get<ExclusiveNovel[]>("/exclusiveNovels");
    return response.data
};

export const fetchNovels = async (): Promise<Novel[]> => {
    const response = await apiClient.get<Novel[]>("/novels");
    return response.data
};

export const fetchNodeNovel = async (): Promise<NodeBook[]> => {
    try {
        // ลอง endpoint ต่างๆ
        const response = await apiClient.get<{ data: NodeBook[] }>("/books");
        
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
            const response2 = await apiClient.get<{ data: NodeBook[] }>("/book/getBooks");
            console.log('getBooks API Response (fallback):', response2.data);
            return response2.data.data || [];
        } catch (error2) {
            console.error('Fallback also failed:', error2);
            return [];
        }
    }
}

export const fetchNodebookById = async (id: string): Promise<NodeBook> => {
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
