import React from 'react'
import EditMyBook from '@/features/user/EditMyBook'

interface Props {
  params: { bookID: string }
}

export default async function Page({ params }: Props) {
  const { bookID } = await params
  return <EditMyBook bookId={bookID} />
}
