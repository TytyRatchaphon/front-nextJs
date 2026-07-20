// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StoryAvatar from "./StoryAvatar";

vi.mock("next/image", () => ({
  default: ({ fill: _fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    <img {...props} />
  ),
}));

describe("StoryAvatar", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("uses the default avatar when the remote image fails", () => {
    act(() => root.render(<StoryAvatar src="https://example.com/broken.png" />));

    const image = container.querySelector("img") as HTMLImageElement;
    expect(image.getAttribute("src")).toBe("https://example.com/broken.png");

    act(() => image.dispatchEvent(new Event("error")));

    expect(image.getAttribute("src")).toBe("/images/default-avatar.png");
  });
});
