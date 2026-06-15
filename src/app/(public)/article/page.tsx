import Article from "@/features/article/Article";
import { fetchLatestArticles, fetchPopularArticles } from '@/services/apiServices';
import type { Metadata } from 'next';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'บทความ - อ่านบทความนิยายและข่าวสาร',
  description: 'อ่านบทความเกี่ยวกับนิยาย ข่าวสาร รีวิวนิยายยอดนิยม เรื่องราวน่าสนใจ อัพเดททุกวันที่ Enjoybook',
  alternates: {
    canonical: '/article',
  },
  openGraph: {
    title: 'บทความ - Enjoybook',
    description: 'อ่านบทความเกี่ยวกับนิยาย ข่าวสาร รีวิวนิยายยอดนิยม',
    url: 'https://enjoybook.co/article',
  },
};

export default async function ArticlePage() {
  const [initialPopularArticles, initialLatestData] = await Promise.all([
    fetchPopularArticles(),
    fetchLatestArticles(1, 8),
  ]);

  return (
    <div className="min-h-screen bg-white flex justify-center w-full">
      <div className="max-w-[1440px] w-full px-4  py-8">
         <Article
           initialPopularArticles={initialPopularArticles}
           initialLatestData={initialLatestData}
         />
      </div>
    </div>
  );
}
