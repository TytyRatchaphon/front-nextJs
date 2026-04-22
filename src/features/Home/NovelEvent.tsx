'use client'
import { useQuery } from '@tanstack/react-query';
import { fetchBookPromotions } from '@/services/apiServices';
import { Alert } from 'antd';
import CardBook from '@/components/novelCard/CardBook';
import GifLoader from '@/components/utility/GifLoader';

// Interface matching the provided JSON structure
interface BookPromotion {
  book_id: number;
  name: string;
  img: string;
  user_id: number;
  view: number;
  end: string;
  status: string;
  tag: string;
  img_full: string;
  bgimg: string | null;
  writer_name: string;
  chapter: number;
  shelve_count: number;
  isBestSeller: boolean;
  isNew: boolean;
  isNewEp: boolean;
  discount: any;
  discount_ep_count?: number;
}

export default function NovelEvent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['bookPromotions'],
    queryFn: () => fetchBookPromotions(1, 20),
  });

  if (isLoading) {
    return (
      <GifLoader />
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <Alert message="Error fetching promotions" type="error" />
      </div>
    );
  }

  const books: BookPromotion[] = data?.data?.books || [];

  return (  
    <div className="max-w-[1128px] mx-auto px-4 py-8 font-primary">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">ส่วนลดรายตอน</h1>
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-y-8 gap-x-4 justify-items-center">
        {books.map((book) => (
          <CardBook key={book.book_id} book={book} />
        ))}
      </div>
    </div>
  );
}