"use client";

import React from 'react';
import { Select } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveCategories } from '@/services/apiServices';

const { Option } = Select;

export default function CategoryGenreSwiper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type') || 'all';
  const currentCategoryId = searchParams.get('categoryId') || 'all';
  const currentTab = searchParams.get('tab') || 'new';

  const { data: genres = [] } = useQuery({
    queryKey: ['activeCategories', currentType],
    queryFn: () => fetchActiveCategories(currentType),
    staleTime: 5 * 60 * 1000,
  });

  // Effect: If currentCategoryId is not 'all' and not found in loaded genres, revert to 'all' or wait?
  // Actually, if it shows ID, it means it has a value but no Option. 
  // We can just rely on Antd to show value, but ideally we should match types.
  // Casting to string above solves type mismatch.


  const handleChange = (value: string) => {
    router.push(`/cat/list?type=${currentType}&categoryId=${value}&tab=${currentTab}&limit=10&page=1`);
  };

  if (!genres.length && currentType !== 'all') return null;

  return (
    <div className="w-full bg-white py-3 border-b border-gray-50">
      <div className="px-4 lg:px-8 max-w-[1200px] mx-auto flex items-center gap-2">
        <span className="text-gray-700 font-medium whitespace-nowrap">หมวดหมู่ :</span>
        <Select
          value={String(currentCategoryId)}
          onChange={handleChange}
          className="w-full md:w-[200px]"
          variant="borderless"
          popupMatchSelectWidth={false}
        >
          <Option value="all">ทั้งหมด</Option>
          {genres.filter(g => g.id !== 'all').map((genre) => (
            <Option key={String(genre.id)} value={String(genre.id)}>
              {genre.name}
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );
}
