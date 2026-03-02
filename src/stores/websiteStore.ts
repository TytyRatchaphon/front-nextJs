import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WebsiteSettingsData } from '@/types/api';
import { fetchWebsiteSettings } from '@/services/apiServices';
import { getErrorMessage } from '@/types/errors';

interface WebsiteStore {
  settings: WebsiteSettingsData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number;
  fetchSettings: (force?: boolean) => Promise<void>;
  setSettings: (settings: WebsiteSettingsData) => void;
  fetchPromise: Promise<void> | null;
}

export const useWebsiteStore = create<WebsiteStore>()(
  persist(
    (set, get) => ({
      settings: null,
      isLoading: false,
      error: null,
      lastFetched: 0,
      fetchPromise: null,

      fetchSettings: async (force = false) => {
        const { settings, lastFetched, fetchPromise } = get();
        const now = Date.now();

        // 1. Check cache freshness
        if (!force && (settings && now - lastFetched < 300000)) {
          return;
        }

        // 2. Check if a fetch is already in progress
        // If so, return existing promise to deduplicate requests
        if (fetchPromise) {
           return fetchPromise;
        }

        // 3. Start new fetch
        const promise = (async () => {
             set({ isLoading: true, error: null });
             try {
               const res = await fetchWebsiteSettings();
               if (res && res.status === 'success') {
                 set({ settings: res.data, isLoading: false, lastFetched: Date.now() });
               } else {
                 if (res === null) {
                    set({ isLoading: false }); 
                    return; 
                 }
                 console.error('[WebsiteStore] Fetch failed or invalid status', res);
                 set({ isLoading: false, error: 'Failed to fetch settings' });
               }
             } catch (err: unknown) {
               console.error('[WebsiteStore] Fetch error', err);
               set({ isLoading: false, error: getErrorMessage(err) });
             } finally {
               set({ fetchPromise: null });
             }
        })();

        set({ fetchPromise: promise });
        return promise;
      },

      setSettings: (settings) => set({ settings }),
    }),
    {
      name: 'website-settings-storage',
      skipHydration: false,
      partialize: (state) => ({ 
          settings: state.settings, 
          lastFetched: state.lastFetched 
      }), // Don't persist isLoading, error, or fetchPromise
    }
  )
);
