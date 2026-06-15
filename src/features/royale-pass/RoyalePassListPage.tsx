"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "antd";
import { CalendarDays, ChevronRight, Crown, Lock, Sparkles, Timer } from "lucide-react";

import GifLoader from "@/components/utility/GifLoader";
import { queryKeys, QUERY_CONFIG } from "@/constants/query";
import { fetchRoyalePassList, type RoyalePassSummary } from "@/services/api/royalePassApi";
import { useAuthStore } from "@/stores/authStore";

import {
  // formatCountdownToStart,
  formatPassDateRange,
  getPassBannerSrc,
  getUserLevel,
} from "./utils/royalePassUtils";

const getPremiumLabel = (pass: RoyalePassSummary) => {
  const status = String(pass.user_state?.premium_status ?? "").toLowerCase();
  if (status === "active" || status === "unlocked" || pass.user_state?.is_premium) return "Premium";
  return "Free";
};

const getRemainingTimeText = (pass: RoyalePassSummary) => {
  const targetDate = pass.is_preorder_period ? pass.start_date : pass.end_date;
  if (!targetDate) return pass.is_preorder_period ? "ไม่ทราบวันที่เริ่ม" : "ไม่มีกำหนดเวลา";
  
  const targetTime = new Date(targetDate).getTime();
  const diffMs = targetTime - Date.now();
  
  if (diffMs <= 0) return pass.is_preorder_period ? "เริ่มแล้ว" : "สิ้นสุดแล้ว";
  
  const diffDays = Math.floor(diffMs / 86_400_000);
  const diffHours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  const diffMinutes = Math.floor((diffMs % 3_600_000) / 60_000);
  const diffSeconds = Math.floor((diffMs % 60_000) / 1000);
  
  if (diffDays > 0) {
    return `${diffDays} วัน ${diffHours} ชม. ${diffMinutes} นาที ${diffSeconds} วินาที`;
  }
  return `${diffHours} ชม. ${diffMinutes} นาที ${diffSeconds} วินาที`;
};

function CountdownTimer({ pass }: { pass: RoyalePassSummary }) {
  const [timeText, setTimeText] = React.useState(getRemainingTimeText(pass));

  React.useEffect(() => {
    // Only update if there is an end date or it's preorder
    if (!pass.end_date && !pass.is_preorder_period) return;
    
    const interval = setInterval(() => {
      setTimeText(getRemainingTimeText(pass));
    }, 1000);
    return () => clearInterval(interval);
  }, [pass]);

  return <span>{timeText}</span>;
}

function RoyalePassCard({ pass }: { pass: RoyalePassSummary }) {
  const level = getUserLevel(pass as any);
  const premiumLabel = getPremiumLabel(pass);
  const isPremium = premiumLabel === "Premium";

  return (
    <Link
      href={`/royale-pass/${pass.pass_id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(220,38,38,0.08)] hover:border-red-100"
    >
      {/* Banner Area */}
      <div className="relative aspect-[16/7] w-full overflow-hidden bg-slate-100">
        <Image
          src={getPassBannerSrc(pass)}
          alt={pass.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
          unoptimized
        />
        {/* Subtle gradient for badges */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent opacity-70 pointer-events-none" />
        
        {/* Badges */}
        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          {pass.is_preorder_period && (
            <span className="rounded-full bg-red-600/90 backdrop-blur-md border border-red-500/50 px-3 py-1 text-[11px] font-black tracking-wider text-white shadow-sm">
              PRE-ORDER
            </span>
          )}
          <span className={`rounded-full border px-3 py-1 text-[11px] font-black tracking-wider shadow-sm backdrop-blur-md ${
            isPremium 
              ? "bg-amber-500/95 border-amber-400/50 text-white" 
              : "bg-white/95 border-white/50 text-slate-800"
          }`}>
            {premiumLabel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <h2 className="line-clamp-1 text-2xl font-extrabold text-slate-900 tracking-tight transition-colors duration-300 group-hover:text-red-600">{pass.name}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500 font-medium leading-relaxed min-h-[40px]">{pass.description || "ทำภารกิจเพื่อสะสมเลเวลและรับรางวัลมากมายตลอดช่วงเวลากิจกรรม"}</p>
        
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 transition-colors group-hover:bg-red-50/30">
            <CalendarDays size={14} className="text-slate-400 group-hover:text-red-400 transition-colors" />
            {formatPassDateRange(pass.start_date, pass.end_date)}
          </span>
        </div>

        {/* Separator */}
        <div className="my-6 h-[1px] w-full bg-slate-100" />

        {/* Progress Footer */}
        <div className="flex items-center justify-between gap-5 mt-auto">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_4px_12px_rgba(220,38,38,0.25)] ring-4 ring-red-50 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <div className="flex flex-col items-center justify-center -space-y-1 mt-0.5">
                <span className="text-[9px] font-black opacity-90 uppercase tracking-wider">LV</span>
                <span className="text-xl font-black leading-none">{level}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                {pass.is_preorder_period ? "เปิดในอีก" : "หมดเวลาในอีก"}
              </p>
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
                <Timer size={16} className="text-red-500" />
                <CountdownTimer pass={pass} />
              </div>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 transition-all duration-300 group-hover:bg-red-600 group-hover:border-red-600 group-hover:text-white shadow-sm group-hover:shadow-[0_4px_12px_rgba(220,38,38,0.3)]">
            <ChevronRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function RoyalePassListPage() {
  const { hasMounted, isLoggedIn } = useAuthStore();
  const { data: passes = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.royalePass.list(),
    queryFn: fetchRoyalePassList,
    enabled: hasMounted && isLoggedIn,
    staleTime: QUERY_CONFIG.STALE_TIME_MEDIUM,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    document.title = "Royale Pass - EnjoyBook";
  }, []);

  if (!hasMounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white font-primary">
        <GifLoader width={150} height={150} />
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#fafbfc] px-4 text-center font-primary">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 md:p-10 border border-slate-100 shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-inner">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">กรุณาเข้าสู่ระบบก่อน</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium">
            ระบบจะคำนวณเลเวล ภารกิจ และของรางวัลที่ได้รับตามข้อมูลบัญชีผู้ใช้งานของคุณ เพื่อให้คุณไม่พลาดทุกรางวัลสุดพิเศษ
          </p>
          <Link href="/" className="mt-8 block w-full">
            <Button type="primary" danger className="h-12 w-full rounded-xl font-bold shadow-[0_4px_12px_rgba(220,38,38,0.2)] bg-gradient-to-r from-red-500 to-red-600 border-none hover:from-red-600 hover:to-red-700 text-sm">
              กลับสู่หน้าหลัก
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafbfc] pb-16 font-primary selection:bg-red-500/20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-700 border-b border-red-800/20 shadow-sm">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-800/30 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        
        <div className="relative mx-auto flex max-w-[1200px] flex-col gap-5 px-4 py-12 md:px-6 lg:py-16">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600 shadow-[0_8px_24px_rgba(0,0,0,0.15)] ring-4 ring-white/30">
              <Crown size={30} className="drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight md:text-5xl drop-shadow-sm">Royale Pass</h1>
              <p className="mt-3 text-sm text-red-50 md:text-base font-medium max-w-2xl leading-relaxed">
                ทำภารกิจสุดท้าทาย สะสม เลเวล เพื่อปลดล็อกของรางวัลสุดพิเศษมากมาย ทั้งในแบบ <span className="text-red-700 font-bold px-2 py-0.5 rounded-md bg-white shadow-sm mx-0.5">ฟรี</span> และ <span className="text-red-800 font-bold px-2 py-0.5 rounded-md bg-amber-400 shadow-sm mx-0.5">พรีเมียม</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-12">
        {isLoading && (
          <div className="grid gap-6 md:gap-8 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-[380px] animate-pulse rounded-3xl bg-white border border-slate-100 shadow-sm" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-3xl bg-white border border-slate-100 p-10 md:p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-lg mx-auto">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
              <Sparkles size={28} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">เกิดข้อผิดพลาด</h2>
            <p className="mt-3 text-slate-500 font-medium leading-relaxed">ไม่สามารถโหลดข้อมูล Royale Pass ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง</p>
            <Button className="mt-8 rounded-xl font-bold px-8 h-12 shadow-[0_4px_12px_rgba(220,38,38,0.2)] bg-gradient-to-r from-red-500 to-red-600 border-none text-white hover:from-red-600 hover:to-red-700" onClick={() => refetch()}>
              โหลดข้อมูลใหม่
            </Button>
          </div>
        )}

        {!isLoading && !isError && passes.length === 0 && (
          <div className="rounded-3xl bg-white border border-slate-100 p-10 md:p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-lg mx-auto">
            <div className="mx-auto w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6">
              <Crown size={28} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">ยังไม่มี Royale Pass</h2>
            <p className="mt-3 text-slate-500 font-medium leading-relaxed">เมื่อมี Royale Pass ที่เปิดอยู่หรือกำลังจะเปิดให้สั่งจองล่วงหน้า ระบบจะแสดงรายการที่นี่โดยอัตโนมัติ</p>
          </div>
        )}

        {!isLoading && !isError && passes.length > 0 && (
          <div className="grid gap-6 md:gap-8 md:grid-cols-2">
            {passes.map((pass) => (
              <RoyalePassCard key={pass.pass_id} pass={pass} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
