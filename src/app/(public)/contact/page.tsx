import type { Metadata } from 'next';
import LiveChatContactPage from "@/features/liveChat/LiveChatContactPage";

export const metadata: Metadata = {
  title: 'ติดต่อทีมงาน',
  description: 'ติดต่อทีมงาน Enjoybook สอบถามข้อมูล แจ้งปัญหา หรือส่งข้อเสนอแนะ พร้อมให้บริการทุกวัน',
  alternates: { canonical: '/contact' },
};
export default function ContactPage() {
  return <LiveChatContactPage />;
}
