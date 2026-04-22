'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { useQuery } from "@tanstack/react-query";
import { fetchCategoryRankingBooks, CategoryRankingBookItem, fetchBookCategoryAll } from "@/services/apiServices";
import "@/types/api";
import { Select } from 'antd';
import GifLoader from '@/components/utility/GifLoader';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';

interface CategoryRankProps {
    categoryId?: string | number;
}

export default function CategoryRank({ categoryId }: CategoryRankProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

    const { data: categories = [] } = useQuery({
        queryKey: ['bookCategories'],
        queryFn: fetchBookCategoryAll,
    });

    const { data: books = [], isLoading } = useQuery({
        queryKey: ['categoryRankingPage', categoryId, activeTab],
        queryFn: () => {
            // Changed from number days to string keywords
            if (!categoryId) return [];
            return fetchCategoryRankingBooks(Number(categoryId), activeTab, 50);
        },
        enabled: !!categoryId,
    });

    const handleCategoryChange = (value: number) => {
        router.push(`/ranking/category/${value}`);
    };

    return (
        <div className="container mx-auto px-4 py-8 font-primary">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header/Tabs */}
                <div className="border-b border-gray-100 p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 flex-wrap">
                        <h1 className="text-xl font-bold">จัดอันดับตามหมวดหมู่</h1>
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <h2 className="text-lg font-bold whitespace-nowrap">เลือกหมวดหมู่ :</h2>
                            <Select
                                style={{ width: '100%', maxWidth: '200px' }}
                                placeholder="เลือกหมวดหมู่"
                                value={categoryId ? Number(categoryId) : undefined}
                                onChange={handleCategoryChange}
                                options={categories.map((cat) => ({
                                    label: cat.name,
                                    value: cat.id,
                                }))}
                                className="font-primary custom-select-red flex-1 sm:flex-none"
                            />
                        </div>
                    </div>
                    <style jsx global>{`
                        .custom-select-red .ant-select-selector {
                            transition: all 0.3s !important;
                        }
                        .custom-select-red:hover .ant-select-selector {
                            border-color: #dc2626 !important;
                        }
                        .custom-select-red.ant-select-focused .ant-select-selector {
                            border-color: #dc2626 !important;
                            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1) !important;
                        }
                        .custom-select-red .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
                            background-color: #fef2f2 !important;
                            color: #dc2626 !important;
                        }
                    `}</style>
                    <div className="flex text-lg font-bold">
                        <button
                            onClick={() => setActiveTab('weekly')}
                            className={`flex-1 py-4 text-center transition-colors relative ${activeTab === 'weekly' ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:text-red-500 hover:bg-gray-50'
                                }`}
                        >
                            สัปดาห์
                            {activeTab === 'weekly' && (
                                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-red-600" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('monthly')}
                            className={`flex-1 py-4 text-center transition-colors relative ${activeTab === 'monthly' ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:text-red-500 hover:bg-gray-50'
                                }`}
                        >
                            เดือน
                            {activeTab === 'monthly' && (
                                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-red-600" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('yearly')}
                            className={`flex-1 py-4 text-center transition-colors relative ${activeTab === 'yearly' ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:text-red-500 hover:bg-gray-50'
                                }`}
                        >
                            ปี
                            {activeTab === 'yearly' && (
                                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-red-600" />
                            )}
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="p-2 md:p-6 min-h-[500px]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full py-20">
                            <GifLoader className="h-20" />
                        </div>
                    ) : books.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <p>ไม่พบข้อมูลการจัดอันดับ</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {books.map((book: CategoryRankingBookItem) => (
                                <div key={book.book_id} className="flex items-start md:items-center gap-3 md:gap-4 py-3 px-3 md:py-4 md:px-4 border border-gray-100 hover:border-red-100 hover:bg-red-50/30 rounded-xl transition-all group cursor-pointer bg-white shadow-sm hover:shadow-md">
                                    {/* Rank Number */}
                                    <div className="w-8 md:w-16 flex-shrink-0 text-center mt-1 md:mt-0">
                                        <span className={`text-xl md:text-4xl font-bold ${book.rank <= 3 ? 'text-red-500' : 'text-gray-800'}`}>
                                            {book.rank}
                                        </span>
                                    </div>

                                    {/* Book Cover */}
                                    <div className="relative w-[70px] h-[105px] md:w-[100px] md:h-[150px] flex-shrink-0 shadow-md rounded-lg overflow-hidden">
                                        <Image
                                            src={resolveBookCoverImageSrc(book, '/images/ejb.png')}
                                            alt={book.name}
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 md:gap-2">
                                        <Link href={`/book/${book.book_id}`}>
                                            <h3 className="text-base md:text-xl font-bold text-gray-900 line-clamp-2 md:truncate group-hover:text-red-600 transition-colors">
                                                {book.name}
                                            </h3>
                                        </Link>
                                        <p className="text-xs md:text-sm text-gray-500 flex items-center gap-2">
                                            โดย <span className="text-gray-800 font-medium">{book.writer_name}</span>
                                        </p>

                                        <div className="flex items-center flex-wrap gap-2 mt-1 w-full overflow-hidden">
                                            <div className="flex items-center gap-1 text-gray-500 text-[10px] md:text-sm bg-gray-100 px-2 py-0.5 md:py-1 rounded-full flex-shrink-0">
                                                <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                                <span>{(book.view || 0).toLocaleString()}</span>
                                            </div>

                                            {/* Tag Swiper */}
                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                <Swiper
                                                    slidesPerView="auto"
                                                    spaceBetween={4}
                                                    freeMode={true}
                                                    modules={[FreeMode]}
                                                    className="w-full"
                                                >
                                                    {(Array.isArray(book.tag) ? book.tag : (typeof book.tag === 'string' ? book.tag.split(',') : [])).map((tag, i) => (
                                                        <SwiperSlide key={i} className="!w-auto">
                                                            <Link href={`/search?q=${tag.trim()}`} className="block">
                                                                <span className="border border-red-300 text-red-500 text-[10px] md:text-xs px-2 py-0.5 rounded leading-none whitespace-nowrap hover:bg-red-50 transition-colors block">
                                                                    {tag.trim()}
                                                                </span>
                                                            </Link>
                                                        </SwiperSlide>
                                                    ))}
                                                </Swiper>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
