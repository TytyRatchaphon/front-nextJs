import React from 'react';
import ArticleDetail from '@/features/article/ArticleDetail';
import { fetchArticleDetail } from '@/services/apiServices';

export const revalidate = 120;

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const initialData = await fetchArticleDetail(resolvedParams.id);
  return <ArticleDetail id={resolvedParams.id} initialData={initialData} />;
}
