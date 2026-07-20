import { beforeEach, describe, expect, it } from "vitest";

import type { StoryItem } from "../types/storyTypes";
import { useStoryStore } from "./storyStore";

const storyItem: StoryItem = {
  type: "video_story_items",
  ref_id: 1,
  thumbnail_url: "thumbnail",
  hls_url: "stream",
  dash_url: "stream",
  is_viewed: false,
  is_liked: false,
  links: [],
};

describe("Story viewer audio preference", () => {
  beforeEach(() => {
    useStoryStore.setState({
      isViewerOpen: false,
      currentGroupIndex: 0,
      viewerStartItem: null,
      isMuted: true,
    });
  });

  it("keeps an explicit unmute when the viewer moves to another Story group", () => {
    useStoryStore.getState().openViewer(0, [storyItem]);
    useStoryStore.getState().setMuted(false);
    useStoryStore.getState().openViewer(1, [{ ...storyItem, ref_id: 2 }]);

    expect(useStoryStore.getState().isMuted).toBe(false);
  });

  it("starts muted again after the viewer is closed", () => {
    useStoryStore.getState().openViewer(0, [storyItem]);
    useStoryStore.getState().setMuted(false);
    useStoryStore.getState().closeViewer();

    expect(useStoryStore.getState().isMuted).toBe(true);
  });
});
