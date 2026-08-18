"use client";

import { Button, Popover } from "antd";

import type { EpisodeBookmark } from "../readerContentUtils";
import { getReaderMenuTheme } from "./ReaderSettingsPopover";

type ReaderBookmarkPopoverProps = {
  zIndex: number;
  currentBg: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmarks: EpisodeBookmark[];
  isFetchingBookmarks: boolean;
  onCreateBookmark: () => void;
  onEditBookmark: (bookmark: EpisodeBookmark) => void;
  onDeleteBookmark: (bookmarkId: number) => void;
  onScrollToParagraph: (paragraphIndex: number) => void;
};

export function ReaderBookmarkPopover({
  zIndex,
  currentBg,
  open,
  onOpenChange,
  bookmarks,
  isFetchingBookmarks,
  onCreateBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onScrollToParagraph,
}: ReaderBookmarkPopoverProps) {
  const readerMenuTheme = getReaderMenuTheme(currentBg?.key);
  const bookmarkIconStroke = currentBg?.key === "dark" ? "#DFDFEC" : "#4B5563";

  return (
    <Popover
      placement="bottomRight"
      zIndex={zIndex}
      getPopupContainer={(triggerNode) => (triggerNode ? (triggerNode.parentElement as HTMLElement) : document.body)}
      classNames={{ root: "reader-bookmark-popover" }}
      styles={{ body: { padding: 0 } }}
      trigger="click"
      open={open}
      onOpenChange={onOpenChange}
      content={
        <div
          className="reader-bookmark-panel w-80"
          style={{ backgroundColor: readerMenuTheme.panelBg, color: readerMenuTheme.text }}
        >
          <div
            className="reader-bookmark-title flex items-center justify-between border-b px-3 pt-3 pb-2"
            style={{ borderBottomColor: readerMenuTheme.panelBorder, color: readerMenuTheme.text }}
          >
            <div className="text-sm font-semibold">ตำแหน่งที่บุ๊กมาร์กไว้</div>
            <div />
          </div>
          <div className="mb-2 flex items-center justify-end px-3 pt-3">
            <Button size="small" type="primary" onClick={onCreateBookmark}>
              เพิ่มจากตำแหน่งปัจจุบัน
            </Button>
          </div>
          <div className="max-h-72 overflow-auto">
            {isFetchingBookmarks ? (
              <div className="reader-bookmark-empty py-4 text-center text-xs" style={{ color: readerMenuTheme.muted }}>กำลังโหลด...</div>
            ) : bookmarks.length === 0 ? (
              <div className="reader-bookmark-empty py-4 text-center text-xs" style={{ color: readerMenuTheme.muted }}>ยังไม่มีบุ๊กมาร์กในตอนนี้</div>
            ) : (
              <div className="space-y-1">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="reader-bookmark-item w-full px-3 py-2 rounded-lg transition-colors"
                    style={{ borderColor: readerMenuTheme.panelBorder }}
                  >
                    <button
                      onClick={() => onScrollToParagraph(bookmark.paragraph_index)}
                      className="w-full text-left"
                    >
                      <div className="reader-bookmark-heading text-sm font-medium" style={{ color: readerMenuTheme.text }}>ย่อหน้า {bookmark.paragraph_index}</div>
                      {bookmark.note && <div className="reader-bookmark-note text-xs truncate" style={{ color: readerMenuTheme.muted }}>{bookmark.note}</div>}
                    </button>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditBookmark(bookmark)}
                        className="text-xs text-blue-500 hover:text-blue-600"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => onDeleteBookmark(bookmark.id)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      }
    >
      <button
        className={`p-2 rounded-full transition-colors ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`}
        title="Bookmark"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M14 2C16 2 17 3.01 17 5.03V12.08C17 14.07 15.59 14.84 13.86 13.8L12.54 13C12.24 12.82 11.76 12.82 11.46 13L10.14 13.8C8.41 14.84 7 14.07 7 12.08V5.03C7 3.01 8 2 10 2H14Z" stroke={bookmarkIconStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.82 4.98996C3.41 5.55996 2 7.65996 2 11.9V14.93C2 19.98 4 22 9 22H15C20 22 22 19.98 22 14.93V11.9C22 7.58996 20.54 5.47996 17 4.95996" stroke={bookmarkIconStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </Popover>
  );
}
