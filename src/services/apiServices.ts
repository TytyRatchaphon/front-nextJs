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
    const response = await apiClient.get<{ data: {books:NodeBook[]} }>("/book/getBooks");
    return response.data.data.books
}

export const fetchNodebookById = async (id: string): Promise<NodeBook> => {
  
  const response = await apiClient.get<{ data: { book: NodeBook } }>(`/book/${id}`);

  return response.data.data.book; 
};
