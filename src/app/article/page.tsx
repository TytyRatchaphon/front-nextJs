import React from 'react';
import Article from "@/features/article/Article";
import { fetchLatestArticles, fetchPopularArticles } from '@/services/apiServices';

export const revalidate = 120;

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
