import JsonLd from './JsonLd';
import { generateBreadcrumbSchema, type BreadcrumbItem } from '@/utils/schema';

/**
 * Injects BreadcrumbList JSON-LD for any page with hierarchical navigation.
 *
 * Usage:
 *   <BreadcrumbJsonLd items={[
 *     { name: 'หน้าหลัก', url: 'https://enjoybook.co' },
 *     { name: 'นิยาย', url: 'https://enjoybook.co/allnovel' },
 *     { name: bookName, url: `https://enjoybook.co/book/${id}` },
 *   ]} />
 */
export default function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (!items || items.length < 2) return null;
  return <JsonLd data={generateBreadcrumbSchema(items)} />;
}
