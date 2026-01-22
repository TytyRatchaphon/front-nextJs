import { NextResponse } from 'next/server';
import axios from 'axios';

// 👇 URL Backend ของคุณ
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3331';

export async function GET() {
  try {
    // ดึงข้อมูล Category จาก Backend
    const response = await axios.get(`${BACKEND_URL}/category`);

    // ส่งข้อมูลกลับไปที่ Frontend
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json([], { status: 500 });
  }
}