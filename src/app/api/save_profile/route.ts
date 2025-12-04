import { NextResponse } from 'next/server';

// 👇 ตรวจสอบ URL Backend (Port 3331)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3331'; 

export async function POST(request: Request) {
  try {
    console.log('🔄 [Proxy: Fetch Mode] Processing Request...');

    // 1. แกะ FormData จาก Frontend
    const reqFormData = await request.formData();
    
    // 2. รับ Token และจัดการ Bearer
    const token = request.headers.get('authorization');
    if (!token) return NextResponse.json({ message: 'ไม่พบ Token' }, { status: 401 });

    const rawToken = token.replace(/^Bearer\s+/i, "");
    const finalToken = `Bearer ${rawToken}`;

    // 3. สร้าง FormData ใหม่ (Re-pack) เพื่อความชัวร์
    const backendFormData = new FormData(); 
    
    console.log('📦 Payload Preview:');
    for (const [key, value] of reqFormData.entries()) {
         // กรองค่า 'null' ที่เป็น string หรือค่าว่างที่ไม่จำเป็นออก (เพื่อให้เหมือน Postman)
         if (value === 'null' || value === null) continue;
         
         // Log ดูข้อมูล (ยกเว้นไฟล์ยาวๆ)
         if (value instanceof File) {
            console.log(`   📂 File: ${key} -> ${value.name} (${value.size} bytes)`);
         } else {
            console.log(`   📝 Text: ${key} -> ${value}`);
         }

         backendFormData.append(key, value);
    }

    console.log('🚀 Sending to Backend:', `${BACKEND_URL}/user/save_profile`);

    // 4. ยิงไป Backend ด้วย fetch (เสถียรที่สุดสำหรับ FormData ใน Next.js)
    const backendResponse = await fetch(`${BACKEND_URL}/user/save_profile`, {
        method: 'POST',
        headers: {
            'Authorization': finalToken,
            // 🛑 ห้ามใส่ 'Content-Type': 'multipart/form-data' เด็ดขาด!
            // fetch จะใส่ให้เองพร้อม boundary เช่น: multipart/form-data; boundary=----WebKitFormBoundary...
        },
        body: backendFormData, 
    });

    // 5. อ่าน Response
    const data = await backendResponse.json();

    console.log('✅ Backend Status:', backendResponse.status);
    console.log('✅ Backend Response:', JSON.stringify(data).substring(0, 200) + '...');

    // 6. เช็คผลลัพธ์
    if (!backendResponse.ok || (data.code !== 200 && data.status !== 'success')) {
         // กรณีพิเศษ: Backend แจ้งเตือนแต่ให้ Token ใหม่มา (ถือว่าผ่าน)
         if (data.data?.token) {
             console.log('⚠️ Backend warning but Token received. Passing through.');
             return NextResponse.json(data);
         }
         
         // กรณี Error จริง
         console.error('🔥 Backend Rejected:', data);
         return NextResponse.json(data, { status: 400 });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('🔥 [Proxy Critical Error]:', error.message);
    return NextResponse.json(
      { message: error.message || 'เกิดข้อผิดพลาดที่ Server Proxy' },
      { status: 500 }
    );
  }
}