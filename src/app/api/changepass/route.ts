import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldpass, newpass1, newpass2, token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token กรุณาเข้าสู่ระบบใหม่' },
        { status: 401 }
      );
    }
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    const response = await axios.post(
      `${API_BASE_URL}/user/changepass`,
      {
        oldpass,
        newpass1,
        newpass2,
        pws: token,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
          'pws': token,
        },
        withCredentials: true,
        validateStatus: (status) => status < 500,
      }
    );

    return NextResponse.json(response.data, { 
      status: response.status,
    });
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: unknown; status?: number }; message?: string };
    
    return NextResponse.json(
      {
        success: false,
        message: (axiosError.response?.data as { message?: string })?.message || axiosError.message || 'เกิดข้อผิดพลาด',
        error: axiosError.response?.data,
      },
      { status: axiosError.response?.status || 500 }
    );
  }
}
