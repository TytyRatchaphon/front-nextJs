import React from 'react'
import EditMyBook from '@/features/user/EditMyBook'

interface Props {
  params: { bookID: string }
}

export default function Page({ params }: Props) {
  const { bookID } = params
  return <EditMyBook bookId={bookID} />
}
