import React from 'react'
import EditMyBook from '@/features/user/EditMyBook'
import AuthGuard from '@/components/auth/AuthGuard'

interface Props {
  params: { bookID: string }
}

export default async function Page({ params }: Props) {
  const { bookID } = await params
  return (
    <AuthGuard>
      <EditMyBook bookId={bookID} />
    </AuthGuard>
  )
}
