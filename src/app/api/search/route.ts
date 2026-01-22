// src/app/api/search/route.ts
import { NextResponse } from 'next/server';
import { getEmbedding } from '@/services/ai'; // ฟังก์ชันที่เรียก OpenAI
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function POST(req: Request) {
  try {
    const { query, limit = 20 } = await req.json();

    if (!query) return NextResponse.json({ code: 200, data: { items: [], total: 0 } });

    // 1. แปลงคำค้นหาเป็นพิกัด Vector
    const queryVector = await getEmbedding(query);
     // ดูค่า Vector ว่าเปลี่ยนไหม

    // 2. ค้นหาใน Supabase โดยใช้ RPC
    const { data: aiResults, error } = await supabase.rpc('match_novels', {
      query_embedding: queryVector,
      match_threshold: 0.1, // ลด Threshold ลงเพื่อดูผลลัพธ์ง่ายขึ้น
      match_count: limit
    });

    if (error) {
        throw error;
    }

    if (aiResults && aiResults.length > 0) {
    }

    // 3. ปรับ Format ให้ตรงกับที่ CardBook ต้องการ
    const formattedItems = aiResults.map((item: any) => ({
      book_id: item.book_id,
      bookID: String(item.book_id),
      name: item.title,     
      title: item.title,
      des: item.content || item.des, // รองรับทั้งสองชื่อ
      img: item.img,        // รูปภาพจากที่ sync ไว้
      author: item.author,  // ผู้แต่ง
      view: item.view,
      chapter: item.chapter,
      shelveCount: item.shelve_count,
      status: item.status,
      type: item.type,
      similarity: item.similarity,
    }));

    return NextResponse.json({
      code: 200,
      data: {
        items: formattedItems,
        total: formattedItems.length
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}