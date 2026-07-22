import { beforeEach, describe, expect, it } from 'vitest';

import { useStoryStore } from './storyStore';

describe('storyStore viewer audio', () => {
  beforeEach(() => {
    useStoryStore.setState({
      isViewerOpen: false,
      currentGroupIndex: 0,
      currentItemIndex: 0,
      viewerItems: [],
      isViewerMuted: true,
    });
  });

  it('keeps the user mute preference across groups and resets it when the viewer closes', () => {
    expect(useStoryStore.getState().isViewerMuted).toBe(true);

    useStoryStore.getState().setViewerMuted(false);
    useStoryStore.getState().setCurrentGroupIndex(1);

    expect(useStoryStore.getState().isViewerMuted).toBe(false);

    useStoryStore.getState().closeViewer();

    expect(useStoryStore.getState().isViewerMuted).toBe(true);
  });
});
