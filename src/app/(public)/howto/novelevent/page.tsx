import type { Metadata } from 'next';
import NovelEvent from '@/features/Home/NovelEvent'

export const metadata: Metadata = {
  title: 'กิจกรรมนิยาย',
  description: 'กิจกรรมนิยายสุดพิเศษบน Enjoybook ร่วมสนุก ลุ้นรางวัล',
  alternates: { canonical: '/howto/novelevent' },
};

function page() {
  return (
    <div>
      <NovelEvent />
    </div>
  )
}

export default page