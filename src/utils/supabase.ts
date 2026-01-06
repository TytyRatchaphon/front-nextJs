import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const searchSimilarNovels = async (queryVector: number[]) => {
  // เรียกใช้ฟังก์ชัน match_novels ที่เราสร้างไว้ใน SQL Editor
  const { data, error } = await supabase.rpc('match_novels', {
    query_embedding: queryVector,
    match_threshold: 0.5, // ความเหมือน 50% ขึ้นไป
    match_count: 5,        // เอามา 5 เรื่อง
  });

  return { data, error };
};