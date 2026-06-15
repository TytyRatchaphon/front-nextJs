import type { Metadata } from 'next';
import NewNovel from "@/features/Home/NewNovel";

export const metadata: Metadata = {
  title: 'นิยายมาใหม่',
  description: 'นิยายมาใหม่ อัปเดตทุกวัน อ่านนิยายออนไลน์ล่าสุดบน Enjoybook',
  alternates: { canonical: '/news' },
};

export default function NewsPage() {
    return (
        <NewNovel />
    )
}
