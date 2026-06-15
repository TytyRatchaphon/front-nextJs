import AuthGuard from '@/components/auth/AuthGuard'
import CartClientLoader from '@/features/Home/CartClientLoader'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ตะกร้าสินค้า',
  description: 'ตะกร้าสินค้าของคุณบน Enjoybook',
  alternates: { canonical: '/cart' },
}

function CartPage() {
  return (
    <AuthGuard>
        <div className="min-h-screen bg-gray-50 pb-20">
            <CartClientLoader />
        </div>
    </AuthGuard>
  )
}

export default CartPage
