import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { storyApi } from '../services/storyApi';
import { StoryDisplayStatus } from '../types/storyTypes';

export const useManageStories = (
  page: number = 1,
  limit: number = 20,
  displayStatus: StoryDisplayStatus = 'all',
  sort: string = 'created_desc'
) => {
  return useQuery({
    queryKey: ['story-manage', page, limit, displayStatus, sort],
    queryFn: () => storyApi.fetchManageStories(page, limit, displayStatus, sort),
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useManageStoryDetail = (storyItemId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['story-manage-detail', storyItemId],
    queryFn: () => storyApi.fetchManageStoryDetail(storyItemId),
    enabled: enabled && !!storyItemId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateStory = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ storyItemId, data }: { storyItemId: number, data: any }) =>
      storyApi.updateStory(storyItemId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story-manage'] });
      queryClient.invalidateQueries({ queryKey: ['story-manage-detail', variables.storyItemId] });
      message.success('อัปเดตข้อมูลสำเร็จ');
    },
    onError: () => {
      message.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  });
};

export const useDeleteStory = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (storyItemId: number) => storyApi.deleteStory(storyItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-manage'] });
      message.success('ลบสตอรี่สำเร็จ');
    },
    onError: () => {
      message.error('เกิดข้อผิดพลาดในการลบสตอรี่');
    }
  });
};

export const useStoryViewers = (
  storyItemId: number,
  page: number = 1,
  limit: number = 50,
  reaction: 'all' | 'like' = 'all',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['story-viewers', storyItemId, page, limit, reaction],
    queryFn: () => storyApi.fetchStoryViewers(storyItemId, page, limit, reaction),
    enabled: enabled && !!storyItemId,
    staleTime: 1000 * 60,
  });
};

export const useCreateManageLink = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ storyItemId, data }: { storyItemId: number, data: any }) =>
      storyApi.createManageLink(storyItemId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story-manage-detail', variables.storyItemId] });
      message.success('เพิ่มลิงก์สำเร็จ');
    },
    onError: () => {
      message.error('เกิดข้อผิดพลาดในการเพิ่มลิงก์');
    }
  });
};

export const useUpdateManageLinks = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ storyItemId, data }: { storyItemId: number, data: any }) =>
      storyApi.updateManageLinks(storyItemId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story-manage-detail', variables.storyItemId] });
      message.success('อัปเดตลิงก์ทั้งหมดสำเร็จ');
    },
    onError: () => {
      message.error('เกิดข้อผิดพลาดในการอัปเดตลิงก์');
    }
  });
};

export const useReorderManageLinks = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ storyItemId, linkIds }: { storyItemId: number, linkIds: number[] }) =>
      storyApi.reorderManageLinks(storyItemId, linkIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story-manage-detail', variables.storyItemId] });
      message.success('เรียงลำดับลิงก์สำเร็จ');
    },
    onError: () => {
      message.error('เกิดข้อผิดพลาดในการเรียงลำดับลิงก์');
    }
  });
};

export const useUpdateManageLinkSingle = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ storyItemId, linkId, data }: { storyItemId: number, linkId: number, data: any }) =>
      storyApi.updateManageLinkSingle(storyItemId, linkId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story-manage-detail', variables.storyItemId] });
      message.success('อัปเดตลิงก์สำเร็จ');
    },
    onError: () => {
      message.error('เกิดข้อผิดพลาดในการอัปเดตลิงก์');
    }
  });
};

export const useDeleteManageLink = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ storyItemId, linkId }: { storyItemId: number, linkId: number }) =>
      storyApi.deleteManageLink(storyItemId, linkId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story-manage-detail', variables.storyItemId] });
      message.success('ลบลิงก์สำเร็จ');
    },
    onError: () => {
      message.error('เกิดข้อผิดพลาดในการลบลิงก์');
    }
  });
};
