// src/app/api/ai-sync/route.ts
import { NextResponse } from 'next/server';
import { getEmbedding } from '@/services/ai';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function GET() {
  try {
    // 1. ดึงข้อมูลหนังสือทั้งหมดจาก API หลัก
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.214:3331';
    console.log("Fetching books from:", apiUrl);
    
    // ใช้ endpoint ที่คืนค่าหนังสือทั้งหมด (อาจจะต้องปรับตาม API จริงที่มี)
    // สมมติว่าใช้ /getAllBookHome หรือ /book/search?limit=1000
    const response = await axios.get(`${apiUrl}/getAllBookHome`);
    
    let allBooks: any[] = [];
    let debugInfo: any = {};

    if (response.data && response.data.data) {
        // debug info
        debugInfo = {
             keys: Object.keys(response.data.data),
             isSpotlightArray: Array.isArray(response.data.data.spotlight),
             isGroupArray: Array.isArray(response.data.data.groupBookHome)
        };

        if(Array.isArray(response.data.data)) {
            allBooks = response.data.data;
        } else if (response.data.data.spotlight || response.data.data.groupBookHome) {
            // กรณีโครงสร้างเป็น { spotlight: [], ... } รวมทุก list
            const d = response.data.data;
            const spotlight = Array.isArray(d.spotlight) ? d.spotlight : [];
            const groupBooks = Array.isArray(d.groupBookHome) 
                ? d.groupBookHome.flatMap((g: any) => Array.isArray(g.list) ? g.list : []) 
                : [];
            
            allBooks = [...spotlight, ...groupBooks];
        }
    }

    console.log(`Found ${allBooks.length} books to sync`);

    if (allBooks.length === 0) {
        console.warn("No books found to sync.");
        return NextResponse.json({ message: "Sync Completed! Synced 0 books." });
    }

    let count = 0;
    // 2. Loop สร้าง Embedding และบันทึก
    for (const rawNovel of allBooks) {
      // ตรวจสอบว่าข้อมูลซ้อนอยู่ใน field "book" หรือไม่
      const novel = rawNovel.book ? rawNovel.book : rawNovel;

      // ป้องกันข้อมูลไม่ครบ
      if (!novel.book_id && !novel.bookID) continue;
      
      const bookId = novel.book_id || Number(novel.bookID);
      const title = novel.name || ""; // ชื่อเรื่องอยู่ใน name
      // บาง API ใช้ title เป็นเรื่องย่อ, บางอันใช้ des
      const desc = novel.des || novel.title || ""; 
      const tag = Array.isArray(novel.tag) ? novel.tag.join(" ") : (novel.tag || "");
      const author = novel.writer_name || novel['writer.writer_name'] || "";

      // ถ้าไม่มีชื่อเรื่อง ให้ข้ามไปเลย (ป้องกันข้อมูลขยะ)
      if (!title || title.trim() === "") {
          continue;
      }
      
      // รวม Text ให้ AI จับใจความ
      const content = `ชื่อเรื่อง: ${title} ผู้แต่ง: ${author} แท็ก: ${tag} เรื่องย่อ: ${desc}`;
      
      // สร้าง Vector
      const embedding = await getEmbedding(content);

      // Upsert ลง Supabase พร้อม Metadata เพื่อเอาไปโชว์ตอน Search
      const { error } = await supabase.from('novel_embeddings').upsert({
        book_id: bookId,
        title: title,
        des: desc,
        author: author,
        img: novel.img || novel.img_full || "",
        view: Number(novel.view || 0),
        chapter: Number(novel.chapter || 0),
        shelve_count: Number(novel.shelve_count || novel.shelveCount || 0),
        status: novel.status || "",
        type: novel.type || "",
        embedding: embedding
      });

      if (error) {
          console.error(`Failed to sync book ${bookId}:`, error);
      } else {
          count++;
      }
    }

    return NextResponse.json({ message: `Sync Completed! Synced ${count} books.` });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}