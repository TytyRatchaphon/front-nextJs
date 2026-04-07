import { beforeEach, describe, expect, it } from "vitest";

import { useReadingStore } from "./readingStore";

describe("readingStore", () => {
  beforeEach(() => {
    useReadingStore.setState({
      readingProgress: {},
      bookmarks: [],
      readingHistory: [],
    });
  });

  it("has expected initial state", () => {
    const state = useReadingStore.getState();
    expect(state.readingProgress).toEqual({});
    expect(state.bookmarks).toEqual([]);
    expect(state.readingHistory).toEqual([]);
  });

  it("updates and retrieves reading progress with 0 fallback", () => {
    useReadingStore.getState().updateProgress("book-1", 12);

    expect(useReadingStore.getState().getProgress("book-1")).toBe(12);
    expect(useReadingStore.getState().getProgress("book-unknown")).toBe(0);
  });

  it("adds/removes bookmarks and checks bookmarked state", () => {
    useReadingStore.getState().addBookmark("book-1");
    useReadingStore.getState().addBookmark("book-2");

    expect(useReadingStore.getState().isBookmarked("book-1")).toBe(true);
    expect(useReadingStore.getState().bookmarks).toEqual(["book-1", "book-2"]);

    useReadingStore.getState().removeBookmark("book-1");
    expect(useReadingStore.getState().isBookmarked("book-1")).toBe(false);
    expect(useReadingStore.getState().bookmarks).toEqual(["book-2"]);
  });

  it("maintains reading history as unique and most-recent-first", () => {
    useReadingStore.getState().addToHistory("book-1");
    useReadingStore.getState().addToHistory("book-2");
    useReadingStore.getState().addToHistory("book-1");

    expect(useReadingStore.getState().readingHistory).toEqual(["book-1", "book-2"]);

    useReadingStore.getState().clearHistory();
    expect(useReadingStore.getState().readingHistory).toEqual([]);
  });
});
