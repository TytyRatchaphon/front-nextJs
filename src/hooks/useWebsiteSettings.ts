import { useCallback, useMemo } from "react";
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/constants/queryKeys";
import { fetchWebsiteSettings } from "@/services/api/userApi";
import { getErrorMessage } from "@/types/errors";
import type { WebsiteSettingsData, WebsiteSettingsResponse } from "@/types/api";

export const WEBSITE_SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;
export const WEBSITE_SETTINGS_QUERY_KEY = queryKeys.website.settings();

const normalizeWebsiteSettings = (
  response: WebsiteSettingsResponse | null,
): WebsiteSettingsData | null => {
  if (!response || response.status !== "success") return null;
  return response.data ?? null;
};

export const fetchWebsiteSettingsQuery = async (): Promise<WebsiteSettingsData | null> => {
  const response = await fetchWebsiteSettings();
  return normalizeWebsiteSettings(response);
};

export const prefetchWebsiteSettings = async (
  queryClient: QueryClient,
  force = false,
): Promise<void> => {
  if (force) {
    await queryClient.invalidateQueries({ queryKey: WEBSITE_SETTINGS_QUERY_KEY });
  }

  await queryClient.fetchQuery({
    queryKey: WEBSITE_SETTINGS_QUERY_KEY,
    queryFn: fetchWebsiteSettingsQuery,
    staleTime: force ? 0 : WEBSITE_SETTINGS_CACHE_TTL_MS,
    gcTime: WEBSITE_SETTINGS_CACHE_TTL_MS,
  });
};

export interface WebsiteSettingsState {
  settings: WebsiteSettingsData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number;
  fetchSettings: (force?: boolean) => Promise<void>;
  setSettings: (settings: WebsiteSettingsData) => void;
}

export const useWebsiteSettings = <T = WebsiteSettingsState>(
  selector?: (state: WebsiteSettingsState) => T,
): T => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: WEBSITE_SETTINGS_QUERY_KEY,
    queryFn: fetchWebsiteSettingsQuery,
    staleTime: WEBSITE_SETTINGS_CACHE_TTL_MS,
    gcTime: WEBSITE_SETTINGS_CACHE_TTL_MS,
    refetchOnWindowFocus: false,
  });

  const fetchSettings = useCallback(
    async (force = false) => {
      await prefetchWebsiteSettings(queryClient, force);
    },
    [queryClient],
  );

  const setSettings = useCallback(
    (settings: WebsiteSettingsData) => {
      queryClient.setQueryData(WEBSITE_SETTINGS_QUERY_KEY, settings);
    },
    [queryClient],
  );

  const state = useMemo<WebsiteSettingsState>(
    () => ({
      settings: query.data ?? null,
      isLoading: query.isLoading || query.isFetching,
      error: query.error ? getErrorMessage(query.error) : null,
      lastFetched: query.dataUpdatedAt || 0,
      fetchSettings,
      setSettings,
    }),
    [fetchSettings, query.data, query.dataUpdatedAt, query.error, query.isFetching, query.isLoading, setSettings],
  );

  return selector ? selector(state) : (state as unknown as T);
};
