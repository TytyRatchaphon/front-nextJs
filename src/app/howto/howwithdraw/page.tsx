import React from 'react'

function HowWithdrawPage() {
  return (
    <div className='min-h-screen py-8'>
      <div className='max-w-5xl mx-auto px-4'>
        {/* Header */}
        <h1 className='text-3xl font-bold text-center mb-8'>ขั้นตอนการจ่ายเงินให้นักเขียน</h1>
        
        {/* Content */}
        <div className='p-8'>
          {/* Section 1 */}
          <h2 className='text-xl font-bold mb-6 border-b-2 border-black pb-2'>
            ขั้นตอนการจ่ายเงินให้นักเขียน
          </h2>

          <p className='text-base mb-6'>
            การจ่ายเงินให้นักเขียน
          </p>

          <p className='text-base font-semibold mb-6'>
            นักเขียนที่เริ่มสั่งขายนิยายด้วยเหรียญบุกทอง
          </p>

          <p className='text-base mb-6'>
            จะต้องส่งส่วนอบัตรประชาชนและส่วนอรสมุดบัญชี พร้อมส่วนอวจากดีดองและลงลายมื่อชื่อ
          </p>

          <p className='text-base mb-8'>
            เพื่อเป็นการยืนยันตัวตนในการรับเงินรายได้ของนักเขียน
          </p>

          {/* Section 2 */}
          <h2 className='text-xl font-bold mb-6'>
            เรามีเงื่อนไขในการชำระเงินดังนี้
          </h2>

          <div className='space-y-4 mb-6'>
            <p className='text-base leading-relaxed'>
              นักเขียนจะได้รับส่วนแบ่งรายได้ 70 % จากยอดขายเหรียญบุทอง (ก่อนการหักภาษี ณ ที่จ่ายและส่วนบริการโอนเงินเข้าบัญชีของ Payment Gateway)
            </p>

            <p className='text-base leading-relaxed'>
              สามารถตรวจสอบยอดเงินได้ที่หั่องทาง &apos;เขียนนิยาย&apos; &gt; ยอดเงินที่ถอนได้
            </p>

            <p className='text-base leading-relaxed'>
              ระบบจะต้องขายยอดเงินในสัปดาห์ที่ 1 ของทุกเดือน เมื่อยอดโอนขั้นต่ำ 100 บาท
            </p>

            <p className='text-base leading-relaxed'>
              และโอนเข้าบัญชีซี่ที่ลงทะเบียนไว้ทุกวันที่ 30 ของทุกเดือน (หากติดวันหยุดเสาร์-อาทิตย์ นักขีดทูกจะถูกเลื่อนออกไป 1 วัน)
            </p>
          </div>

          <div className='space-y-4'>
            <p className='text-base leading-relaxed'>
              ทุกยอดถอน จะมีค่าบริการโอนเงินเข้าบัญชีของ Payment Gateway 10 บาทต่อครั้ง
            </p>

            <p className='text-base leading-relaxed'>
              ทุกยอดที่ถอนจะมีการหักภาษี ณ ที่จ่าย 3%
            </p>

            <p className='text-base leading-relaxed'>
              ทางเราจะส่งเอกสารหักภาษี ณ ที่จ่ายไปตามที่นักเขียนแจ้งไว้ใน &apos;ที่อยู่ปัจจุบัน&apos;
            </p>

            <p className='text-base leading-relaxed'>
              นักเขียนสามารถดาวน์โหลดรับทั้งหลังส์อรับรองการหักภาษี ณ ที่จ่าย (สำเนา) ได้ที่ ถอนเงิน &gt; ประวัติการถอน ได้ภายหลังจากที่ได้รับเงินโอนค่าภาษีนักเขียนต้องการหนังสื่อรับรองการหักภาษี ณ ที่จ่าย (ต้นฉบับ) สามารถแจ้งขอได้ทางอีเมล support@enjoybook.co ทางเราจะซีดส่งเอกสารหักภาษี ณ ที่จ่ายไปตามที่นักเขียนแจ้งไว้ใน &apos;ที่อยู่ปัจจุบัน&apos;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowWithdrawPage