# Frontend: Book Video Playlist

> เอกสารสำหรับทีม frontend ที่ต้อง integrate ระบบวิดีโอ Playlist ของหนังสือ
> อัปเดตตาม implementation ณ วันที่ 6 สิงหาคม 2026

## สารบัญ

1. [สรุปภาพรวม (TL;DR)](#สรุปภาพรวม-tldr)
2. [ความแตกต่างจาก Trailer เดิม](#ความแตกต่างจาก-trailer-เดิม)
3. [Config API](#config-api)
4. [Writer: คลังวิดีโอ](#writer-คลังวิดีโอ)
5. [Writer: Upload วิดีโอ](#writer-upload-วิดีโอ)
6. [Writer: ติดตาม Processing ผ่าน Socket.IO](#writer-ติดตาม-processing-ผ่าน-socketio)
7. [Writer: จัดการ Playlist](#writer-จัดการ-playlist)
8. [Writer: สมาชิก Playlist](#writer-สมาชิก-playlist)
9. [Writer: รูป Playlist](#writer-รูป-playlist)
10. [Public: Playlist ในหน้า Book Detail](#public-playlist-ในหน้า-book-detail)
11. [Public: Playback วิดีโอ](#public-playback-วิดีโอ)
12. [Public: View, Like, Comment และ Report](#public-view-like-comment-และ-report)
13. [Public: Story Bar](#public-story-bar)
14. [Error Codes](#error-codes)
15. [ข้อควรระวัง](#ข้อควรระวัง)

## สรุปภาพรวม (TL;DR)

| หัวข้อ | รายละเอียด |
|---|---|
| ฟีเจอร์ | คลังวิดีโอหนังสือ + Playlist ที่นักเขียนจัดการ |
| ผู้ใช้งาน | นักเขียน (จัดการ), ผู้อ่าน (ดู/Like/Comment), guest (ดูเท่านั้น) |
| Writer entrypoint | `GET /mybook/:bookId/videos/config` |
| Reader entrypoint | `GET /bookdetail/:bookId` ที่ `data.video.playlists` |
| Playback type | `book_video` |
| Interaction type | `book_video` |
| Story Bar group type | `book_video_playlist` |
| Upload | Direct upload แบบ request เดียว ไม่มี resume/multipart |
| Processing realtime | Socket.IO room `book_video:{videoId}` |
| สิทธิ์นักเขียน | JWT + เป็นเจ้าของหนังสือ + `manage_video = 1` |
| สิทธิ์ผู้อ่าน | Public (guest/login) ดูได้เมื่อหนังสือ publish และ Playlist published |

## ความแตกต่างจาก Trailer เดิม

| เรื่อง | Trailer | Book Video Playlist |
|---|---|---|
| ตาราง | `book_video_trailer` | `book_video` |
| จำนวนต่อเรื่อง | 1 ตัว | ไม่จำกัด |
| Interaction type | `book_video_trailer` | `book_video` |
| Upload | Multipart (initiate → parts → complete) | Direct upload (request เดียว) |
| Playback URL | `/video/trailers/:id/play/...` | `/media/book_video/:refId/...` |
| Refresh URL | `GET /video/trailers/:id/playback` | `GET /video/playback?type=book_video&ref_id=:id` |
| Story Bar | `book_video_trailer` group | `book_video_playlist` group |
| Session/Log | ใช้ `video_upload_session`, `video_transcode_log` | ไม่ใช้ สถานะอยู่ใน `book_video` |

**สำคัญ:** ห้ามใช้ type `book_video_trailer` กับวิดีโอ Playlist และห้ามใช้ type `book_video` กับ Trailer

---

## Config API

```http
GET /mybook/:bookId/videos/config
Authorization: Bearer {jwt}
```

เรียกก่อน upload เพื่ออ่าน validation config

Response:

```ts
{
  upload: {
    maxBytes: number;          // e.g. 524288000 (500 MB)
    maxDurationSeconds: number; // e.g. 120
    allowedExtensions: string[]; // ["mp4","mov","m4v","webm"]
    allowedMimeTypes: string[];  // ["video/mp4","video/quicktime",...]
    resumable: false;
  };
  playlistCover: {
    maxBytes: number;          // e.g. 2097152 (2 MB)
    width: number;             // 1080
    height: number;            // 1080
    allowedExtensions: string[];
    allowedMimeTypes: string[];
    outputFormat: string;      // "webp"
  };
  reorderMaxItems: 500;
}
```

---

## Writer: คลังวิดีโอ

### รายการวิดีโอ

```http
GET /mybook/:bookId/videos?limit=20&cursor=...&status=completed
Authorization: Bearer {jwt}
```

| Query | ค่า | หมายเหตุ |
|---|---|---|
| `limit` | 1–100, default 20 | |
| `cursor` | string | จาก `nextCursor` ของ response ก่อน |
| `status` | `uploading`, `queued`, `processing`, `completed`, `failed`, `cancelled`, `deleted` | ไม่ส่งได้ทุก status |

Response:

```ts
{
  items: Video[];
  nextCursor: string | null;
}
```

### ดูรายละเอียดวิดีโอ

```http
GET /mybook/:bookId/videos/:videoId
Authorization: Bearer {jwt}
```

### ดูสถานะวิดีโอ (สำหรับ polling)

```http
GET /mybook/:bookId/videos/:videoId/status
Authorization: Bearer {jwt}
```

### แก้ชื่อวิดีโอ

```http
PATCH /mybook/:bookId/videos/:videoId
Authorization: Bearer {jwt}
Content-Type: application/json

{ "title": "ชื่อใหม่" }
```

`title` ยาว 1–150 ตัวอักษร

### Retry วิดีโอที่ failed

```http
POST /mybook/:bookId/videos/:videoId/retry
Authorization: Bearer {jwt}
```

ใช้ record เดิมและ stable job ID ไม่ upload ซ้ำ

Response: `{ videoId, status: "queued", jobId }`

### ลบวิดีโอ

```http
DELETE /mybook/:bookId/videos/:videoId
Authorization: Bearer {jwt}
```

Soft delete → cancel transcode → enqueue cleanup

Response: `{ videoId, status: "deleted" }`

**การลบวิดีโอจะลบ membership ออกจากทุก Playlist ที่วิดีโอนั้นอยู่**

---

## Writer: Upload วิดีโอ

### ต่างจาก Trailer

Trailer ใช้ multipart upload (initiate → upload parts → complete) แต่ Book Video ใช้ **direct upload แบบ request เดียว** ส่ง raw binary body ผ่าน POST

### วิธี upload

```http
POST /mybook/:bookId/videos/uploads
Authorization: Bearer {jwt}
Content-Type: video/mp4
Content-Length: 73400320
x-idempotency-key: {uuid}
x-file-name: trailer.mp4
x-video-title: ฉากสำคัญตอนที่ 5
```

Body: raw binary ของไฟล์วิดีโอ

| Header | จำเป็น | กติกา |
|---|---|---|
| `x-idempotency-key` | ใช่ | 8–100 ตัวอักษร, unique ทั้งระบบ ใช้ `crypto.randomUUID()` |
| `x-file-name` | ใช่ | URL-encoded, decode แล้วไม่เกิน 255, extension ต้องตรง MIME |
| `x-video-title` | ใช่ | URL-encoded หรือ UTF-8, trim แล้ว 1–150 ตัวอักษร |
| `content-type` | ใช่ | ต้องอยู่ใน allowlist จาก config |
| `content-length` | ใช่ | integer > 0 และไม่เกิน `upload.maxBytes` |

Response:

```ts
{
  video: Video;
  jobId: string;
  idempotent: boolean; // true ถ้า key เดิมส่ง record เดิมกลับ
}
```

### Flow หลังอัปโหลด

```text
upload สำเร็จ → status = queued → worker claim → processing → completed
                                                             → failed
```

### Idempotency

ถ้าส่ง `x-idempotency-key` เดิม จะได้ record เดิมกลับมาพร้อม `idempotent: true` ถ้า key ซ้ำแต่ต่าง book/user จะได้ error `BOOK_VIDEO_IDEMPOTENCY_CONFLICT`

---

## Writer: ติดตาม Processing ผ่าน Socket.IO

### เชื่อมต่อ

```ts
const socket = io(SOCKET_URL, {
  auth: { token: jwtToken },
});
```

### Join room

```ts
socket.emit("book_video:join", { videoId: 123 });
```

Server ตรวจ JWT + ownership + `manage_video` ก่อนอนุญาต

### รับ update

```ts
socket.on("book_video:updated", (payload) => {
  // payload: { videoId, status, progress, stage, jobId, attempt, maxAttempts, error, updatedAt }
});
```

| Field | ใช้ทำอะไร |
|---|---|
| `status` | แสดงสถานะปัจจุบัน |
| `progress` | `progressPercent` สำหรับ progress bar |
| `stage` | `processing_stage` เช่น `transcoding-720p` |
| `error` | `{ code, message }` เมื่อ failed |

### Leave room

```ts
socket.emit("book_video:leave", { videoId: 123 });
```

Leave เมื่อได้ terminal status (`completed`, `failed`, `cancelled`, `deleted`)

### Fallback

ถ้า Socket ไม่พร้อม ใช้ HTTP polling:

```http
GET /mybook/:bookId/videos/:videoId/status
```

Poll ทุก 5 วินาที หยุดเมื่อได้ terminal status

### แนวทางที่แนะนำ

1. หลัง upload ใช้ `videoId` จาก response
2. Join room และรอ ACK
3. ดึง HTTP snapshot ครั้งเดียวเพื่อปิด race condition
4. ใช้ Socket event เป็นหลัก ไม่ poll ซ้ำ
5. หลัง reconnect ดึง snapshot อีกครั้งและ join room ใหม่
6. ถ้า Socket หลุด ใช้ HTTP fallback ชั่วคราว
7. Terminal status → leave room

---

## Writer: จัดการ Playlist

### รายการ Playlist

```http
GET /mybook/:bookId/video-playlists?limit=20&cursor=...
Authorization: Bearer {jwt}
```

Response: `{ items: Playlist[], nextCursor, hasMore }`

### สร้าง Playlist

```http
POST /mybook/:bookId/video-playlists
Authorization: Bearer {jwt}
Content-Type: application/json

{ "name": "ฉากเด็ดประจำสัปดาห์" }
```

สร้างเป็น `unpublished`, `cover_mode = auto`

### ดูรายละเอียด Playlist

```http
GET /mybook/:bookId/video-playlists/:playlistId
Authorization: Bearer {jwt}
```

Response มี `videos: Video[]` รวมอยู่ด้วย

### แก้ชื่อ / เปลี่ยนสถานะเผยแพร่

```http
PATCH /mybook/:bookId/video-playlists/:playlistId
Authorization: Bearer {jwt}
Content-Type: application/json

{ "name": "ชื่อใหม่", "publishStatus": "published" }
```

ส่ง `publishStatus` หรือ `publish_status` ก็ได้ ต้องส่งอย่างน้อย 1 field

**Publish ได้เมื่อมีวิดีโอ `completed` อย่างน้อย 1 ตัว** ไม่เช่นนั้นจะได้ `BOOK_VIDEO_PLAYLIST_NO_COMPLETED_VIDEO`

### ลบ Playlist

```http
DELETE /mybook/:bookId/video-playlists/:playlistId
Authorization: Bearer {jwt}
```

Soft delete ไม่ลบวิดีโอ

### จัดลำดับ Playlist

```http
PUT /mybook/:bookId/video-playlists/order
Authorization: Bearer {jwt}
Content-Type: application/json

{ "playlistIds": [3, 1, 2] }
```

ส่ง `playlistIds` หรือ `playlist_ids` ก็ได้

**กติกา:**

- ต้องส่ง ID ครบทุก Playlist ที่ยังไม่ deleted
- สูงสุด 500 IDs
- ส่งบางส่วน, ซ้ำ, หรือ ID ไม่ตรง scope จะ reject

---

## Writer: สมาชิก Playlist

### เพิ่มวิดีโอเข้า Playlist

```http
POST /mybook/:bookId/video-playlists/:playlistId/videos
Authorization: Bearer {jwt}
Content-Type: application/json

{ "videoIds": [10, 20, 30] }
```

ส่ง `videoIds` หรือ `video_ids` ก็ได้

**กติกา:**

- วิดีโอต้องอยู่ในหนังสือเดียวกัน
- วิดีโอยังไม่ deleted
- ซ้ำใน Playlist เดียวไม่ได้ → `BOOK_VIDEO_PLAYLIST_MEMBER_EXISTS`
- วิดีโอเดียวอยู่หลาย Playlist ได้

### นำวิดีโอออกจาก Playlist

```http
DELETE /mybook/:bookId/video-playlists/:playlistId/videos/:videoId
Authorization: Bearer {jwt}
```

ลบเฉพาะ membership ไม่ลบวิดีโอและไฟล์

### จัดลำดับวิดีโอใน Playlist

```http
PUT /mybook/:bookId/video-playlists/:playlistId/videos/order
Authorization: Bearer {jwt}
Content-Type: application/json

{ "videoIds": [30, 10, 20] }
```

กติกาเดียวกับ reorder Playlist: ต้องส่ง ID ครบ, สูงสุด 500

---

## Writer: รูป Playlist

### อัปโหลดรูป custom

```http
PUT /mybook/:bookId/video-playlists/:playlistId/cover
Authorization: Bearer {jwt}
Content-Type: image/webp
Content-Length: 204800
x-file-name: cover.webp
```

Body: raw binary ของรูปภาพ

| Header | กติกา |
|---|---|
| `x-file-name` | URL-encoded, extension ต้องตรง MIME |
| `content-type` | `image/jpeg`, `image/png` หรือ `image/webp` |
| `content-length` | ไม่เกิน `playlistCover.maxBytes` (default 2 MB) |

Response: `{ playlistId, coverMode: "custom", coverUrl }`

Backend resize/crop เป็น 1080×1080 และแปลงเป็น webp อัตโนมัติ

### ลบรูป custom (กลับเป็น auto)

```http
DELETE /mybook/:bookId/video-playlists/:playlistId/cover
Authorization: Bearer {jwt}
```

Response: `{ playlistId, coverMode: "auto" }`

### รูปที่แสดงเมื่อ auto

```text
thumbnail ของวิดีโอ completed ตัวแรกตาม Playlist order
→ ปกหนังสือ (ถ้าไม่มีวิดีโอ completed)
```

---

## Public: Playlist ในหน้า Book Detail

### Book Detail Response

```http
GET /bookdetail/:bookId
```

Response เพิ่ม field ที่ `data.video.playlists`:

```ts
{
  video: {
    trailer: { ... },   // Trailer เดิม
    playlists: {
      items: Playlist[];  // สูงสุด 10 รายการแรก
      nextCursor: string | null;
      hasMore: boolean;
    };
  }
}
```

Playlist แต่ละตัวมี:

```ts
{
  id: number;
  name: string;
  coverUrl: string | null;  // custom cover หรือ thumbnail วิดีโอแรก
  publishStatus: "published";
  videoCount: number;        // จำนวน completed video
  publishedAt: string;
  updatedAt: string;
}
```

### โหลด Playlist เพิ่ม

```http
GET /bookdetail/:bookId/video-playlists?limit=20&cursor=...
```

Auth: `decodeAuthorization` (guest/login) ไม่บังคับ JWT

Response: `{ items: Playlist[], nextCursor, hasMore }`

### โหลดวิดีโอใน Playlist

```http
GET /bookdetail/:bookId/video-playlists/:playlistId
GET /bookdetail/:bookId/video-playlists/:playlistId/videos
```

ทั้งสอง path ใช้ได้เหมือนกัน

Response:

```ts
{
  playlist: {
    id: number;
    name: string;
    coverUrl: string | null;
  };
  videos: {
    items: PublicVideo[];
    activeRefId: number | null;    // วิดีโอแรกที่ยังไม่ดู
    activeIndex: number;           // index ของ activeRefId ใน items
    pagination: {
      totalItems: number;
      nextCursor: string | null;
      prevCursor: string | null;
      hasMore: boolean;
    };
  };
}
```

`activeRefId` คือ **first unseen** — วิดีโอแรกตาม order ที่ผู้ชมยังไม่เคยดู ถ้าดูครบแล้วจะใช้วิดีโอตัวแรก

frontend ควร highlight/auto-select คลิปนี้เมื่อเปิด Playlist ครั้งแรก

PublicVideo แต่ละตัว:

```ts
{
  id: number;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}
```

### เงื่อนไขการแสดง

```text
หนังสือ status = publish
Playlist publish_status = published
Playlist deleted_at IS NULL
วิดีโอ status = completed และ deleted_at IS NULL
```

ผู้อ่านจะไม่เห็นวิดีโอที่ uploading/processing/failed

---

## Public: Playback วิดีโอ

### ขอ Playback URL

```http
GET /video/playback?type=book_video&ref_id=123
```

ไม่ต้องส่ง JWT

Response:

```ts
{
  type: "book_video";
  refId: number;
  expiresAt: number;    // Unix timestamp วินาที
  hlsUrl: string | null;
  dashUrl: string | null;
}
```

### เล่นวิดีโอ

Player โหลด manifest จาก URL ที่ได้:

```http
GET /media/book_video/123/hls/master.m3u8?token=...
GET /media/book_video/123/dash/manifest.mpd?token=...
```

รองรับ `GET`, `HEAD`, Range request

### เลือก source

1. ใช้ `hlsUrl` เมื่อ player รองรับ HLS
2. ใช้ `dashUrl` เมื่อ HLS ไม่ได้
3. ทั้งคู่ `null` = เล่นไม่ได้

### Refresh URL เมื่อหมดอายุ

ตรวจ `expiresAt` ก่อนหมดอายุ หรือเมื่อ manifest/segment ตอบ 401/403:

```http
GET /video/playback?type=book_video&ref_id=123
```

เปลี่ยน source แล้ว seek กลับตำแหน่งเดิม ใช้ single-flight เพื่อไม่ให้ refresh ซ้ำ

### สิทธิ์การเล่น

| สถานการณ์ | เล่นได้ |
|---|---|
| หนังสือ publish + วิดีโอ completed + อยู่ใน Playlist published | ✅ ทุกคน |
| นักเขียนเจ้าของหนังสือ preview วิดีโอของตัวเอง | ✅ ผ่าน manage scope |
| วิดีโอไม่อยู่ใน Playlist published | ❌ public ไม่ได้ |
| หนังสือยังไม่ publish | ❌ public ไม่ได้ |

---

## Public: View, Like, Comment และ Report

ใช้ API กลางเดียวกันกับ Trailer และ Story โดยส่ง `type = "book_video"` แทน

### บันทึก View

```http
POST /video/interactions/view
Content-Type: application/json

{
  "type": "book_video",
  "refId": 123
}
```

Auth: `decodeAuthorization` (guest ส่ง `x-device-id` header ได้)

Guest ต้องส่ง `x-device-id` เพื่อให้ View ผูกกับอุปกรณ์ ไม่เช่นนั้นจะไม่สามารถติดตาม first unseen ได้

### Toggle Like

```http
POST /video/interactions/like
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "type": "book_video",
  "refId": 123
}
```

ต้อง login กดซ้ำเพื่อ unlike

### Comment

อ่าน comment:

```http
GET /video/comments?type=book_video&ref_id=123&limit=20&cursor=...
```

Auth: `decodeAuthorization` (guest/login)

สร้าง comment:

```http
POST /video/comments
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "type": "book_video",
  "refId": 123,
  "text": "เนื้อหาคอมเมนท์"
}
```

Reply:

```http
POST /video/comments/:commentId/replies
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "type": "book_video",
  "refId": 123,
  "text": "ข้อความตอบกลับ"
}
```

อ่าน replies:

```http
GET /video/comments/:commentId/replies?type=book_video&ref_id=123
```

ลบ comment ของตัวเอง:

```http
DELETE /video/comments/:commentId
Authorization: Bearer {jwt}
```

### Report วิดีโอ

อ่าน preset:

```http
GET /video/reports/presets
```

ส่ง report:

```http
POST /video/reports
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "type": "book_video",
  "refId": 123,
  "presetId": 1,
  "detail": "รายละเอียดเพิ่มเติม"
}
```

Report comment:

```http
POST /video/comments/:commentId/report
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "type": "book_video",
  "refId": 123
}
```

### สิ่งที่เหมือน Trailer

ทุก interaction API ใช้ endpoint เดียวกัน เปลี่ยนแค่ `type`:

- Trailer: `type = "book_video_trailer"`
- Book Video: `type = "book_video"`
- Story: `type = "video_story_items"`

`view_count`, `like_count`, `comment_count` ผูกกับ `book_video.id` ดังนั้นวิดีโอเดียวอยู่หลาย Playlist ก็ใช้ยอดชุดเดียว

---

## Public: Story Bar

### Story Bar Response

```http
GET /video/story-bar?limit=20&cursor=...
```

Auth: `decodeAuthorization` (guest ส่ง `x-device-id`)

Response มี groups หลายประเภท ผสมกัน:

```ts
{
  groups: StoryBarGroup[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

Playlist group มี `groupType = "book_video_playlist"`:

```ts
{
  groupType: "book_video_playlist";
  groupId: number;       // playlist ID
  bookId: number;
  bookTitle: string;
  bookCoverUrl: string;
  writerName: string;
  hasUnseen: boolean;
  totalItems: number;
  preview: {
    refId: number;         // video ID ที่จะเล่น
    thumbnailUrl: string;
    title: string;
  };
}
```

### แสดง card บน Story Bar

- ใช้ `preview.thumbnailUrl` เป็นรูป card (ไม่ใช้รูป Playlist)
- ใช้ชื่อ/รูปหนังสือเป็นชื่อและไอคอนบน card
- `hasUnseen` ใช้แสดง indicator ว่ามีคลิปใหม่

### เปิดดูวิดีโอจาก Story Bar

```http
GET /video/story-bar/groups/book_video_playlist/:playlistId/items?start_ref_id=123
```

| Query | หมายเหตุ |
|---|---|
| `start_ref_id` | video ID ที่ต้องการเล่น (optional) |

Response:

```ts
{
  items: [{
    refId: number;
    thumbnailUrl: string;
    title: string;
    playbackUrl: { hlsUrl, dashUrl, expiresAt };
  }];
  activeRefId: number;
  pagination: { totalItems: number };
}
```

**คืน `items` เพียง 1 วิดีโอ** ไม่ใช่ทั้ง Playlist

กติกาเลือกวิดีโอ:

1. ถ้า `start_ref_id` เป็น completed member → เล่นวิดีโอนั้น
2. ไม่เช่นนั้น → เลือก first unseen
3. ดูครบแล้ว → เลือกวิดีโอแรก

### เปิดรายการ Playlist ทั้งหมด

เมื่อ user กดดูรายการ ให้เรียก public Book Detail endpoint:

```http
GET /bookdetail/:bookId/video-playlists/:playlistId/videos
```

โหลดรายการวิดีโอทั้งหมดแบบ cursor pagination แล้วให้ user เลือกคลิปจากรายการ

### การนำทาง

- ลูกศรถัดไป/ก่อนหน้า/swipe → เปลี่ยน Story Bar group ไม่ใช่เปลี่ยนตอนถัดไปใน Playlist
- วิดีโอจบแล้วไม่ auto-play ตอนถัดไปใน Playlist
- user ต้องเลือกคลิปจากรายการเอง

### Impression

```http
POST /video/story-bar/impressions
Content-Type: application/json

{ "writerIds": [101, 102, 103] }
```

Auth: `decodeAuthorization`

ส่งเมื่อ group ปรากฏบนหน้าจอ เพื่อให้ algorithm กระจายเนื้อหา

---

## Error Codes

| Error Code | HTTP | เกิดเมื่อ |
|---|---|---|
| `BOOK_VIDEO_NOT_FOUND` | 404 | ไม่พบวิดีโอหรือไม่ใช่เจ้าของ |
| `BOOK_VIDEO_NOT_RETRYABLE` | 400 | retry วิดีโอที่ไม่ใช่ failed |
| `BOOK_VIDEO_IDEMPOTENCY_CONFLICT` | 409 | idempotency key ซ้ำต่าง book/user |
| `BOOK_VIDEO_FILE_SIZE_LIMIT_EXCEEDED` | 400 | ไฟล์ใหญ่เกิน |
| `BOOK_VIDEO_MIME_TYPE_NOT_ALLOWED` | 400 | MIME type ไม่อยู่ใน allowlist |
| `BOOK_VIDEO_FILE_EXTENSION_NOT_ALLOWED` | 400 | extension ไม่อยู่ใน allowlist |
| `BOOK_VIDEO_FILE_TYPE_MISMATCH` | 400 | extension ไม่ตรง MIME |
| `BOOK_VIDEO_UPLOAD_BODY_MISSING` | 400 | ไม่มี body |
| `BOOK_VIDEO_UPLOAD_FAILED` | 500 | upload ไป storage ล้มเหลว |
| `BOOK_VIDEO_PLAYLIST_NOT_FOUND` | 404 | ไม่พบ Playlist |
| `BOOK_VIDEO_PLAYLIST_MEMBER_EXISTS` | 409 | วิดีโออยู่ใน Playlist แล้ว |
| `BOOK_VIDEO_PLAYLIST_NO_COMPLETED_VIDEO` | 400 | publish Playlist ที่ไม่มี completed video |
| `BOOK_VIDEO_PLAYLIST_ORDER_MISMATCH` | 400 | ส่ง ID ไม่ครบหรือไม่ตรง scope |
| `BOOK_VIDEO_PLAYLIST_COVER_SIZE_INVALID` | 400 | รูปใหญ่เกิน |
| `VIDEO_PLAYBACK_NOT_AVAILABLE` | 404 | วิดีโอไม่พร้อมเล่น public |

---

## ข้อควรระวัง

- Direct upload ไม่มี resume ถ้า request หลุดต้อง upload ใหม่ทั้งไฟล์
- `content-length` ต้องถูกต้อง reverse proxy ต้องไม่ตัด stream
- `idempotency_key` unique ทั้งระบบ ต้องสร้าง key ใหม่ทุก upload
- Reorder ต้องส่ง ID ครบทั้ง scope ห้ามส่งบางส่วน
- `activeIndex` ใน public response เป็น index ภายใน page ที่คืน ไม่ใช่ตำแหน่งรวมทั้ง Playlist
- Guest ที่ไม่ส่ง `x-device-id` จะไม่มีประวัติ first unseen ข้าม request
- Playlist ที่ published แล้วนำ completed video ตัวสุดท้ายออก ระบบไม่ unpublish อัตโนมัติ แต่ public query จะไม่แสดง Playlist นั้น
- ระบบไม่มี resumable upload, subtitle, DRM, offline download หรือ watch duration
