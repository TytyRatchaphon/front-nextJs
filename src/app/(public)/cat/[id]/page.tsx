import Category from '@/features/Home/Category'

export const revalidate = 120;
import '@/components/home/FooterWrapper';
import '@/components/navbar/navbar';

function Page() {
  return (
    <>
        <Category />
    </>
  )
}

export default Page