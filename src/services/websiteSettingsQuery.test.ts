import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWebsiteSettings } from '@/services/api/userApi';

import { fetchWebsiteSettingsQuery } from './websiteSettingsQuery';

vi.mock('@/services/api/userApi', () => ({
  fetchWebsiteSettings: vi.fn(),
}));

const mockedFetchWebsiteSettings = vi.mocked(fetchWebsiteSettings);

describe('website settings query loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null instead of undefined when settings are unavailable', async () => {
    mockedFetchWebsiteSettings.mockResolvedValueOnce(null);

    await expect(fetchWebsiteSettingsQuery()).resolves.toBeNull();
  });
});
