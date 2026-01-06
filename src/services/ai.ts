import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "embedding-001"}); // เปลี่ยนมาใช้รุ่นเสถียร

// export const getEmbedding = async (text: string): Promise<number[]> => {
//   const result = await model.embedContent(text);
//   const embedding = result.embedding;
//   return embedding.values; // คืนค่าชุดตัวเลข (768 มิติ สำหรับ text-embedding-004)
// };

export const getEmbedding = async (text: string): Promise<number[]> => {
  console.log(`Debug: getEmbedding called with: "${text}"`);
  console.log("Debug: API Key present:", !!apiKey, "Prefix:", apiKey?.substring(0, 5));

  try {
    // ใช้ Format ปกติ (text) เพราะ SDK รองรับและเสถียรกว่า
    const result = await model.embedContent(text);
    
    const embedding = result.embedding;
    console.log("Debug: Embedding generated. First 3 values:", embedding.values.slice(0, 3));
    
    // Check if it looks like the recurring static vector
    if (embedding.values[0] === -0.010790561) {
        console.warn("WARNING: This looks like a static/empty vector!");
    }

    return embedding.values; 
  } catch (error) {
    console.error("Debug: Gemini API Error:", error);
    throw error;
  }
};