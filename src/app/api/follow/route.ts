import { NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.214:3331';

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
    const { writer_id, action } = body;
    
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ message: 'ไม่พบ Token' }, { status: 401 });
    }

    // Ensure Bearer prefix
    const rawToken = token.replace(/^Bearer\s+/i, "").trim();
    const finalToken = `Bearer ${rawToken}`;


    const response = await axios.post(
      `${BACKEND_URL}/user/follow`,
      { writer_id, action },
      {
        headers: {
          'Authorization': finalToken,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);

  } catch (error: any) {
    
    // If 404, maybe try /profile/follow?
    if (error.response?.status === 404) {
        try {
            const token = request.headers.get('authorization');
            const rawToken = token ? token.replace(/^Bearer\s+/i, "").trim() : "";
            const finalToken = `Bearer ${rawToken}`;
            
            const responseRetry = await axios.post(
                `${BACKEND_URL}/profile/follow`,
                body,
                {
                    headers: {
                        'Authorization': finalToken,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return NextResponse.json(responseRetry.data);
        } catch (retryError: any) {
            return NextResponse.json(
                retryError.response?.data || { message: 'เกิดข้อผิดพลาดในการติดตาม' },
                { status: retryError.response?.status || 500 }
            );
        }
    }

    return NextResponse.json(
      error.response?.data || { message: 'เกิดข้อผิดพลาดในการติดตาม' },
      { status: error.response?.status || 500 }
    );
  }
}
