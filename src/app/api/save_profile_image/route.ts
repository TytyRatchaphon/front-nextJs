import { NextResponse } from 'next/server';

// 👇 ตรวจสอบ URL Backend
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3331';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = request.headers.get('authorization');

    if (!token) {
        return NextResponse.json({ message: 'ไม่พบ Token' }, { status: 401 });
    }

    // ✅ Logic: บังคับรูปแบบ Bearer ให้ถูกต้อง (เหมือนไฟล์ save_profile)
    const rawToken = token.replace(/^Bearer\s+/i, "");
    const finalToken = `Bearer ${rawToken}`;

    //  // เปิดดูถ้าอยากเช็ค

    const backendResponse = await fetch(`${BACKEND_URL}/user/save_profile_image`, {
        method: 'POST',
        headers: {
            'Authorization': finalToken, // ส่ง Token ที่จัด Format แล้ว
            // ⚠️ ห้ามใส่ Content-Type ตรงนี้ fetch จะจัดการเอง
        },
        body: formData, 
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
        throw new Error(data.message || 'อัปโหลดรูปภาพไม่สำเร็จ');
    }

    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูป' },
      { status: 500 }
    );
  }
}