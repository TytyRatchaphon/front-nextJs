import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // กำหนดรูปแบบการยิงให้คงที่ (Constant Arrival Rate)
    smooth_load: {
      executor: 'constant-arrival-rate',
      rate: 50,                // ยิงคงที่ที่ 50 Requests ต่อวินาที (RPS)
      timeUnit: '1s',           // หน่วยเวลา
      duration: '1m',           // ระยะเวลาทดสอบ (ปรับเพิ่ม/ลดได้)
      preAllocatedVUs: 50,      // เตรียม Virtual Users ไว้ล่วงหน้า
      maxVUs: 500,              // ขยายจำนวนคนได้สูงสุดถ้าเริ่มตอบสนองช้า
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% ของ request ต้องจบใน 500ms
    http_req_failed: ['rate<0.01'],   // Error ต้องไม่เกิน 1%
  },
};

export default function () {
  const BASE_URL = 'http://192.168.250.73:3009';

  // ใช้ Batch Request เพื่อจำลองการโหลดหน้าเว็บที่มีหลาย API (ทำให้กราฟนิ่งขึ้น)
  let responses = http.batch([
    ['GET', `${BASE_URL}/`],
    ['GET', `${BASE_URL}/book/5005`],
    ['GET', `${BASE_URL}/ranking`],
  ]);

  // ตรวจสอบ Status 200 ของทุก Request
  check(responses[0], { 'Home status is 200': (r) => r.status === 200 });
  check(responses[1], { 'Book status is 200': (r) => r.status === 200 });
  check(responses[2], { 'Ranking status is 200': (r) => r.status === 200 });

  // ลด Sleep ให้เหลือสั้นๆ หรือไม่ใส่เลยก็ได้เมื่อใช้ constant-arrival-rate
  sleep(0.1); 
}