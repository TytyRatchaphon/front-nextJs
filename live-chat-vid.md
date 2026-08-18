# Live Chat Video Support — Frontend Integration Guide

เอกสารอธิบายการเชื่อมต่อ API, การอัปโหลดวิดีโอแบบเรียลไทม์ (Real-time Upload Progress) และการแสดงผลวิดีโอผ่าน Signed Temporary Playback URL ในระบบ Live Chat

---

## สารบัญ

1. [สรุปภาพรวม (TL;DR)](#สรุปภาพรวม-tldr)
2. [Data Types & Interface Specs](#data-types--interface-specs)
3. [การอัปโหลดวิดีโอพร้อม Real-time Upload Progress](#การอัปโหลดวิดีโอพร้อม-real-time-upload-progress)
4. [การแสดงผลวิดีโอผ่าน Signed Playback URL](#การแสดงผลวิดีโอผ่าน-signed-playback-url)
5. [การรับข้อความวิดีโอแบบเรียลไทม์ (Socket.IO)](#การรับข้อความวิดีโอแบบเรียลไทม์-socketio)
6. [การรับมือ Error และ Edge Cases](#การรับมือ-error-และ-edge-cases)

---

## สรุปภาพรวม (TL;DR)

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **Endpoint อัปโหลดวิดีโอ** | `POST /live-chat/messages/video` (Multipart Form-Data) |
| **Form Data Field** | `video` (หรือ `file`) |
| **Real-time Progress** | วัดผลผ่าน HTTP Stream (Axios `onUploadProgress` / `XHR.upload`) โดย**ไม่ต้องเพิ่มตารางหรือคอลัมน์ใดๆ** ในฐานข้อมูล |
| **Playback URL** | ฟิลด์ `video_url` จะเป็น Signed Playback URL แบบมี Token หมดอายุ |
| **การเล่นวิดีโอบน UI** | ใช้ `<video src={message.video_url || message.body} controls preload="metadata" />` |

---

## Data Types & Interface Specs

### `LiveChatMessageDTO`

```typescript
export type LiveChatMessageType = 'text' | 'image' | 'video';

export interface LiveChatMessageDTO {
  message_id: number;
  thread_id: number;
  sender_type: 'user' | 'admin' | 'system';
  sender_user_id: number | null;
  sender_admin_id: number | null;
  message_type: LiveChatMessageType;
  body: string;                      // MinIO Direct URL
  image_url?: string;                
  video_url?: string;                // Signed Temporary Playback URL (มี Token)
  created_at: string;
}
```

---

## การอัปโหลดวิดีโอพร้อม Real-time Upload Progress

การแสดงผลเปอร์เซ็นต์ความคืบหน้า (Progress 0% - 100%) ทำได้โดยตรงบนฝั่ง Client ผ่าน HTTP Request Event ของ `Axios` หรือ `XMLHttpRequest` โดยไม่จำต้องดัดแปลง หรือสร้างคอลัมน์/ตารางใหม่ในฐานข้อมูล:

### ตัวอย่าง Code (TypeScript + Axios + Ant Design Progress)

```typescript
import axios from 'axios';
import { Progress } from 'antd';
import { useState } from 'react';

function VideoUploadComponent() {
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  async function handleVideoUpload(file: File) {
    const formData = new FormData();
    formData.append('video', file);

    setUploadPercent(0);
    try {
      const response = await axios.post('/live-chat/messages/video', formData, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || file.size;
          const percent = Math.min(100, Math.max(0, Math.round((progressEvent.loaded * 100) / total)));
          setUploadPercent(percent); // อัปเดต % เรียลไทม์บน UI
        },
      });

      if (response.data.status === 'success') {
        const newMessage = response.data.data.message;
        // เพิ่ม newMessage เข้าสู่ Message List
      }
    } finally {
      setUploadPercent(null);
    }
  }

  return (
    <div>
      {uploadPercent !== null && (
        <div className="upload-progress-box">
          <span>กำลังอัปโหลดวิดีโอ... {uploadPercent}%</span>
          <Progress percent={uploadPercent} status={uploadPercent === 100 ? 'active' : 'normal'} size="small" />
        </div>
      )}
    </div>
  );
}
```

---

## การแสดงผลวิดีโอผ่าน Signed Playback URL

ข้อความที่เป็นวิดีโอจะมีฟิลด์ `video_url` ซึ่งเป็น **Signed Playback URL** (มี `?token=...`) ที่สร้างขึ้นแบบเดียวกับ Video Story เพื่อความปลอดภัยและการรองรับ HTTP Range Request (Video Seeking)

```tsx
function ChatMessageBubble({ message }: { message: LiveChatMessageDTO }) {
  if (message.message_type === 'video') {
    const playUrl = message.video_url || message.body;
    return (
      <div className="live-chat-bubble is-video-message">
        <video
          src={playUrl}
          controls
          preload="metadata"
          playsInline
          style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8 }}
        />
      </div>
    );
  }

  return <span className="live-chat-message-text">{message.body}</span>;
}
```

---

## การรับข้อความวิดีโอแบบเรียลไทม์ (Socket.IO)

เมื่อมีข้อความวิดีโอใหม่เข้ามาผ่าน Socket.IO event `live_chat:message`:

```typescript
socket.on('live_chat:message', (payload) => {
  if (payload.thread_id === currentThreadId) {
    appendMessage(payload.message);
  }
});
```
