"use client";

import React from 'react';
import { Typography, Skeleton, Empty, Button } from 'antd';
import { useDailyCoinPass } from '@/features/daily-coin-pass/hooks/useDailyCoinPass';
import { PassCard } from '@/features/daily-coin-pass/components/PassCard';
import Link from 'next/link';
import { History, Coins, Sparkles, AlertCircle, Ticket } from 'lucide-react';
import { ClaimButton } from '@/features/daily-coin-pass/components/ClaimButton';

const { Title, Text } = Typography;

export default function DailyCoinPassDashboard() {
  const { data, loading, error, refresh } = useDailyCoinPass();

  if (loading) return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Skeleton active avatar paragraph={{ rows: 3 }} />
      <Skeleton active paragraph={{ rows: 4 }} />
    </div>
  );
  
  if (error) return (
    <div className="p-10 text-center max-w-2xl mx-auto mt-10 bg-red-50 rounded-2xl border border-red-100">
      <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
      <Title level={4} className="text-red-600">เกิดข้อผิดพลาดในการดึงข้อมูล</Title>
      <Button onClick={refresh} type="primary" danger className="mt-4">ลองใหม่อีกครั้ง</Button>
    </div>
  );
  
  if (!data) return (
    <div className="p-20 text-center">
      <Empty description={<span className="text-slate-500 font-medium text-lg">กรุณาเข้าสู่ระบบเพื่อใช้งาน Daily Coin Pass</span>} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Section / Summary */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100 pt-12 pb-16 mb-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[60%] h-[100%] rounded-bl-full bg-gradient-to-br from-pink-50 to-orange-50 blur-[80px] opacity-70" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-3">
              Daily Coin Pass <Sparkles className="text-pink-500" />
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              รับเหรียญฟรีทุกวันจากพาสสุดคุ้มของคุณ
            </p>
          </div>
          
          <Link href="/daily-coin-pass/history">
            <Button className="flex items-center gap-2 border-slate-200 text-slate-600 hover:text-pink-600 hover:border-pink-300 rounded-full px-6 h-10 shadow-sm font-medium transition-all">
              <History size={16} /> ประวัติการรับ
            </Button>
          </Link>
        </div>


      </section>

      {/* Passes List */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <Title level={4} className="!mb-0 text-slate-800">พาสของคุณ ({data.active_passes.length})</Title>
        </div>
        
        {data.active_passes.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
               <Ticket size={40} />
             </div>
             <Title level={4} className="text-slate-700">คุณยังไม่มีพาสที่เปิดใช้งาน</Title>
             <p className="text-slate-500 mb-6">ซื้อพาสรายวันเพื่อรับเหรียญคุ้มๆ ทุกวัน</p>
             <Link href="/store">
               <Button type="primary" size="large" className="rounded-xl px-8 bg-gradient-to-r from-pink-500 to-rose-500 border-0 hover:shadow-lg hover:shadow-pink-500/30">
                 ไปที่ร้านค้า
               </Button>
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
            {data.active_passes.map(pass => (
              <PassCard 
                key={pass.user_pass_id} 
                pass={pass}
                onClaimSuccess={refresh} 
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


