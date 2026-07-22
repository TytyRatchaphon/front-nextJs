"use client";

import React, { use } from 'react';
import { Typography, Skeleton, Empty, Button, Breadcrumb } from 'antd';
import { useDailyCoinPassCalendar } from '@/features/daily-coin-pass/hooks/useDailyCoinPassCalendar';
import { PassCalendar } from '@/features/daily-coin-pass/components/PassCalendar';
import Link from 'next/link';
import { HomeOutlined } from '@ant-design/icons';
import { CalendarDays, AlertCircle } from 'lucide-react';

const { Title } = Typography;

export default function DailyCoinPassCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userPassId = parseInt(resolvedParams.id, 10);
  const { data, loading, error, refresh } = useDailyCoinPassCalendar(userPassId);

  if (loading) return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  );
  
  if (error) return (
    <div className="p-10 text-center max-w-2xl mx-auto mt-10 bg-red-50 rounded-2xl border border-red-100">
      <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
      <Title level={4} className="text-red-600">เกิดข้อผิดพลาดในการดึงข้อมูลปฏิทิน</Title>
      <Button onClick={refresh} type="primary" danger className="mt-4">ลองใหม่อีกครั้ง</Button>
    </div>
  );
  
  if (!data) return (
    <div className="p-20 text-center">
      <Empty description={<span className="text-slate-500 font-medium text-lg">ไม่พบข้อมูลพาสนี้</span>} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Area */}
      <div className="bg-white border-b border-slate-100 pt-6 pb-8 mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Breadcrumb 
            className="mb-6 font-medium text-slate-500"
            items={[
              { title: <Link href="/daily-coin-pass" className="hover:text-pink-500 transition-colors"><HomeOutlined /> Dashboard</Link> },
              { title: <span className="text-slate-800">{data.name}</span> }
            ]}
          />
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-50 rounded-2xl flex items-center justify-center text-pink-500 shadow-inner">
              <CalendarDays size={28} />
            </div>
            <div>
              <Title level={2} className="!mb-1 text-slate-800">{data.name}</Title>
              <p className="text-slate-500 font-medium">ดูปฏิทินและรับรางวัลรายวันของคุณ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8">
            <PassCalendar 
              calendar={data} 
              onClaimSuccess={refresh} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
