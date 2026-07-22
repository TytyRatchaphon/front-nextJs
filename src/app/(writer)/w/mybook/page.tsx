import MyBook from '@/features/mybook/MyBook'
import AuthGuard from '@/features/auth/components/AuthGuard'

function page() {
  return (
    <AuthGuard>
      <div>
        <MyBook />
      </div>
    </AuthGuard>
  )
}

export default page