import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ReadingState {
  // Reading progress
  readingProgress: Record<string, number>; // bookId -> chapter
  
  // Bookmarks
  bookmarks: string[];
  
  // Reading history
  readingHistory: string[];
  
  // Actions
  updateProgress: (bookId: string, chapter: number) => void;
  addBookmark: (bookId: string) => void;
  removeBookmark: (bookId: string) => void;
  addToHistory: (bookId: string) => void;
  clearHistory: () => void;
  
  // Getters
  isBookmarked: (bookId: string) => boolean;
  getProgress: (bookId: string) => number;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      // Initial states
      readingProgress: {},
      bookmarks: [],
      readingHistory: [],
      
      // Actions
      updateProgress: (bookId: string, chapter: number) => 
        set((state) => ({
          readingProgress: {
            ...state.readingProgress,
            [bookId]: chapter
          }
        })),
      
      addBookmark: (bookId: string) => 
        set((state) => ({
          bookmarks: [...state.bookmarks, bookId]
        })),
      
      removeBookmark: (bookId: string) => 
        set((state) => ({
          bookmarks: state.bookmarks.filter(id => id !== bookId)
        })),
      
      addToHistory: (bookId: string) => 
        set((state) => ({
          readingHistory: [bookId, ...state.readingHistory.filter(id => id !== bookId)]
        })),
      
      clearHistory: () => set({ readingHistory: [] }),
      
      // Getters
      isBookmarked: (bookId: string) => {
        return get().bookmarks.includes(bookId);
      },
      
      getProgress: (bookId: string) => {
        return get().readingProgress[bookId] || 0;
      },
    }),
    { 
      name: 'reading-storage',
      partialize: (state) => ({ 
        readingProgress: state.readingProgress,
        bookmarks: state.bookmarks,
        readingHistory: state.readingHistory
      })
    }
  )
)
