import React from 'react'
import ThreadDetail from '@/features/book/threadDetail'

interface PageProps {
  params: Promise<{
    id: string;
  }>
}

export default async function ThreadPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div>
      <ThreadDetail topicId={id} />
    </div>
  )
}
