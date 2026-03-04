import React from 'react';
import { Modal, Rate } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';
import parse from 'html-react-parser';

dayjs.extend(relativeTime);
dayjs.locale('th');

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: any | null;
}

export default function ReviewModal({ isOpen, onClose, review }: ReviewModalProps) {
  if (!review) return null;

  const userAvatar = review.user?.img || '/images/default-avatar.png';
  const userName = review.user?.fullname || 'Unknown';
  const timeAgo = dayjs(review.created_at).fromNow();
  
  const bookCover = review.book?.img || review.book?.img_full || '/images/default-cover.png';
  const bookTitle = review.book?.name || 'Unknown Book';
  const bookTag = review.book?.tag?.[0] || 'นิยาย';
  const writerName = review.book?.writer_name || 'Unknown Writer';

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      className="font-primary"
      closeIcon={<span className="text-gray-400 hover:text-red-500 transition-colors">✕</span>}
    >
      <div className="p-2 sm:p-4">
        {/* Header: User & Time */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image src={userAvatar} alt={userName} fill className="object-cover" />
            </div>
            <div>
              <div className="text-base font-bold text-gray-800">{userName}</div>
              <div className="text-sm text-gray-400">{timeAgo}</div>
            </div>
          </div>
        </div>

        {/* Rating & Episode */}
        <div className="flex items-center gap-2 mb-4">
          <Rate disabled defaultValue={review.rating} allowHalf className="text-base text-yellow-500" />
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            อ่านถึงตอนที่ {review.ep_read || 0}
          </span>
        </div>

        {/* Content */}
        <div className="text-base text-gray-700 leading-relaxed mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[100px] whitespace-pre-wrap word-break">
          {parse((review.content || '').replace(/\[\/?SPOILER\]/gi, ''))}
        </div>

        {/* Book Info footer */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-bold text-gray-500 mb-2">รีวิวจากเรื่อง</h3>
          <Link href={`/book/${review.book?.book_id}`} className="flex gap-4 bg-white rounded-xl p-3 border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all group">
            <div className="relative w-14 h-20 rounded-md overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
              <Image src={bookCover} alt={bookTitle} fill className="object-cover" unoptimized />
            </div>
            <div className="flex flex-col justify-center overflow-hidden flex-1">
              <h4 className="text-base font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-red-600 transition-colors">{bookTitle}</h4>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[#E33527] font-medium bg-red-50 px-2 py-0.5 rounded">{bookTag}</span>
              </div>
              <p className="text-sm text-gray-500 truncate mt-auto">เขียนโดย: {writerName}</p>
            </div>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
