# 📖 คู่มือการนำทางหน้าอ่านนิยาย (Reading Navigation Guide)

## ภาพรวม

ระบบนำทางอัตโนมัติสำหรับหน้าอ่านนิยาย ที่สามารถไปตอนก่อนหน้า/ตอนถัดไปได้

---

## 🎯 ฟีเจอร์

### ✅ ปุ่มนำทาง 3 ปุ่ม:

1. **ตอนก่อนหน้า** - ไปตอนก่อนหน้านี้
2. **สารบัญ** - กลับไปหน้ารายการตอน (Detail Page)
3. **ตอนถัดไป** - ไปตอนถัดไป

### ✅ Auto Disable:

- ปุ่ม "ตอนก่อนหน้า" จะ disabled เมื่ออยู่ตอนแรก
- ปุ่ม "ตอนถัดไป" จะ disabled เมื่ออยู่ตอนสุดท้าย

### ✅ Debug Mode:

- แสดงข้อมูล debug ใน development mode
- แสดง prev/next episode ID
- แสดงจำนวนตอนทั้งหมด

---

## 🔧 การทำงานของระบบ

### ขั้นตอน:

```
1. โหลดตอนปัจจุบัน
   ↓
   API: GET /readep/:episodeId
   ↓
   ได้ book_id

2. โหลดรายการตอนทั้งหมด
   ↓
   API: GET /bookgroup/:bookId
   ↓
   ได้ array ของตอนทั้งหมด

3. หาตำแหน่งปัจจุบัน
   ↓
   findIndex(ep => ep.epID === episodeId)
   ↓
   ได้ currentIndex

4. คำนวณ prev/next
   ↓
   prev = allEpisodes[currentIndex - 1]
   next = allEpisodes[currentIndex + 1]
   ↓
   set state

5. Enable/Disable ปุ่ม
   ↓
   disabled={!prevEpisode}
   disabled={!nextEpisode}
```

---

## 📝 Code Implementation

### 1. API Functions

```typescript
// ดึงเนื้อหาตอน
const fetchEpisodeContent = async (episodeId: string) => {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`/readep/${episodeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ดึงรายการตอนทั้งหมด
const fetchBookEpisodes = async (bookId: number | string) => {
  const response = await fetch(`/bookgroup/${bookId}`);
  const allEpisodes = [];

  // รวมตอนจากทุก group
  data.groups.forEach((group) => {
    allEpisodes.push(...group.list);
  });

  // เรียงตาม order_by
  return allEpisodes.sort((a, b) => a.order_by - b.order_by);
};
```

### 2. React Queries

```typescript
// Query สำหรับเนื้อหาตอน
const { data: episode } = useQuery({
  queryKey: ["episodeContent", episodeId],
  queryFn: () => fetchEpisodeContent(episodeId),
  staleTime: 10 * 60 * 1000,
});

// Query สำหรับรายการตอน
const { data: allEpisodes } = useQuery({
  queryKey: ["bookEpisodes", episode?.book_id],
  queryFn: () => fetchBookEpisodes(episode!.book_id),
  enabled: !!episode?.book_id,
  staleTime: 10 * 60 * 1000,
});
```

### 3. State Management

```typescript
const [prevEpisode, setPrevEpisode] = useState<string | null>(null);
const [nextEpisode, setNextEpisode] = useState<string | null>(null);

useEffect(() => {
  if (!allEpisodes || !episodeId) return;

  const currentIndex = allEpisodes.findIndex(
    (ep: any) => ep.epID === episodeId
  );

  if (currentIndex !== -1) {
    // Prev
    setPrevEpisode(
      currentIndex > 0 ? allEpisodes[currentIndex - 1].epID : null
    );

    // Next
    setNextEpisode(
      currentIndex < allEpisodes.length - 1
        ? allEpisodes[currentIndex + 1].epID
        : null
    );
  }
}, [allEpisodes, episodeId]);
```

### 4. Navigation Buttons

```tsx
<Button
  disabled={!prevEpisode}
  onClick={() => {
    if (prevEpisode) {
      router.push(`/read/${prevEpisode}`);
    }
  }}
>
  ตอนก่อนหน้า
</Button>

<Button
  type="primary"
  onClick={() => router.push(`/detail/${bookId}`)}
>
  สารบัญ
</Button>

<Button
  disabled={!nextEpisode}
  onClick={() => {
    if (nextEpisode) {
      router.push(`/read/${nextEpisode}`);
    }
  }}
>
  ตอนถัดไป
</Button>
```

---

## 🐛 Debug & Troubleshooting

### การตรวจสอบปัญหา:

#### 1. ปุ่มถูก disabled ตลอด

```typescript
// ตรวจสอบใน Console
console.log("Episode data:", episode);
console.log("Book ID:", episode?.book_id);
console.log("All episodes:", allEpisodes);
console.log("Current index:", currentIndex);
console.log("Prev:", prevEpisode);
console.log("Next:", nextEpisode);
```

**สาเหตุที่พบบ่อย:**

- ❌ `episode.book_id` เป็น `undefined` → API ไม่ส่งมา
- ❌ `allEpisodes` เป็น `undefined` → Query ไม่ทำงาน
- ❌ `currentIndex` เป็น `-1` → หา epID ไม่เจอ
- ❌ `epID` ไม่ตรงกัน → case-sensitive หรือ format ไม่ตรง

#### 2. คลิกแล้วไม่ไปหน้าถัดไป

```typescript
// ตรวจสอบการ navigate
onClick={() => {
  console.log("Navigating to:", nextEpisode);
  router.push(`/read/${nextEpisode}`);
}}
```

**สาเหตุที่พบบ่อย:**

- ❌ `nextEpisode` เป็น `null`
- ❌ Router ไม่ทำงาน
- ❌ URL format ผิด

#### 3. ข้อมูลไม่อัพเดท

```typescript
// ตรวจสอบ dependencies
useEffect(() => {
  // ...
}, [allEpisodes, episodeId]); // ต้องมี dependencies!
```

**สาเหตุที่พบบ่อย:**

- ❌ ขาด dependencies array
- ❌ Cache Query ยังไม่หมดอายุ
- ❌ State ไม่ update

---

## 🧪 การทดสอบ

### Test Case 1: ตอนแรก

```
✅ เปิดตอนแรกของหนังสือ
✅ ปุ่ม "ตอนก่อนหน้า" ควร disabled
✅ ปุ่ม "ตอนถัดไป" ควรใช้งานได้
✅ คลิก "ตอนถัดไป" → ไปตอนที่ 2
```

### Test Case 2: ตอนกลางๆ

```
✅ เปิดตอนกลางๆ (เช่น ตอนที่ 5)
✅ ปุ่มทั้ง 2 ควรใช้งานได้
✅ คลิก "ตอนก่อนหน้า" → ไปตอนที่ 4
✅ คลิก "ตอนถัดไป" → ไปตอนที่ 6
```

### Test Case 3: ตอนสุดท้าย

```
✅ เปิดตอนสุดท้ายของหนังสือ
✅ ปุ่ม "ตอนก่อนหน้า" ควรใช้งานได้
✅ ปุ่ม "ตอนถัดไป" ควร disabled
✅ คลิก "ตอนก่อนหน้า" → ไปตอนก่อนหน้า
```

### Test Case 4: หนังสือมีหลาย Group

```
✅ เปิดตอนสุดท้ายของ Group แรก
✅ ปุ่มทั้ง 2 ควรใช้งานได้
✅ คลิก "ตอนถัดไป" → ไปตอนแรกของ Group ถัดไป
```

### Test Case 5: กลับสู่สารบัญ

```
✅ คลิกปุ่ม "สารบัญ"
✅ ควรกลับไปหน้า /detail/:bookId
✅ ควรเห็นรายการตอนทั้งหมด
```

---

## 📊 Debug Mode (Development Only)

ใน development mode จะแสดงข้อมูล debug ที่ด้านล่างของปุ่มนำทาง:

```
Debug: Prev=EP2025xxx | Next=EP2025yyy | Episodes=50
```

แสดง:

- **Prev**: epID ของตอนก่อนหน้า (หรือ "none")
- **Next**: epID ของตอนถัดไป (หรือ "none")
- **Episodes**: จำนวนตอนทั้งหมด

---

## 💡 Console Logs (Development Mode)

เมื่อทำการนำทาง จะมี logs แสดง:

```javascript
// เมื่อ load หน้า
🔍 Finding navigation for episode: EP2025xxx
📚 Total episodes: 50
📍 Current index: 5
⬅️ Prev episode set: EP2025xxx
➡️ Next episode set: EP2025yyy

// เมื่อคลิกปุ่ม
🔙 Navigating to prev episode: EP2025xxx
// หรือ
🔜 Navigating to next episode: EP2025yyy
```

---

## ⚙️ Configuration

### เปลี่ยน Cache Time

```typescript
const { data: allEpisodes } = useQuery({
  queryKey: ["bookEpisodes", episode?.book_id],
  queryFn: () => fetchBookEpisodes(episode!.book_id),
  staleTime: 10 * 60 * 1000, // 10 นาที (ปรับได้)
});
```

### เพิ่ม Loading State

```typescript
const { data: allEpisodes, isLoading: isLoadingNav } = useQuery({
  // ...
});

<Button disabled={!nextEpisode || isLoadingNav}>
  {isLoadingNav ? "กำลังโหลด..." : "ตอนถัดไป"}
</Button>;
```

### เพิ่ม Error Handling

```typescript
const { data: allEpisodes, error: navError } = useQuery({
  // ...
});

if (navError) {
  console.error("Navigation error:", navError);
}
```

---

## 🚀 Future Enhancements

### 1. Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" && prevEpisode) {
      router.push(`/read/${prevEpisode}`);
    }
    if (e.key === "ArrowRight" && nextEpisode) {
      router.push(`/read/${nextEpisode}`);
    }
  };

  window.addEventListener("keydown", handleKeyboard);
  return () => window.removeEventListener("keydown", handleKeyboard);
}, [prevEpisode, nextEpisode]);
```

### 2. Auto-scroll to Top

```typescript
onClick={() => {
  if (nextEpisode) {
    router.push(`/read/${nextEpisode}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}}
```

### 3. Preload Next Episode

```typescript
useEffect(() => {
  if (nextEpisode) {
    router.prefetch(`/read/${nextEpisode}`);
  }
}, [nextEpisode]);
```

### 4. Progress Indicator

```tsx
<div className="text-center text-sm text-gray-500">
  ตอนที่ {currentIndex + 1} / {allEpisodes?.length}
</div>
```

### 5. Swipe Gestures (Mobile)

```typescript
// ใช้ library เช่น react-swipeable
const handlers = useSwipeable({
  onSwipedLeft: () => nextEpisode && router.push(`/read/${nextEpisode}`),
  onSwipedRight: () => prevEpisode && router.push(`/read/${prevEpisode}`),
});

<div {...handlers}>{/* content */}</div>;
```

---

## 📋 Checklist การตรวจสอบ

เมื่อเพิ่งติดตั้งระบบ ให้ตรวจสอบ:

- [ ] API `/readep/:episodeId` ส่ง `book_id` มา
- [ ] API `/bookgroup/:bookId` ส่ง `groups` array มา
- [ ] แต่ละ group มี `list` array
- [ ] แต่ละตอนมี `epID` และ `order_by`
- [ ] `fetchBookEpisodes` เรียงตามลำดับถูกต้อง
- [ ] State `prevEpisode` และ `nextEpisode` update ถูกต้อง
- [ ] ปุ่ม disabled/enabled ตามที่คาดหวัง
- [ ] คลิกปุ่มแล้ว navigate ได้
- [ ] URL ถูกต้อง: `/read/:episodeId`
- [ ] Console ไม่มี error
- [ ] Cache ทำงานถูกต้อง

---

## 🎓 สรุป

ระบบนำทางหน้าอ่านนิยายทำงานโดย:

1. ✅ ดึงข้อมูลตอนปัจจุบัน → ได้ book_id
2. ✅ ดึงรายการตอนทั้งหมด → ได้ array ของตอน
3. ✅ หาตำแหน่งปัจจุบัน → findIndex
4. ✅ คำนวณ prev/next → currentIndex ± 1
5. ✅ Enable/disable ปุ่ม → disabled={!prevEpisode}
6. ✅ Navigate → router.push(`/read/${episodeId}`)

**ผลลัพธ์**: ผู้ใช้สามารถอ่านนิยายต่อเนื่องได้โดยไม่ต้องกลับไปสารบัญ! 📖✨

---

**หมายเหตุ**:

- Console logs จะทำงานใน development mode เท่านั้น
- ใน production mode, console จะถูก disable เพื่อความปลอดภัย
- Debug info จะแสดงใน development mode เท่านั้น
