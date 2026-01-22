import { NextResponse } from 'next/server';

// 👇 ตรวจสอบ URL Backend (Port 3331)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3331';

export async function POST(request: Request) {
  try {

    // 1. รับ Token และจัดการ Bearer
    const token = request.headers.get('authorization');
    if (!token) return NextResponse.json({ message: 'ไม่พบ Token' }, { status: 401 });

    const rawToken = token.replace(/^Bearer\s+/i, "");
    const finalToken = `Bearer ${rawToken}`;

    const contentType = request.headers.get('content-type') || '';

    let backendResponse;

    if (contentType.includes('application/json')) {
      // --- กรณี JSON (แก้ข้อความ) ---
      const body = await request.json();

      backendResponse = await fetch(`${BACKEND_URL}/user/save_profile`, {
        method: 'POST',
        headers: {
          'Authorization': finalToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

    } else {
      // --- กรณี FormData (มีรูปภาพ) ---
      const reqFormData = await request.formData();
      const backendFormData = new FormData();

      for (const [key, value] of reqFormData.entries()) {
        if (value === 'null' || value === null) continue;
        backendFormData.append(key, value);
      }

      backendResponse = await fetch(`${BACKEND_URL}/user/save_profile`, {
        method: 'POST',
        headers: {
          'Authorization': finalToken,
          // fetch automatically sets Content-Type for FormData
        },
        body: backendFormData,
      });
    }

    // 5. อ่าน Response
    const data = await backendResponse.json();


    // 6. เช็คผลลัพธ์
    if (!backendResponse.ok || (data.code !== 200 && data.status !== 'success')) {
      // กรณีพิเศษ: Backend แจ้งเตือนแต่ให้ Token ใหม่มา (ถือว่าผ่าน)
      if (data.data?.token) {
        return NextResponse.json(data);
      }

      // กรณี Error จริง
      return NextResponse.json(data, { status: 400 });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'เกิดข้อผิดพลาดที่ Server Proxy' },
      { status: 500 }
    );
  }
}