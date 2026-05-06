"use client";

import type { RefObject, ReactNode } from "react";

import type { ReadPayMethod } from "../purchaseUtils";
import { ReadPurchaseFallback } from "./ReadPurchaseFallback";

type ReaderContentAreaProps = {
  contentRef: RefObject<HTMLElement | null>;
  innerContentRef: RefObject<HTMLDivElement | null>;
  allowTemporaryTextSelection: boolean;
  renderedEpisodeHtml: string;
  parsedRenderedEpisodeHtml: ReactNode;
  isQuotaHardBlocked: boolean;
  fontSize: number;
  currentFontFamily?: { family?: string } | null;
  isBold: boolean;
  textAlign: "left" | "center" | "justify";
  isFocused: boolean;
  contentHeight?: number;
  shouldDelayObfuscatedRender: boolean;
  episode: unknown;
  settings: any;
  isScheduledReleasePending: boolean;
  purchaseState: any;
  scheduledPublishAt: Date | null;
  scheduledReleaseCountdown: string | null;
  currentBgKey?: string;
  onLogin: () => void;
  onGoStore: () => void;
  onOpenConfirm: (method: ReadPayMethod, amount?: number | null) => void;
  selectedParagraphIndex: number | null;
  onCreateBookmarkAtParagraph: (paragraphIndex: number) => void;
  onClearSelectedParagraph: () => void;
  showTrackedParagraphLabel: boolean;
  trackedParagraphIndex: number | null;
};

export function ReaderContentArea({
  contentRef,
  innerContentRef,
  allowTemporaryTextSelection,
  renderedEpisodeHtml,
  parsedRenderedEpisodeHtml,
  isQuotaHardBlocked,
  fontSize,
  currentFontFamily,
  isBold,
  textAlign,
  isFocused,
  contentHeight,
  shouldDelayObfuscatedRender,
  episode,
  settings,
  isScheduledReleasePending,
  purchaseState,
  scheduledPublishAt,
  scheduledReleaseCountdown,
  currentBgKey,
  onLogin,
  onGoStore,
  onOpenConfirm,
  selectedParagraphIndex,
  onCreateBookmarkAtParagraph,
  onClearSelectedParagraph,
  showTrackedParagraphLabel,
  trackedParagraphIndex,
}: ReaderContentAreaProps) {
  return (
    <>
      <article
        ref={contentRef}
        className={`episode-content episode-content-wrapper relative mt-5 pb-10 md:pb-14 ${allowTemporaryTextSelection ? "" : "select-none"} leading-loose lg:px-11 px-6 text-wrap whitespace-normal overflow-x-hidden main-read cursor-pointer`}
        style={{
          userSelect: allowTemporaryTextSelection ? "text" : "none",
          WebkitUserSelect: allowTemporaryTextSelection ? "text" : "none",
          MozUserSelect: allowTemporaryTextSelection ? "text" : "none",
          msUserSelect: allowTemporaryTextSelection ? "text" : "none",
        }}
      >
        <div
          ref={innerContentRef}
          className={renderedEpisodeHtml && !isQuotaHardBlocked ? "reader-font-surface" : undefined}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "1.8",
            fontFamily: renderedEpisodeHtml && !isQuotaHardBlocked
              ? (currentFontFamily?.family || "var(--font-sarabun), sans-serif")
              : "var(--font-sarabun), sans-serif",
            fontWeight: isBold ? "bold" : "normal",
            textAlign,
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            minHeight: !isFocused
              ? contentHeight
              : (shouldDelayObfuscatedRender ? 240 : undefined),
            opacity: (isFocused && !shouldDelayObfuscatedRender) ? 1 : 0,
            transition: "opacity 0.1s ease",
            pointerEvents: (isFocused && !shouldDelayObfuscatedRender) ? "auto" : "none",
          }}
        >
          {(isFocused && !shouldDelayObfuscatedRender) ? (
            renderedEpisodeHtml && !isQuotaHardBlocked ? (
              parsedRenderedEpisodeHtml
            ) : (
              <ReadPurchaseFallback
                episode={episode}
                settings={settings}
                isQuotaHardBlocked={isQuotaHardBlocked}
                isScheduledReleasePending={isScheduledReleasePending}
                purchaseState={purchaseState}
                scheduledPublishAt={scheduledPublishAt}
                scheduledReleaseCountdown={scheduledReleaseCountdown}
                currentBgKey={currentBgKey}
                onLogin={onLogin}
                onGoStore={onGoStore}
                onOpenConfirm={onOpenConfirm}
              />
            )
          ) : null}
        </div>

        {isFocused && shouldDelayObfuscatedRender && (
          <div
            className="absolute inset-x-0 top-0 px-6 lg:px-11 py-4 pointer-events-none"
            aria-hidden="true"
          >
            <div className="animate-pulse space-y-4">
              <div className="h-4 rounded bg-white/10 w-11/12" />
              <div className="h-4 rounded bg-white/10 w-full" />
              <div className="h-4 rounded bg-white/10 w-10/12" />
              <div className="h-4 rounded bg-white/10 w-9/12" />
            </div>
          </div>
        )}

        {!isFocused && (
          <div className="fixed inset-0 z-[5000] bg-white pointer-events-none">
            <div className="hidden" aria-hidden="true">
              คลิกที่นี่เพื่ออ่านต่อ
            </div>
          </div>
        )}
      </article>

      {isFocused && selectedParagraphIndex && (
        <div className="fixed bottom-24 right-6 z-[850]">
          <button
            onClick={() => {
              onCreateBookmarkAtParagraph(selectedParagraphIndex);
              window.getSelection()?.removeAllRanges();
              onClearSelectedParagraph();
            }}
            className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold shadow-lg hover:bg-red-700 transition-colors"
          >
            บันทึกย่อหน้า {selectedParagraphIndex}
          </button>
        </div>
      )}

      {isFocused && showTrackedParagraphLabel && trackedParagraphIndex && (
        <div className="fixed bottom-24 left-6 z-[840] px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium pointer-events-none">
          ย่อหน้า {trackedParagraphIndex.toLocaleString("th-TH")}
        </div>
      )}
    </>
  );
}
