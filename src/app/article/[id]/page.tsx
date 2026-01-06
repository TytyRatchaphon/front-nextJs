import React from 'react';
import ArticleDetail from '@/features/article/ArticleDetail';

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ArticleDetail id={resolvedParams.id} />;
}