import type { BookUpdateCalendarDay, BookUpdateDailyBook, UpdateScope } from "@/services/api/bookUpdatesApi";

export type BookUpdateTimeGroup = {
  timeLabel: string;
  books: BookUpdateDailyBook[];
};

export const getCoverSrc = (book: BookUpdateDailyBook) =>
  book.img_gif_full ||
  book.img_full ||
  book.img_gif ||
  book.img ||
  "/images/ejb.png";

export const getFastAccessText = (book: BookUpdateDailyBook) => {
  const fast = book.latest_episode?.fast_access;
  if (!fast?.available || fast.advance_days <= 0) return null;

  return `อ่านล่วงหน้าได้ ${fast.advance_days} วัน`;
};

export const isLoginRequiredError = (message?: string) =>
  Boolean(message && /login|เข้าสู่ระบบ|กรุณาเข้าสู่ระบบ/i.test(message));

export const getEmptyText = (scope: UpdateScope) => {
  if (scope === "shelf") return "วันนี้ยังไม่มีนิยายในชั้นหนังสือของคุณอัปเดต";
  if (scope === "following") return "วันนี้ยังไม่มีนิยายจากนักเขียนที่ติดตามอัปเดต";
  return "วันนี้ยังไม่มีนิยายอัปเดต";
};

export const getCalendarDayClass = (day: BookUpdateCalendarDay, selectedDate: string) =>
  [
    "calendar-day",
    day.date === selectedDate ? "is-selected" : "",
    day.is_today ? "is-today" : "",
    day.is_past ? "is-past" : "",
    day.is_future ? "is-future" : "",
    day.has_updates ? "has-updates" : "no-updates",
  ]
    .filter(Boolean)
    .join(" ");

export const groupBooksByPublishTime = (books: BookUpdateDailyBook[]): BookUpdateTimeGroup[] => {
  const groups: BookUpdateTimeGroup[] = [];

  books.forEach((book) => {
    const timeLabel = book.publish_time_text || "อัปเดตใหม่";
    const currentGroup = groups[groups.length - 1];

    if (currentGroup?.timeLabel === timeLabel) {
      currentGroup.books.push(book);
      return;
    }

    groups.push({ timeLabel, books: [book] });
  });

  return groups;
};
