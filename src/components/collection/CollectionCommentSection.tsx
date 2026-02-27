"use client"

import React, { useState, useEffect } from "react";
import { Alert, Button, Pagination, App, Empty, Input } from "antd";
import { fetchCollectionComments, postCollectionComment, CollectionCommentData } from "@/services/api/collectionApi";
import CollectionCommentItem from "./CollectionCommentItem";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import GifLoader from '@/components/utility/GifLoader';

interface CollectionCommentSectionProps {
  collectionId: string | number;
}

export default function CollectionCommentSection({ collectionId }: CollectionCommentSectionProps) {
  const { notification: api } = App.useApp();
  const [comments, setComments] = useState<CollectionCommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth
  const { token } = useAuthStore() as any;
  const { openLoginModal } = useUIStore();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        const uid = decoded.user_id || decoded.id || decoded.sub || decoded.userId;
        setCurrentUserId(Number(uid));
      } catch (error) {
      }
    }
  }, [token]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Form State
  const [newComment, setNewComment] = useState("");

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await fetchCollectionComments(collectionId, currentPage, pageSize);
      if (data && data.comments) {
        setComments(data.comments);
        if (data.pagination && typeof data.pagination.total === 'number') {
          setTotalItems(data.pagination.total);
        } else {
          if (currentPage === 1 && data.comments.length < pageSize) {
            setTotalItems(data.comments.length);
          }
        }
      } else {
        setComments([]);
        setTotalItems(0);
      }
    } catch (err) {
      setError("ไม่สามารถโหลดความคิดเห็นได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collectionId) loadComments();
  }, [collectionId, currentPage, pageSize]);

  const handleSubmit = async () => {
    if (!token) {
      openLoginModal();
      return;
    }

    if (!newComment.trim()) {
      api.warning({
        message: 'แจ้งเตือน',
        description: 'กรุณากรอกข้อความแสดงความคิดเห็น',
        placement: 'topRight',
      });
      return;
    }

    try {
      setLoading(true);
      await postCollectionComment(collectionId, newComment);

      api.success({
        message: 'สำเร็จ',
        description: 'แสดงความคิดเห็นเรียบร้อยแล้ว',
        placement: 'topRight',
      });

      setNewComment("");
      setCurrentPage(1);
      loadComments();

    } catch (err: any) {
      api.error({
        message: 'เกิดข้อผิดพลาด',
        description: err?.response?.data?.message || "เกิดข้อผิดพลาดในการส่งความคิดเห็น",
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleDeleteSuccess = () => {
    api.success({
      message: 'สำเร็จ',
      description: 'ลบความคิดเห็นเรียบร้อยแล้ว',
      placement: 'topRight',
    });
    loadComments();
  };

  if (loading && comments.length === 0) return <div className="py-10 text-center"><GifLoader /></div>;
  if (error) return <Alert message={error} type="error" showIcon />;

  return (
    <div className="pt-8 pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-xl font-bold text-gray-900">ความคิดเห็นทั้งหมด ({totalItems})</h3>
      </div>

      {/* Write Comment Box */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">เขียนความคิดเห็น</h3>
        <div className="space-y-4">
          <Input.TextArea
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="แสดงความคิดเห็นของคุณที่นี่..."
            className="w-full !rounded-lg"
          />
          <div className="flex justify-end">
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="!bg-red-600 hover:!bg-red-700 h-10 px-8 text-sm font-semibold rounded-lg"
            >
              ส่งความคิดเห็น
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        {loading ? (
          <GifLoader className="py-12" width={100} height={100} />
        ) : comments.length > 0 ? (
          <>
            {comments.map((comment) => (
              <CollectionCommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onReplySuccess={() => loadComments()}
                onDeleteSuccess={handleDeleteSuccess}
              />
            ))}
            <div className="mt-8 flex justify-center">
              <Pagination
                current={currentPage}
                total={totalItems}
                pageSize={pageSize}
                onChange={onPageChange}
                showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <div className="py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Empty description="ยังไม่มีความคิดเห็น" />
          </div>
        )}
      </div>
    </div>
  );
}
