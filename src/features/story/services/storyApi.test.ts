import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveVideoApiUrl } from './storyApi';

describe('resolveVideoApiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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
});
