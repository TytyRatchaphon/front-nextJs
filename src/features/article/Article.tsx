"use client";

import React from 'react';
import parse from 'html-react-parser';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  fetchPopularArticles,
  fetchLatestArticles,
  LatestArticle,
  PopularArticle,
  ArticlePagination,
} from '@/services/apiServices';

// Helper to format date to Thai string "19 พ.ค. 2025"
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};



const ArticleLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
}

interface ArticleProps {
  initialPopularArticles?: PopularArticle[];
  initialLatestData?: {
    list: LatestArticle[];
    pagination: ArticlePagination;
  };
}

export default function Article({ initialPopularArticles = [], initialLatestData }: ArticleProps) {
  const [page, setPage] = React.useState(1);

  const { data: popularArticles = [], isLoading: isLoadingPopular } = useQuery({
    queryKey: ['popularArticles'],
    queryFn: fetchPopularArticles,
    initialData: initialPopularArticles,
    staleTime: 2 * 60 * 1000,
  });

  const { data: latestData, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['latestArticles', page],
    queryFn: () => fetchLatestArticles(page, 8),
    initialData: page === 1 ? initialLatestData : undefined,
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });

  const latestArticles: LatestArticle[] = latestData?.list || [];
  const pagination = latestData?.pagination;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
       setPage(newPage);
    }
  };

  if (isLoadingPopular) {
    return <div className="w-full h-64 flex items-center justify-center text-gray-500">Loading articles...</div>;
  }

  // Pick main article logic
  const mainArticle = popularArticles.length > 0 ? popularArticles[0] : null;
  const sideArticles = popularArticles.length > 0 ? popularArticles.slice(1) : [];

  return (
    <div className="w-full flex flex-col items-center mb-16 px-4 md:px-0 mt-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-black mb-2">Enjoy Blog เรื่องราวข่าวสาร</h2>
        <p className="text-gray-500 text-sm">ข่าวสารดีพร้อมอัพเดทพร้อมกันทุกวัน</p>
      </div>

      <div className="w-full max-w-[1124px]">
        {/* Popular Articles Section */}
        {mainArticle && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-black mb-6 text-left">บทความยอดนิยม</h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Main Article (Left) */}
              <Link href={`/article/${mainArticle.id}`} className="md:col-span-3 h-[300px] md:h-[400px] relative rounded-xl overflow-hidden group cursor-pointer shadow-lg block">
                <Image
                    src={mainArticle.img}
                    alt={mainArticle.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loader={ArticleLoader}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-6 w-full">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs rounded mb-3">
                      นิยาย
                    </span>
                    <div className="text-white text-2xl md:text-3xl font-bold mb-4 leading-tight line-clamp-2">
                      {parse(mainArticle.title)}
                    </div>
                    <div className="flex items-center text-gray-300 text-xs md:text-sm gap-4">
                      <span className="font-semibold text-red-500">By {mainArticle.post_by || 'Admin'}</span>
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{formatDate(mainArticle.update_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{mainArticle.view}</span>
                      </div>
                    </div>
                </div>
              </Link>

              {/* Side Articles (Right) */}
              <div className="md:col-span-2 flex flex-col gap-4">
                {sideArticles.map((article) => (
                  <Link href={`/article/${article.id}`} key={article.id} className="relative h-[120px] md:h-[125px] rounded-xl overflow-hidden group cursor-pointer shadow block">
                    <Image
                      src={article.img}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loader={ArticleLoader}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 p-3 w-full">
                      <div className="flex justify-between items-start mb-1">
                        <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[10px] rounded">
                          นิยาย
                        </span>
                      </div>

                      <div className="text-white text-sm font-bold mb-2 line-clamp-2 leading-snug">
                        {parse(article.title)}
                      </div>
                      
                      <div className="flex items-center text-gray-300 text-[10px] gap-2">
                        <span className="font-semibold text-red-500">By {article.post_by || 'Admin'}</span>
                        <div className="flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>{formatDate(article.update_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>{article.view}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Latest Updates Section */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-black text-left">อัพเดทล่าสุด</h3>
            <div className="flex gap-2">
                 {/* Icons or Sort dropdown could go here as per design */}
            </div>
          </div>
          
          {isLoadingLatest && <div className="text-center py-8">Loading updates...</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestArticles.map((article: LatestArticle) => {
               const title = article.name || "";
               
               return (
                <Link href={`/article/${article.id}`} key={article.id} className="flex flex-col group cursor-pointer">
                  <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-3">
                    <Image
                      src={article.img}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loader={ArticleLoader}
                    />
                  </div>
                  <div className="font-bold text-black text-lg line-clamp-2 mb-2 leading-snug group-hover:text-red-500 transition-colors">
                    {parse(title)}
                  </div>
                  <div className="flex items-center text-gray-500 text-sm gap-3">
                     <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="#6b7280" strokeWidth="1.5"/>
                          <path d="M12 6V12L16 14" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{formatDate(article.update_at)}</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{article.view}</span>
                     </div>
                  </div>
                </Link>
               );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
             <div className="flex justify-center mt-12 gap-2">
                <button 
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!pagination.prevPage}
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   &lt;
                </button>
                
                {[...Array(pagination.totalPages)].map((_, i) => {
                   const p = i + 1;
                   if (pagination.totalPages > 7 && Math.abs(page - p) > 2 && p !== 1 && p !== pagination.totalPages) {
                      if (Math.abs(page - p) === 3) return <span key={p} className="flex items-end px-1">...</span>;
                      return null;
                   }
                   
                   return (
                     <button
                       key={p}
                       onClick={() => handlePageChange(p)}
                       className={`w-10 h-10 flex items-center justify-center border rounded ${
                         page === p 
                           ? 'border-red-500 text-red-500 font-bold' 
                           : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                       }`}
                     >
                       {p}
                     </button>
                   );
                })}

                <button 
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!pagination.nextPage}
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   &gt;
                </button>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
