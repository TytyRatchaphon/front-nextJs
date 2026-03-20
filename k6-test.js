import http from 'k6/http';
import { check, sleep } from 'k6';

// ตั้งค่าสถานการณ์ (Scenarios) สำหรับจำลองคนเข้าใช้งาน
export const options = {
  stages: [
    { duration: '30s', target: 100 },  // ขั้นที่ 1: ค่อยๆ เพิ่มยอดผู้ใช้จาก 0 ไป 50 คนภายใน 30 วินาที
    { duration: '1m', target: 300 },  // ขั้นที่ 2: เพิ่มเป็น 300 คน และรักษาจำนวนนี้ไว้ 1 นาที (จำลองช่วง Peak)
    { duration: '20s', target: 0 },   // ขั้นที่ 3: ค่อยๆ ลดลงเหลือ 0 คนภายใน 20 วินาที
  ],
  thresholds: {
    // กำหนดเกณฑ์ผ่าน/ไม่ผ่าน (ตัวเลือกเสริม ตรวจสอบเวลาตอบสนอง)
    http_req_duration: ['p(95)<20000'], // 95% ของ Request ต้องตอบสนองเร็วกว่า 1 วินาที (1000ms)
    http_req_failed: ['rate<0.01'],    // Error rate ต้องน้อยกว่า 1% 
  },
};

export default function () {
  // ⚠️ เปลี่ยน BASE_URL เป็น URL ที่เราต้องการเทส
  // ถ้าเทสบนเครื่องตัวเอง (รัน npm run start ไว้) ให้ใช้ localhost:3000
  // ถ้าเทสบน Server จริง ให้ใช้ https://yourdomain.com
  const BASE_URL = 'http://192.168.250.64:3018'; 

  // หน่วงเวลาแบบสุ่ม 0 ถึง 2 วินาทีก่อนเริ่มจำลองการเข้าเว็บ เพื่อไม่ให้ Bot ยิงเข้ามาพร้อมกันเป๊ะๆ (ป้องกันการกระชาก)
  sleep(Math.random() * 5);

  // 1. จำลองการเข้าหน้าแรก (Home)
  let resHome = http.get(`${BASE_URL}/home/banner`);
  check(resHome, {
    'Home status is 200': (r) => r.status === 200,
  });
  
  // หน่วงเวลาจำลองพฤติกรรมคนจริงๆ (อ่านหน้าเว็บ 1-2 วินาทีก่อนกดต่อ)
  sleep(Math.random() * 4 + 1); 

  // 2. จำลองการเข้าหน้าจัดอันดับ
  let resRanking = http.get(`${BASE_URL}/book/recommend/3392`);
  check(resRanking, {
    'Ranking status is 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 4 + 1);

  // 3. จำลองการเข้าหน้าอ่านนิยาย (เปลี่ยน ID นิยายและตอนให้ตรงกับที่มีในระบบ)
  let resRead = http.get(`${BASE_URL}/home/update?page=1&limit=9`); 
  check(resRead, {
    'Read page status is 200': (r) => r.status === 200,
  });
}