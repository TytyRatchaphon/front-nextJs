import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveTypes, fetchActiveCategories } from '@/services/apiServices';
import { Spin } from 'antd';

const NovelMenu = () => {
    const [selectedType, setSelectedType] = useState<string>('all');

    const { data: activeTypes = [], isLoading: isLoadingTypes } = useQuery({
        queryKey: ['activeTypes'],
        queryFn: fetchActiveTypes,
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 2 * 60 * 60 * 1000, // 2 hours
    });

    const { data: activeCategories = [], isLoading: isLoadingCategories } = useQuery({
        queryKey: ['activeCategories', selectedType],
        queryFn: () => fetchActiveCategories(selectedType),
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 2 * 60 * 60 * 1000, // 2 hours
        enabled: !!selectedType,
    });

    if (isLoadingTypes) {
        return (
            <div className="w-[800px] bg-white shadow-xl rounded-xl p-6 border border-gray-100 flex justify-center items-center h-[300px]">
                <Spin />
            </div>
        );
    }

    return (
        <div className="flex w-[800px] bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
            {/* Left Column: Types */}
            <div className="w-[200px] bg-gray-50 flex-shrink-0 py-4 border-r border-gray-100">
                <div className="flex flex-col">
                    {activeTypes.map((type: any) => (
                        <div
                            key={type.type}
                            className={`
                                relative px-6 py-3 cursor-pointer transition-all duration-200
                                ${selectedType === type.type 
                                    ? 'bg-white text-red-600 font-bold' 
                                    : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
                                }
                            `}
                            onMouseEnter={() => setSelectedType(type.type)}
                            onClick={() => setSelectedType(type.type)} // Support click for touch/hybrid
                        >
                            {selectedType === type.type && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" />
                            )}
                            <div className="flex items-center justify-between">
                                <span className="font-primary text-base">{type.label}</span>
                                {selectedType === type.type && (
                                     <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Categories */}
            <div className="flex-1 p-6 bg-white">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <h3 className="text-lg font-bold text-gray-800">
                        {activeTypes.find((t: any) => t.type === selectedType)?.label || 'หมวดหมู่'}
                    </h3>
                </div>

                {isLoadingCategories ? (
                    <div className="flex justify-center items-center h-[200px]">
                        <Spin />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                        {activeCategories.length > 0 ? (
                            activeCategories.map((cat: any) => (
                                <Link 
                                    key={cat.id}
                                    href={`/cat/list?type=${selectedType}&categoryId=${cat.id}&tab=bestseller&period=30&limit=10&page=1`}
                                    className="text-gray-600 hover:text-red-600 transition-colors text-sm py-1 truncate block"
                                    title={cat.name}
                                    prefetch={false}
                                >
                                    {cat.name}
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-3 text-center text-gray-400 py-10">
                                ไม่พบหมวดหมู่ในประเภทนี้
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NovelMenu;
