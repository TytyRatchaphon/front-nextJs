"use client";

import React, { useEffect, useState, useMemo, useRef, Suspense } from "react";
import Image from "next/image";
import { Image as AntdImage } from "antd";
import { Button, Modal } from "antd";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import GifLoader from '@/components/utility/GifLoader';
import { imageLoader } from '@/utils/imageUtils';
import AmountPill from "@/components/utility/AmountPill";
import FreeCoinPill from "@/components/utility/FreeCoinPill";
import StampPill from "@/components/utility/StampPill";
import { fetchRankProfile, RankProfileResponse, fetchAllRanks, RankItem, fetchQuests, QuestGroup } from "@/services/api/userApi";
import QuestSection from "@/components/quest/QuestSection";
import ProfileAchievements from "@/components/achievement/ProfileAchievements";
import Cookies from "js-cookie";
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import { useWebsiteStore } from "@/stores/websiteStore";

function MyProfileContent() {
    const { user, isLoggedIn, hasMounted } = useAuthStore();
    const router = useRouter();
    const { settings } = useWebsiteStore();

    const [bannerError, setBannerError] = useState(false);
    const [rankData, setRankData] = useState<RankProfileResponse['data'] | null>(null);
    const [allRanks, setAllRanks] = useState<RankItem[]>([]);
    const [showRanksModal, setShowRanksModal] = useState(false);
    const [questGroups, setQuestGroups] = useState<QuestGroup[]>([]);
    const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
    const swiperRef = useRef<SwiperType | null>(null);

    // Find initial slide index (current rank)
    const currentRankIndex = useMemo(() => {
        if (!Array.isArray(allRanks)) return 0;
        const idx = allRanks.findIndex(r => r.is_current_rank);
        return idx >= 0 ? idx : 0;
    }, [allRanks]);

    // Reset banner error when data changes
    useEffect(() => {
        setBannerError(false);
    }, [user?.banner]);

    // Fetch Rank Data
    useEffect(() => {
        const loadRank = async () => {
            if (!isLoggedIn) return;
            const rawToken = Cookies.get('token');
            const token = rawToken ? rawToken.replace(/^['"]+|['"]+$/g, '') : '';
            if (!token) return;
            try {
                const data = await fetchRankProfile(token);
                if (data) {
                    setRankData(data);
                }
                const ranks = await fetchAllRanks(token);
                if (Array.isArray(ranks)) {
                    setAllRanks(ranks);
                }
                const quests = await fetchQuests(token);
                if (Array.isArray(quests)) {
                    setQuestGroups(quests);
                }
            } catch (error) {
                console.error('fetchRankProfile error:', error);
            }
        };
        if (hasMounted) loadRank();
    }, [isLoggedIn, hasMounted]);

    // Set Document Title
    useEffect(() => {
        if (user?.fullname) {
            document.title = `${user.fullname} - ของฉัน`;
        } else {
            document.title = "โปรไฟล์ของฉัน - EnjoyBook";
        }
    }, [user]);

    if (!hasMounted) {
        return <GifLoader className="h-64" width={150} height={150} />;
    }

    if (!isLoggedIn || !user) {
        // Fallback or could optionally redirect to login
        return (
            <div className="min-h-screen bg-white font-primary pb-10 flex flex-col items-center justify-center">
                <p className="text-gray-500 mb-4">กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์ของคุณ</p>
                <Button type="primary" onClick={() => router.push('/')}>กลับหน้าหลัก</Button>
            </div>
        );
    }

    const { fullname, banner, img: profileImg, frame, aka, stamp = 0, coin = 0, freecoin = 0 } = user as any; // Cast for additional fallback fields

    return (
        <div className="min-h-screen bg-white font-primary pb-10">
            {/* Banner Section */}
            <div className="w-full h-[200px] md:h-[280px] relative overflow-hidden bg-gray-100">
                {banner && !bannerError ? (
                    <AntdImage
                        src={imageLoader({
                            src: banner.startsWith('http') || banner.startsWith('data:') || banner.startsWith('/')
                                ? banner
                                : `https://img.enjoybook.co/${banner}`,
                            width: 1000
                        })}
                        alt="Banner"
                        width="100%"
                        height="100%"
                        style={{ objectFit: "cover" }}
                        preview={false}
                        onError={() => setBannerError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-red-600 to-rose-500" />
                )}
                <div className="absolute inset-0 bg-black/10" /> {/* Dim overlay */}
            </div>

            {/* Profile Bar */}
            <div className="container mx-auto px-4 relative z-10 -mt-16 mb-8 md:mb-12">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-6 flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-6 border border-gray-100/50">
                    {/* Avatar */}
                    <div className="relative -mt-16 md:-mt-20 shrink-0">
                        <div className="w-28 h-28 md:w-40 md:h-40 rounded-full border-[4px] md:border-[6px] border-white shadow-lg overflow-hidden bg-gray-50 relative group">
                            <AntdImage
                                src={imageLoader({
                                    src: profileImg
                                        ? (profileImg.startsWith('http') || profileImg.startsWith('data:') || profileImg.startsWith('/')
                                            ? profileImg
                                            : `https://img.enjoybook.co/${profileImg}`)
                                        : "/images/default-avatar.png",
                                    width: 300
                                })}
                                alt="Profile"
                                width="100%"
                                height="100%"
                                className="object-cover transition-transform duration-500"
                                style={{ objectFit: "cover", zIndex: 1 }}
                                preview={false}
                                fallback="/images/default-avatar.png"
                            />
                            {frame?.img && (
                                <div className="absolute inset-0 pointer-events-none z-10">
                                    <Image src={frame.img} alt="Frame" fill className="object-contain" unoptimized />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left w-full md:w-auto">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 truncate px-2 md:px-0">
                            {fullname || "ผู้ใช้งาน"}
                        </h1>
                        <p className="text-gray-500 text-sm mb-3 font-medium">
                            ฉายา: {aka?.name || 'ไม่มีฉายา'}
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-gray-600 text-sm font-medium">
                            <AmountPill amount={Number(coin) || 0} />
                            <FreeCoinPill amount={Number(freecoin) || 0} />
                            <StampPill amount={Number(stamp) || 0} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 w-full md:w-auto justify-center md:justify-start">
                        <Button
                            onClick={() => router.push('/sprofile')}
                            className="bg-white border border-gray-300 text-gray-800 hover:!border-red-600 hover:!text-red-600 rounded-full px-8 h-12 text-base font-medium transition-all flex items-center gap-2 shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            แก้ไขข้อมูล
                        </Button>
                    </div>
                </div>


            </div>

            {/* Rank & Quest Grid */}
            <div className="container mx-auto px-4 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                    {/* Rank Card */}
                    {rankData && (
                        <div 
                            className="w-full bg-gradient-to-br from-[#E6E8ED] via-[#F4F5F7] to-[#D5D7DF] rounded-2xl p-5 shadow-sm relative overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setShowRanksModal(true)}
                            title="ดูแรงค์ทั้งหมด"
                        >
                            {/* Background Rank Image */}
                            <div className="absolute -right-10 -bottom-10 w-50 h-50 opacity-15 pointer-events-none">
                                <Image 
                                    src={rankData.current_rank.rank_img || "/images/user.png"} 
                                    alt="" 
                                    fill 
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                            
                            <div className="relative z-10 flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {/* Badge Icon */}
                                    <div className="w-16 h-16 bg-white/60 rounded-full shadow-sm flex items-center justify-center p-2 border border-white/80 shrink-0">
                                        <Image 
                                            src={rankData.current_rank.rank_img || "/images/user.png"} 
                                            alt={rankData.current_rank.name} 
                                            width={48} 
                                            height={48} 
                                            sizes="48px"
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                    {/* Rank Details */}
                                    <div>
                                        <p className="text-gray-500 text-xs font-semibold tracking-wider">ระดับปัจจุบัน</p>
                                        <p className="text-gray-900 font-bold text-lg">{rankData.current_rank.name}</p>
                                    </div>
                                </div>
                                
                                {/* Total RP */}
                                <div className="flex items-center gap-1.5 bg-red-100/50 px-3 py-1.5 rounded-xl border border-red-200/50">
                                    {settings?.rank_point && (
                                        <Image
                                            src={settings.rank_point}
                                            alt="RP"
                                            width={18}
                                            height={18}
                                            className="object-contain"
                                            unoptimized
                                        />
                                    )}
                                    <span className="text-red-600 font-bold text-lg">{rankData.total_rp.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative z-10 w-full h-2.5 bg-[#FA807280] rounded-full overflow-hidden mb-2 shadow-inner">
                                <div 
                                    className="h-full bg-[#FF0000] rounded-full transition-all duration-500 ease-out opacity-100"
                                    style={{ 
                                        width: `${rankData.current_rank.max_rp > 0 ? Math.min(100, Math.max(0, (rankData.total_rp / rankData.current_rank.max_rp) * 100)) : 0}%` 
                                    }}
                                />
                            </div>

                            {/* Footer Status */}
                            <div className="relative z-10 text-sm mt-3 font-medium text-gray-700">
                                ต้องการอีก <span className="text-red-600 font-bold">{rankData.rp_needed.toLocaleString()}</span> แต้ม เพื่ออัปแรงค์เป็น <span className="text-yellow-600 font-bold">{rankData.next_rank.name}</span>
                            </div>
                        </div>
                    )}

                    {/* Achievements Section */}
                    <ProfileAchievements />

                </div>
            </div>

            {/* All Ranks Modal */}
            <Modal
                open={showRanksModal}
                onCancel={() => setShowRanksModal(false)}
                footer={null}
                title={null}
                closable={true}
                centered
                width={900}
                className="ranks-modal"
                styles={{ body: { padding: 0, overflow: 'hidden' } }}
            >
                <div className="py-8 px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">🏆 แรงค์ทั้งหมด</h2>
                    <p className="text-gray-500 text-sm text-center mb-8">สะสมแต้มเพื่ออัปแรงค์ของคุณ</p>
                    
                    {showRanksModal && allRanks.length > 0 && (
                        <>
                        <Swiper
                            key={showRanksModal ? 'open' : 'closed'}
                            effect="coverflow"
                            centeredSlides={true}
                            slidesPerView="auto"
                            initialSlide={currentRankIndex}
                            onSwiper={(swiper) => { swiperRef.current = swiper; }}
                            onSlideChange={(swiper) => setActiveSlideIndex(swiper.activeIndex)}
                            coverflowEffect={{
                                rotate: 0,
                                stretch: 0,
                                depth: 200,
                                modifier: 1.5,
                                slideShadows: true,
                            }}
                            modules={[EffectCoverflow]}
                            className="pb-4"
                            navigation
                        >
                            {allRanks.map((rank) => (
                                <SwiperSlide key={rank.rank_id} style={{ width: '200px' }}>
                                    <div 
                                        className={`rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-300 border-2 min-h-[240px] ${
                                            rank.is_current_rank 
                                                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-400 shadow-xl shadow-red-100' 
                                                : 'bg-white border-gray-100'
                                        }`}
                                    >
                                        {/* Rank Badge */}
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center p-1 ${
                                            rank.is_current_rank ? 'bg-red-50 ring-2 ring-red-300' : 'bg-gray-50'
                                        }`}>
                                            <Image 
                                                src={rank.rank_img || "/images/user.png"} 
                                                alt={rank.name} 
                                                width={90} 
                                                height={90} 
                                                sizes="90px"
                                                className="object-contain"
                                                unoptimized
                                            />
                                        </div>
                                        
                                        {/* Rank Name */}
                                        <p className={`text-sm font-bold text-center leading-tight ${
                                            rank.is_current_rank ? 'text-red-600' : 'text-gray-700'
                                        }`}>
                                            {rank.name}
                                        </p>
                                        
                                        {/* RP Range */}
                                        <p className="text-xs text-gray-400 text-center">
                                            {rank.max_rp !== null 
                                                ? `${rank.min_rp.toLocaleString()} - ${rank.max_rp.toLocaleString()} RP` 
                                                : `${rank.min_rp.toLocaleString()}+ RP`
                                            }
                                        </p>
                                        
                                        {/* Current Badge */}
                                        {rank.is_current_rank && (
                                            <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-semibold">
                                                แรงค์ปัจจุบัน
                                            </span>
                                        )}
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>

                        {/* Go to my rank button — always reserve space */}
                        <div className="flex justify-center mt-4 h-10">
                            <button
                                onClick={() => swiperRef.current?.slideTo(currentRankIndex)}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-red-500 !text-white hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 ${
                                    activeSlideIndex === currentRankIndex ? 'invisible' : ''
                                }`}
                            >
                                {activeSlideIndex > currentRankIndex && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 18 9 12 15 6"></polyline>
                                    </svg>
                                )}
                                กลับไปแรงค์ของฉัน
                                {activeSlideIndex < currentRankIndex && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                )}
                            </button>
                        </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}

export default function MyProfile() {
    return (
        <Suspense fallback={<GifLoader />}>
            <MyProfileContent />
        </Suspense>
    );
}
