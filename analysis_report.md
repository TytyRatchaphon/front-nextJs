# 🔍 Performance Analysis Report — Timeout Root Causes

## สรุปสั้น

ปัญหา timeout ตอน load test 300 users ไม่ได้เกิดจาก cluster ไม่พอ แต่เกิดจาก **Frontend ส่ง request ไป BE มากเกินความจำเป็น** และ **ไม่มีกลไกป้องกันการ cascade failure** หลายจุด ทำให้แม้จะเพิ่ม cluster จาก 2 → 6 ก็ยังไม่ช่วย เพราะปัญหาอยู่ที่ traffic volume ที่ FE สร้างขึ้น

---

## 🔴 ปัญหาวิกฤต (Critical — ต้องแก้ก่อน)

### 1. Axios ไม่มี Timeout Config
**ไฟล์**: [apiClient.ts](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/services/apiClient.ts)

```typescript
// ❌ ปัจจุบัน — ไม่มี timeout
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});
```

> [!CAUTION]
> **ทุก API request ไม่มี timeout** — ถ้า BE ตอบช้า request จะค้างตลอด ไม่ปล่อย connection
> เมื่อ 300 users ยิงพร้อมกัน = 300+ connections ค้างพร้อมกัน → BE ล่ม → ทุกอันก็ timeout

**แก้ไข:**
```typescript
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 15000, // 15 วินาที
    headers: { "Content-Type": "application/json" },
});
```

---

### 2. Socket.IO — `forceNew: true` + Polling-First + ไม่จำกัดจำนวน Reconnection

**ไฟล์**: [SocketProvider.tsx](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/providers/SocketProvider.tsx#L75-L96)

```typescript
// ❌ ปัจจุบัน
const socketInstance = io(socketUrl, {
  transports: ['polling', 'websocket'],  // เริ่มด้วย HTTP polling → สร้าง request ซ้ำเรื่อยๆ
  reconnectionAttempts: Infinity,         // ไม่เคยหยุด reconnect
  forceNew: true,                         // สร้าง connection ใหม่ทุกครั้ง
  timeout: 20000,
});
```

> [!CAUTION]
> **ปัญหาหลัก 3 จุด:**
> 1. `forceNew: true` — ทุกครั้งที่ dependency เปลี่ยน (token, user) จะสร้าง socket ใหม่ทั้งหมด
> 2. `transports: ['polling', 'websocket']` — เริ่มด้วย HTTP long-polling ซึ่งสร้าง request จำนวนมาก
> 3. `reconnectionAttempts: Infinity` — ตอน BE ล่ม, socket จะ reconnect ไม่หยุด → ยิ่ง flood server

**แก้ไข:**
```typescript
const socketInstance = io(socketUrl, {
  transports: ['websocket'],              // ใช้ WebSocket ตรงๆ
  reconnectionAttempts: 10,               // จำกัดการ reconnect
  reconnectionDelay: 2000,                // เพิ่ม delay
  reconnectionDelayMax: 30000,            // max 30 วินาที
  forceNew: false,                        // ใช้ connection เดิม
  timeout: 10000,
});
```

---

### 3. [generateMetadata()](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/book/%5Bid%5D/page.tsx#21-58) ใน Root Layout — ยิง API ทุก Page Request

**ไฟล์**: [layout.tsx](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/layout.tsx#L103-L112)

```typescript
// ❌ ทุกครั้งที่ user เข้าหน้าไหนก็ตาม → เรียก API นี้
export async function generateMetadata(): Promise<Metadata> {
  const settingsResponse = await fetchWebsiteSettings();
  // ...
}
```

> [!CAUTION]
> **ทุก page navigation จะเรียก `fetchWebsiteSettings()` ใหม่** เพราะอยู่ใน root layout
> 300 users × เฉลี่ย 5 หน้า = **1,500 requests แค่จาก metadata ตัวเดียว**

**แก้ไข:** ใช้ `unstable_cache` หรือค่า static metadata
```typescript
import { unstable_cache } from 'next/cache';

const getCachedSettings = unstable_cache(
  async () => {
    const res = await fetchWebsiteSettings();
    return res?.data;
  },
  ['website-settings'],
  { revalidate: 300 } // cache 5 นาที
);

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedSettings();
  // ...
}
```

---

### 4. HomePage ใช้ `noStore()` — Bypass Cache ทุก Request

**ไฟล์**: [HomePage.tsx](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/features/Home/HomePage.tsx)

```typescript
// ❌ ปิด cache ทั้งหมด
export default async function HomePage() {
  noStore();
  const homeData = await fetchHomeData();
  // ...
}
```

> [!WARNING]
> `noStore()` ทำให้ Next.js ไม่ cache อะไรเลย — ทุก user ที่เข้าหน้าแรกจะยิง API ใหม่ทุกครั้ง
> แม้ว่า [page.tsx](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/page.tsx) จะตั้ง `revalidate = 60` แต่ `noStore()` จะ override ค่านี้

**แก้ไข:** ลบ `noStore()` ออก และใช้ ISR ที่ตั้งไว้แล้วใน [page.tsx](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/page.tsx) (`revalidate = 60`)

---

## 🟠 ปัญหาสำคัญ (High — ควรแก้เร็ว)

### 5. Sitemap ทำ N+1 Queries — ยิง API เป็นร้อยรอบ

**ไฟล์**: [sitemap.ts](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/sitemap.ts)

```typescript
// ❌ แต่ละ book → ยิง resolveBookId + fetchBookEpisodes = 2 calls/book
const bookRoutes = await Promise.all(books.map(async (book) => {
    // ... resolveBookId() ...
}));
const readRoutesRaw = await Promise.all(books.map(async (book) => {
    // ... resolveBookId() + fetchBookEpisodes() ...
}));
```

> [!WARNING]
> ถ้ามี 200 books → **400+ API calls ทุกครั้งที่สร้าง sitemap** พร้อมกัน
> Search engine bots จะเรียก sitemap บ่อย → flood BE

**แก้ไข:** เพิ่ม `revalidate` และใช้ batch API

---

### 6. React Query ไม่มี `retry` limit

**ไฟล์**: [providers.tsx](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/providers.tsx)

```typescript
// ❌ ไม่ได้ตั้ง retry → default = 3 retries + exponential backoff
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      // ไม่มี retry config!
    },
  },
})
```

> [!WARNING]
> Default React Query retry = 3 ครั้ง → เมื่อ BE timeout, 300 users × 3 retries = **900 requests ซ้ำ**
> พอ fail อีก → retry อีก → cascade failure

**แก้ไข:**
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,            // retry แค่ 1 ครั้ง
      retryDelay: 3000,     // รอ 3 วินาที
      gcTime: 5 * 60 * 1000,
    },
  },
})
```

---

### 7. ReactQueryDevtools โหลดใน Production

**ไฟล์**: [providers.tsx](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/providers.tsx#L33)

```typescript
// ❌ DevTools ถูก render ทุกครั้ง ไม่ว่า production หรือ dev
<ReactQueryDevtools initialIsOpen={false} />
```

**แก้ไข:** ลบออกหรือ wrap ด้วย env check
```typescript
{process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
```

---

## 🟡 ปัญหาปานกลาง (Medium — ควรพิจารณา)

### 8. โหลด Google Fonts 12 ตัว

**ไฟล์**: [layout.tsx](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/layout.tsx#L16-L99)

โหลด: Bai Jamjuree, Sarabun, Prompt, Kanit, IBM Plex Sans Thai, Mitr, Mali, Trirong, Maitree, Taviraj, Kodchasan, Chakra Petch

> [!IMPORTANT]
> แม้ใช้ `next/font/google` (ซึ่ง Next ดาวน์โหลดตอน build) แต่ 12 fonts ก็เพิ่ม payload ขนาดใหญ่ให้ initial page load → เพิ่ม TTFB

**แก้ไข:** ลดเหลือแค่ font ที่ใช้จริง (2-3 ตัว)

---

### 9. FingerprintJS โหลดทุกครั้ง (ครั้งแรกของ session)

**ไฟล์**: [deviceUtils.ts](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/utils/deviceUtils.ts)

FingerprintJS ต้อง load + compute fingerprint ทุก session ใหม่ ซึ่งเป็น heavy operation

**ข้อดี:** มี memory cache แล้ว → ไม่ซ้ำใน session เดียวกัน
**ข้อเสีย:** API call แรกจะช้ากว่าปกติ

---

### 10. `book/[id]/page.tsx` — ยิง API ซ้ำใน [generateMetadata](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/book/%5Bid%5D/page.tsx#21-58) + render

**ไฟล์**: [page.tsx](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/book/%5Bid%5D/page.tsx)

- [generateMetadata()](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/book/%5Bid%5D/page.tsx#21-58) เรียก `fetchBookDetail(id)`
- [BookDetailPage()](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/book/%5Bid%5D/page.tsx#59-82) อาจเรียก `resolveBookId(bookId)` อีก
- ทั้งสองทำงาน server-side แต่ไม่ได้ share cache

---

## 📊 สรุป — Traffic ที่ FE สร้างต่อ User Visit

| แหล่งที่มา | Requests ต่อ visit | หมายเหตุ |
|---|---|---|
| [generateMetadata](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/book/%5Bid%5D/page.tsx#21-58) (layout) | 1 | ทุกหน้า |
| [fetchHomeData](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/services/api/homeApi.ts#66-74) (noStore) | 1 | หน้าแรก |
| `fetchWebsiteSettings` (websiteStore) | 1 | mount ครั้งแรก |
| Socket.IO polling | 3-5 | ก่อน upgrade เป็น WS |
| Actual page data | 1-3 | แต่ละหน้า |
| React Query retries (on fail) | ×3 | ทุก query ที่ fail |
| **รวมต่อ user visit** | **~7-11** | — |
| **300 users peak** | **~2,100-3,300** | — |

> [!CAUTION]
> ตัวเลขนี้เป็น **ค่าต่ำสุด** — ยังไม่รวม user ที่เปิดหลายหน้า, socket reconnection, หรือ sitemap bots ที่ซ้อนเข้ามา

---

## 🛠 ลำดับการแก้ไข (Priority Order)

| # | Fix | ผลกระทบ | ความง่าย |
|---|---|---|---|
| 1 | เพิ่ม `timeout: 15000` ใน apiClient | ⭐⭐⭐⭐⭐ | ง่ายมาก |
| 2 | แก้ Socket: ลบ `forceNew`, ใช้ `websocket` only, ลด reconnect | ⭐⭐⭐⭐⭐ | ง่าย |
| 3 | Cache [generateMetadata](file:///c:/Users/cityz/Desktop/ejb/front-nextJs/src/app/book/%5Bid%5D/page.tsx#21-58) ใน layout | ⭐⭐⭐⭐⭐ | ง่าย |
| 4 | ลบ `noStore()` ใน HomePage | ⭐⭐⭐⭐ | ง่ายมาก |
| 5 | ตั้ง `retry: 1` ใน React Query | ⭐⭐⭐⭐ | ง่าย |
| 6 | ลบ ReactQueryDevtools ใน production | ⭐⭐⭐ | ง่ายมาก |
| 7 | แก้ sitemap ให้ใช้ revalidate + batch | ⭐⭐⭐ | ปานกลาง |
| 8 | ลดจำนวน Google Fonts | ⭐⭐ | ปานกลาง |
