"use client"

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchThreadDetail, deleteThread } from '@/services/apiServices';
import { Alert, Modal, Button, App } from 'antd';
import GifLoader from '@/components/utility/GifLoader';
import ThreadCommentSection from './ThreadCommentSection';
import '@/services/apiServices'; 
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { DeleteOutlined } from '@ant-design/icons';
import { sanitizeUserGeneratedHtml } from '@/utils/sanitizeHtml';

interface ThreadDetailProps {
  topicId: string | number;
  initialThread?: Awaited<ReturnType<typeof fetchThreadDetail>> | null;
}

export default function ThreadDetail({ topicId, initialThread = null }: ThreadDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notification, modal } = App.useApp();
  const messageApi = {
    success: (content: unknown) => notification.success({ message: String(content ?? '') }),
    error: (content: unknown) => notification.error({ message: String(content ?? '') }),
    warning: (content: unknown) => notification.warning({ message: String(content ?? '') }),
    info: (content: unknown) => notification.info({ message: String(content ?? '') }),
  };
  const { token } = useAuthStore() as any;
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
      } catch {
      }
    }
  }, [token]);

  const { data: thread, isLoading, isError, error } = useQuery({
    queryKey: ['threadDetail', topicId],
    queryFn: () => fetchThreadDetail(topicId),
    enabled: !!topicId,
    initialData: initialThread ?? undefined,
    staleTime: 60 * 1000,
  });

  const deleteThreadMutation = useMutation({
    mutationFn: deleteThread,
    onSuccess: () => {
      messageApi.success('ลบกระทู้สำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      router.push('/thread'); // Redirect to thread list
    },
    onError: () => {
        messageApi.error('เกิดข้อผิดพลาดในการลบกระทู้');
    }
  });

  const handleDeleteThread = () => {
    modal.confirm({ // Use modal instance
        title: 'ยืนยันการลบกระทู้',
        content: 'คุณแน่ใจหรือไม่ที่จะลบกระทู้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
        okText: 'ลบ',
        cancelText: 'ยกเลิก',
        okButtonProps: { danger: true },
        onOk: () => deleteThreadMutation.mutate(Number(topicId))
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <GifLoader />
      </div>
    );
  }

  if (isError || !thread) {
     const errorMsg = (error as any)?.response?.data?.message || "ไม่สามารถโหลดข้อมูลกระทู้ได้";
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert message="เกิดข้อผิดพลาด" description={errorMsg} type="error" showIcon />
      </div>
    );
  }

  // Format Date
  const formattedDate = new Date(thread.date_at).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const isOwner = currentUserId && Number(currentUserId) === Number(thread.user_id);
  const safeThreadDetailHtml = sanitizeUserGeneratedHtml(thread.detail || "");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Thread Header */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100 relative">
        {/* Delete Button for Owner */}
        {isOwner && (
            <div className="absolute top-4 right-4">
                 <Button 
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteThread}
                 >
                    ลบกระทู้
                 </Button>
            </div>
        )}

        <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-snug">
                {thread.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-700">โพสต์โดย:</span>
                    <span className="text-red-600 font-semibold cursor-pointer hover:underline">
                        {thread.author}
                    </span>
                </div>
                
                <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formattedDate}</span>
                </div>
                
                <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{thread.view}</span>
                </div>
                
                <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{thread.comment_count}</span>
                </div>
            </div>
        </div>

        {/* Thread Content */}
        <div 
            className="prose max-w-none text-gray-800 leading-relaxed mb-6 [&_img]:max-w-full [&_img]:rounded-lg"
            dangerouslySetInnerHTML={{ __html: safeThreadDetailHtml }}
        />

        {/* Tags */}
        {thread.tag && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                {thread.tag.split(',').map((tag, idx) => (
                    tag.trim() && (
                        <span key={idx} className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-red-100 transition-colors">
                            #{tag.trim()}
                        </span>
                    )
                ))}
            </div>
        )}
      </div>

      {/* Comments Section */}
      <ThreadCommentSection topicId={topicId} />
    </div>
  );
}
