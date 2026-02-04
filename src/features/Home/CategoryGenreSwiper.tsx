"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveCategories } from '@/services/apiServices';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CategoryGenreSwiper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type') || 'all';
  const currentCategoryId = searchParams.get('categoryId') || 'all';
  const currentTab = searchParams.get('tab') || 'new';

  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showExpandButton, setShowExpandButton] = useState(false);

  const { data: genres = [] } = useQuery({
    queryKey: ['activeCategories', currentType],
    queryFn: () => fetchActiveCategories(currentType),
    staleTime: 5 * 60 * 1000,
  });

  const allGenres = [{ id: 'all', name: 'ทั้งหมด' }, ...genres.filter(g => g.id !== 'all')];

  useEffect(() => {
    // Simple check: if we have many items, show button. 
    // Or we can check height overflow, but a simple count check is stable.
    if (allGenres.length > 8) { // Adjust threshold as needed
        setShowExpandButton(true);
    } else {
        setShowExpandButton(false);
    }
  }, [allGenres.length]);

  const handleChange = (value: string) => {
    router.push(`/cat/list?type=${currentType}&categoryId=${value}&tab=${currentTab}&limit=10&page=1`);
  };

  if (!genres.length && currentType !== 'all') return null;

  return (
    <div className="w-full bg-white py-4 border-b border-gray-50">
      <div className="px-4 lg:px-8 max-w-[1200px] mx-auto flex flex-col md:flex-row md:items-start gap-3">
        <span className="text-gray-700 font-bold whitespace-nowrap py-1.5 min-w-fit">หมวดหมู่ :</span>
        
        <div className="flex-1 flex items-start gap-2 w-full">
            <div className="flex-1 relative min-w-0">
                <div 
                    ref={containerRef}
                    className={`flex flex-wrap gap-2 transition-all duration-300 ease-in-out overflow-hidden ${
                        isExpanded ? 'max-h-[1000px]' : 'max-h-[40px] md:max-h-[44px]' // Approx 1 row height
                    }`}
                >
                    {allGenres.map((genre) => {
                        const isActive = String(currentCategoryId) === String(genre.id);
                        return (
                            <button
                                key={String(genre.id)}
                                onClick={() => handleChange(String(genre.id))}
                                className={`
                                    px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                                    ${isActive 
                                        ? 'bg-red-500 border-red-500 !text-white shadow-sm hover:bg-red-600' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {genre.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {showExpandButton && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors flex-shrink-0 mt-1"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            )}
        </div>
      </div>
    </div>
  );
}
