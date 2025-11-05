import React from 'react'
import ResetPasswordPage from '@/features/user/ResetPassword'

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  return (
    <ResetPasswordPage params={resolvedParams} />
  )
}