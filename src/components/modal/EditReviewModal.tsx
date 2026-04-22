import * as React from "react";
import { useState } from 'react';
import { Modal, Rate, Input, Switch, Button, App } from 'antd';
import Image from 'next/image';
import { updateBookReview } from '@/services/api/commentApi';      
import { useQueryClient } from '@tanstack/react-query';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';

const { TextArea } = Input;

interface EditReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: any | null;
  onSuccess?: () => void;
}

export default function EditReviewModal({ isOpen, onClose, review, onSuccess }: EditReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { notification } = App.useApp();
  const queryClient = useQueryClient();

  // Reset state when opened with a review
  React.useEffect(() => {
    if (isOpen && review) {
      setRating(Number(review.rating) || 0);
      
      // Clean content from html tags if any before editing
      let cleanContent = review.content || '';
      if (cleanContent.startsWith('<p>')) {
         cleanContent = cleanContent.replace(/<[^>]+>/g, '');
      }
      const hasSpoiler = cleanContent.includes('[SPOILER]');
      cleanContent = cleanContent.replace(/\[\/?SPOILER\]/gi, '').trim();
      
      setContent(cleanContent);
      setIsSpoiler(hasSpoiler);
    }
  }, [isOpen, review]);

  const handleSubmit = async () => {
    if (!review) return;

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
      const reviewId = review.review_id || review.id;
      
      let finalContent = content;

      const res = await updateBookReview(reviewId, rating, finalContent, isSpoiler);
      notification.success({ 
        message: res?.message || 'แก้ไขรีวิวสำเร็จ', 
        placement: 'topRight' 
      });
      
      // Invalidate queries to refresh the reviews list
      queryClient.invalidateQueries({ queryKey: ['allPinnedReviews'] });
      queryClient.invalidateQueries({ queryKey: ['bookReviews', review.book?.book_id] });
      onSuccess?.();
      
      onClose();
    } catch (error: any) {
      console.error(error);
      notification.error({ message: error?.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขรีวิว', placement: 'topRight' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBookImg = (book: any) => {
    return resolveBookCoverImageSrc(book, '/images/ejb.png');
  };

  if (!review) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={<div className="text-xl font-bold text-center mt-2 font-primary !text-white">แก้ไขรีวิว</div>}
      centered
      width={400}
      footer={null}
      closeIcon={<span className="text-gray-400 hover:text-red-500 transition-colors">✕</span>}
      className="font-primary"
    >
      <div className="pt-4 flex flex-col items-center">
        
        {/* Selected Book Area */}
        <div className="flex flex-col items-center mb-6 w-full">
          <div className="relative w-32 h-44 rounded-lg overflow-hidden shrink-0 bg-gray-200 mb-3 shadow-sm border border-gray-100">
            <Image 
              src={getBookImg(review.book)} 
              alt={review.book?.name || review.book?.title || ''} 
              fill 
              className="object-cover" 
              unoptimized 
            />
          </div>
          <h4 className="text-lg font-bold text-gray-800 text-center line-clamp-2 px-4 mb-3">
            {review.book?.name || review.book?.title || review.book?.bookname}
          </h4>
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
          disabled={!review || rating === 0 || !content.trim()}
          className="w-full h-12 rounded-xl text-base font-bold text-white shadow-sm mt-4"
          style={{ backgroundColor: '#E33527', borderColor: '#E33527' }}
        >
          บันทึกการแก้ไข
        </Button>
      </div>
    </Modal>
  );
}
