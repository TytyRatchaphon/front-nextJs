"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import Image from "next/image";
import { Image as AntdImage } from "antd";
import { Pagination, Select, Empty, Button, message, Modal } from "antd";
import { fetchWriterBooks, fetchPublicWriterProfile, followWriter, WriterBook, WriterProfileResponse } from "@/services/apiServices";
import CardBook from "@/components/novelCard/CardBook";
import { useSearchParams } from "next/navigation";
import { FacebookShareButton, TwitterShareButton, LineShareButton } from "react-share";
import { useUIStore } from "@/stores/uiStore";
import GifLoader from '@/components/utility/GifLoader';
import { imageLoader } from '@/utils/imageUtils';
import Cookies from 'js-cookie';


const TABS = [
    { key: "all", label: "นิยายทั้งหมด" },
    { key: "new", label: "นิยายมาใหม่" },
    { key: "end", label: "จบแล้ว" },
];


function WriterProfileContent() {
    const searchParams = useSearchParams();
    // Default writerId from prompt JSON if not in URL
    const writerId = searchParams.get("id") || "17966";

    const [books, setBooks] = useState<WriterBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize] = useState(24);
    const [sortBy, setSortBy] = useState("view");

    // Follow State
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // Antd Message Hook
    const [messageApi, contextHolder] = message.useMessage();
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const openLoginModal = useUIStore((s) => s.openLoginModal);

    // Profile State
    const [profile, setProfile] = useState<WriterProfileResponse['data'] | null>(null);
    const [bannerError, setBannerError] = useState(false);

    // Reset banner error when data changes
    useEffect(() => {
        setBannerError(false);
    }, [profile?.writer?.banner]);

    // Fetch Profile
    useEffect(() => {
        const loadProfile = async () => {
            const data = await fetchPublicWriterProfile(writerId);
            if (data) {
                setProfile(data);
                setIsFollowing(data.isFollowing);
            }
        };
        if (writerId) loadProfile();
    }, [writerId]);

    // Set Document Title
    useEffect(() => {
        if (profile?.writer?.writer_name) {
            document.title = `${profile.writer.writer_name}`;
        } else {
            document.title = "EnjoyBook - อ่านนิยายออนไลน์";
        }
    }, [profile]);

    // Share logic replaced by react-share components directly in JSX

    const fetchBooks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchWriterBooks(writerId, activeTab, currentPage, pageSize, sortBy);
            if (data) {
                setBooks(data.items || []);
                setTotalItems(data.total || 0);
            } else {
                setBooks([]);
                setTotalItems(0);
            }
        } catch {
        } finally {
            setLoading(false);
        }
    }, [writerId, activeTab, currentPage, pageSize, sortBy]);

    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    // Handle Tab Change
    const handleTabChange = (key: string) => {
        setActiveTab(key);
        setCurrentPage(1); // Reset to page 1
    };

    const handleFollow = async () => {
        const token = Cookies.get('token');
        if (!token) {
            openLoginModal();
            return;
        }

        setFollowLoading(true);
        try {
            const action = isFollowing ? 'unfollow' : 'follow';
            await followWriter(writerId, action);

            setIsFollowing(!isFollowing);

            // Show Feedback Message
            if (action === 'follow') {
                messageApi.success("ติดตามนักเขียนเรียบร้อยแล้ว");
            } else {
                messageApi.success("ยกเลิกติดตามนักเขียนเรียบร้อยแล้ว");
            }

            // Optionally update the follower count locally for immediate feedback
            if (profile) {
                setProfile({
                    ...profile,
                    follower_count: isFollowing
                        ? Math.max(0, profile.follower_count - 1)
                        : profile.follower_count + 1
                });
            }

        } catch {
            messageApi.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setFollowLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-primary pb-10">
            {contextHolder}
            {/* Banner Section */}
            <div className="w-full h-[200px] md:h-[280px] relative overflow-hidden bg-gray-100">
                {profile?.writer?.banner && !bannerError ? (
                    <AntdImage
                        src={imageLoader({
                            src: profile.writer.banner.startsWith('http') || profile.writer.banner.startsWith('data:') || profile.writer.banner.startsWith('/')
                                ? profile.writer.banner
                                : `https://img.enjoybook.co/${profile.writer.banner}`,
                            width: 1000
                        })}
                        alt="Banner"
                        width="100%"
                        height="100%"
                        style={{ objectFit: "cover" }}
                        preview={{}}
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
                                    src: profile?.writer?.img
                                        ? (profile.writer.img.startsWith('http') || profile.writer.img.startsWith('data:') || profile.writer.img.startsWith('/')
                                            ? profile.writer.img
                                            : `https://img.enjoybook.co/${profile.writer.img}`)
                                        : "/images/default-avatar.png",
                                    width: 300
                                })}
                                alt="Profile"
                                width="100%"
                                height="100%"
                                className="object-cover transition-transform duration-500"
                                style={{ objectFit: "cover" }}
                                preview={{}}
                                fallback="/images/default-avatar.png"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left w-full md:w-auto">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 truncate px-2 md:px-0">{profile?.writer?.writer_name || "กำลังโหลด..."}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-gray-600 text-sm font-medium">
                            <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full transition-colors hover:bg-gray-200 cursor-default">
                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                {(profile?.follower_count)?.toLocaleString() || 0} ผู้ติดตาม
                            </span>
                            <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full transition-colors hover:bg-gray-200 cursor-default">
                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                {(profile?.book_count)?.toLocaleString() || 0} เรื่อง
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 w-full md:w-auto justify-center md:justify-start">
                        <Button
                            loading={followLoading}
                            onClick={handleFollow}
                            className={`rounded-full px-8 h-12 text-base font-medium transition-all flex items-center gap-2 shadow-sm ${isFollowing
                                ? "bg-white border border-gray-300 text-gray-800 hover:!border-red-600 hover:!text-red-600"
                                : "bg-white border border-gray-300 text-gray-800 hover:!border-red-600 hover:!text-red-600"
                                }`}
                        >
                            {isFollowing ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-base">กำลังติดตาม</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span>+</span> ติดตาม
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => setShareModalOpen(true)}
                            className="rounded-full w-12 h-12 flex items-center justify-center border-gray-200 text-gray-500 hover:!text-red-500 hover:!border-red-500 shadow-sm bg-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Tabs & Filter Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-100 mb-6 gap-4">

                    {/* Custom Tabs */}
                    <div className="flex overflow-x-auto w-full md:w-auto pb-2 md:pb-0 gap-6 no-scrollbar">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`text-sm font-medium whitespace-nowrap pb-3 border-b-2 transition-colors ${activeTab === tab.key
                                    ? "border-red-600 text-red-600"
                                    : "border-transparent text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                <span className={activeTab === tab.key ? "" : "opacity-80"}>
                                    {tab.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="w-full md:w-48 pb-2 md:pb-0">
                        <Select
                            defaultValue="view"
                            value={sortBy}
                            onChange={(val) => setSortBy(val)}
                            className="w-full"
                            options={[
                                { value: "view", label: "เรียงตาม: ยอดวิว" },
                                { value: "newest", label: "เรียงตาม: ล่าสุด" },
                                { value: "name", label: "เรียงตาม: ชื่อเรื่อง" },
                            ]}
                        />
                    </div>
                </div>

                {/* Book Grid */}
                {loading ? (
                    <GifLoader className="h-64" width={150} height={150} />
                ) : (
                    <>
                        {books.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-6">
                                {books.map((book) => (
                                    <div key={book.book_id} className="flex justify-center w-full">
                                        <CardBook book={book} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20">
                                <Empty description="ไม่พบหนังสือในหมวดหมู่นี้" />
                            </div>
                        )}

                        {/* Pagination */}
                        {totalItems > 0 && (
                            <div className="mt-12 flex justify-center">
                                <Pagination
                                    current={currentPage}
                                    total={totalItems}
                                    pageSize={pageSize}
                                    onChange={(page) => setCurrentPage(page)}
                                    showSizeChanger={false}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Share Modal */}
            <Modal
                open={shareModalOpen}
                onCancel={() => setShareModalOpen(false)}
                footer={null}
                centered
                width={600}
                closeIcon={<span className="text-gray-400 text-xl font-light">×</span>}
            >
                <div className="flex flex-col items-center p-4">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">แชร์โปรไฟล์นักเขียน</h3>

                    {/* Social Icons */}
                    <div className="flex gap-4 mb-6">
                        {/* Facebook */}
                        <FacebookShareButton
                            url={typeof window !== 'undefined' ? window.location.href : ''}
                            className="hover:opacity-80 transition-opacity"
                        >
                            <Image src="/images/social-1.png" alt="Facebook" width={48} height={48} unoptimized />
                        </FacebookShareButton>

                        {/* Twitter */}
                        <TwitterShareButton
                            url={typeof window !== 'undefined' ? window.location.href : ''}
                            title={`ติดตามนักเขียน ${profile?.writer?.writer_name || ''} ที่ EnjoyBook`}
                            className="hover:opacity-80 transition-opacity"
                        >
                            <Image src="/images/social-3.png" alt="Twitter" width={48} height={48} unoptimized />
                        </TwitterShareButton>

                        {/* Line */}
                        <LineShareButton
                            url={typeof window !== 'undefined' ? window.location.href : ''}
                            title={`ติดตามนักเขียน ${profile?.writer?.writer_name || ''} ที่ EnjoyBook`}
                            className="hover:opacity-80 transition-opacity"
                        >
                            <Image src="/images/social-2.png" alt="Line" width={48} height={48} unoptimized />
                        </LineShareButton>
                    </div>

                    {/* Copy Link Section */}
                    <div className="flex w-full gap-2">
                        <input
                            type="text"
                            readOnly
                            value={typeof window !== 'undefined' ? window.location.href : ''}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-600 text-sm focus:outline-none bg-white"
                        />
                        <button
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    navigator.clipboard.writeText(window.location.href);
                                    messageApi.success("คัดลอกลิงก์แล้ว");
                                }
                            }}
                            className="bg-[#f7f8fa] hover:bg-[#9a9a9e] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            copy link
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default function WriterProfile() {
    return (
        <Suspense fallback={<GifLoader />}>
            <WriterProfileContent />
        </Suspense>
    );
}
