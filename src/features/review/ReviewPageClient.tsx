"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { fetchReviewById, deleteUserReview } from '@/services/api/commentApi';
import ReviewModal from '@/components/modal/ReviewModal';
import EditReviewModal from '@/components/modal/EditReviewModal';
import { useAuthStore } from '@/stores/authStore';

interface ReviewPageClientProps {
  reviewId: string;
}

export default function ReviewPageClient({ reviewId }: ReviewPageClientProps) {
  const [review, setReview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();
  const currentUserId = user?.user_id;
  const { notification, modal } = App.useApp();

  useEffect(() => {
    const loadReview = async () => {
      setLoading(true);
      const data = await fetchReviewById(reviewId);
      if (data) {
        setReview(data);
        setIsModalOpen(true);
      }
      setLoading(false);
    };
    if (reviewId) {
      loadReview();
    }
  }, [reviewId]);

  const handleClose = () => {
    setIsModalOpen(false);
    router.back();
  };

  const handleEdit = () => {
    setIsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDelete = (review: any) => {
    setIsModalOpen(false);
    modal.confirm({
      title: 'ต้องการลบรีวิวนี้ใช่หรือไม่?',
      content: 'เมื่อลบแล้วจะไม่สามารถกู้คืนได้',
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          const rid = review.review_id || review.id;
          const res = await deleteUserReview(rid);
          notification.success({
            message: res?.message || 'ลบรีวิวสำเร็จ',
            placement: 'topRight'
          });
          router.push('/');
        } catch (error: any) {
          notification.error({
            message: error?.response?.data?.message || 'เกิดข้อผิดพลาดในการลบรีวิว',
            placement: 'topRight'
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#E33527]"></div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center gap-4 font-primary">
        <h1 className="text-2xl font-bold text-gray-700">ไม่พบรีวิว</h1>
        <p className="text-gray-500">รีวิวนี้อาจถูกลบไปแล้วหรือไม่มีอยู่ในระบบ</p>
        <button
          onClick={() => router.push('/')}
          className="bg-[#E33527] hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold transition-colors"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-primary">
      <ReviewModal
        isOpen={isModalOpen}
        onClose={handleClose}
        review={review}
        currentUserId={currentUserId}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <EditReviewModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          // Reload review data after edit
          fetchReviewById(reviewId).then((data) => {
            if (data) {
              setReview(data);
              setIsModalOpen(true);
            }
          });
        }}
        review={review}
        onSuccess={() => {
          fetchReviewById(reviewId).then((data) => {
            if (data) setReview(data);
          });
        }}
      />
    </div>
  );
}
