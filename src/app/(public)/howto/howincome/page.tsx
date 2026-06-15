import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ส่วนแบ่งรายได้นักเขียน',
  description: 'รายละเอียดวิธีคำนวณส่วนแบ่งรายได้สำหรับนักเขียนบน Enjoybook',
  alternates: { canonical: '/howto/howincome' },
};

function HowIncomePage() {
  return (
    <div className='min-h-screen py-8'>
      <div className='max-w-5xl mx-auto px-4'>
        {/* Header */}
        <h1 className='text-3xl font-bold text-center mb-8'>ส่วนแบ่งรายได้นักเขียน</h1>
        
        {/* Content */}
        <div className='p-8'>
          {/* Introduction */}
          <p className='text-base leading-relaxed mb-8'>
            วิธีการคำนวณส่วนแบ่งรายได้ จะขึ้นกับรูปแบบของช่องทางการชำระเงิน ดังนี้
          </p>

          {/* Section 1 */}
          <h2 className='text-lg font-semibold mb-4'>
            1. ในกรณีที่ชำระเงินผ่านระบบการชำระภายในของระบบปฏิบัติการ ได้แก่
          </h2>
          
          <div className='space-y-3 ml-4 mb-4'>
            <p className='text-base'>
              - IOS ของ Apple ตามที่ Apple เรียกเก็บจริงในแต่ละประเทศ 30 %
            </p>
            <p className='text-base'>
              - Android ของ Google 30 %
            </p>
          </div>

          <div className='ml-4 mb-8'>
            <p className='text-base leading-relaxed'>
              การแบ่งรายได้ระหว่างนักเขียนให้ในแบ่งรายได้สุทธิหลังหักส่วนแบ่งของเจ้าของระบบปฏิบัติการที่หักรายจ้างส่น โดยแบ่งให้กับผู้รับบริการร้อยละ 70 (เจ็ดสิบ) และแบ่งให้กับผู้ให้บริการร้อยละ 30 (สามสิบ)
            </p>
          </div>

          {/* Section 2 */}
          <h2 className='text-lg font-semibold mb-4'>
            2. ในกรณีที่ชำระเงินผ่านช่องทางอื่น นอกเหนือจากที่กล่าวมาในข้อ 1 การแบ่งรายได้ระหว่างนักเขียนให้ในแบ่งรายได้สุทธิหลังหักส่วนแบ่งค่าธรรมเนียมการชำระเงินผ่านช่องทางนั้น โดยแบ่งให้กับผู้รับบริการร้อยละ 70 (เจ็ดสิบ) และแบ่งให้กับผู้ให้บริการ ร้อยละ 30 (สามสิบ)
          </h2>

          {/* Section 3 */}
          <h2 className='text-lg font-semibold mb-4 mt-8'>
            3. ในกรณีถอนเงินชำระต่อธนบัตชะมีการหักค่าธรรมเนียมต่าง ๆ ดังนี้
          </h2>
          
          <div className='space-y-4 ml-4'>
            <p className='text-base'>
              - หัก ณ ที่จ่าย 3 %
            </p>
            <p className='text-base leading-relaxed'>
              - หักค่าบริการโอน 8-12 บาทต่อธนบัตชิ้นอยู่กับธนาคาร ทั้งนี้ผู้ให้บริการขอสงวนสิทธิ์ในการเปลี่ยนแปลงค่าบริการโอนตามเงื่อนไขที่ธนาคารกำหนดไว้
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowIncomePage