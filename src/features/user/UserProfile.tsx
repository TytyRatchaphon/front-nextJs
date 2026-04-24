"use client";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { App, Image as AntdImage } from "antd";
import { useRouter } from "next/navigation";
import GifLoader from '@/components/utility/GifLoader';
import { imageLoader } from '@/utils/imageUtils';
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import CollectionCard from "@/components/collection/CollectionCard";
import { usePublicUserProfileData } from "./hooks/usePublicUserProfile";
import { AchievementShowcaseCard } from "./components/AchievementShowcaseCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { copyCollection } from "@/services/api/collectionApi";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import FrameOverlayImage from "@/components/ui/FrameOverlayImage";

function UserProfileContent({ userId }: { userId: string }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { settings } = useWebsiteSettings();
    const { notification } = App.useApp();
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const openLoginModal = useUIStore((s) => s.openLoginModal);
    const [bannerError, setBannerError] = useState(false);
    const [copyingCollectionId, setCopyingCollectionId] = useState<number | null>(null);

    const { profile, rank, achievements, collections, isLoading, isError } = usePublicUserProfileData(userId);

    const copyCollectionMutation = useMutation({
        mutationFn: (collectionId: number) => copyCollection(collectionId),
        onSuccess: (res) => {
            notification.success({
                message: res?.message || 'คัดลอกคอลเล็กชันสำเร็จ',
                placement: 'topRight',
            });
            queryClient.invalidateQueries({ queryKey: ['userCollections'] });
        },
        onError: (err: any) => {
            notification.error({
                message: err?.response?.data?.message || 'ไม่สามารถคัดลอกคอลเล็กชันได้',
                placement: 'topRight',
            });
        },
        onSettled: () => {
            setCopyingCollectionId(null);
        },
    });

    const handleCopyCollection = (collectionId: number) => {
        if (!isLoggedIn) {
            openLoginModal();
            return;
        }
        setCopyingCollectionId(collectionId);
        copyCollectionMutation.mutate(collectionId);
    };

    useEffect(() => {
        if (profile?.fullname) {
            document.title = `${profile.fullname} - EnjoyBook Profile`;
        }
    }, [profile?.fullname]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <GifLoader className="h-64" width={150} height={150} />
            </div>
        );
    }

    if (isError || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลผู้ใช้</h2>
                    <p className="text-gray-500 mb-6">ผู้ใช้นี้อาจไม่มีอยู่ หรือเกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-red-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors"
                    >
                        ย้อนกลับ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-primary pb-20">
            {/* Banner Section */}
            <div className="w-full h-[200px] md:h-[320px] relative overflow-hidden bg-gray-100">
                {profile.banner && !bannerError ? (
                    <AntdImage
                        src={imageLoader({
                            src: profile.banner,
                            width: 1200
                        })}
                        alt="Banner"
                        width="100%"
                        height="100%"
                        style={{ objectFit: "cover" }}
                        preview={false}
                        onError={() => setBannerError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-red-500 to-rose-400" />
                )}
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Profile Info Section */}
            <div className="container mx-auto px-4 relative z-10 -mt-20 md:-mt-24 mb-8">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-lg p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 border border-white/50">
                    
                    {/* Avatar Container */}
                    <div className="relative -mt-16 md:-mt-20 shrink-0">
                        <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-[6px] border-white shadow-md overflow-hidden bg-gray-50 relative group">
                            <AntdImage
                                src={imageLoader({
                                    src: profile.img || '/images/default-avatar.png',
                                    width: 300
                                })}
                                alt="Profile"
                                width="100%"
                                height="100%"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                style={{ objectFit: "cover", zIndex: 1 }}
                                preview={false}
                                fallback="/images/default-avatar.png"
                            />
                            {profile.frame && (
                                <div className="absolute inset-0 pointer-events-none z-10">
                                    <FrameOverlayImage src={profile.frame.img} alt={profile.frame.name} className="object-cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Container */}
                    <div className="flex-1 text-center md:text-left w-full">
                        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 truncate px-2 md:px-0">
                            {profile.fullname}
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base mb-4 font-medium px-2 md:px-0">
                            {profile.aka?.name ? `"${profile.aka.name}"` : ''}
                        </p>
                        
                        {/* Stats Badges */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <div className="bg-blue-50/80 border border-blue-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M9.15957 10.87C9.05957 10.86 8.93957 10.86 8.82957 10.87C6.44957 10.79 4.55957 8.84 4.55957 6.44C4.55957 3.99 6.53957 2 8.99957 2C11.4496 2 13.4396 3.99 13.4396 6.44C13.4296 8.84 11.5396 10.79 9.15957 10.87Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M16.4103 4C18.3503 4 19.9103 5.57 19.9103 7.5C19.9103 9.39 18.4103 10.93 16.5403 11C16.4603 10.99 16.3703 10.99 16.2803 11" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M4.15973 14.56C1.73973 16.18 1.73973 18.82 4.15973 20.43C6.90973 22.27 11.4197 22.27 14.1697 20.43C16.5897 18.81 16.5897 16.17 14.1697 14.56C11.4297 12.73 6.91973 12.73 4.15973 14.56Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M18.3398 20C19.0598 19.85 19.7398 19.56 20.2998 19.13C21.8598 17.96 21.8598 16.03 20.2998 14.86C19.7498 14.44 19.0798 14.16 18.3698 14" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <div className="flex flex-col">
                                    <span className="text-xs text-blue-600/70 font-semibold uppercase tracking-wider">ผู้ติดตาม</span>
                                    <span className="text-sm font-bold text-blue-700 leading-none">{profile.totalFollowers.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="bg-emerald-50/80 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="19" viewBox="0 0 24 19" fill="none">
                                    <path d="M23.1429 9.77693e-07H17.0143C15.6991 9.77693e-07 14.4134 0.377679 13.3071 1.09018L12 1.92857L10.6929 1.09018C9.58771 0.377816 8.30056 -0.000702109 6.98571 9.77693e-07H0.857143C0.383036 9.77693e-07 0 0.383037 0 0.857144V16.0714C0 16.5455 0.383036 16.9286 0.857143 16.9286H6.98571C8.30089 16.9286 9.58661 17.3063 10.6929 18.0188L11.8821 18.7848C11.917 18.8063 11.9571 18.8196 11.9973 18.8196C12.0375 18.8196 12.0777 18.8089 12.1125 18.7848L13.3018 18.0188C14.4107 17.3063 15.6991 16.9286 17.0143 16.9286H23.1429C23.617 16.9286 24 16.5455 24 16.0714V0.857144C24 0.383037 23.617 9.77693e-07 23.1429 9.77693e-07ZM6.98571 15H1.92857V1.92857H6.98571C7.93393 1.92857 8.85536 2.19911 9.65089 2.71072L10.958 3.54911L11.1429 3.66964V16.0446C9.86786 15.3589 8.44286 15 6.98571 15ZM22.0714 15H17.0143C15.5571 15 14.1321 15.3589 12.8571 16.0446V3.66964L13.042 3.54911L14.3491 2.71072C15.1446 2.19911 16.0661 1.92857 17.0143 1.92857H22.0714V15ZM8.91696 5.35714H3.94018C3.83571 5.35714 3.75 5.44821 3.75 5.55804V6.76339C3.75 6.87321 3.83571 6.96429 3.94018 6.96429H8.91429C9.01875 6.96429 9.10446 6.87321 9.10446 6.76339V5.55804C9.10714 5.44821 9.02143 5.35714 8.91696 5.35714ZM14.8929 5.55804V6.76339C14.8929 6.87321 14.9786 6.96429 15.083 6.96429H20.0571C20.1616 6.96429 20.2473 6.87321 20.2473 6.76339V5.55804C20.2473 5.44821 20.1616 5.35714 20.0571 5.35714H15.083C14.9786 5.35714 14.8929 5.44821 14.8929 5.55804ZM8.91696 9.10714H3.94018C3.83571 9.10714 3.75 9.19821 3.75 9.30804V10.5134C3.75 10.6232 3.83571 10.7143 3.94018 10.7143H8.91429C9.01875 10.7143 9.10446 10.6232 9.10446 10.5134V9.30804C9.10714 9.19821 9.02143 9.10714 8.91696 9.10714ZM20.0598 9.10714H15.083C14.9786 9.10714 14.8929 9.19821 14.8929 9.30804V10.5134C14.8929 10.6232 14.9786 10.7143 15.083 10.7143H20.0571C20.1616 10.7143 20.2473 10.6232 20.2473 10.5134V9.30804C20.25 9.19821 20.1643 9.10714 20.0598 9.10714Z" fill="#000000" />
                                </svg>
                                <div className="flex flex-col">
                                    <span className="text-xs text-emerald-600/70 font-semibold uppercase tracking-wider">ชั้นหนังสือ</span>
                                    <span className="text-sm font-bold text-emerald-700 leading-none">{profile.totalBooksInShelf.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="container mx-auto px-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column (Rank) */}
                    <div className="md:col-span-6 lg:col-span-6 flex flex-col gap-6">
                        {rank && (
                            <div className="w-full bg-gradient-to-br from-[#E6E8ED] via-[#F4F5F7] to-[#D5D7DF] rounded-2xl p-5 shadow-sm relative overflow-hidden border border-gray-200 h-full min-h-[160px]">
                                <div className="absolute -right-10 -bottom-10 w-50 h-50 opacity-15 pointer-events-none">
                                    <Image 
                                        src={rank.current_rank.rank_img} 
                                        alt="" 
                                        fill 
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                                
                                <div className="relative z-10 flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 bg-white/60 rounded-full shadow-sm flex items-center justify-center p-2 border border-white/80 shrink-0">
                                            <div className="relative w-full h-full">
                                                <Image 
                                                    src={rank.current_rank.rank_img} 
                                                    alt={rank.current_rank.name} 
                                                    fill
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs font-semibold tracking-wider">ระดับปัจจุบัน</p>
                                            <p className="text-gray-900 font-bold text-lg">{rank.current_rank.name}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 bg-red-100/50 px-3 py-1.5 rounded-xl border border-red-200/50">
                                        {settings?.rp && (
                                            <Image
                                                src={settings.rp}
                                                alt="RP"
                                                width={18}
                                                height={18}
                                                className="object-contain"
                                                unoptimized
                                            />
                                        )}
                                        <span className="text-red-600 font-bold text-lg">{rank.total_rp.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-auto">
                                    <div className="w-full h-2.5 bg-[#FA807280] rounded-full overflow-hidden mb-2 shadow-inner relative">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-[#FF0000] rounded-full transition-all duration-500 ease-out"
                                            style={{ 
                                                width: `${rank.current_rank.max_rp > 0 ? Math.min(100, Math.max(0, (rank.total_rp / rank.current_rank.max_rp) * 100)) : 0}%` 
                                            }}
                                        />
                                    </div>
                                    {rank.next_rank && (
                                        <div className="relative z-10 text-sm mt-3 font-medium text-gray-700">
                                            ต้องการอีก <span className="text-red-600 font-bold mx-1">{rank.rp_needed.toLocaleString()}</span> แต้ม เพื่ออัปแรงค์เป็น <span className="text-yellow-600 font-bold ml-1">{rank.next_rank.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (Achievements) */}
                    <div className="md:col-span-6 lg:col-span-6 h-full">
                        <AchievementShowcaseCard data={achievements} />
                    </div>

                </div>

                {/* Public Collections Section */}
                <div className="mt-12 md:mt-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            คอลเล็กชันสาธารณะ
                        </h2>
                    </div>
                    
                    {collections?.list && collections.list.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {collections.list.map((collection: any) => (
                                <div key={collection.id} className="relative transition-transform hover:-translate-y-1 duration-300">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyCollection(collection.id);
                                        }}
                                        disabled={copyingCollectionId === collection.id}
                                        className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-gray-200 px-3 py-1.5 text-xs font-semibold !text-black hover:text-red-600 hover:border-red-300 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                        {copyingCollectionId === collection.id ? 'กำลังคัดลอก...' : 'คัดลอก'}
                                    </button>
                                    <div onClick={() => router.push(`/profile/${userId}/collection/${collection.id}`)} className="cursor-pointer">
                                    <CollectionCard collection={collection} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">ไม่มีคอลเล็กชัน</h3>
                            <p className="text-gray-500 text-sm">ผู้ใช้นี้ยังไม่ได้สร้างคอลเล็กชันสาธารณะ</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UserProfile({ userId }: { userId: string }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <GifLoader className="h-64" width={150} height={150} />
            </div>
        }>
            <UserProfileContent userId={userId} />
        </Suspense>
    );
}

