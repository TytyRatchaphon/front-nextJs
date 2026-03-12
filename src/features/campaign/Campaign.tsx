'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Alert } from 'antd';
import GifLoader from '@/components/utility/GifLoader';
import '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');
import { postCampaignClick, fetchCampaigns, type CampaignData } from '@/services/apiServices';

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
        };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute to save resources, or 1000 for seconds if needed

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return <span className="text-gray-500 text-sm">หมดเวลา</span>;
  }

  return (
    <div className="bg-[#D32F2F] text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm whitespace-nowrap">
      {timeLeft.days} วัน {timeLeft.hours} ชม.
    </div>
  );
}

function Campaign({ initialData }: { initialData?: CampaignData[] }) {
  const { data: campaigns, isLoading, isError, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
    initialData,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-primary">
      {/* Header Section */}
      <div className="bg-white shadow-sm py-8 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
          <h1 className="text-3xl font-bold text-gray-900">
            แคมเปญทั้งหมด
          </h1>
          <p className="text-gray-500 mt-2">
            รวมกิจกรรมและโปรโมชั่นสุดพิเศษ
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 mt-8">
        {isError && (
          <Alert
            message="เกิดข้อผิดพลาด"
            description={error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลแคมเปญได้"}
            type="error"
            showIcon
            className="mb-6"
          />
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <GifLoader />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns?.map((campaign) => (
              <Link
                key={campaign.cp_id}
                href={`/campaign/${campaign.cp_id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col group"
                onClick={() => postCampaignClick(campaign.cp_id)}
              >
                {/* Banner Image */}
                <div className="relative w-full aspect-[2/1] bg-gray-100">
                  <Image
                    src={campaign.img_banner}
                    alt={campaign.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    {/* Name - Line clamped */}
                    <h2 className="text-lg font-bold text-gray-900 line-clamp-2 leading-snug flex-1 group-hover:text-red-600 transition-colors">
                      {campaign.name}
                    </h2>

                    {/* Countdown */}
                    {campaign.status === 'active' && (
                      <CountdownTimer targetDate={campaign.end_date} />
                    )}
                  </div>

                  {/* Detail */}
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                    {campaign.detail}
                  </p>

                  {/* Date Footer */}
                  <div className="mt-auto pt-4 border-t border-gray-50 text-xs text-gray-400">
                    เวลาโปรโมชั่น: {dayjs(campaign.start_date).format('DD/MM/YYYY HH:mm')} - {dayjs(campaign.end_date).format('DD/MM/YYYY HH:mm')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && !isError && campaigns?.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">📭</div>//////
            <div className="text-xl">ไม่มีแคมเปญในขณะนี้</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Campaign;