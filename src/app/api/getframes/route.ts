import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    // ดึง token จาก header
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'ไม่พบ token' },
        { status: 401 }
      );
    }


    // เรียก backend API พร้อม timeout
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3331'}/user/getFrameUser`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      timeout: 25000, // 25 วินาที (น้อยกว่า frontend เล็กน้อย)
    });


    // ส่งข้อมูลกลับไปให้ Frontend
    return NextResponse.json(response.data);

  } catch (error: any) {

    return NextResponse.json(
      {
        status: 'error',
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเรียก API'
      },
      { status: error.response?.status || 500 }
    );
  }
}
