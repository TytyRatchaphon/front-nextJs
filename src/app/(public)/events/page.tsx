import React from "react";
import Link from "next/link";
import { Crown, CalendarDays, Gift, ChevronRight, Sparkles, Star, Target, Trophy, ListTodo } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "กิจกรรม | EnjoyBook",
  description: "รวมกิจกรรม และโปรโมชั่นพิเศษมากมายบน EnjoyBook",
  alternates: { canonical: '/events' },
};

export default function EventCenterPage() {
  const events = [
    {
      id: "royale-pass",
      title: "Royale Pass",
      description: "ทำภารกิจสะสมเลเวล รับของรางวัลสุดเอ็กซ์คลูซีฟมากมาย ทั้งกรอบโปรไฟล์ เหรียญ และคูปอง",
      icon: <Crown size={32} className="text-amber-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)]" />,
      href: "/royale-pass",
      bgGradient: "from-red-600 via-red-500 to-orange-500",
      cardGradient: "from-red-50 to-orange-50/50",
      borderGlow: "group-hover:border-red-300 group-hover:shadow-[0_20px_60px_rgba(220,38,38,0.15)]",
      hoverText: "group-hover:text-red-600",
      badge: { text: "กำลังมาแรง", color: "bg-red-100 text-red-600 border-red-200" },
      decoration: <Sparkles className="absolute -top-4 -right-4 text-red-500/10 transform transition-transform duration-700 group-hover:scale-125 group-hover:-rotate-12" size={120} />,
    },
    {
      id: "daily-login",
      title: "ล็อคอินรายวัน",
      description: "เข้าสู่ระบบทุกวัน รับของขวัญฟรีทุกวัน สะสมวันล็อคอินต่อเนื่องเพื่อรับรางวัลใหญ่",
      icon: <Gift size={32} className="text-purple-400 drop-shadow-[0_2px_10px_rgba(192,132,252,0.5)]" />,
      href: "/event", // Placeholder URL
      bgGradient: "from-purple-600 via-purple-500 to-indigo-500",
      cardGradient: "from-purple-50 to-indigo-50/50",
      borderGlow: "group-hover:border-purple-300 group-hover:shadow-[0_20px_60px_rgba(168,85,247,0.15)]",
      hoverText: "group-hover:text-purple-600",
      badge: { text: "รับฟรีทุกวัน", color: "bg-purple-100 text-purple-600 border-purple-200" },
      decoration: <Star className="absolute -top-4 -right-4 text-purple-500/10 transform transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12" size={120} />,
    },
    {
      id: "calendar",
      title: "ปฏิทินกิจกรรม",
      description: "เช็คอินกิจกรรมพิเศษตามเทศกาลต่างๆ ไม่พลาดทุกความเคลื่อนไหวและของรางวัลเด็ดๆ",
      icon: <CalendarDays size={32} className="text-emerald-400 drop-shadow-[0_2px_10px_rgba(52,211,153,0.5)]" />,
      href: "/book-updates", // Placeholder URL
      bgGradient: "from-emerald-600 via-emerald-500 to-teal-500",
      cardGradient: "from-emerald-50 to-teal-50/50",
      borderGlow: "group-hover:border-emerald-300 group-hover:shadow-[0_20px_60px_rgba(16,185,129,0.15)]",
      hoverText: "group-hover:text-emerald-600",
      badge: { text: "เร็วๆ นี้", color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
      decoration: <Target className="absolute -top-4 -right-4 text-emerald-500/10 transform transition-transform duration-700 group-hover:scale-125 group-hover:-rotate-12" size={120} />,
    },
    {
      id: "achievements",
      title: "ความสำเร็จ",
      description: "ปลดล็อกความสำเร็จจากการอ่านนิยาย และกิจกรรมต่างๆ เพื่อรับรางวัลพิเศษ และโชว์สถิติของคุณ",
      icon: <Trophy size={32} className="text-yellow-400 drop-shadow-[0_2px_10px_rgba(250,204,21,0.5)]" />,
      href: "/achievement",
      bgGradient: "from-yellow-600 via-yellow-500 to-amber-500",
      cardGradient: "from-yellow-50 to-amber-50/50",
      borderGlow: "group-hover:border-yellow-300 group-hover:shadow-[0_20px_60px_rgba(234,179,8,0.15)]",
      hoverText: "group-hover:text-yellow-600",
      badge: { text: "ท้าทาย", color: "bg-yellow-100 text-yellow-600 border-yellow-200" },
      decoration: <Sparkles className="absolute -top-4 -right-4 text-yellow-500/10 transform transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12" size={120} />,
    },
    {
      id: "all-quests",
      title: "ภารกิจทั้งหมด",
      description: "รวบรวมภารกิจสุดท้าทายให้คุณได้ร่วมสนุก ทำภารกิจให้สำเร็จเพื่อรับของรางวัล ทั้งเหรียญและไอเทมเพียบ",
      icon: <ListTodo size={32} className="text-blue-400 drop-shadow-[0_2px_10px_rgba(96,165,250,0.5)]" />,
      href: "/all-quest",
      bgGradient: "from-blue-600 via-blue-500 to-cyan-500",
      cardGradient: "from-blue-50 to-cyan-50/50",
      borderGlow: "group-hover:border-blue-300 group-hover:shadow-[0_20px_60px_rgba(59,130,246,0.15)]",
      hoverText: "group-hover:text-blue-600",
      badge: { text: "ภารกิจ", color: "bg-blue-100 text-blue-600 border-blue-200" },
      decoration: <Target className="absolute -top-4 -right-4 text-blue-500/10 transform transition-transform duration-700 group-hover:scale-125 group-hover:-rotate-12" size={120} />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100 pb-16 pt-12 lg:pt-20 lg:pb-24">
        {/* Background Decorations */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-red-100/40 to-orange-100/40 blur-[100px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-purple-100/40 to-blue-100/40 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1200px] px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight mb-6 !leading-[1.6]">
            ศูนย์รวม <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 drop-shadow-sm py-2 px-1 inline-block">กิจกรรมทั้งหมด</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            สะสมเลเวล ล็อคอินรายวัน และรับของรางวัลพิเศษมากมายที่เราเตรียมไว้ให้คุณ
          </p>
        </div>
      </section> 

      {/* Events Grid */}
      <section className="relative z-20 mx-auto max-w-[1200px] px-4 md:px-6 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {events.map((event) => (
            <Link
              key={event.id}
              href={event.href}
              className={`group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-2 hover:scale-[1.01] ${event.borderGlow}`}
            >
              {/* Card Header Background */}
              <div className={`h-32 w-full bg-gradient-to-br ${event.cardGradient} relative overflow-hidden flex items-center p-6`}>
                {event.decoration}
                
                {/* Icon Box */}
                <div className={`relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br ${event.bgGradient} flex items-center justify-center shadow-lg border border-white/20 transform transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.15] group-hover:-rotate-3 group-hover:shadow-2xl`}>
                  {event.icon}
                </div>
{/*                 
                Badge
                <div className={`absolute top-5 right-5 px-3 py-1.5 rounded-full text-[11px] font-bold border shadow-sm ${event.badge.color}`}>
                  {event.badge.text}
                </div> */}
              </div>

              {/* Card Content */}
              <div className="flex flex-col flex-1 p-6 lg:p-8 relative z-10 bg-white">
                <h3 className={`text-xl md:text-2xl font-black text-slate-800 mb-3 transition-colors duration-500 ease-out ${event.hoverText}`}>
                  {event.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium mb-8 flex-1">
                  {event.description}
                </p>

                {/* Action Footer */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-400 transition-all duration-500 group-hover:text-slate-800 group-hover:pl-1">
                    ไปที่กิจกรรม
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:bg-gradient-to-br ${event.bgGradient} group-hover:text-white shadow-sm group-hover:scale-110 group-hover:shadow-md`}>
                    <ChevronRight size={18} className="transition-transform duration-500 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
