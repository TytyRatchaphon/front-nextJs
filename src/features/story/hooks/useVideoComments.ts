"use client";

import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { storyApi } from '../services/storyApi';
import { StoryItemType } from '../types/storyTypes';
import { App } from 'antd';

export const useVideoComments = (type: StoryItemType, ref_id: number, enabled = true) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const queryKey = ['video-comments', type, ref_id];

  const commentsQuery = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => storyApi.fetchComments(type, ref_id, 20, pageParam || undefined),
    getNextPageParam: (lastPage) => lastPage?.next_cursor || null,
    initialPageParam: null as string | null,
    enabled: enabled && ref_id > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createCommentMutation = useMutation({
    mutationFn: (comment_text: string) => storyApi.createComment(type, ref_id, comment_text),
    onSuccess: (data) => {
      // Invalidate the query to fetch the new comment list
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'ไม่สามารถส่งคอมเมนต์ได้');
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (comment_id: number) => storyApi.deleteComment(comment_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      message.success('ลบคอมเมนต์เรียบร้อยแล้ว');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'ไม่สามารถลบคอมเมนต์ได้');
    }
  });

  const reportCommentMutation = useMutation({
    mutationFn: (comment_id: number) => storyApi.reportComment(comment_id),
    onSuccess: (data) => {
      if (data.created) {
        message.success('รายงานคอมเมนต์เรียบร้อยแล้ว');
      } else {
        message.info('คุณได้รายงานคอมเมนต์นี้ไปแล้ว');
      }
    },
    onError: (error: any) => {
      message.error('ไม่สามารถรายงานคอมเมนต์ได้');
    }
  });

  return {
    commentsQuery,
    createCommentMutation,
    deleteCommentMutation,
    reportCommentMutation,
  };
};

export const useVideoCommentReplies = (comment_id: number, enabled: boolean) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const queryKey = ['video-comment-replies', comment_id];

  const repliesQuery = useQuery({
    queryKey,
    queryFn: () => storyApi.fetchReplies(comment_id, 20),
    enabled: enabled,
    staleTime: 1000 * 60 * 5,
  });

  const replyMutation = useMutation({
    mutationFn: (comment_text: string) => storyApi.replyComment(comment_id, comment_text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'ไม่สามารถตอบกลับได้');
    }
  });

  return {
    repliesQuery,
    replyMutation,
  };
};
