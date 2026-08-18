// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StoryUploader from "./StoryUploader";

const mocks = vi.hoisted(() => ({
  authState: {
    hasMounted: true,
    isLoggedIn: false,
  },
  useStoryUpload: vi.fn(() => ({
    uploadStory: vi.fn(),
    isUploading: false,
    config: null,
  })),
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (state: typeof mocks.authState) => unknown) => selector(mocks.authState),
}));

vi.mock("../hooks/useStoryUpload", () => ({
  useStoryUpload: mocks.useStoryUpload,
}));

describe("StoryUploader", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    mocks.authState.hasMounted = true;
    mocks.authState.isLoggedIn = false;
    mocks.useStoryUpload.mockClear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("does not initialize the upload lifecycle for a logged-out viewer", () => {
    act(() => root.render(<StoryUploader />));

    expect(mocks.useStoryUpload).not.toHaveBeenCalled();
  });

  it("initializes the upload lifecycle after the viewer is logged in", () => {
    mocks.authState.isLoggedIn = true;

    act(() => root.render(<StoryUploader />));

    expect(mocks.useStoryUpload).toHaveBeenCalledTimes(1);
  });
});
