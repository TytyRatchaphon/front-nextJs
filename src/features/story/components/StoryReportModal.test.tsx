// @vitest-environment happy-dom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import StoryReportModal from './StoryReportModal';
import type { StoryItem } from '../types/storyTypes';

vi.mock('antd', () => ({
  App: { useApp: () => ({ message: { info: vi.fn(), success: vi.fn() } }) },
  Alert: () => null,
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  Input: { TextArea: () => <textarea /> },
  Modal: ({ zIndex }: { zIndex?: number }) => <div data-testid="report-modal" data-z-index={zIndex} />,
  Radio: Object.assign(() => null, { Group: () => null }),
  Spin: () => null,
}));

vi.mock('../services/storyApi', () => ({
  storyApi: { fetchVideoReportPresets: vi.fn(() => new Promise(() => {})) },
  VideoReportApiError: class VideoReportApiError extends Error {},
}));

const item: StoryItem = {
  type: 'video_story_items',
  ref_id: 20,
  thumbnail_url: '',
  hls_url: '',
  dash_url: '',
  is_viewed: true,
  is_liked: false,
  links: [],
};

describe('StoryReportModal', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders above the Story Viewer overlay', () => {
    act(() => {
      root.render(
        <StoryReportModal open item={item} onClose={vi.fn()} onReported={vi.fn()} />,
      );
    });

    expect(container.querySelector('[data-testid="report-modal"]')?.getAttribute('data-z-index'))
      .toBe('10000');
  });
});
