import { useQuery  } from "@tanstack/react-query";
import {
    fetchBanners,
    fetchRecNovels,
    fetchExclusiveNovels,
    fetchNovels,
    fetchNodeNovel,
    fetchNodebookById,
} from "@/services/apiServices"

export const useGetBanners = () => {
    return useQuery({
        queryKey: ["banners"],
        queryFn: fetchBanners,
    });
};

export const useGetRecNovels = () => {
    return useQuery({
        queryKey: ["recNovels"],
        queryFn: fetchRecNovels,
    });
};

export const useGetExclusiveNovels = () => {
    return useQuery({
        queryKey: ["exclusiveNovels"],
        queryFn: fetchExclusiveNovels,
    });
};

export const useGetNovels = () => {
    return useQuery({
        queryKey: ["novels"],
        queryFn: fetchNovels,
    });
};

export const useGetNodeNovel = () =>{
    return useQuery({
        queryKey: ["book/getBooks"],
        queryFn: fetchNodeNovel
    });
};

export const useGetNodeBookById = (id : string) => {
    return useQuery({

    queryKey: ['book', id], 
    
    queryFn: () => fetchNodebookById(id),

    enabled: !!id, 
  });
}

