'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Pagination, Tabs, Select, Alert } from 'antd';
import GifLoader from '@/components/utility/GifLoader';
import { useQuery } from '@tanstack/react-query';
import CardBook from '@/components/novelCard/CardBook';

interface SearchParams {
  query: string;
  categories: number[];
  types: string[];
  status: string[];
  end: string;
  sortBy: string;
  order: string;
}

const searchBooks = async (
  params: SearchParams,
  page: number,
  limit: number
) => {
  const { query, categories, types, status, end, sortBy, order } = params;

  const queryParams = new URLSearchParams();

  if (query) queryParams.append("q", query);
  if (categories.length > 0) queryParams.append("categories", categories.join(","));
  if (types.length > 0) queryParams.append("types", types.join(","));
  if (status.length > 0) queryParams.append("status", status.join(","));
  if (end && end !== "all") queryParams.append("end", end);
  if (sortBy) queryParams.append("sortBy", sortBy);
  if (order) queryParams.append("order", order);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());

  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.214:3331'}/book/search?${queryParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to search books");
  }

  const data = await response.json();

  if (data.code === 200 && data.data) {
    return data.data;
  }

  throw new Error("Invalid response format");
};

function AllNovel() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: "",
    categories: [],
    types: [],
    status: [],
    end: "all",
    sortBy: "update_at",
    order: "DESC",
  });
  const topRef = useRef<HTMLDivElement>(null);
  const pageSize = 18;

  const {
    data: apiResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["searchBooks", searchParams, currentPage],
    queryFn: () => searchBooks(searchParams, currentPage, pageSize),
    staleTime: 5 * 60 * 1000,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setCurrentPage(1);
    // Note: If tabs are meant to filter, update searchParams here.
  };

  const handleSortChange = (val: string) => {
    setSearchParams(prev => ({ ...prev, sortBy: val }));
    setCurrentPage(1);
  };

  const novels = useMemo(() => {
    if (!apiResponse?.items || !Array.isArray(apiResponse.items)) {
      return [];
    }

    const normalized = apiResponse.items.map((b: any) => {
      const imageRaw = b.img_full || b.imgtn || b.img || b.thumb || b.image || "";
      const imageUrl = imageRaw;

      const book_id = b.book_id ?? (b.bookID ? Number(b.bookID) : 0);
      const bookID = b.bookID?.toString() || (book_id ? String(book_id) : "");
      const name = b.name || b.title || b.bookname || "ไม่มีชื่อ";
      const author = b['writer.writer_name'] || b.writer_name || b.author || (b.user_id ? String(b.user_id) : 'ไม่ระบุผู้แต่ง');
      const chapter = b.chapter ?? b.chapters ?? b.chapter_count ?? 0;
      const end = b.end ?? b.status ?? b.finished ?? b.is_end ?? b.ended ?? b.end_status ?? null;

      return {
        book_id: Number(book_id) || 0,
        bookID: String(bookID || ""),
        type: b.type || "",
        img: imageUrl,
        name,
        title: name,
        tag: b.tag || '',
        view: Number(b.view || 0),
        shelveCount: Number(b.shelveCount ?? b.shelfCount ?? b.shelve_count ?? b.shelf_count ?? 0),
        heart: b.heart ?? b.likes ?? b.like ?? 0,
        flower: b.flower ?? b.flower_count ?? 0,
        author,
        chapter: Number(chapter || 0),
        end,
        isBestSeller: b.isBestSeller,
        isNew: b.isNew,
        discount: b.discount,
        isNewEp: b.isNewEp,
        discount_ep_count: b.discount_ep_count,
      };
    });

    return normalized;
  }, [apiResponse]);

  const total = apiResponse?.total || 0;

  return (
    <div className="w-full max-w-[1128px] mx-auto px-4 lg:px-0 py-6 pt-[20px] lg:pt-[100px]" ref={topRef}>
      <style jsx>{`
        :global(.ant-tabs-tab:hover) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover svg path) {
          fill: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active svg path) {
          fill: #dc2626 !important;
        }
        :global(.ant-tabs-ink-bar) {
          background: #dc2626 !important;
        }
      `}</style>
      
      {/* Header with Tabs and Sort */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <Tabs 
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            { 
              key: 'all', 
              label: (
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_1218_13105)">
                      <path d="M10.1919 3.90412C10.4888 3.60881 10.4888 3.12756 10.1919 2.83224L9.09974 1.74006L9.10131 1.74162C8.81224 1.45256 8.31537 0.955681 7.61224 0.254119C7.28099 -0.0693187 6.74506 -0.0661937 6.41693 0.261931L0.263806 6.41037C0.185081 6.48856 0.122602 6.58155 0.0799663 6.68399C0.0373307 6.78643 0.0153809 6.89629 0.0153809 7.00725C0.0153809 7.1182 0.0373307 7.22806 0.0799663 7.3305C0.122602 7.43294 0.185081 7.52593 0.263806 7.60412L6.41537 13.751C6.57397 13.9093 6.78892 13.9983 7.01302 13.9983C7.23713 13.9983 7.45208 13.9093 7.61068 13.751L10.1904 11.1729C10.4872 10.8776 10.4872 10.3963 10.1904 10.101C10.0478 9.95911 9.8548 9.87946 9.65365 9.87946C9.4525 9.87946 9.25952 9.95911 9.11693 10.101L7.16381 12.0572C7.08256 12.1385 6.95599 12.1385 6.87474 12.0572L1.96068 7.14787C1.87943 7.06662 1.87943 6.94006 1.96068 6.85881L6.87318 1.94943C6.87943 1.94318 6.88724 1.93849 6.89349 1.93224C6.97474 1.86818 7.08724 1.87443 7.16224 1.94943L9.11849 3.90412C9.41537 4.20099 9.89662 4.20099 10.1919 3.90412ZM5.38412 7.0385C5.38412 7.47859 5.55911 7.90066 5.8706 8.21185C6.18208 8.52304 6.60455 8.69787 7.04506 8.69787C7.48556 8.69787 7.90803 8.52304 8.21952 8.21185C8.531 7.90066 8.70599 7.47859 8.70599 7.0385C8.70599 6.5984 8.531 6.17633 8.21952 5.86514C7.90803 5.55395 7.48556 5.37912 7.04506 5.37912C6.60455 5.37912 6.18208 5.55395 5.8706 5.86514C5.55911 6.17633 5.38412 6.5984 5.38412 7.0385ZM13.7622 6.43537L11.8419 4.52443C11.5451 4.22912 11.0638 4.22912 10.7685 4.52599C10.6979 4.59626 10.6419 4.67978 10.6037 4.77175C10.5655 4.86372 10.5458 4.96234 10.5458 5.06193C10.5458 5.16153 10.5655 5.26014 10.6037 5.35211C10.6419 5.44408 10.6979 5.5276 10.7685 5.59787L12.0654 6.89318C12.1466 6.97443 12.1466 7.10099 12.0654 7.18224L10.7872 8.45881C10.7167 8.52907 10.6607 8.61259 10.6224 8.70456C10.5842 8.79653 10.5646 8.89515 10.5646 8.99474C10.5646 9.09434 10.5842 9.19295 10.6224 9.28493C10.6607 9.3769 10.7167 9.46041 10.7872 9.53068C10.9298 9.67257 11.1228 9.75221 11.324 9.75221C11.5251 9.75221 11.7181 9.67257 11.8607 9.53068L13.7638 7.62912C13.8423 7.55073 13.9045 7.45763 13.9469 7.35515C13.9893 7.25267 14.011 7.14282 14.0109 7.03192C14.0107 6.92102 13.9887 6.81123 13.946 6.70886C13.9034 6.60649 13.8409 6.51355 13.7622 6.43537Z" fill="black" fillOpacity="0.85"/>
                      </g>
                      <defs>
                      <clipPath id="clip0_1218_13105">
                      <rect width="14" height="14" fill="white"/>
                      </clipPath>
                  </defs>
                </svg>
                  นิยายทั้งหมด
                </span>
              )
            },
          ]}
          className="flex-1"
        />
        
        {/* Sort Dropdown */}
        <Select
          value={searchParams.sortBy}
          onChange={handleSortChange}
          style={{ width: 160 }}
          options={[
            { value: 'update_at', label: 'อัพเดตล่าสุด' },
            { value: 'date_at', label: 'ใหม่ล่าสุด' },
            { value: 'view', label: 'ยอดชมสูงสุด' },
          ]}
        />
      </div>

      {/* Error State */}
      {isError && (
        <Alert
          message="เกิดข้อผิดพลาด"
          description={
            error instanceof Error
              ? error.message
              : "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
          }
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <GifLoader />
        </div>
      ) : (
        <>
          {/* Book Grid - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6 mb-8 justify-items-center">
            {novels.length > 0 ? (
              novels.map((novel: any) => (
                <CardBook key={novel.book_id || novel.bookID} book={novel} />
              ))
            ) : (
              <div className="w-full col-span-full text-center text-gray-500 py-8">
                ไม่พบข้อมูลหนังสือ
              </div>
            )}
          </div>

          {/* Pagination */}
          {novels.length > 0 && (
            <div className="flex justify-end mt-8 mb-20">
              <Pagination
                current={currentPage}
                total={total}
                pageSize={pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AllNovel;