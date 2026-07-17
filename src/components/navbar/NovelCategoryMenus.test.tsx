// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DesktopNovelDropdown } from "./NovelCategoryMenus";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : undefined} {...props}>{children}</a>
  ),
}));

describe("DesktopNovelDropdown", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    container.id = "Navbar";
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("exposes the desktop menu panel to reader navbar theme selectors", () => {
    act(() => {
      root.render(
        <DesktopNovelDropdown
          categories={[]}
          getLinkClasses={() => ""}
          href="/translated-novel"
          isLoading={false}
          label="Translated novels"
          type="tran"
        />,
      );
    });

    expect(container.querySelector("#Navbar .reader-novel-mega-menu")).toBeTruthy();
    expect(container.querySelector("#Navbar .reader-novel-mega-menu-panel")).toBeTruthy();
  });
});
