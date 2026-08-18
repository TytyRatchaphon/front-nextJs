import { describe, expect, it } from "vitest";

import {
  getLiveChatErrorMessage,
  mergeMessages,
  resolveLiveChatMediaUrl,
  validateFeedback,
  validateGif,
  validateImage,
  validateLiveChatImage,
  validateLiveChatVideo,
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

    expect(validateGif({ name: "reaction.png", size: 512 })).toBe("กรุณาเลือกไฟล์ GIF เท่านั้น");
    expect(validateGif({ name: "reaction.gif", size: 5 * 1024 * 1024 + 1 })).toBe("รูปภาพต้องมีขนาดไม่เกิน 5 MB");
    expect(validateGif({ name: "reaction.GIF", size: 512 })).toBeNull();

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

  it("validates images and videos against live chat media config", () => {
    expect(validateLiveChatImage({ name: "doc.txt", size: 10, type: "text/plain" }))
      .toBe("รองรับเฉพาะไฟล์รูปภาพประเภท JPG, JPEG, PNG, GIF, WEBP");
    expect(validateLiveChatImage({ name: "photo.jpg", size: 10_485_761, type: "image/jpeg" }))
      .toBe("รูปภาพต้องมีขนาดไม่เกิน 10 MB");
    expect(validateLiveChatImage({ name: "photo.webp", size: 500_000, type: "image/webp" })).toBeNull();

    expect(validateLiveChatVideo({ name: "clip.avi", size: 10, type: "video/x-msvideo" }))
      .toBe("รองรับเฉพาะไฟล์วิดีโอประเภท MP4, MOV, M4V, WEBM");
    expect(validateLiveChatVideo({ name: "clip.mp4", size: 104_857_601, type: "video/mp4" }))
      .toBe("วิดีโอต้องมีขนาดไม่เกิน 100 MB");
    expect(validateLiveChatVideo({ name: "clip.mp4", size: 5_000_000, type: "video/mp4" })).toBeNull();
  });

  it("resolves live chat media URLs and strips internal LAN IPs", () => {
    expect(resolveLiveChatMediaUrl("http://192.168.220.214:4005/live-chat/video/1.mp4"))
      .toBe("https://apiweb.enjoybook.co/live-chat/video/1.mp4");
    expect(resolveLiveChatMediaUrl("https://img.enjoybook.co/sample.png"))
      .toBe("https://img.enjoybook.co/sample.png");
    expect(resolveLiveChatMediaUrl("/storage/video/2.mp4"))
      .toBe("https://apiweb.enjoybook.co/storage/video/2.mp4");
  });
});
