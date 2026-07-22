import EditMyBook from '@/features/user/EditMyBook'
import AuthGuard from '@/features/auth/components/AuthGuard'

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
