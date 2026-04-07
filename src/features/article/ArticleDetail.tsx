"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, Tag } from 'antd';
import { Eye, Clock, Share2, ChevronRight } from 'lucide-react';
import { fetchArticleDetail } from '@/services/apiServices';
import type { ArticleResponse } from '@/types/api';
import GifLoader from '@/components/utility/GifLoader';
import { useLogger } from '@/hooks/useLogger';
import { sanitizeUserGeneratedHtml } from '@/utils/sanitizeHtml';
import { resolveSafeNavigationUrl } from '@/utils/navigationUtils';


// Helper for date formatting
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function ArticleDetail({ id, initialData = null }: { id: string; initialData?: ArticleResponse | null }) {
  const [data, setData] = useState<ArticleResponse['data'] | null>(() => initialData?.data ?? null);
  const [loading, setLoading] = useState(() => !initialData);
  const [error, setError] = useState<string | null>(() => {
    if (!initialData) return null;
    return initialData.code === 200 ? null : 'Article not found';
  });
  const { log } = useLogger();

  useEffect(() => {
    let isCancelled = false;

    if (!id) {
      return () => {
        isCancelled = true;
      };
    }

    const initialDetailId = initialData?.data?.result?.[0]?.id;
    if (initialData?.code === 200 && initialDetailId && String(initialDetailId) === String(id)) {
      return () => {
        isCancelled = true;
      };
    }

    const fetchData = async () => {
      try {
        setError(null);
        setLoading(true);
        const result = await fetchArticleDetail(id);
        if (isCancelled) return;
        if (result && result.code === 200 && result.data) {
          setData(result.data);
        } else {
          setData(null);
          setError('ไม่พบข้อมูลบทความ');
        }
      } catch {
        if (isCancelled) return;
        setData(null);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        if (isCancelled) return;
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [id, initialData]);

  useEffect(() => {
    if (data?.result?.[0]) {
      const detail = data.result[0];
      const startTime = Date.now();

      return () => {
        const duration = Math.round((Date.now() - startTime) / 1000 * 10) / 10;
        log('page_view', 'article', id, {
          title: detail.title,
          category: detail.type,
          writer: detail.post_by,
        }, duration);
      };
    }
  }, [data, id, log]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <GifLoader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Alert message="Error" description={error || 'ไม่พบข้อมูลบทความ'} type="error" showIcon />
      </div>
    );
  }

  // API returns result as an array, so we take the first item
  const detail = data.result?.[0];
  const { listRecommend } = data;

  if (!detail) {
     return (
       <div className="flex justify-center items-center min-h-[400px]">
        <Alert message="Error" description="ไม่พบข้อมูลบทความ" type="error" showIcon />
      </div>
    )
  }

  const safeDetail1Html = sanitizeUserGeneratedHtml(detail.detail_1 || '');
  const safeDetail2Html = sanitizeUserGeneratedHtml(detail.detail_2 || '');

  return (
    <div className="bg-gray-50 min-h-screen py-8 font-primary">
      <div className="max-w-[1200px] mx-auto px-4">
        
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-red-500 transition-colors">หน้าแรก</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link href="/article" className="hover:text-red-500 transition-colors">บทความ</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 truncate max-w-[300px]">{detail.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm p-6 md:p-8 overflow-hidden">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                         <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                             {detail.type || 'Article'}
                         </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-relaxed">
                        {detail.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-b border-gray-100 pb-6">
                         <div className="flex items-center gap-1">
                             <span className="font-semibold text-red-500">By {detail.post_by}</span>
                         </div>
                         <div className="flex items-center gap-1">
                             <Clock className="w-4 h-4" />
                             <span>{formatDate(detail.date_post)}</span>
                         </div>
                         <div className="flex items-center gap-1">
                             <Eye className="w-4 h-4" />
                             <span>{detail.view.toLocaleString()} views</span>
                         </div>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-8 bg-gray-100">
                    <Image 
                        src={detail.img} 
                        alt={detail.title}
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Content Body */}
                <div className="prose prose-lg max-w-none text-gray-800 prose-headings:text-gray-900 prose-a:text-red-600 hover:prose-a:text-red-700 prose-img:rounded-xl mb-8">
                     <div dangerouslySetInnerHTML={{ __html: safeDetail1Html }} />
                     {safeDetail2Html && <div className="mt-4" dangerouslySetInnerHTML={{ __html: safeDetail2Html }} />}
                </div>

                {/* Tags */}
                {detail.tag && (
                    <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-100">
                        {detail.tag.split(',').map((tag, idx) => (
                            <Link key={idx} href={`/search?q=${tag.trim()}`}>
                                <Tag className="cursor-pointer hover:border-red-500 hover:text-red-500 text-sm py-1 px-3 m-0 rounded-full">
                                    #{tag.trim()}
                                </Tag>
                            </Link>
                        ))}
                    </div>
                )}
                 
                {/* Action Buttons */}
                <div className="flex flex-col gap-4 mb-8">
                    {[1, 2, 3].map((num) => {
                        const img = (detail as any)[`button${num}_img`];
                        const type = (detail as any)[`button${num}_type`];
                        const data = (detail as any)[`button${num}_data`];

                        if (!img) return null;

                        let href = '#';
                        let isExternalLink = false;
                        if (type === 'book') {
                             href = `/book/${data}`;
                        } else if (type === 'link') {
                             const safeLink = resolveSafeNavigationUrl(String(data || ''), { allowExternal: true });
                             href = safeLink || '#';
                             isExternalLink = Boolean(safeLink);
                        }

                        return (
                            <Link
                                key={num}
                                href={href}
                                target={isExternalLink ? '_blank' : undefined}
                                rel={isExternalLink ? 'noopener noreferrer' : undefined}
                                className="block hover:opacity-90 transition-opacity"
                            >
                                <div className="relative w-full h-auto aspect-[4/1] md:aspect-[5/1] rounded-lg overflow-hidden">
                                     <Image 
                                        src={img} 
                                        alt={`Action Button ${num}`}
                                        fill
                                        className="object-contain" // Changed to contain to avoid cropping if aspect ratio mismatches
                                     />
                                </div>
                            </Link>
                        );
                    })}
                </div>

                 {/* Share Section (Placeholder) */}
                 <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                     <span className="font-semibold text-gray-900">แชร์บทความนี้</span>
                     <div className="flex gap-2">
                        <button className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                     </div>
                 </div>

            </div>

            {/* Sidebar / Recommendations */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Recommended List */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-red-500 pl-3">
                        แนะนำ
                    </h3>
                    <div className="space-y-6">
                        {listRecommend && listRecommend.length > 0 ? (
                            listRecommend.map((item) => {
                                const safeRecommendNameHtml = sanitizeUserGeneratedHtml(String(item.name || ''));
                                const plainRecommendName = safeRecommendNameHtml.replace(/<[^>]+>/g, '');
                                return (
                                <Link 
                                    href={`/article/${item.id}`} 
                                    key={item.id}
                                    className="group flex gap-4 items-start"
                                >
                                    <div className="relative w-[100px] h-[70px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                        <Image
                                            src={item.img}
                                            alt={plainRecommendName}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div 
                                            className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-1 leading-snug"
                                            dangerouslySetInnerHTML={{ __html: safeRecommendNameHtml }}
                                        ></div>
                                        <div className="flex items-center text-xs text-gray-400 gap-2">
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                <span>{item.view}</span>
                                            </div>
                                            <span>•</span>
                                            <span>{new Date(item.update_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </Link>
                            )})
                        ) : (
                            <p className="text-gray-500 text-sm">ไม่มีบทความแนะนำ</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}
