"use client";

import { Input, Modal } from "antd";

type ReadBookmarkModalProps = {
  open: boolean;
  editingBookmarkId: number | string | null;
  bookmarkParagraphIndex: number | null;
  bookmarkNote: string;
  isSavingBookmark: boolean;
  onNoteChange: (note: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function ReadBookmarkModal({
  open,
  editingBookmarkId,
  bookmarkParagraphIndex,
  bookmarkNote,
  isSavingBookmark,
  onNoteChange,
  onCancel,
  onSubmit,
}: ReadBookmarkModalProps) {
  return (
    <Modal
      open={open}
      title={editingBookmarkId ? "แก้ไข Bookmark" : "เพิ่ม Bookmark"}
      onCancel={onCancel}
      onOk={onSubmit}
      okText={editingBookmarkId ? "บันทึกการแก้ไข" : "บันทึก"}
      cancelText="ยกเลิก"
      confirmLoading={isSavingBookmark}
    >
      <div className="space-y-3 pt-2">
        <div className="text-sm text-gray-600">
          ตำแหน่งย่อหน้า: <span className="font-semibold text-gray-900">{bookmarkParagraphIndex ?? "-"}</span>
        </div>
        <Input.TextArea
          value={bookmarkNote}
          onChange={(event) => onNoteChange(event.target.value)}
          rows={3}
          maxLength={120}
          placeholder="เพิ่มโน้ต (ไม่บังคับ)"
        />
      </div>
    </Modal>
  );
}
