"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { Image as AntdImage } from "antd";
import { useRouter } from "next/navigation";
import GifLoader from '@/components/utility/GifLoader';
import { imageLoader } from '@/utils/imageUtils';
import { useWebsiteStore } from "@/stores/websiteStore";
import type { CollectionItem } from '@/services/api/collectionApi';
import CollectionCard from "@/components/collection/CollectionCard";

// --- Mocks ---
const MOCK_USER = {
    user_id: 999,
    fullname: "Mock Public User",
    aka: { name: "นักอ่านในตำนาน" },
    img: "/images/default-avatar.png",
    banner: null,
    frame: null,
};

const MOCK_RANK_DATA = {
    total_rp: 15420,
    rp_needed: 4580,
    current_rank: {
        rank_id: 3,
        name: "Gold Reader",
        min_rp: 10000,
        max_rp: 20000,
        rank_img: "https://image.enjoybook.co/enjoybook.image/rank/202602241505545qtm.png" // Placeholder
    },
    next_rank: {
        name: "Platinum Reader",
        rank_img: "https://image.enjoybook.co/enjoybook.image/rank/202602241505545qtm.png"
    }
};

const MOCK_PUBLIC_COLLECTIONS: CollectionItem[] = [
    {
        id: 101,
        name: "นิยายโปรดที่อยากแบ่งปัน",
        description: "รวมนิยายสนุกๆ ที่อ่านจบแล้วรู้สึกชอบมาก",
        is_public: true,
        cover_image: "https://image.enjoybook.co/book/1.jpg",
        is_pinned: true,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        book_count: 5,
        books: []
    },
    {
        id: 102,
        name: "แนวแฟนตาซีทะลุมิติ",
        description: "พล็อตเรื่องล้ำๆ แนวระบบ",
        is_public: true,
        cover_image: null,
        is_pinned: false,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        book_count: 12,
        books: []
    }
];
// ------------

function UserProfileContent({ userId }: { userId: string }) {
    const router = useRouter();
    const { settings } = useWebsiteStore();

    const [bannerError, setBannerError] = useState(false);
    const [loading, setLoading] = useState(true);

    // Mock Loading
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, [userId]);

    useEffect(() => {
        document.title = `${MOCK_USER.fullname} - EnjoyBook Profile`;
    }, []);

    if (loading) {
        return <GifLoader className="h-64" width={150} height={150} />;
    }

    const user = MOCK_USER;
    const rankData = MOCK_RANK_DATA;
    const collections = MOCK_PUBLIC_COLLECTIONS;

    return (
        <div className="min-h-screen bg-white font-primary pb-10">
            {/* Banner Section */}
            <div className="w-full h-[200px] md:h-[280px] relative overflow-hidden bg-gray-100">
                {user.banner && !bannerError ? (
                    <AntdImage
                        src={imageLoader({
                            src: user.banner,
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
                <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Profile Bar */}
            <div className="container mx-auto px-4 relative z-10 -mt-16 mb-8 md:mb-12">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-6 flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-6 border border-gray-100/50">
                    {/* Avatar */}
                    <div className="relative -mt-16 md:-mt-20 shrink-0">
                        <div className="w-28 h-28 md:w-40 md:h-40 rounded-full border-[4px] md:border-[6px] border-white shadow-lg overflow-hidden bg-gray-50 relative group">
                            <AntdImage
                                src={imageLoader({
                                    src: user.img,
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
                            {user.frame && (
                                <div className="absolute inset-0 pointer-events-none z-10">
                                    {/* Handle frame rendering if available */}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left w-full md:w-auto">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 truncate px-2 md:px-0">
                            {user.fullname}
                        </h1>
                        <p className="text-gray-500 text-sm mb-3 font-medium">
                            ฉายา: {user.aka?.name || 'ไม่มีฉายา'}
                        </p>
                    </div>

                </div>
            </div>

            <div className="container mx-auto px-4 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Rank Card */}
                    <div className="w-full bg-gradient-to-br from-[#E6E8ED] via-[#F4F5F7] to-[#D5D7DF] rounded-2xl p-5 shadow-sm relative overflow-hidden border border-gray-200">
                        <div className="absolute -right-10 -bottom-10 w-50 h-50 opacity-15 pointer-events-none">
                            <Image 
                                src={rankData.current_rank.rank_img} 
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
                                        src={rankData.current_rank.rank_img} 
                                        alt={rankData.current_rank.name} 
                                        width={48} 
                                        height={48} 
                                        className="object-contain"
                                    />
                                </div>
                                {/* Rank Details */}
                                <div>
                                    <p className="text-gray-500 text-xs font-semibold tracking-wider">ระดับชั้นอ่าน</p>
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
                                className="h-full bg-[#FF0000] rounded-full transition-all duration-500 ease-out"
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
                </div>

                {/* Public Collections Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        คอลเล็กชันสาธารณะ
                    </h2>
                    
                    {collections.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {collections.map((collection) => (
                                <div key={collection.id} onClick={() => router.push(`/shelve/collection/${collection.id}`)} className="cursor-pointer">
                                    <CollectionCard collection={collection} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-gray-500">ยังไม่มีคอลเล็กชันสาธารณะ</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UserProfile({ userId }: { userId: string }) {
    return (
        <Suspense fallback={<GifLoader className="h-64" width={150} height={150} />}>
            <UserProfileContent userId={userId} />
        </Suspense>
    );
}
