import Category from '@/features/Home/Category';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { fetchBookCategoryAll } from '@/services/apiServices';
import JsonLd from '@/components/seo/JsonLd';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { generateCollectionPageSchema } from '@/utils/schema';

export const revalidate = 120;

type Props = {
  params: Promise<{ id: string }>;
};

const getCachedCategories = unstable_cache(
  async () => fetchBookCategoryAll(),
  ['book-categories-all'],
  { revalidate: 300 }
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const categories = await getCachedCategories();
    const category = categories.find((cat) => String(cat.id) === id);

    if (!category) {
      return { title: 'หมวดหมู่นิยาย' };
    }

    return {
      title: `นิยาย${category.name} - อ่านนิยาย${category.name}ออนไลน์`,
      description: category.description || `อ่านนิยาย${category.name}ออนไลน์ที่ Enjoybook รวมนิยาย${category.name}ยอดนิยม อัพเดททุกวัน`,
      alternates: {
        canonical: `/cat/${id}`,
      },
      openGraph: {
        title: `นิยาย${category.name}`,
        description: category.description || `รวมนิยาย${category.name}ยอดนิยม อ่านฟรีที่ Enjoybook`,
        url: `https://enjoybook.co/cat/${id}`,
        type: 'website',
      },
    };
  } catch {
    return { title: 'หมวดหมู่นิยาย' };
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  // Get category name for schema + breadcrumb
  let categoryName = 'หมวดหมู่';
  let categoryDescription = '';
  try {
    const categories = await getCachedCategories();
    const category = categories.find((cat) => String(cat.id) === id);
    if (category) {
      categoryName = category.name;
      categoryDescription = category.description || `รวมนิยาย${category.name}ยอดนิยม อ่านออนไลน์ที่ Enjoybook`;
    }
  } catch {
    // Non-critical
  }

  const baseUrl = 'https://enjoybook.co';
  const collectionSchema = generateCollectionPageSchema({
    name: `นิยาย${categoryName}`,
    description: categoryDescription,
    url: `${baseUrl}/cat/${id}`,
  });

  return (
    <>
      <JsonLd data={collectionSchema} />
      <BreadcrumbJsonLd items={[
        { name: 'หน้าหลัก', url: baseUrl },
        { name: 'หมวดหมู่', url: `${baseUrl}/allnovel` },
        { name: categoryName, url: `${baseUrl}/cat/${id}` },
      ]} />
      <Category />
    </>
  );
}