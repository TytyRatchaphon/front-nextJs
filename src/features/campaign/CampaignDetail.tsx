"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import 'next/link';
import { Alert } from 'antd';
import GifLoader from '@/components/utility/GifLoader';
import { fetchCampaignDetail } from '@/services/apiServices';
import type { CampaignDetailData } from '@/types/api';
import parse from 'html-react-parser';
import CardBook from '@/components/novelCard/CardBook';
import '@/utils/imageUtils';

// Helper to format date if needed, though mostly using banners
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

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
      } catch {
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
      {/* Main Content Container - Widened & Styled */}
      <div className="max-w-5xl mx-auto shadow-2xl min-h-screen relative flex flex-col bg-white">

        {/* Banners Section */}
        <div className="flex flex-col w-full mb-10">
          {/* Banner 2 / Section Header */}
          {data.img_banner2 && (
            <div className="w-full relative px-0">
              <Image
                unoptimized
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
          <div className="px-6 md:px-10 py-6 text-center">
            <div className="text-gray-700 text-lg leading-relaxed">
              {parse(data.detail)}
            </div>
          </div>
        )}

        {/* Image Cards Section - Vertical Stack */}
        {data.img_card && data.img_card.length > 0 && (
          <div className="w-full px-4 md:px-10 mb-8">
            <div className="flex flex-col gap-4">
              {data.img_card.map((imgUrl, index) => (
                imgUrl && imgUrl !== "null" && (
                  <div key={index} className="relative w-full rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
                    <Image
                      unoptimized
                      src={imgUrl}
                      alt={`Promotion Card ${index + 1}`}
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full h-auto block"
                    />
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Book List Section */}
        {data.books && data.books.length > 0 && (
          <div className="w-full">

            {/* Book Grid Container with img_shelf as Background */}
            <div
              className="px-4 md:px-10 pb-12 pt-8"
              style={{
                backgroundImage: (data.img_shelf && data.img_shelf !== "null")
                  ? `url(${data.img_shelf})`
                  : `linear-gradient(to bottom, #ffffff 0%, ${data.color_bg || '#f4f5eb'} 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'top center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
                {data.books.map((book) => (
                  <CardBook key={book.book_id} book={book as any} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Start/End Date Footer */}
        <div className="text-center pb-10 pt-4 text-gray-500 text-sm bg-white/50">
          <p className="opacity-70 mb-1">ระยะเวลากิจกรรม</p>
          <div className="inline-block px-4 py-1 rounded-full bg-gray-100 font-medium">
            {formatDate(data.start_date)} - {formatDate(data.end_date)}
          </div>
        </div>
      </div>
    </div>
  );
}