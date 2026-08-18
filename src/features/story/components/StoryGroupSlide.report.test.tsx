// @vitest-environment happy-dom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/stores/authStore';
import StoryGroupSlide from './StoryGroupSlide';
import type { StoryGroup, StoryItem } from '../types/storyTypes';

vi.mock('antd', () => ({
  App: {
    useApp: () => ({ message: { success: vi.fn() } }),
  },
  Dropdown: ({ children, menu }: {
    children: React.ReactNode;
    menu: {
      items: Array<Record<string, any>>;
      onClick?: (info: { key: string; domEvent: { stopPropagation: () => void } }) => void;
    };
  }) => (
    <div>
      {children}
      {menu.items.map((item) => (
        <button
          key={item.key}
          disabled={item.disabled}
          onClick={() => menu.onClick?.({ key: item.key, domEvent: { stopPropagation: vi.fn() } })}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@ant-design/icons', () => ({
  CloseOutlined: () => null,
  LinkOutlined: () => null,
}));

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

vi.mock('../hooks/useStoryPlayer', () => ({
  useStoryPlayer: () => ({ playerState: 'playing', errorMessage: null }),
}));

vi.mock('../hooks/useVideoComments', () => ({
  useVideoComments: () => ({
    createCommentMutation: { mutate: vi.fn(), isPending: false },
  }),
}));

vi.mock('../services/storyApi', () => ({
  storyApi: { sendView: vi.fn() },
}));

vi.mock('./StoryProgressBar', () => ({ default: () => null }));
vi.mock('./StoryAvatar', () => ({ default: () => null }));
vi.mock('./StoryCtaLinks', () => ({ default: () => null }));
vi.mock('./StoryLikeButton', () => ({ default: () => null }));
vi.mock('./StoryCommentModal', () => ({ default: () => null }));
vi.mock('./StoryReportModal', () => ({
  default: ({ open }: { open: boolean }) => open ? <div data-testid="story-report-modal" /> : null,
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

const group: StoryGroup = {
  groupType: 'user',
  groupId: 'user:10',
  section: 'following',
  user_id: 10,
  user: {
    user_id: 10,
    userID: '10',
    fullname: 'Story owner',
    writer_name: '',
    display_name: 'Story owner',
    profile_image: '',
  },
  hasUnseen: true,
  totalItems: 1,
  preview: item,
};

describe('StoryGroupSlide video report action', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    useAuthStore.setState({
      isLoggedIn: true,
      hasMounted: true,
      token: 'token',
      user: { user_id: 99, fullname: 'Viewer', email: '', role: 'user' },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('opens the report modal when a logged-in viewer chooses report', () => {
    act(() => {
      root.render(
        <StoryGroupSlide
          group={group}
          currentItem={item}
          currentItemIndex={0}
          isLoadingItems={false}
          onManageLinks={vi.fn()}
          onClose={vi.fn()}
          onNextItem={vi.fn()}
          onPrevItem={vi.fn()}
          onItemViewed={vi.fn()}
          onItemLikeChange={vi.fn()}
        />,
      );
    });

    const reportButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'รายงานวิดีโอ');
    expect(reportButton).toBeTruthy();

    act(() => reportButton?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(container.querySelector('[data-testid="story-report-modal"]')).not.toBeNull();
  });
});
