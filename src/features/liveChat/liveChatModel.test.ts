import { describe, expect, it } from "vitest";

import {
  getLiveChatErrorMessage,
  mergeMessages,
  validateFeedback,
  validateImage,
  validateMessageBody,
} from "./liveChatModel";
import type { LiveChatMessage } from "./types";

const message = (messageId: number, body = `message-${messageId}`): LiveChatMessage => ({
  message_id: messageId,
  thread_id: 10,
  sender_type: "user",
  sender_user_id: 1,
  sender_admin_id: null,
  message_type: "text",
  body,
  created_at: `2026-07-16T10:00:0${messageId}.000Z`,
});

describe("liveChatModel", () => {
  it("merges message pages chronologically without duplicate message IDs", () => {
    expect(mergeMessages([message(2), message(3)], [message(1), message(2, "duplicate")]))
      .toEqual([message(1), message(2), message(3)]);
  });

  it("validates text, image and feedback inputs using the Live Chat contract", () => {
    expect(validateMessageBody("   ")).toBe("กรุณาพิมพ์ข้อความ");
    expect(validateMessageBody("x".repeat(5_001))).toBe("ข้อความต้องไม่เกิน 5,000 ตัวอักษร");
    expect(validateMessageBody("ขอความช่วยเหลือ")).toBeNull();

    expect(validateImage({ name: "proof.pdf", size: 10 })).toBe("รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ GIF");
    expect(validateImage({ name: "proof.png", size: 5 * 1024 * 1024 + 1 })).toBe("รูปภาพต้องมีขนาดไม่เกิน 5 MB");
    expect(validateImage({ name: "proof.webp", size: 512 })).toBeNull();

    expect(validateFeedback({ rating: 0, comment: "", tags: [] })).toBe("กรุณาเลือกคะแนน 1–5");
    expect(validateFeedback({ rating: 5, comment: "x".repeat(2_001), tags: [] })).toBe("ความคิดเห็นต้องไม่เกิน 2,000 ตัวอักษร");
    expect(validateFeedback({ rating: 5, comment: "", tags: Array.from({ length: 8 }, (_, index) => String(index)) }))
      .toBe("เลือกหัวข้อประเมินได้ไม่เกิน 7 ข้อ");
  });

  it("maps known server failures to actionable Thai copy", () => {
    expect(getLiveChatErrorMessage({ error_code: "intake_expired" }))
      .toBe("แบบคัดกรองหมดอายุแล้ว กรุณาเริ่มใหม่");
    expect(getLiveChatErrorMessage({ error_code: "rate_limit_exceeded", retryAfter: 30 }))
      .toBe("ส่งคำขอบ่อยเกินไป กรุณาลองใหม่ใน 30 วินาที");
    expect(getLiveChatErrorMessage({ request_id: "req-123" }))
      .toBe("ระบบขัดข้องชั่วคราว กรุณาลองใหม่ (รหัสอ้างอิง: req-123)");
  });
});
