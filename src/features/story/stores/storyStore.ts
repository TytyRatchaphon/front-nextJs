import { create } from 'zustand';
import { StoryItem, StoryItemType } from '../types/storyTypes';

interface StoryState {
  // Viewer
  isViewerOpen: boolean;
  currentGroupIndex: number;
  viewerStartItem: { refId: number; type: StoryItemType } | null;
  viewerRequestId: number;

  // Upload
  uploadStatus: 'idle' | 'validating' | 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';
  uploadProgress: number;
  uploadStage: string;
  activeUploadId: number | null;

  // Actions - Viewer
  openViewer: (groupIndex: number, items: StoryItem[], startIndex?: number) => void;
  closeViewer: () => void;

  // Actions - Upload
  setUploadState: (status: StoryState['uploadStatus'], progress?: number, stage?: string) => void;
  setActiveUploadId: (id: number | null) => void;
  resetUpload: () => void;
}

export const useStoryStore = create<StoryState>()((set) => ({
  // Initial state
  isViewerOpen: false,
  currentGroupIndex: 0,
  viewerStartItem: null,
  viewerRequestId: 0,
  uploadStatus: 'idle',
  uploadProgress: 0,
  uploadStage: '',
  activeUploadId: null,

  // Viewer actions
  openViewer: (groupIndex, items, startIndex = 0) =>
    set((state) => {
      const startItem = items[startIndex];
      return {
        isViewerOpen: true,
        currentGroupIndex: groupIndex,
        viewerStartItem: startItem
          ? { refId: startItem.ref_id, type: startItem.type }
          : null,
        viewerRequestId: state.viewerRequestId + 1,
      };
    }),

  closeViewer: () =>
    set({
      isViewerOpen: false,
      viewerStartItem: null,
    }),

  // Upload actions
  setUploadState: (status, progress = 0, stage = '') =>
    set({ uploadStatus: status, uploadProgress: progress, uploadStage: stage }),

  setActiveUploadId: (id) => set({ activeUploadId: id }),

  resetUpload: () =>
    set({
      uploadStatus: 'idle',
      uploadProgress: 0,
      uploadStage: '',
      activeUploadId: null,
    }),
}));
