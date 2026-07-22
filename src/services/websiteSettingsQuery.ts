import { fetchWebsiteSettings } from '@/services/api/userApi';
import type { WebsiteSettingsData } from '@/types/api';

export const fetchWebsiteSettingsQuery = async (): Promise<WebsiteSettingsData | null> => {
  const response = await fetchWebsiteSettings();
  if (!response || response.status !== 'success') return null;
  return response.data ?? null;
};
