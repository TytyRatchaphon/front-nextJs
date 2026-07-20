import { afterEach, describe, expect, it, vi } from 'vitest';

import apiClient from '@/services/apiClient';

import { resolveVideoApiUrl, storyApi, VideoReportApiError } from './storyApi';

vi.mock('@/services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe('resolveVideoApiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('routes Video API requests through the dedicated service URL', () => {
    vi.stubEnv('NEXT_PUBLIC_VIDEO_API_BASE_URL', 'https://video.example.com/');

    expect(resolveVideoApiUrl('/video/story-bar?limit=20')).toBe(
      'https://video.example.com/video/story-bar?limit=20',
    );
  });

  it('keeps relative paths when no dedicated service URL is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_VIDEO_API_BASE_URL', '');

    expect(resolveVideoApiUrl('/video/story-bar?limit=20')).toBe('/video/story-bar?limit=20');
  });

  it('loads active report presets without authentication', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        code: 200,
        status: 'success',
        message: 'success',
        data: {
          items: [{ id: 1, title: 'เนื้อหาไม่เหมาะสม', order_by: 10 }],
        },
      },
    });

    await expect(storyApi.fetchVideoReportPresets()).resolves.toEqual([
      { id: 1, title: 'เนื้อหาไม่เหมาะสม', order_by: 10 },
    ]);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/video/reports/presets', {
      headers: { 'x-skip-auth': 'true' },
    });
  });

  it('submits a video report with trimmed optional detail', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        code: 200,
        status: 'success',
        message: 'VIDEO_REPORT_CREATED',
        data: {
          id: 125,
          type: 'video_story_items',
          ref_id: 20,
          preset: { id: 3, title: 'สแปม' },
          detail: 'รายละเอียด',
          status: 'pending',
          created: true,
          already_reported: false,
          created_at: '2026-07-17T03:30:00.000Z',
        },
      },
    });

    await storyApi.submitVideoReport({
      type: 'video_story_items',
      ref_id: 20,
      preset_id: 3,
      detail: '  รายละเอียด  ',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/video/reports',
      {
        type: 'video_story_items',
        ref_id: 20,
        preset_id: 3,
        detail: 'รายละเอียด',
      },
      { headers: { 'x-auth-scheme': 'bearer' } },
    );
  });

  it('does not treat an HTTP 2xx response as success when body code is not 200', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      status: 202,
      data: {
        code: 401,
        status: 'warning',
        message: 'TOKEN_EXPIRED',
        data: null,
      },
    });

    await expect(storyApi.submitVideoReport({
      type: 'book_video_trailer',
      ref_id: 9,
      preset_id: 2,
    })).rejects.toMatchObject<Partial<VideoReportApiError>>({
      code: 401,
      message: 'TOKEN_EXPIRED',
    });
  });
});
