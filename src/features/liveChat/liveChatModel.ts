import type {
  LiveChatConfig,
  LiveChatError,
  LiveChatMediaConfigSpec,
  LiveChatMessage,
} from "./types";

const MAX_MESSAGE_LENGTH = 5_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export const DEFAULT_LIVE_CHAT_CONFIG: LiveChatConfig = {
  image: {
    maxBytes: 10_485_760,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
    allowedExtensions: ["jpg", "jpeg", "png", "gif", "webp"],
  },
  video: {
    maxBytes: 104_857_600,
    allowedMimeTypes: [
      "video/mp4",
      "video/quicktime",
      "video/x-m4v",
      "video/webm",
    ],
    allowedExtensions: ["mp4", "mov", "m4v", "webm"],
  },
};

export function mergeMessages(
  current: LiveChatMessage[],
  incoming: LiveChatMessage[],
): LiveChatMessage[] {
  const byId = new Map<number, LiveChatMessage>();
  current.forEach((item) => byId.set(item.message_id, item));
  incoming.forEach((item) => {
    if (!byId.has(item.message_id)) byId.set(item.message_id, item);
  });
  return [...byId.values()].sort((left, right) => left.message_id - right.message_id);
}
export function validateMessageBody(body: string): string | null {
  if (!body.trim()) return "กรุณาพิมพ์ข้อความ";
  if (body.length > MAX_MESSAGE_LENGTH) return "ข้อความต้องไม่เกิน 5,000 ตัวอักษร";
  return null;
}

export function validateImage(file: Pick<File, "name" | "size">): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    return "รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ GIF";
  }
  if (file.size <= 0) return "ไฟล์รูปภาพไม่ถูกต้อง";
  if (file.size > MAX_IMAGE_BYTES) return "รูปภาพต้องมีขนาดไม่เกิน 5 MB";
  return null;
}

export function validateGif(file: Pick<File, "name" | "size">): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (extension !== "gif") return "กรุณาเลือกไฟล์ GIF เท่านั้น";
  return validateImage(file);
}

export function validateLiveChatImage(
  file: Pick<File, "name" | "size"> & { type?: string },
  config: LiveChatMediaConfigSpec = DEFAULT_LIVE_CHAT_CONFIG.image,
): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isExtensionAllowed = config.allowedExtensions
    .map((e) => e.toLowerCase())
    .includes(extension);
  const isMimeAllowed =
    !file.type ||
    config.allowedMimeTypes
      .map((m) => m.toLowerCase())
      .includes(file.type.toLowerCase());

  if (!isExtensionAllowed || !isMimeAllowed) {
    return `รองรับเฉพาะไฟล์รูปภาพประเภท ${config.allowedExtensions.map((e) => e.toUpperCase()).join(", ")}`;
  }
  if (file.size <= 0) return "ไฟล์รูปภาพไม่ถูกต้อง";
  if (file.size > config.maxBytes) {
    const maxMb = Math.round(config.maxBytes / (1024 * 1024));
    return `รูปภาพต้องมีขนาดไม่เกิน ${maxMb} MB`;
  }
  return null;
}

export function validateLiveChatVideo(
  file: Pick<File, "name" | "size"> & { type?: string },
  config: LiveChatMediaConfigSpec = DEFAULT_LIVE_CHAT_CONFIG.video,
): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isExtensionAllowed = config.allowedExtensions
    .map((e) => e.toLowerCase())
    .includes(extension);
  const isMimeAllowed =
    !file.type ||
    config.allowedMimeTypes
      .map((m) => m.toLowerCase())
      .includes(file.type.toLowerCase());

  if (!isExtensionAllowed || !isMimeAllowed) {
    return `รองรับเฉพาะไฟล์วิดีโอประเภท ${config.allowedExtensions.map((e) => e.toUpperCase()).join(", ")}`;
  }
  if (file.size <= 0) return "ไฟล์วิดีโอไม่ถูกต้อง";
  if (file.size > config.maxBytes) {
    const maxMb = Math.round(config.maxBytes / (1024 * 1024));
    return `วิดีโอต้องมีขนาดไม่เกิน ${maxMb} MB`;
  }
  return null;
}

export function validateFeedback(input: {
  rating: number;
  comment: string;
  tags: string[];
}): string | null {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return "กรุณาเลือกคะแนน 1–5";
  }
  if (input.comment.length > 2_000) return "ความคิดเห็นต้องไม่เกิน 2,000 ตัวอักษร";
  if (input.tags.length > 7) return "เลือกหัวข้อประเมินได้ไม่เกิน 7 ข้อ";
  if (new Set(input.tags).size !== input.tags.length) return "หัวข้อประเมินต้องไม่ซ้ำกัน";
  return null;
}

export function getLiveChatErrorMessage(error: LiveChatError | null | undefined): string {
  if (!error) return "เกิดข้อผิดพลาด กรุณาลองใหม่";

  const knownMessages: Record<string, string> = {
    thread_not_found: "ไม่พบห้องสนทนานี้ กรุณาโหลดรายการใหม่",
    message_not_found: "สถานะข้อความเปลี่ยนไป กรุณาโหลดห้องสนทนาใหม่",
    help_topic_not_found: "ไม่พบหัวข้อช่วยเหลือนี้ กรุณาเลือกหัวข้อใหม่",
    intake_not_found: "ไม่พบแบบคัดกรอง กรุณาเริ่มใหม่",
    intake_expired: "แบบคัดกรองหมดอายุแล้ว กรุณาเริ่มใหม่",
    intake_state_conflict: "คำตอบมีการเปลี่ยนแปลง กรุณาลองอีกครั้งจากข้อมูลล่าสุด",
    intake_already_completed: "แบบคัดกรองนี้เสร็จสิ้นแล้ว",
    feedback_not_eligible: "ไม่สามารถส่งแบบประเมินสำหรับเคสนี้ได้",
    feedback_tag_invalid: "หัวข้อประเมินมีการเปลี่ยนแปลง กรุณาเลือกใหม่",
    image_upload_failed: "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่",
  };

  if (error.error_code === "rate_limit_exceeded") {
    return error.retryAfter
      ? `ส่งคำขอบ่อยเกินไป กรุณาลองใหม่ใน ${error.retryAfter} วินาที`
      : "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
  }
  if (error.error_code && knownMessages[error.error_code]) return knownMessages[error.error_code];
  if (error.httpStatus === 401) return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง";
  if (error.request_id) {
    return `ระบบขัดข้องชั่วคราว กรุณาลองใหม่ (รหัสอ้างอิง: ${error.request_id})`;
  }
  return "ระบบขัดข้องชั่วคราว กรุณาลองใหม่";
}

export function resolveLiveChatMediaUrl(src: string | undefined | null): string {
  if (!src) return "";
  let raw = src.trim();
  if (!raw) return "";

  if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;

  // Strip internal LAN IPs or localhost from backend responses
  if (raw.includes("192.168.") || raw.includes("localhost")) {
    try {
      const parsed = new URL(raw.startsWith("http") ? raw : `http://${raw}`);
      raw = parsed.pathname + parsed.search;
    } catch {
      // Keep raw if URL parsing fails
    }
  }

  if (raw.startsWith("//")) return `https:${raw}`;

  if (raw.startsWith("http://")) {
    raw = raw.replace("http://", "https://");
  }

  if (raw.startsWith("https://")) return raw;

  const baseUrl =
    process.env.NEXT_PUBLIC_VIDEO_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "https://apiweb.enjoybook.co";

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = raw.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}
