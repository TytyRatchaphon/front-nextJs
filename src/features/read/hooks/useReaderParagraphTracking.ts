import { useCallback, useEffect, useMemo, useState, type RefObject } from "react";
import type { EpisodeBookmark } from "../readerContentUtils";

type ParagraphNotificationArgs = {
  message: string;
  description?: string;
  placement?: "topRight";
};

type ParagraphNotificationApi = {
  warning: (args: ParagraphNotificationArgs) => void;
};

type UseReaderParagraphTrackingParams = {
  contentRootRef: RefObject<HTMLDivElement | null>;
  isFocused: boolean;
  renderedEpisodeHtml: string;
  bookmarks: EpisodeBookmark[];
  notification: ParagraphNotificationApi;
  onCloseBookmarkPopover: () => void;
};

export function useReaderParagraphTracking({
  contentRootRef,
  isFocused,
  renderedEpisodeHtml,
  bookmarks,
  notification,
  onCloseBookmarkPopover,
}: UseReaderParagraphTrackingParams) {
  const [selectedParagraphIndex, setSelectedParagraphIndex] = useState<number | null>(null);
  const [trackedParagraphIndex, setTrackedParagraphIndex] = useState<number | null>(null);
  const [showTrackedParagraphLabel, setShowTrackedParagraphLabel] = useState(true);
  const [showTrackedParagraphArrow, setShowTrackedParagraphArrow] = useState(true);

  const bookmarkedParagraphIndexes = useMemo(
    () => new Set(bookmarks.map((b) => b.paragraph_index).filter((n) => Number.isFinite(n) && n > 0)),
    [bookmarks],
  );

  const getCurrentParagraphIndex = useCallback(() => {
    const root = contentRootRef.current;
    if (!root) return null;

    const nodes = Array.from(root.querySelectorAll("[data-paragraph-index]")) as HTMLElement[];
    if (nodes.length === 0) return null;

    const anchorY = window.innerHeight * 0.35;
    let closestIdx: number | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    nodes.forEach((node) => {
      const idx = Number(node.getAttribute("data-paragraph-index"));
      if (!Number.isFinite(idx)) return;

      const rect = node.getBoundingClientRect();
      const topDistance = Math.abs(rect.top - anchorY);

      if (topDistance < closestDistance) {
        closestDistance = topDistance;
        closestIdx = idx;
      }
    });

    return closestIdx;
  }, [contentRootRef]);

  const scrollToParagraph = useCallback((paragraphIndex: number) => {
    const root = contentRootRef.current;
    if (!root) return;

    const target = root.querySelector(`[data-paragraph-index="${paragraphIndex}"]`) as HTMLElement | null;
    if (!target) {
      notification.warning({
        message: "ไม่พบตำแหน่งที่บุ๊กมาร์กไว้",
        description: `ย่อหน้าที่ ${paragraphIndex} ไม่มีในเนื้อหาปัจจุบัน`,
        placement: "topRight",
      });
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("bookmark-highlight");
    window.setTimeout(() => target.classList.remove("bookmark-highlight"), 1400);
    onCloseBookmarkPopover();
  }, [contentRootRef, notification, onCloseBookmarkPopover]);

  useEffect(() => {
    const onSelectionChange = () => {
      const root = contentRootRef.current;
      if (!root || !isFocused) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setSelectedParagraphIndex(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const targetNode = container.nodeType === Node.ELEMENT_NODE ? container as Element : container.parentElement;

      if (!targetNode || !root.contains(targetNode)) {
        setSelectedParagraphIndex(null);
        return;
      }

      const paragraphEl = (targetNode as Element).closest("[data-paragraph-index]") as HTMLElement | null;
      if (!paragraphEl) {
        setSelectedParagraphIndex(null);
        return;
      }

      const idx = Number(paragraphEl.getAttribute("data-paragraph-index"));
      if (!Number.isFinite(idx) || idx <= 0) {
        setSelectedParagraphIndex(null);
        return;
      }

      setSelectedParagraphIndex(idx);
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [contentRootRef, isFocused]);

  useEffect(() => {
    if (!isFocused) {
      setTrackedParagraphIndex(null);
      return;
    }

    const updateTrackedParagraph = () => {
      setTrackedParagraphIndex(getCurrentParagraphIndex());
    };

    updateTrackedParagraph();
    window.addEventListener("scroll", updateTrackedParagraph, { passive: true });
    window.addEventListener("resize", updateTrackedParagraph);

    return () => {
      window.removeEventListener("scroll", updateTrackedParagraph);
      window.removeEventListener("resize", updateTrackedParagraph);
    };
  }, [getCurrentParagraphIndex, isFocused, renderedEpisodeHtml]);

  useEffect(() => {
    const root = contentRootRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll("[data-paragraph-index]")) as HTMLElement[];
    nodes.forEach((node) => node.classList.remove("paragraph-tracked-current"));

    if (!trackedParagraphIndex || !showTrackedParagraphArrow) return;
    const target = root.querySelector(`[data-paragraph-index="${trackedParagraphIndex}"]`) as HTMLElement | null;
    if (target) target.classList.add("paragraph-tracked-current");
  }, [contentRootRef, trackedParagraphIndex, renderedEpisodeHtml, showTrackedParagraphArrow]);

  useEffect(() => {
    const root = contentRootRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll("[data-paragraph-index]")) as HTMLElement[];
    nodes.forEach((node) => node.classList.remove("paragraph-bookmarked"));

    bookmarkedParagraphIndexes.forEach((idx) => {
      const target = root.querySelector(`[data-paragraph-index="${idx}"]`) as HTMLElement | null;
      if (target) target.classList.add("paragraph-bookmarked");
    });
  }, [bookmarkedParagraphIndexes, contentRootRef, renderedEpisodeHtml]);

  return {
    selectedParagraphIndex,
    setSelectedParagraphIndex,
    trackedParagraphIndex,
    showTrackedParagraphLabel,
    setShowTrackedParagraphLabel,
    showTrackedParagraphArrow,
    setShowTrackedParagraphArrow,
    getCurrentParagraphIndex,
    scrollToParagraph,
  };
}
