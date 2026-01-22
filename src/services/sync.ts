import { getEmbedding } from "./ai"; // ฟังก์ชันที่เรียก OpenAI
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const syncAllNovelsToAi = async (novels: any[]) => {
  for (const novel of novels) {
    // 1. รวมข้อมูลที่ต้องการให้ AI วิเคราะห์
    const text = `ชื่อเรื่อง: ${novel.title} แท็ก: ${novel.tag} เรื่องย่อ: ${novel.des}`;

    // 2. แปลงเป็น Vector (ตัวเลข 1536 มิติ)
    const embedding = await getEmbedding(text);

    // 3. บันทึกลง Supabase
    const { error } = await supabase
      .from('novel_embeddings')
      .upsert({
        book_id: novel.book_id,
        title: novel.title,
        embedding: embedding
      });

    if (error) {
      console.error('Error syncing novel to AI:', error);
    }
  }
};