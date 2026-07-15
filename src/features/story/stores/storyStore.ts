import { create } from 'zustand';
import { StoryGroup, StoryItem, StoryItemType, StoryLink } from '../types/storyTypes';

interface StoryState {
  // Bar
  groups: StoryGroup[];
  isBarLoading: boolean;

  // Viewer
  isViewerOpen: boolean;
  currentGroupIndex: number;
  currentItemIndex: number;
  viewerItems: StoryItem[];

  // Upload
  uploadStatus: 'idle' | 'validating' | 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';
  uploadProgress: number;
  uploadStage: string;
  activeUploadId: number | null;

  // Actions - Bar
  setGroups: (groups: StoryGroup[]) => void;
  setBarLoading: (loading: boolean) => void;

  // Actions - Viewer
  openViewer: (groupIndex: number, items: StoryItem[], startIndex?: number) => void;
  closeViewer: () => void;
  setViewerItems: (items: StoryItem[], startIndex?: number) => void;
  nextItem: () => void;
  prevItem: () => void;
  nextGroup: () => void;
  prevGroup: () => void;
  setCurrentGroupIndex: (index: number) => void;
  markItemViewed: (refId: number, type: StoryItemType) => void;
  toggleItemLike: (refId: number, type: StoryItemType, isLiked: boolean, likeCount?: number | null) => void;
  updateItemLinks: (refId: number, type: StoryItemType, links: StoryLink[]) => void;

  // Actions - Upload
  setUploadState: (status: StoryState['uploadStatus'], progress?: number, stage?: string) => void;
  setActiveUploadId: (id: number | null) => void;
  resetUpload: () => void;
}

export const useStoryStore = create<StoryState>()((set, get) => ({
  // Initial state
  groups: [],
  isBarLoading: true,
  isViewerOpen: false,
  currentGroupIndex: 0,
  currentItemIndex: 0,
  viewerItems: [],
  uploadStatus: 'idle',
  uploadProgress: 0,
  uploadStage: '',
  activeUploadId: null,

  // Bar actions
  setGroups: (groups) => set({ groups }),
  setBarLoading: (loading) => set({ isBarLoading: loading }),

  // Viewer actions
  openViewer: (groupIndex, items, startIndex = 0) =>
    set({
      isViewerOpen: true,
      currentGroupIndex: groupIndex,
      viewerItems: items,
      currentItemIndex: startIndex,
    }),

  closeViewer: () =>
    set({
      isViewerOpen: false,
      viewerItems: [],
      currentItemIndex: 0,
    }),

  setViewerItems: (items, startIndex = 0) => set((state) => {
    const currentGroup = state.groups[state.currentGroupIndex];
    let newGroups = state.groups;

    // Self-healing: If the actual fetched items count differs from totalItems, correct it on-the-fly
    if (currentGroup && items.length > 0 && currentGroup.totalItems !== items.length) {
      newGroups = [...state.groups];
      newGroups[state.currentGroupIndex] = {
        ...currentGroup,
        totalItems: items.length
      };
    }

    const safeStartIndex = items.length === 0
      ? 0
      : Math.min(Math.max(startIndex, 0), items.length - 1);

    return { viewerItems: items, currentItemIndex: safeStartIndex, groups: newGroups };
  }),

  nextItem: () => {
    const { currentItemIndex, viewerItems, currentGroupIndex, groups } = get();
    if (currentItemIndex < viewerItems.length - 1) {
      set({ currentItemIndex: currentItemIndex + 1 });
    } else if (currentGroupIndex < groups.length - 1) {
      // Auto advance to next group when items are exhausted
      get().nextGroup();
    } else {
      // Reached the end of the last group
      get().closeViewer();
    }
  },

  prevItem: () => {
    const { currentItemIndex, currentGroupIndex } = get();
    if (currentItemIndex > 0) {
      set({ currentItemIndex: currentItemIndex - 1 });
    } else if (currentGroupIndex > 0) {
      // Go to previous group
      get().prevGroup();
    }
  },

  nextGroup: () => {
    const { currentGroupIndex, groups } = get();
    if (currentGroupIndex < groups.length - 1) {
      // We don't have the items for the next group yet, so we just update the index.
      // The viewer component should detect group index change, show loading, and fetch items.
      set({ currentGroupIndex: currentGroupIndex + 1, currentItemIndex: 0, viewerItems: [] });
    } else {
      get().closeViewer();
    }
  },

  prevGroup: () => {
    const { currentGroupIndex } = get();
    if (currentGroupIndex > 0) {
      set({ currentGroupIndex: currentGroupIndex - 1, currentItemIndex: 0, viewerItems: [] });
    }
  },

  setCurrentGroupIndex: (index: number) => {
    set((state) => state.currentGroupIndex === index
      ? state
      : { currentGroupIndex: index, currentItemIndex: 0, viewerItems: [] });
  },

  markItemViewed: (refId, type) => {
    set((state) => {
      const viewerItems = state.viewerItems.map((item) =>
        item.ref_id === refId && item.type === type ? { ...item, is_viewed: true } : item
      );
      const hasUnseen = viewerItems.some((item) => !item.is_viewed);

      return {
        viewerItems,
        groups: state.groups.map((group, index) => {
          if (index === state.currentGroupIndex) {
            const preview = group.preview.ref_id === refId && group.preview.type === type
              ? { ...group.preview, is_viewed: true }
              : group.preview;

          return {
            ...group,
              hasUnseen,
              preview,
          };
        }
        return group;
      }),
      };
    });
  },

  toggleItemLike: (refId, type, isLiked, likeCount) => {
    set((state) => ({
      viewerItems: state.viewerItems.map((item) =>
        item.ref_id === refId && item.type === type
          ? {
              ...item,
              is_liked: isLiked,
              like_count: likeCount !== undefined ? likeCount : item.like_count,
            }
          : item
      ),
    }));
  },

  updateItemLinks: (refId, type, links) => {
    set((state) => ({
      viewerItems: state.viewerItems.map(item =>
        item.ref_id === refId && item.type === type
          ? { ...item, links }
          : item
      )
    }));
  },

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
