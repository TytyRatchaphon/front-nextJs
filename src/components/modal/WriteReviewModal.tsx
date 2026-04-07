import React, { useState } from 'react';
import { Modal, Rate, Input, Switch, Button, App } from 'antd';
import Image from 'next/image';
import { postPinnedReview } from '@/services/api/commentApi';      
import SelectNovelModal from './SelectNovelModal';
import { useQueryClient } from '@tanstack/react-query';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';

const { TextArea } = Input;

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBook?: any | null;
  lockBook?: boolean;
  onSuccess?: () => void;
}

export default function WriteReviewModal({ isOpen, onClose, initialBook, lockBook = false, onSuccess }: WriteReviewModalProps) {
  const [selectedBook, setSelectedBook] = useState<any | null>(initialBook || null);
  const [isSelectNovelOpen, setIsSelectNovelOpen] = useState(false);
  
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { notification } = App.useApp();
  const queryClient = useQueryClient();

  // Reset state when opened with a new or same initialBook
  React.useEffect(() => {
    if (isOpen) {
      setSelectedBook(initialBook || null);
      setRating(0);
      setContent('');
      setIsSpoiler(false);
    }
  }, [isOpen, initialBook]);

  const handleSubmit = async () => {
    if (!selectedBook) {
      notification.warning({ message: 'กรุณาเลือกหนังสือก่อนทำการรีวิว', placement: 'topRight' });
      return;
    }
    if (rating === 0) {
      notification.warning({ message: 'กรุณาให้คะแนน', placement: 'topRight' });
      return;
    }
    if (!content.trim()) {
      notification.warning({ message: 'กรุณาแสดงความคิดเห็น', placement: 'topRight' });
      return;
    }

    try {
      setIsSubmitting(true);
      const bookId = selectedBook.book_id || selectedBook.bookID || selectedBook.id;
      // Send content directly; is_spoiler is sent as a boolean flag to API

      const res = await postPinnedReview(bookId, rating, content, isSpoiler);
      notification.success({ 
        message: res?.message || 'ส่งรีวิวสำเร็จ', 
        placement: 'topRight' 
      });
      queryClient.invalidateQueries({ queryKey: ['allPinnedReviews'] });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      notification.error({ message: error?.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งรีวิว', placement: 'topRight' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBookImg = (book: any) => {
    return resolveBookCoverImageSrc(book, '/images/ejb.png');
  };

  return (
    <>
      <Modal
        open={isOpen && !isSelectNovelOpen} // Hide this modal if the selection modal is open
        onCancel={onClose}
        title={<div className="text-xl font-bold text-center mt-2 font-primary !text-white">เขียนรีวิว</div>}
        centered
        width={400}
        footer={null}
        closeIcon={<span className="text-gray-400 hover:text-red-500 transition-colors">✕</span>}
        className="font-primary"
      >
        <div className="pt-4 flex flex-col items-center">
          
          {/* Selected Book Area */}
          <div className="flex flex-col items-center mb-6 w-full">
            {selectedBook ? (
              <>
                <div className="relative w-32 h-44 rounded-lg overflow-hidden shrink-0 bg-gray-200 mb-3 shadow-sm border border-gray-100">
                  <Image 
                    src={getBookImg(selectedBook)} 
                    alt={selectedBook.name || selectedBook.title || ''} 
                    fill 
                    className="object-cover" 
                    unoptimized 
                  />
                </div>
                <h4 className="text-lg font-bold text-gray-800 text-center line-clamp-2 px-4 mb-3">
                  {selectedBook.name || selectedBook.title || selectedBook.bookname}
                </h4>
                {!lockBook && (
                  <Button 
                    onClick={() => setIsSelectNovelOpen(true)}
                    className="rounded-full text-[#E33527] border-[#E33527] hover:bg-red-50 flex items-center justify-center gap-1 px-4"
                  >
                    <span className="text-lg leading-none">+</span> เปลี่ยนเรื่อง
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="w-32 h-44 rounded-lg bg-gray-200 mb-4 flex items-center justify-center text-gray-400 shadow-inner">
                  ไม่มีรูปภาพ
                </div>
                {!lockBook && (
                  <Button 
                    onClick={() => setIsSelectNovelOpen(true)}
                    className="rounded-full text-[#E33527] border-[#E33527] hover:bg-red-50 flex items-center justify-center gap-1 px-4"
                  >
                    <span className="text-lg leading-none">+</span> เลือกเรื่อง
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Rating */}
          <div className="w-full flex justify-start mb-4">
             <Rate 
               value={rating} 
               onChange={setRating} 
               className="text-2xl text-yellow-400" 
             />
          </div>

          {/* Spoiler & Label */}
          <div className="w-full flex justify-between items-center mb-2">
            <span className="text-gray-600 font-medium">แสดงความคิดเห็น</span>
            <div className="flex items-center gap-2">
              <Switch 
                checked={isSpoiler} 
                onChange={setIsSpoiler} 
                style={{ backgroundColor: isSpoiler ? '#E33527' : '#d9d9d9' }}
              />
              <span className="text-gray-600 font-medium">สปอย</span>
            </div>
          </div>

          {/* Text Area */}
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="แสดงความคิดเห็น"
            autoSize={{ minRows: 4, maxRows: 6 }}
            className="rounded-xl p-3 mb-6 bg-white border-gray-300 hover:border-red-400 focus:border-red-500 mb-2"
          />

          {/* Submit Button */}
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!selectedBook || rating === 0 || !content.trim()}
            className="w-full h-12 rounded-xl text-base font-bold text-white shadow-sm mt-4"
            style={{ backgroundColor: '#E33527', borderColor: '#E33527' }}
          >
            ส่งรีวิว
          </Button>
        </div>
      </Modal>
      {/* Select Novel Modal - Mounted here so it overlays correctly or switches out */}
      <SelectNovelModal 
        isOpen={isSelectNovelOpen}
        onClose={() => setIsSelectNovelOpen(false)}
        onSelect={(book) => {
          setSelectedBook(book);
          setIsSelectNovelOpen(false);
        }}
        selectedBookId={selectedBook ? (selectedBook.book_id || selectedBook.bookID || selectedBook.id) : undefined}
      />
    </>
  );
}
