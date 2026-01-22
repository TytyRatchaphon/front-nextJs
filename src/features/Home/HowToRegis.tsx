"use client"

import React from 'react'
import Image from 'next/image'

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
}

function HowToRegis() {

  return (
    <div className="w-full flex justify-center py-10 px-4">
      <div className="max-w-[1000px] w-full flex flex-col gap-8 text-black">

        {/* Title */}
        <h1 className="text-3xl lg:text-4xl font-bold text-center mb-8">วิธีสมัครสมาชิก</h1>

        {/* Section 1: Intro */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl lg:text-2xl font-bold">การสร้างบัญชีผู้ใช้และการเข้าสู่ระบบ</h2>

          <h3 className="text-lg lg:text-xl font-bold underline decoration-1 underline-offset-4">บัญชีผู้ใช้คืออะไร</h3>

          <p className="text-base lg:text-lg leading-relaxed">
            บัญชีผู้ใช้ เป็นสิ่งสำคัญสำหรับผู้ใช้ในเว็บไซต์
            <br />
            โดยหลังจากสร้างบัญชีผู้ใช้แล้ว จะสามารถเข้าสู่ระบบซื้อนิยายติดเหรียญทอง
            เติมเงิน จัดการชั้นหนังสือ เขียนรีวิว สร้างกระทู้ และร่วมกิจกรรม แคมเปญต่าง ๆ ได้
          </p>

          <p className="text-base lg:text-lg leading-relaxed">
            ในกรณีหากไม่มีบัญชีผู้ใช้ สามารถทดลองอ่านได้
            <br />
            แต่จำกัดการอ่านนิยายรายตอนที่เป็นตอนฟรีไม่เกินจำนวน 5 ตอน เท่านั้น
            <br />
            และไม่สามารถอ่านนิยายรายตอนที่ติดเหรียญทองได้
          </p>
        </section>

        {/* Section 2: Registration */}
        <section className="flex flex-col gap-4">
          <h3 className="text-lg lg:text-xl font-bold underline decoration-1 underline-offset-4">การสมัครบัญชีผู้ใช้งานเพื่อเข้าสู่ระบบ</h3>

          {/* Image Placeholder */}
          <Image src="https://img.enjoybook.co/img/smn/EJB2024n7oIzU7Ieuu1piG0MOlV1206104512.png" alt="สมัครสมาชิก" width={600} height={600} loader={imageLoader} />


          <p className="text-base lg:text-lg leading-relaxed">
            กดเลือกสมัครสมาชิก ด้านล่างสุด
            <br />
            ใส่ข้อมูลรายชื่อและอีเมลที่ใช้งาน พร้อมสร้างรหัสผ่านและกดสมัครสมาชิก
          </p>
        </section>

        {/* Section 3: Login */}
        <section className="flex flex-col gap-4">
          <h3 className="text-lg lg:text-xl font-bold underline decoration-1 underline-offset-4">การเข้าสู่ระบบ</h3>

          {/* Image Placeholder */}
          <Image src="https://img.enjoybook.co/img/smn/EJB2024XXv30m1is6JTXrp6BMHm1206104651.png" alt="สมัครสมาชิก" width={600} height={600} loader={imageLoader} />

          <p className="text-base lg:text-lg leading-relaxed">
            ผู้ใช้สามารถเข้าสู่ระบบได้โดยใช้อีเมล หรือชื่อผู้ใช้
            <br />
            หากมี apple id หรือ บัญชี facebook / gmail และ Line สามารถเข้าสู่ระบบได้ทันที
            <br />
            โดยไม่ต้องใช้อีเมลสมัครสมาชิก
          </p>
        </section>

        {/* Section 4: Forgot Password */}
        <section className="flex flex-col gap-4">
          <h3 className="text-lg lg:text-xl font-bold underline decoration-1 underline-offset-4">กรณี ' ลืมรหัสผ่าน '</h3>

          {/* Image Placeholder */}
          <Image src="https://img.enjoybook.co/img/smn/EJB2024Ib4xAYUoyEy2bTBAG1ki1206104903.png" alt="Forgot Password" width={600} height={600} loader={imageLoader} />

          <p className="text-base lg:text-lg leading-relaxed">
            ในหน้าต่างเข้าสู่ระบบ สามารถกดปุ่ม 'ลืมรหัสผ่าน' ที่อยู่ด้านล่างได้
            <br />
            โดยระบบจะให้กรอกอีเมลที่ใช้สมัคร หลังจากนั้นระบบจะส่งขั้นตอน
            <br />
            การเปลี่ยนรหัสผ่านไปที่อีเมลดังกล่าว หากผู้ใช้ไม่ได้ยืนยันอีเมลที่
            <br />
            ระบบส่งไปให้ตอนสร้างบัญชีผู้ใช้ ระบบจะไม่สามารถดำเนินการ
            <br />
            ส่งอีเมลขั้นตอนการเปลี่ยนรหัสผ่านได้
          </p>

          <p className="text-base lg:text-lg font-bold mt-4">
            หรือแจ้งปัญหามาให้ทีมงานช่วยเหลือได้ที่ไลน์ @enjoybook (มี @ ด้วยนะ)
          </p>
        </section>

      </div>
    </div>
  )
}

export default HowToRegis