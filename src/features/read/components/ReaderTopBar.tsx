"use client";

import Link from "next/link";
import { Popover } from "antd";

import { ReadEpisodeListContent } from "./ReadEpisodeListContent";
import { ReaderSettingsPopover, getReaderMenuTheme } from "./ReaderSettingsPopover";
import type { EpisodeBookmark, ReadEpisodeListGroup } from "../readerContentUtils";

type ReaderTopBarProps = {
  bookId: string;
  displayTitle: string;
  currentBg: any;
  zIndex: number;
  episodeGroups: ReadEpisodeListGroup[];
  currentEpisodeId: string;
  isGroupExpanded: (group: ReadEpisodeListGroup) => boolean;
  toggleGroupExpanded: (group: ReadEpisodeListGroup) => void;
  collapseAllGroups: () => void;
  onNavigateToEpisode: (episodeId: string | number, options?: { closeList?: boolean; closeSidebar?: boolean }) => void;
  isListPopoverOpen: boolean;
  onListPopoverOpenChange: (open: boolean) => void;
  fontSize: number;
  setFontSize: any;
  fontFamily: string;
  setFontFamily: any;
  bgColor: string;
  setBgColor: any;
  textColorKey: string;
  setTextColorKey: (key: string) => void;
  themeTextColors: Record<string, { key: string; label: string; hex: string }[]>;
  isBold: boolean;
  setIsBold: any;
  textAlign: "left" | "center" | "justify";
  setTextAlign: any;
  isAutoScroll: boolean;
  setIsAutoScroll: any;
  scrollSpeed: number;
  setScrollSpeed: any;
  fontFamilies: any[];
  bgColors: any[];
  readerDefaultFontKey: string;
  hasReaderObfuscationConfig: boolean;
  showTrackedParagraphLabel: boolean;
  setShowTrackedParagraphLabel: any;
  showTrackedParagraphArrow: boolean;
  setShowTrackedParagraphArrow: any;
  isBookmarkPopoverOpen: boolean;
  onBookmarkPopoverOpenChange: (open: boolean) => void;
  bookmarks: EpisodeBookmark[];
  isFetchingBookmarks: boolean;
  onCreateBookmark: () => void;
  onEditBookmark: (bookmark: EpisodeBookmark) => void;
  onDeleteBookmark: (bookmarkId: number) => void;
  onScrollToParagraph: (paragraphIndex: number) => void;
};

export function ReaderTopBar({
  bookId,
  displayTitle,
  currentBg,
  zIndex,
  episodeGroups,
  currentEpisodeId,
  isGroupExpanded,
  toggleGroupExpanded,
  collapseAllGroups,
  onNavigateToEpisode,
  isListPopoverOpen,
  onListPopoverOpenChange,
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  bgColor,
  setBgColor,
  textColorKey,
  setTextColorKey,
  themeTextColors,
  isBold,
  setIsBold,
  textAlign,
  setTextAlign,
  isAutoScroll,
  setIsAutoScroll,
  scrollSpeed,
  setScrollSpeed,
  fontFamilies,
  bgColors,
  readerDefaultFontKey,
  hasReaderObfuscationConfig,
  showTrackedParagraphLabel,
  setShowTrackedParagraphLabel,
  showTrackedParagraphArrow,
  setShowTrackedParagraphArrow,
  isBookmarkPopoverOpen,
  onBookmarkPopoverOpenChange,
  bookmarks,
  isFetchingBookmarks,
  onCreateBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onScrollToParagraph,
}: ReaderTopBarProps) {
  const readerMenuTheme = getReaderMenuTheme(currentBg?.key);

  return (
    <div
      className={`transition-colors duration-300 w-full sticky top-0 z-[120] ${currentBg?.paper || currentBg?.bg}`}
      data-reader-ignore-toggle="true"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 120,
        borderColor: currentBg?.key === "dark" ? "#333333" : "rgba(0,0,0,0.05)",
        borderBottomWidth: "1px",
      }}
    >
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-1">
          <Link
            href={bookId ? `/book/${bookId}` : "/"}
            className={`p-2 rounded-full transition-colors ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
            style={{ color: readerMenuTheme.text }}
          >
            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: readerMenuTheme.text }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden sm:inline">หน้าหลัก</span>
            </div>
          </Link>
          <Popover
            placement="bottomLeft"
            zIndex={zIndex}
            getPopupContainer={(triggerNode) => (triggerNode ? (triggerNode.parentElement as HTMLElement) : document.body)}
            overlayClassName="reader-episode-popover"
            title={<div className="text-sm font-semibold">สารบัญ</div>}
            content={
              <ReadEpisodeListContent
                episodeGroups={episodeGroups}
                currentEpisodeId={currentEpisodeId}
                isGroupExpanded={isGroupExpanded}
                toggleGroupExpanded={toggleGroupExpanded}
                collapseAllGroups={collapseAllGroups}
                onNavigateToEpisode={onNavigateToEpisode}
              />
            }
            trigger="click"
            open={isListPopoverOpen}
            onOpenChange={onListPopoverOpenChange}
          >
            <button
              className={`p-2 rounded-full transition-colors ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
              title="สารบัญ"
              style={{ color: readerMenuTheme.text }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </Popover>
        </div>

        <h1 className="text-sm font-medium truncate mx-4 flex-1 text-center opacity-80" style={{ color: currentBg?.key === "dark" ? "white" : undefined }}>
          {displayTitle || ""}
        </h1>

        <ReaderSettingsPopover
          zIndex={zIndex}
          currentBg={currentBg}
          fontSize={fontSize}
          setFontSize={setFontSize}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          bgColor={bgColor}
          setBgColor={setBgColor}
          textColorKey={textColorKey}
          setTextColorKey={setTextColorKey}
          themeTextColors={themeTextColors}
          isBold={isBold}
          setIsBold={setIsBold}
          textAlign={textAlign}
          setTextAlign={setTextAlign}
          isAutoScroll={isAutoScroll}
          setIsAutoScroll={setIsAutoScroll}
          scrollSpeed={scrollSpeed}
          setScrollSpeed={setScrollSpeed}
          fontFamilies={fontFamilies}
          bgColors={bgColors}
          readerDefaultFontKey={readerDefaultFontKey}
          hasReaderObfuscationConfig={hasReaderObfuscationConfig}
          showTrackedParagraphLabel={showTrackedParagraphLabel}
          setShowTrackedParagraphLabel={setShowTrackedParagraphLabel}
          showTrackedParagraphArrow={showTrackedParagraphArrow}
          setShowTrackedParagraphArrow={setShowTrackedParagraphArrow}
        />
      </div>
    </div>
  );
}
