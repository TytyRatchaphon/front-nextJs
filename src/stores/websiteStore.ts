import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WebsiteSettingsData } from '@/types/api';
import { fetchWebsiteSettings } from '@/services/apiServices';

interface WebsiteStore {
  settings: WebsiteSettingsData | null;
  isLoading: boolean;
  error: any;
  lastFetched: number;
  fetchSettings: (force?: boolean) => Promise<void>;
  setSettings: (settings: WebsiteSettingsData) => void;
}

export const useWebsiteStore = create<WebsiteStore>()(
  persist(
    (set, get) => ({
      settings: null,
      isLoading: false,
      error: null,
      lastFetched: 0,

      fetchSettings: async (force = false) => {
        const { settings, isLoading, lastFetched } = get();
        const now = Date.now();


        // Cache for 5 minutes (300000ms) unless forced or no settings
        if (!force && (isLoading || (settings && now - lastFetched < 300000))) {

          return;
        }

        set({ isLoading: true, error: null });
        try {

          const res = await fetchWebsiteSettings();
          if (res && res.status === 'success') {

            set({ settings: res.data, isLoading: false, lastFetched: now });
          } else {
            console.error('[WebsiteStore] Fetch failed or invalid status', res);
            set({ isLoading: false, error: 'Failed to fetch settings' });
          }
        } catch (err) {
          console.error('[WebsiteStore] Fetch error', err);
          set({ isLoading: false, error: err });
        }
      },

      setSettings: (settings) => set({ settings }),
    }),
    {
      name: 'website-settings-storage',
      skipHydration: false,
    }
  )
);
