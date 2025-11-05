import { useQuery  } from "@tanstack/react-query";
import {
    fetchBookTrans,
    fetchBookTransById
} from "@/services/apiServices"


export const useGetBookTrans = () =>{
    return useQuery({
        queryKey: ["getAllBookHome"],
        queryFn: fetchBookTrans
    });
};

export const useGetBookTransById = (id : string) => {
    return useQuery({

    queryKey: ['book', id], 
    
    queryFn: () => fetchBookTransById(id),

    enabled: !!id, 
  });
}

