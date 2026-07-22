# Video Story Bar - เอกสารหน้าบ้านเว็บ

เอกสารนี้ใช้สำหรับ frontend ที่ต้องเชื่อมกับ `enjoybook_web_api` เพื่อแสดง Story Bar, Story Viewer, upload story, realtime progress, view/like และ insights

## 1. Endpoint และ env ที่ต้องใช้

| ตัวแปร | ตัวอย่าง | ใช้ทำอะไร |
|---|---|---|
| `VITE_API_URL` | `http://192.168.220.214:4005` | base URL สำหรับ REST API |
| `VITE_SOCKET_URL` | `http://192.168.220.214:4005` | base URL สำหรับ Socket.IO |

Header ที่ควรใช้:

| Header | ใช้เมื่อ | ใช้ทำอะไร |
|---|---|---|
| `Authorization: Bearer <token>` | user login | ให้ backend แยก user, owner, like, insights |
| `x-device-id` | guest หรือทุก request story bar/interactions | แยก guest viewer และ impression |

`x-device-id` ควร generate แล้วเก็บใน localStorage เช่น `demo-uuid`

## 2. Flow หลักของหน้า story bar

```text
โหลด story bar
-> GET /video/story-bar?limit=20
-> render group preview
-> ส่ง impression เฉพาะ trailer ที่เห็นจริง
-> user กด group
-> GET /video/story-bar/groups/:groupType/:groupId/items
-> เปิด story viewer
-> เล่น hls_url/dash_url
-> POST /video/interactions/view เมื่อเล่นจริง
-> POST /video/interactions/like เมื่อกด like
```

## 3. Load Story Bar Preview

### Request

```http
GET /video/story-bar?limit=20&cursor=<nextCursor>
Authorization: Bearer <token>   # optional
x-device-id: <device-id>
```

### Response

```json
{
  "items": [
    {
      "groupType": "user",
      "groupId": "53",
      "section": "own",
      "user_id": 53,
      "user": {
        "user_id": 53,
        "userID": "EJB...",
        "fullname": "Enjoybook",
        "writer_name": "Enjoybook",
        "display_name": "Enjoybook",
        "profile_image": "https://image.enjoybook.co/..."
      },
      "hasUnseen": true,
      "totalItems": 2,
      "preview": {
        "type": "video_story_items",
        "ref_id": 20,
        "thumbnail_url": "https://...",
        "hls_url": "http://.../media/video_story_items/20/hls/master.m3u8?token=...",
        "dash_url": "http://.../media/video_story_items/20/dash/manifest.mpd?token=...",
        "is_viewed": false,
        "is_liked": false,
        "links": []
      }
    }
  ],
  "pagination": {
    "limit": 20,
    "nextCursor": null,
    "hasMore": false
  },
  "sections": {
    "admin": 1,
    "following": 0,
    "trailerDiscovery": 5
  }
}
```

### วิธีใช้ field ระดับ group

| field | วิธีใช้ใน UI |
|---|---|
| `groupType` | ใช้กำหนด endpoint ตอนเปิด viewer: `admin`, `user`, `trailer` |
| `groupId` | ส่งต่อไป endpoint group items |
| `section` | ใช้แยกกลุ่ม UI เช่น `own`, `following`, `trailer_discovery` |
| `user_id` | id เจ้าของ group |
| `user` | แสดง avatar/name |
| `hasUnseen` | วงแหวน profile: true = สี active, false = สี viewed |
| `totalItems` | จำนวน story ใน group |
| `preview` | วิดีโอ 1 ตัวสำหรับ card preview |

### ลำดับแสดงผล

แนะนำ frontend render ตามลำดับ response ที่ backend ส่งมา ไม่ต้อง sort เอง

ลำดับ backend:

1. own story ถ้ามี
2. admin/platform story
3. following user story
4. trailer discovery

หมายเหตุ: exact order อาจเปลี่ยนตาม algorithm backend ได้ ให้ frontend ใช้ response order เป็น source of truth

## 4. Preview Card UI

แต่ละ group แสดงเป็น card แนวนอนแบบ Facebook story

ใช้ field:

| UI | field |
|---|---|
| background image | `preview.thumbnail_url` |
| avatar | `user.profile_image` หรือ fallback |
| name | `user.display_name` |
| ring color | `hasUnseen` |
| badge count | `totalItems` |

ถ้า `section === "own"` หรือเป็น user ปัจจุบัน ให้แสดง card ของตัวเองไว้ด้านหน้า

## 5. เปิด Story Viewer

### Request

```http
GET /video/story-bar/groups/:groupType/:groupId/items?start_ref_id=<optional>
Authorization: Bearer <token>   # optional
x-device-id: <device-id>
```

ตัวอย่าง:

```http
GET /video/story-bar/groups/user/53/items
GET /video/story-bar/groups/admin/admin/items
GET /video/story-bar/groups/trailer/184/items
```

### Response

```json
{
  "groupType": "user",
  "groupId": "53",
  "startRefId": 20,
  "startIndex": 0,
  "items": [
    {
      "type": "video_story_items",
      "ref_id": 20,
      "thumbnail_url": "https://...",
      "hls_url": "http://.../master.m3u8?token=...",
      "dash_url": "http://.../manifest.mpd?token=...",
      "playback_expires_at": 1783483680,
      "is_viewed": false,
      "is_liked": false,
      "view_count": null,
      "like_count": null,
      "links": []
    }
  ]
}
```

### วิธีใช้ field

| field | วิธีใช้ |
|---|---|
| `startRefId` | ref id ที่ควรเริ่มเล่น |
| `startIndex` | index ที่ควรเปิดใน `items` |
| `items[]` | timeline ของ group |
| `items[].type` | ใช้ส่ง interaction/playback refresh |
| `items[].ref_id` | ใช้ส่ง interaction/playback refresh |
| `items[].is_viewed` | ใช้แสดงสถานะ progress/seen |
| `items[].is_liked` | สถานะปุ่ม like |

กติกา:

- group `user`/`admin`: มีหลายวิดีโอได้
- group `trailer`: มี 1 วิดีโอ
- ถ้าดูจบ item สุดท้ายของ group ให้ frontend เปิด group ถัดไปเองจาก story bar list

## 6. เล่นวิดีโอ

เลือก URL:

| สภาพแวดล้อม | แนะนำ |
|---|---|
| Safari/iOS | ใช้ `hls_url` กับ native HLS |
| Chrome/Edge/Android | ใช้ HLS.js หรือ DASH.js ได้ |
| fallback | ถ้า HLS เล่นไม่ได้ลอง `dash_url` |

URL ที่ได้เป็น backend media URL:

```text
/media/:type/:refId/hls/master.m3u8?token=...
/media/:type/:refId/dash/manifest.mpd?token=...
```

frontend ไม่ต้องยิง MinIO โดยตรง

### Token หมดอายุ

ถ้า player โหลด manifest/segment แล้วเจอ 403 หรือ token expired:

```http
GET /video/playback?type=video_story_items&ref_id=20
```

Response:

```json
{
  "type": "video_story_items",
  "refId": 20,
  "expiresAt": 1783483680,
  "hlsUrl": "http://.../media/video_story_items/20/hls/master.m3u8?token=...",
  "dashUrl": "http://.../media/video_story_items/20/dash/manifest.mpd?token=...",
  "thumbnailUrl": "https://..."
}
```

ให้อัปเดต player source ด้วย URL ใหม่

## 7. Progress bar ใน Story Viewer

แนะนำ UI แบบ Facebook/IG:

- ด้านบนมี progress segment ตามจำนวน `items.length`
- item ที่จบแล้ว progress = 100%
- item ปัจจุบัน progress เพิ่มตาม `currentTime / duration`
- item ที่ยังไม่เล่น progress = 0%

เมื่อ video `ended`:

1. ส่ง view ถ้ายังไม่ได้ส่ง
2. ไป item ถัดไป
3. ถ้าหมด group ให้ไป group ถัดไป

## 8. CTA links

ทุก video item มี `links: []`

### Story links

มาจาก `video_story_item_links`

```json
"links": [
  { "label": "อ่านต่อ", "url": "https://example.com/a", "order_by": 0 },
  { "label": "โปรโมชัน", "url": "https://example.com/b", "order_by": 1 }
]
```

### Trailer auto link

backend สร้างให้อัตโนมัติ

```json
"links": [
  {
    "label": "อ่านเลย!",
    "target_type": "book",
    "book_id": 970051,
    "bookID": "B2026...",
    "url": "https://enjoybook.co/book/970051"
  }
]
```

### วิธี render หลาย link

| จำนวน link | UI ที่แนะนำ |
|---|---|
| 0 | ไม่แสดง CTA |
| 1 | แสดงปุ่มเดียวด้านล่าง |
| 2-3 | แสดงปุ่มแนวตั้งด้านล่าง |
| มากกว่า 3 | แสดง 2 ปุ่มแรก + ปุ่ม “เพิ่มเติม” เปิด bottom sheet/modal |

เมื่อกด:

- ใช้ `window.open(link.url, "_blank", "noopener,noreferrer")` หรือ route ภายในถ้าเป็น domain ของระบบ
- ใช้ `label` เป็นข้อความปุ่ม
- ห้าม hardcode เฉพาะ `อ่านเลย!` เพราะ story link ตั้งเองได้หลายลิงก์

## 9. บันทึก View

### Request

```http
POST /video/interactions/view
Authorization: Bearer <token>   # optional
x-device-id: <device-id>
Content-Type: application/json

{
  "type": "video_story_items",
  "ref_id": 20
}
```

`type` ที่รองรับ:

```text
video_story_items
book_video_trailer
```

### ควรส่งเมื่อไหร่

แนะนำส่งเมื่อ video เริ่มเล่นจริง เช่น:

- `playing` ครั้งแรกของ item นั้น
- หรือผ่าน watch threshold เช่น 1-2 วินาที

ไม่ควรส่งทันทีตอนโหลด preview

### Response ปกติ

```json
{
  "type": "video_story_items",
  "ref_id": 20,
  "is_viewed": true,
  "view_count": null,
  "viewer_view_count": 1,
  "is_liked": false,
  "skipped": false
}
```

### Response เมื่อดูวิดีโอตัวเอง

```json
{
  "type": "video_story_items",
  "ref_id": 20,
  "is_viewed": false,
  "view_count": 10,
  "viewer_view_count": 0,
  "is_liked": false,
  "skipped": true,
  "skip_reason": "own_video"
}
```

วิธีใช้:

- ถ้า `skipped=true` ไม่ต้องเปลี่ยน UI เป็น viewed
- ไม่ต้องแสดง error เพราะเป็น behavior ปกติ
- ใช้ป้องกันเจ้าของ story เพิ่มยอดวิวตัวเอง

## 10. Like / Unlike

### Request

```http
POST /video/interactions/like
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "video_story_items",
  "ref_id": 20
}
```

Response:

```json
{
  "type": "video_story_items",
  "ref_id": 20,
  "is_liked": true,
  "like_count": null,
  "is_viewed": true
}
```

วิธีใช้:

- กดครั้งแรก `is_liked=true`
- กดซ้ำ `is_liked=false`
- ถ้าเป็นวิดีโอตัวเอง backend จะ error `VIDEO_LIKE_OWN_NOT_ALLOWED`
- `like_count` จะส่งให้เจ้าของวิดีโอเท่านั้น กรณีคนทั่วไปอาจเป็น `null`

## 11. Story insights ของเจ้าของวิดีโอ

### Request

```http
GET /video/story/:storyItemId/insights
Authorization: Bearer <token>
```

ใช้เฉพาะเจ้าของ story

Response field:

| field | ใช้ทำอะไร |
|---|---|
| `story_item_id` | id story |
| `view_count` | ยอดวิวรวม |
| `like_count` | ยอด like รวม |
| `total_viewers` | จำนวน viewer |
| `total_likers` | จำนวน liker |
| `viewers[]` | รายชื่อคนดู |
| `likers[]` | รายชื่อคน like |

`viewers[]` item:

| field | ใช้ทำอะไร |
|---|---|
| `user` | user object ถ้า login |
| `guest_device_id` | device id ถ้า guest |
| `view_count` | จำนวนครั้งที่ viewer คนนั้นดู |
| `is_liked` | viewer คนนั้น like หรือไม่ |
| `viewed_at` | เวลาดูล่าสุด |
| `reacted_at` | เวลา like ล่าสุด |

## 12. Upload Story Video

### 12.1 โหลด config ก่อน upload

```http
GET /video/story/config
Authorization: Bearer <token>
```

ใช้ validate หน้าเว็บ:

| field | ใช้ทำอะไร |
|---|---|
| `maxUploadBytes` | เช็ค `file.size` |
| `maxDurationSeconds` | อ่าน duration จาก video metadata |
| `allowedExtensions` | เช็คนามสกุล |
| `allowedMimeTypes` | เช็ค MIME |
| `maxCtaLinks` | จำกัด link |
| `isAdmin` | ใช้บอกว่า user ปัจจุบันเป็น admin หรือไม่ |
| `manageVideoStory` | ค่า permission `user.manage_video_story` |
| `canUploadStory` | ถ้า `false` ให้ disable ปุ่มเลือกไฟล์และ Upload story |
| `canUploadAdminStory` | ถ้า `false` ให้ disable option `admin/platform story` |

ตัวอย่างการใช้ permission:

```ts
if (!config.canUploadStory) {
  // disable upload UI และแสดง "บัญชีนี้ยังไม่มีสิทธิ์อัปโหลดวิดีโอสตอรี่"
}

if (!config.canUploadAdminStory) {
  // disable sourceType=admin
}
```

### 12.2 Validate duration ก่อน upload

ตัวอย่างแนวคิด:

```ts
const url = URL.createObjectURL(file);
const video = document.createElement("video");
video.preload = "metadata";
video.src = url;
video.onloadedmetadata = () => {
  if (video.duration > config.maxDurationSeconds) {
    // แจ้งเตือนภาษาไทยและไม่ upload
  }
};
```

### 12.3 Upload request

```http
POST /video/story/uploads
Authorization: Bearer <token>
Content-Type: video/mp4
Content-Length: <file.size>
x-idempotency-key: story-demo-uuid
x-file-name: story.mp4
x-source-type: user
x-priority: 0
x-start-date: 2026-07-10T08:00:00.000Z   # optional
x-end-date: 2026-07-11T08:00:00.000Z     # optional
x-links: %5B%7B%22label%22%3A%22...%22%2C%22url%22%3A%22https%3A%2F%2F...%22%7D%5D   # optional

<binary body>
```

กติกาเวลาแสดงผล:

- ถ้าต้องการลงล่วงหน้า ให้ส่ง `x-start-date` เป็น ISO datetime
- ถ้าส่งเฉพาะ `x-start-date` โดยไม่ส่ง `x-end-date` backend จะคำนวณ `end_date = start_date + activeHours` จาก `/video/story/config`
- ถ้าไม่ส่งทั้งคู่ backend จะเริ่มแสดงหลัง transcode สำเร็จ และคำนวณ `end_date` จากเวลานั้น
- ถ้าส่ง `x-end-date` ต้องมากกว่า `x-start-date`; ถ้าผิด backend จะตอบ `VIDEO_STORY_DATE_RANGE_INVALID`

กติกา `x-links`:

- ใช้แนบ CTA links ตั้งแต่ตอน upload ได้เลย
- ค่า header ต้องเป็น `encodeURIComponent(JSON.stringify(links))` เพื่อรองรับภาษาไทย
- `links` เป็น array ของ `{ label, url, orderBy? }`
- จำนวนสูงสุดดูจาก `maxCtaLinks` ใน `/video/story/config`
- `label` ยาว 1-80 ตัวอักษร และ `url` ต้องเป็น `http://` หรือ `https://`

กติกา `x-idempotency-key`:

- ต้องสร้างใหม่สำหรับ upload ใหม่ทุกครั้ง
- ใช้ key เดิมเฉพาะ retry ของไฟล์/request เดิม
- ถ้าเลือกไฟล์ใหม่แต่ใช้ key เดิม backend จะคืน record เดิมและไม่สร้าง queue ใหม่

### 12.4 หลัง upload response

เมื่อได้ `storyItem.id`:

1. set active upload id
2. join socket room `video_story:{id}`
3. poll `GET /video/story/:id/status` ทันที
4. poll ทุก 2 วินาทีจนกว่า `completed`, `failed`, `deleted`
5. เมื่อ `completed` ให้ reload story bar

## 13. Upload status polling

### Request

```http
GET /video/story/:storyItemId/status
Authorization: Bearer <token>
```

Response field:

| field | ใช้ทำอะไร |
|---|---|
| `status` | DB status |
| `thumbnailUrl` | thumbnail หลัง completed |
| `hlsManifestPath`, `dashManifestPath` | debug path ไม่ใช่ playback URL |
| `bullmqJobId` | job id |
| `processingProgress` | progress จาก queue |
| `processingJob` | state ของ queue job |

ตัวอย่าง:

```json
{
  "id": 20,
  "status": "processing",
  "processingProgress": {
    "percent": 42,
    "stage": "transcoding-360p",
    "updatedAt": "2026-07-09T03:00:00.000Z"
  },
  "processingJob": {
    "id": "story-transcode-20",
    "state": "active",
    "attemptsMade": 1,
    "failedReason": null
  }
}
```

UI mapping:

| status/stage | UI |
|---|---|
| `queued` | รอประมวลผล |
| `processing` | แสดง progress bar |
| `completed` | progress 100%, reload story bar |
| `failed` | แสดง error และให้ upload ใหม่ |
| `deleted` | ซ่อน/หยุด polling |

## 14. Socket realtime status

### Connect

```ts
const socket = io(VITE_SOCKET_URL, {
  transports: ["websocket", "polling"],
  auth: { token },
  query: { user_id, device_id },
});
```

### Join room

```ts
socket.emit("video_story:join", { storyItemId }, (ack) => {
  if (!ack?.ok) {
    // fallback poll status
  }
});
```

### Listen update

```ts
socket.on("video_story:updated", (payload) => {
  // payload.storyItemId
  // payload.status
  // payload.progress
  // payload.stage
});
```

Payload:

```json
{
  "storyItemId": 20,
  "status": "processing",
  "progress": 42,
  "stage": "transcoding-360p",
  "jobId": "story-transcode-20",
  "attempt": 1,
  "maxAttempts": 3,
  "error": null,
  "updatedAt": "2026-07-09T03:00:00.000Z"
}
```

ข้อควรระวัง:

- socket เป็น realtime UX เท่านั้น
- ต้องมี polling fallback เพราะ worker อาจทำจบก่อน frontend join room
- ถ้า response polling เป็น id เก่า ต้อง ignore ไม่ให้เขียนทับ upload ใหม่

## 15. Impression สำหรับ trailer discovery

ส่งเมื่อ card trailer เข้าสู่ viewport จริง

```http
POST /video/story-bar/impressions
Authorization: Bearer <token>   # optional
x-device-id: <device-id>
Content-Type: application/json

{
  "impressions": [
    {
      "groupType": "trailer",
      "user_id": 64689
    }
  ]
}
```

ไม่ต้องส่ง impression ของ admin/user story ใน V1 เพราะ backend ใช้เฉพาะ trailer fair discovery

## 16. UI states ที่ต้องรองรับ

| state | frontend ควรทำอะไร |
|---|---|
| `loading story bar` | skeleton horizontal cards |
| `empty story bar` | ซ่อน bar หรือแสดงปุ่มสร้าง story |
| `hasUnseen=true` | ring สี active |
| `hasUnseen=false` | ring สี viewed |
| `viewer open` | modal fullscreen/fixed เหมือน Facebook |
| `media loading` | loading overlay |
| `media token expired` | refresh `/video/playback` |
| `upload queued` | แสดงรอ worker |
| `upload processing` | progress bar |
| `upload completed` | reload story bar |
| `upload failed` | แสดง error ภาษาไทย |
| `own video view skipped` | ไม่ต้อง error |

## 17. Error ที่พบบ่อย

| error/อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| upload ใหม่แล้วขึ้น completed ทันที | ใช้ `x-idempotency-key` เดิม | generate key ใหม่เมื่อเลือกไฟล์ใหม่ |
| socket connected แต่ progress ไม่ขยับ | join room ช้ากว่า worker | ใช้ polling fallback |
| วิดีโอ fail `VIDEO_DURATION_LIMIT_EXCEEDED` | duration เกิน config | validate duration ก่อน upload |
| upload fail `VIDEO_STORY_DATE_RANGE_INVALID` | `end_date` น้อยกว่าหรือเท่ากับ `start_date` | ให้ผู้ใช้เลือกเวลาสิ้นสุดที่มากกว่าเวลาเริ่ม หรือส่งเฉพาะ `start_date` เพื่อให้ backend คำนวณให้ |
| จัดลำดับ link แล้ว fail `VIDEO_STORY_LINK_ORDER_MISMATCH` | ส่ง `linkIds` ไม่ครบ active links หรือมี id ที่ไม่อยู่ใน story | reload `GET /video/story/:storyItemId/links` แล้วส่ง id active links ทั้งหมดตามลำดับใหม่ |
| แก้/ลบ link แล้ว fail `VIDEO_STORY_LINK_NOT_FOUND` | link ถูกลบแล้ว หรือไม่ได้อยู่ใน story นั้น | reload รายการ links แล้วอัปเดต UI |
| กด like ตัวเองไม่ได้ | backend กันไว้ | ซ่อน/disable like ของวิดีโอตัวเอง |
| ดูวิดีโอตัวเองไม่เพิ่มวิว | behavior ปัจจุบัน | ถ้า `skipped=true` ไม่ต้องแจ้ง error |
| media 403 | token หมดอายุ | refresh `/video/playback` |

## 18. Checklist สำหรับ frontend

- [ ] มี `x-device-id` ถาวรใน localStorage
- [ ] โหลด `/video/story/config` ก่อน upload
- [ ] validate size/type/extension/duration ก่อน upload
- [ ] สร้าง `x-idempotency-key` ใหม่ทุกครั้งที่เลือกไฟล์ใหม่
- [ ] หลัง upload join socket และ poll fallback
- [ ] render story bar ตาม response order
- [ ] ใช้ `hasUnseen` ทำ ring สี profile
- [ ] render `links[]` ได้มากกว่า 1 link
- [ ] ส่ง view เมื่อเล่นจริง ไม่ส่งจาก preview
- [ ] ไม่ error เมื่อ view response ได้ `skipped=true`
- [ ] refresh playback URL เมื่อ token หมดอายุ

## 19. การจัดการลิงก์ (Story CTA Links)

ฟีเจอร์ลิงก์แบบ Call-To-Action (CTA) บนวิดีโอสตอรี่ รองรับการสร้างพร้อมวิดีโอ หรือเข้ามาแก้ไข เพิ่ม ลบ จัดลำดับใหม่ย้อนหลังได้ โดยวิดีโอ 1 ตัวสามารถมีลิงก์ได้สูงสุด 3 ลิงก์

### 19.1 การส่งลิงก์แนบไปพร้อมไฟล์วิดีโอตอนอัปโหลด
ส่งผ่าน HTTP Header ชื่อ `x-links` ในตอนที่ยิง `POST /video/story/uploads`

* **กติกาสำคัญ**: เนื่องจากเป็น HTTP Header ค่าที่เป็นภาษาไทยจะสูญหายหรือเพี้ยนหากส่งดิบๆ **ต้องทำการเข้ารหัสด้วย `encodeURIComponent(JSON.stringify(links))`** จากฝั่งหน้าบ้านก่อนส่งเสมอ!

**ตัวอย่างการส่ง:**
```ts
const links = [
  { label: "อ่านบทความ", url: "https://enjoybook.co/book/123" },
  { label: "ดูคลิป Tiktok", url: "https://tiktok.com/@enjoybook" }
];

const headers = {
  "Content-Type": file.type || "video/mp4",
  "x-idempotency-key": idempotencyKey,
  "x-file-name": file.name,
  "x-links": encodeURIComponent(JSON.stringify(links)) // <-- เข้ารหัส
};
```

---

### 19.2 APIs สำหรับจัดการลิงก์ย้อนหลัง (CRUD & Batch Reorder)

ทุก endpoint ในการแก้ไข/ลบ/จัดลำดับ ต้องส่ง `Authorization: Bearer <token>` ของผู้เป็นเจ้าของวิดีโอสตอรี่นั้นๆ

#### 1) ดึงลิงก์ทั้งหมดของสตอรี่
* **Endpoint**: `GET /video/story/:storyItemId/links`
* **ตัวอย่าง Response**:
```json
{
  "code": 200,
  "status": "success",
  "message": "success",
  "data": {
    "storyItemId": 24,
    "links": [
      {
        "id": 5,
        "label": "อ่านบทความ",
        "url": "https://enjoybook.co/book/123",
        "orderBy": 0,
        "createdAt": "2026-07-09T07:13:02.000Z",
        "updatedAt": "2026-07-09T07:13:02.000Z"
      }
    ]
  }
}
```

#### 2) เพิ่มลิงก์ใหม่เข้าไปท้ายสุด (สูงสุดรวมกันไม่เกิน 3 ลิงก์)
* **Endpoint**: `POST /video/story/:storyItemId/links`
* **Body (JSON)**:
```json
{
  "links": [
    { "label": "ซื้อหนังสือรูปเล่ม", "url": "https://shop.enjoybook.co" }
  ]
}
```

#### 3) แทนที่ลิงก์ทั้งหมดของสตอรี่
ใช้เมื่อต้องการ save แบบ overwrite ทั้งชุด เช่น form แก้ไข links ทั้งหมดในครั้งเดียว
* **Endpoint**: `PUT /video/story/:storyItemId/links`
* **Body (JSON)**:
```json
{
  "links": [
    { "label": "อ่านบทความ", "url": "https://enjoybook.co/book/123", "orderBy": 0 },
    { "label": "ดูโปรโมชัน", "url": "https://shop.enjoybook.co", "orderBy": 1 }
  ]
}
```

ข้อควรระวัง: endpoint นี้จะ mark active links เดิมเป็น `deleted` แล้วสร้าง links ชุดใหม่ ดังนั้น `linkId` เดิมจะเปลี่ยน

#### 4) แก้ไขลิงก์รายตัว (แก้ไข Label หรือ URL)
* **Endpoint**: `PATCH /video/story/:storyItemId/links/:linkId`
* **Body (JSON)**:
```json
{
  "label": "ซื้อหนังสือรูปเล่ม (ลด 10%)",
  "url": "https://shop.enjoybook.co/promo"
}
```

#### 5) ลบลิงก์รายตัว (Soft Delete)
* **Endpoint**: `DELETE /video/story/:storyItemId/links/:linkId`

#### 6) บันทึกการจัดเรียงลำดับลิงก์ทั้งหมดใหม่ (Batch Reorder)
ใช้สำหรับจัดลำดับใหม่ในครั้งเดียวเพื่อลดจำนวนครั้งที่ยิง API โดยการเรียงลำดับ ID จากหน้าไปหลัง
* **Endpoint**: `PUT /video/story/:storyItemId/links/order`
* **Body (JSON)**:
```json
{
  "linkIds": [12, 10, 11]  // ส่งอาเรย์ ID ของลิงก์ที่ต้องการให้แสดงผลเรียงตามนี้
}
```

---

### 19.3 คำแนะนำการออกแบบหน้าบ้าน (UX/UI Best Practices)
1. **การบันทึกลำดับแบบกลุ่ม (Batch Save)**: 
   - เมื่อผู้ใช้กดปุ่มสลับขึ้น-ลงใน UI ให้เปลี่ยนลำดับภายใน State ของหน้าบ้านก่อนและอัปเดตตัวเลขแสดงผลทันทีโดยยังไม่ต้องกดยิง API
   - เมื่อผู้ใช้จัดจนพอใจแล้ว ให้มีปุ่ม **"บันทึกลำดับใหม่"** เพื่อสั่งยิง `PUT /links/order` เพียงครั้งเดียว ช่วยลดทราฟฟิกและหลีกเลี่ยงความล่าช้าในหน้าจอ
2. **การดึงและรีเฟรชข้อมูลในเครื่องเล่นวิดีโอ (Story Viewer)**:
   - ข้อมูลลิงก์ที่ใช้งานจะแสดงอยู่ในออบเจกต์ของแต่ละ Story Item (`links[]`) ที่ได้มาจาก API โหลด Story Bar หรือ API รายการกรุ๊ป
   - หากผู้ใช้แก้ไขลิงก์ย้อนหลังเสร็จสิ้นแล้ว ให้เรียกฟังก์ชันโหลดข้อมูลสตอรี่ในกลุ่มนั้นใหม่อีกครั้งทันที เพื่อให้ปุ่ม CTA บนตัวเครื่องเล่นวิดีโออัปเดตแบบ Real-time ตามข้อมูลล่าสุดในฐานข้อมูล
