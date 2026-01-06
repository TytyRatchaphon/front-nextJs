"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Alert } from 'antd';
import GifLoader from '@/components/utility/GifLoader';
import { fetchCampaignDetail } from '@/services/apiServices';
import type { CampaignDetailData } from '@/types/api';
import parse from 'html-react-parser';
import CardBook from '@/components/novelCard/CardBook';

// Helper to format date if needed, though mostly using banners
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
}

export default function CampaignDetail({ id }: { id: string }) {
  const [data, setData] = useState<CampaignDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchCampaignDetail(id);
        if (result) {
          setData(result);
        } else {
          setError('ไม่พบข้อมูลแคมเปญ');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

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
        <Alert message="Error" description={error || 'Something went wrong'} type="error" showIcon />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-20 font-primary"
      style={{ backgroundColor: data.color_bg || '#f4f5eb' }}
    >
        {/* Main Content Container */}
        <div className="max-w-[800px] mx-auto shadow-2xl min-h-screen relative flex flex-col bg-transparent">
            
            {/* Banners Section */}
            <div className="flex flex-col w-full gap-4">
                {/* Banner 2 / Section Header */}
                {data.img_banner2 && (
                    <div className="w-full relative">
                         <Image
                            loader={imageLoader}
                            src={data.img_banner2} 
                            alt="Secondary Banner" 
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto block"
                        />
                    </div>
                )}
            </div>

             {/* Detail Text */}
             {data.detail && (
                <div className="bg-white/80 backdrop-blur-sm p-6 md:p-8 mx-4 md:mx-0 rounded-xl md:rounded-none my-4 md:my-0 text-center shadow-sm md:shadow-none">
                    <div className="text-gray-800 text-lg leading-relaxed font-medium">
                        {parse(data.detail)}
                    </div>
                </div>
             )}

            {/* Book List Section */}
            {data.books && data.books.length > 0 && (
                <div className="w-full">
                     {/* Shelf / Section Header Image */}
                     {data.img_shelf && (
                         <div className="w-full relative">
                              <Image
                                loader={imageLoader}
                                src={data.img_shelf} 
                                alt="Shelf/Header" 
                                width={0}
                                height={0}
                                sizes="100vw"
                                className="w-full h-auto block"
                              />
                         </div>
                     )}
                     
                     {/* Book Grid Container - Matches the dark/red theme of the shelf often seen in these designs */}
                     <div className="px-4 pb-12 pt-6" style={{ backgroundImage: `linear-gradient(to bottom, ${data.color_bg || '#f4f5eb'} 0%, ${data.color_bg || '#f4f5eb'} 100%)` }}>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
                            {data.books.map((book) => (
                                <CardBook key={book.book_id} book={book} />
                            ))}
                        </div>
                     </div>
                </div>
            )}
            
            {/* Start/End Date Footer */}
            <div className="text-center pb-8 pt-4 text-gray-500 text-xs md:text-sm">
                 <p className="opacity-70">ระยะเวลากิจกรรม</p>
                 <p className="font-semibold">{formatDate(data.start_date)} - {formatDate(data.end_date)}</p>
            </div>
        </div>
    </div>
  );
}