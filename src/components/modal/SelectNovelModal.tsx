import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Input, Button, Empty, Pagination } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';

interface SelectNovelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (book: any) => void;
  selectedBookId?: number | string;
}

const searchBooksApi = async (query: string, page: number, limit: number) => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  params.append('sortBy', 'date_at');
  params.append('order', 'DESC');
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await apiClient.get(`/book/search?${params.toString()}`);
  const data = response.data;
  if (data.code === 200 && data.data) {
    return data.data;
  }
  throw new Error('Invalid response format');
};

export default function SelectNovelModal({ isOpen, onClose, onSelect, selectedBookId }: SelectNovelModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [localSelectedBook, setLocalSelectedBook] = useState<any>(null);

  // Initialize selected book
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setCommittedQuery('');
      setPage(1);
      setLocalSelectedBook(null);
    }
  }, [isOpen]);

  const { data: searchData, isLoading } = useQuery({
    queryKey: ['novelSearch', committedQuery, page],
    queryFn: () => searchBooksApi(committedQuery, page, 20),
    enabled: isOpen,
  });

  const books = searchData?.items ?? [];
  const total = searchData?.total ?? 0;

  const handleSearch = () => {
    setCommittedQuery(searchQuery);
    setPage(1);
  };

  const handleSelectConfirm = () => {
    if (localSelectedBook) {
      onSelect(localSelectedBook);
      onClose();
    }
  };

  const getBookId = (book: any) => Number(book.book_id || book.bookID || book.id);
  const getBookImg = (book: any) => {
    return resolveBookCoverImageSrc(book, '/images/ejb.png');
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={<span className="text-xl font-bold font-primary">เลือกนิยาย</span>}
      centered
      width={480}
      footer={
        <Button
          type="primary"
          onClick={handleSelectConfirm}
          disabled={!localSelectedBook}
          className="w-full h-12 rounded-xl text-base font-bold font-primary"
          style={{ backgroundColor: '#E33527', borderColor: '#E33527' }}
        >
          เลือก
        </Button>
      }
      closeIcon={<span className="text-gray-400 hover:text-red-500 transition-colors">✕</span>}
      className="font-primary"
    >
      <div className="pt-4">
        {/* Search Input */}
        <Input
          placeholder="ค้นหานิยาย..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressEnter={handleSearch}
          size="large"
          className="mb-4 rounded-xl"
          allowClear
          prefix={<SearchOutlined className="text-gray-400 mr-2" />}
        />

        {/* Results */}
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E33527]" />
          </div>
        ) : books.length === 0 ? (
          <Empty description="ไม่พบหนังสือนิยายที่ค้นหา" className="py-8" />
        ) : (
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {books.map((book: any) => {
              const bId = getBookId(book);
              const isSelected = localSelectedBook ? getBookId(localSelectedBook) === bId : selectedBookId === bId;
              const title = book.name || book.title || book.bookname || 'ไม่มีชื่อ';
              const views = Number(book.view || 0).toLocaleString();
              const chapters = book.chapter ?? book.chapters ?? 0;

              return (
                <div
                  key={bId}
                  onClick={() => setLocalSelectedBook(book)}
                  className={`flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-[#E33527] bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                    <Image src={getBookImg(book)} alt={title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-gray-800 line-clamp-2">{title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {views}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        {chapters} ตอน
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#E33527] text-white">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}

            {total > 20 && (
              <div className="flex justify-center mt-4 mb-2">
                <Pagination
                  current={page}
                  total={total}
                  pageSize={20}
                  onChange={(p) => setPage(p)}
                  showSizeChanger={false}
                  size="small"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
      `}</style>
    </Modal>
  );
}
