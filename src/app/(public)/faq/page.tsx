import FaqContent from '@/features/faq/FaqContent';
import { fetchFaqs } from '@/services/apiServices';
import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { generateFAQSchema } from '@/utils/schema';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'คำถามที่พบบ่อย (FAQ)',
  description: 'คำถามที่พบบ่อยเกี่ยวกับ Enjoybook วิธีอ่านนิยาย การเติมเหรียญ การสมัครสมาชิก และอื่นๆ',
  alternates: {
    canonical: '/faq',
  },
};

export default async function FaqPage() {
  const initialFaqs = await fetchFaqs();

  // Generate FAQPage Schema.org for rich results
  const faqSchema = initialFaqs.length > 0
    ? generateFAQSchema(initialFaqs.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })))
    : null;

  return (
    <>
      {faqSchema && <JsonLd data={faqSchema} />}
      <FaqContent initialFaqs={initialFaqs} />
    </>
  );
}
