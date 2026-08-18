import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVideoConfig,
  fetchMyVideos,
  patchMyVideoTitle,
  retryMyVideo,
  deleteMyVideo,
  uploadMyVideoDirect,
  fetchMyPlaylists,
  createMyPlaylist,
  fetchMyPlaylistDetail,
  patchMyPlaylist,
  deleteMyPlaylist,
  reorderMyPlaylists,
  addVideosToPlaylist,
  removeVideoFromPlaylist,
  reorderPlaylistVideos,
  uploadPlaylistCover,
  deletePlaylistCover,
  fetchPublicBookPlaylists,
  fetchPublicPlaylistVideos,
  fetchPublicVideoPlayback,
  recordVideoView,
  toggleVideoLike,
  fetchVideoComments,
  createVideoComment,
  reportVideo,
} from '@/services/api/bookVideoApi';

export const bookVideoKeys = {
  all: ['bookVideo'] as const,
  config: (bookId: number) => [...bookVideoKeys.all, 'config', bookId] as const,
  myVideos: (bookId: number, params?: any) => [...bookVideoKeys.all, 'myVideos', bookId, params] as const,
  myPlaylists: (bookId: number) => [...bookVideoKeys.all, 'myPlaylists', bookId] as const,
  myPlaylistDetail: (bookId: number, playlistId: number) => [...bookVideoKeys.all, 'myPlaylistDetail', bookId, playlistId] as const,
  publicPlaylists: (bookId: number | string) => [...bookVideoKeys.all, 'publicPlaylists', bookId] as const,
  publicPlaylistVideos: (bookId: number | string, playlistId: number) => [...bookVideoKeys.all, 'publicPlaylistVideos', bookId, playlistId] as const,
  playback: (refId: number) => [...bookVideoKeys.all, 'playback', refId] as const,
  comments: (refId: number) => [...bookVideoKeys.all, 'comments', refId] as const,
};

// ----------------------------------------
// Writer Hooks
// ----------------------------------------

export function useBookVideoConfig(bookId: number) {
  return useQuery({
    queryKey: bookVideoKeys.config(bookId),
    queryFn: () => fetchVideoConfig(bookId),
    enabled: Boolean(bookId),
  });
}

export function useMyBookVideos(bookId: number, params?: { limit?: number; cursor?: string; status?: string }) {
  return useQuery({
    queryKey: bookVideoKeys.myVideos(bookId, params),
    queryFn: () => fetchMyVideos(bookId, params),
    enabled: Boolean(bookId),
  });
}

export function useMyBookPlaylists(bookId: number) {
  return useQuery({
    queryKey: bookVideoKeys.myPlaylists(bookId),
    queryFn: () => fetchMyPlaylists(bookId),
    enabled: Boolean(bookId),
  });
}

export function useMyBookPlaylistDetail(bookId: number, playlistId: number) {
  return useQuery({
    queryKey: bookVideoKeys.myPlaylistDetail(bookId, playlistId),
    queryFn: () => fetchMyPlaylistDetail(bookId, playlistId),
    enabled: Boolean(bookId) && Boolean(playlistId),
  });
}

export function useBookVideoMutations(bookId: number) {
  const queryClient = useQueryClient();

  const invalidateVideos = () => {
    queryClient.invalidateQueries({ queryKey: bookVideoKeys.myVideos(bookId) });
  };

  const invalidatePlaylists = () => {
    queryClient.invalidateQueries({ queryKey: bookVideoKeys.myPlaylists(bookId) });
  };

  const patchTitleMutation = useMutation({
    mutationFn: ({ videoId, title }: { videoId: number; title: string }) =>
      patchMyVideoTitle(bookId, videoId, title),
    onSuccess: invalidateVideos,
  });

  const retryMutation = useMutation({
    mutationFn: (videoId: number) => retryMyVideo(bookId, videoId),
    onSuccess: invalidateVideos,
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (videoId: number) => deleteMyVideo(bookId, videoId),
    onSuccess: () => {
      invalidateVideos();
      invalidatePlaylists();
    },
  });

  const createPlaylistMutation = useMutation({
    mutationFn: (name: string) => createMyPlaylist(bookId, name),
    onSuccess: invalidatePlaylists,
  });

  const patchPlaylistMutation = useMutation({
    mutationFn: ({ playlistId, data }: { playlistId: number; data: { name?: string; publishStatus?: 'published' | 'unpublished' } }) =>
      patchMyPlaylist(bookId, playlistId, data),
    onSuccess: invalidatePlaylists,
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: (playlistId: number) => deleteMyPlaylist(bookId, playlistId),
    onSuccess: invalidatePlaylists,
  });

  const reorderPlaylistsMutation = useMutation({
    mutationFn: (playlistIds: number[]) => reorderMyPlaylists(bookId, playlistIds),
    onSuccess: invalidatePlaylists,
  });

  const addVideosToPlaylistMutation = useMutation({
    mutationFn: ({ playlistId, videoIds }: { playlistId: number; videoIds: number[] }) =>
      addVideosToPlaylist(bookId, playlistId, videoIds),
    onSuccess: (_, variables) => {
      invalidatePlaylists();
      queryClient.invalidateQueries({ queryKey: bookVideoKeys.myPlaylistDetail(bookId, variables.playlistId) });
    },
  });

  const removeVideoFromPlaylistMutation = useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: number; videoId: number }) =>
      removeVideoFromPlaylist(bookId, playlistId, videoId),
    onSuccess: (_, variables) => {
      invalidatePlaylists();
      queryClient.invalidateQueries({ queryKey: bookVideoKeys.myPlaylistDetail(bookId, variables.playlistId) });
    },
  });

  const reorderPlaylistVideosMutation = useMutation({
    mutationFn: ({ playlistId, videoIds }: { playlistId: number; videoIds: number[] }) =>
      reorderPlaylistVideos(bookId, playlistId, videoIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookVideoKeys.myPlaylistDetail(bookId, variables.playlistId) });
    },
  });

  const uploadCoverMutation = useMutation({
    mutationFn: ({ playlistId, file }: { playlistId: number; file: File }) =>
      uploadPlaylistCover(bookId, playlistId, file),
    onSuccess: invalidatePlaylists,
  });

  const deleteCoverMutation = useMutation({
    mutationFn: (playlistId: number) => deletePlaylistCover(bookId, playlistId),
    onSuccess: invalidatePlaylists,
  });

  return {
    patchTitleMutation,
    retryMutation,
    deleteVideoMutation,
    createPlaylistMutation,
    patchPlaylistMutation,
    deletePlaylistMutation,
    reorderPlaylistsMutation,
    addVideosToPlaylistMutation,
    removeVideoFromPlaylistMutation,
    reorderPlaylistVideosMutation,
    uploadCoverMutation,
    deleteCoverMutation,
  };
}

// ----------------------------------------
// Public Reader Hooks
// ----------------------------------------

export function usePublicBookPlaylists(bookId: number | string) {
  return useQuery({
    queryKey: bookVideoKeys.publicPlaylists(bookId),
    queryFn: () => fetchPublicBookPlaylists(bookId),
    enabled: Boolean(bookId),
  });
}

export function usePublicPlaylistVideos(bookId: number | string, playlistId: number | null) {
  return useQuery({
    queryKey: bookVideoKeys.publicPlaylistVideos(bookId, playlistId!),
    queryFn: () => fetchPublicPlaylistVideos(bookId, playlistId!),
    enabled: Boolean(bookId) && Boolean(playlistId),
  });
}

export function usePublicVideoPlayback(refId: number | null) {
  return useQuery({
    queryKey: bookVideoKeys.playback(refId!),
    queryFn: () => fetchPublicVideoPlayback(refId!),
    enabled: Boolean(refId),
    staleTime: 1000 * 60 * 5, // 5 mins cache
  });
}

export function useVideoComments(refId: number | null) {
  return useQuery({
    queryKey: bookVideoKeys.comments(refId!),
    queryFn: () => fetchVideoComments(refId!),
    enabled: Boolean(refId),
  });
}
