import type { Metadata } from "next";
import BookUpdatesPage from "@/features/bookUpdates/BookUpdatesPage";

export const metadata: Metadata = {
  title: "ตารางอัปเดตนิยาย",
  description: "ดูนิยายที่อัปเดตรายวัน แยกตามชั้นหนังสือ นักเขียนที่ติดตาม และประเภทนิยาย",
  alternates: { canonical: '/book-updates' },
};

export default function Page() {
  return <BookUpdatesPage />;
}
