# 🧪 การทดสอบระบบป้องกัน (Protection Testing Guide)

## เทคนิคการโจมตีที่ได้รับการป้องกัน

### ❌ 1. Basic Copy/Paste

```javascript
// พยายามคัดลอกด้วย Ctrl+C
// → preventDefault() จะบลอก

// พยายามคัดลอกด้วย right-click
// → contextmenu prevented

// ลองเลือกข้อความ
// → user-select: none
```

---

### ❌ 2. Console.log Basic

```javascript
// ลองใช้ console.log ปกติ
console.log("test");
// → ไม่แสดงผลอะไร (console.log ถูก override เป็น noop)
```

---

### ❌ 3. DOM API Basic

```javascript
// ลองดึงข้อความด้วย innerText
var x = document.querySelector(".episode-content");
console.log(x.innerText);
// → ได้ "🔒" (ถูก override แล้ว)

// ลอง textContent
console.log(x.textContent);
// → ได้ "🔒" (ถูก override แล้ว)

// ลอง innerHTML
console.log(x.innerHTML);
// → ได้ "🔒 Protected Content" (ถูก override แล้ว)
```

---

### ❌ 4. Iframe Console Bypass (ADVANCED - ป้องกันแล้ว!)

```javascript
// เทคนิคที่เคยใช้งานได้ แต่ตอนนี้ใช้ไม่ได้แล้ว

// ขั้นตอน 1: สร้าง iframe
var iframe = document.createElement("iframe");
// ❌ Error: iframe creation is not allowed

// ขั้นตอน 2: แทรก iframe เข้า DOM
document.body.appendChild(iframe);
// ❌ Error: iframe insertion is not allowed

// ขั้นตอน 3: ใช้ console จาก iframe context
const realLog = iframe.contentWindow.console.log.bind(console);
// ❌ ไม่ได้ผลเพราะ iframe ถูกบลอกตั้งแต่ step 1

// ขั้นตอน 4: พยายามดึงข้อความ
var x = document.querySelector(".prose");
realLog(x.innerText);
// ❌ ทำไม่ได้เพราะไม่สามารถสร้าง iframe ได้
```

**การทำงานของการป้องกัน:**

1. `document.createElement('iframe')` → throw Error
2. `appendChild(iframe)` → throw Error
3. `insertBefore(iframe)` → throw Error
4. MutationObserver จะลบ iframe ทันทีที่ตรวจพบ

---

### ❌ 5. DevTools Inspection

```javascript
// กด F12 → preventDefault
// กด Ctrl+Shift+I → preventDefault
// กด Ctrl+Shift+C → preventDefault

// ถ้าเปิด DevTools ได้ (เปิดก่อนโหลดหน้า)
// → detectDevTools() จะซ่อนเนื้อหาทั้งหมด
// → แสดงข้อความ: "⚠️ กรุณาปิด Developer Tools"
```

---

### ❌ 6. View Source & Save Page

```javascript
// กด Ctrl+U (View Source) → preventDefault
// กด Ctrl+S (Save Page) → preventDefault
```

---

### ❌ 7. querySelector + Properties

```javascript
// ลองใช้ querySelector ธรรมดา
document.querySelector(".episode-content");
// → ได้ element

// แต่พอเรียก properties
var el = document.querySelector(".episode-content");
el.innerText; // → "🔒"
el.textContent; // → "🔒"
el.innerHTML; // → "🔒 Protected Content"
```

---

### ❌ 8. Protected Content Component

```javascript
// ลองดู protected words
var words = document.querySelectorAll(".protected-word");
words[0].innerText; // → "" (empty) เพราะ font-size: 0
words[0].textContent; // → "" (empty)

// แต่มองเห็นได้ปกติเพราะใช้ CSS ::before
// content: attr(data-content)
```

---

## ⚠️ วิธีที่ยังสามารถทำได้ (ข้อจำกัดของระบบ)

### 1. Screenshot / Screen Recording

```
กด Print Screen หรือใช้ Snipping Tool
→ สามารถทำได้ (ป้องกันยาก)
→ แต่ได้เป็นรูปภาพ ไม่ใช่ข้อความที่คัดลอกได้
```

**วิธีลด**:

- เพิ่ม watermark (user ID โปร่งใส)
- เพิ่มข้อความ copyright ซ้อนทับ
- จำกัดจำนวนหน้าที่เปิดได้พร้อมกัน

---

### 2. Network Tab (API Response)

```javascript
// เปิด DevTools → Network Tab → ดู API response
// → เห็น HTML content จาก /readep/:episodeId
```

**วิธีแก้**:

```typescript
// Backend: Encrypt content before sending
{
  des: encrypt(originalContent, userToken);
}

// Frontend: Decrypt before rendering
const decryptedContent = decrypt(response.des, userToken);
```

---

### 3. เปิด DevTools ก่อนโหลดหน้า

```
1. เปิด DevTools ก่อน (F12)
2. Navigate ไปหน้าอ่าน
3. DevTools จะเปิดอยู่แล้ว
→ สามารถใช้งาน Console ได้ชั่วคราว
→ แต่ detectDevTools() จะตรวจพบและซ่อนเนื้อหา
```

---

### 4. OCR (Optical Character Recognition)

```
1. Screenshot หน้าจอ
2. ใช้ OCR software อ่านข้อความจากรูป
→ ได้ข้อความออกมา (ป้องกันไม่ได้)
```

**วิธีลด**:

- เพิ่ม watermark ซ้อนทับข้อความ
- ใช้ font ที่ OCR อ่านยาก
- เพิ่ม background noise/pattern

---

## ✅ สรุปประสิทธิภาพการป้องกัน

| ระดับผู้โจมตี   | วิธีการ                    | ป้องกันได้หรือไม่                  |
| --------------- | -------------------------- | ---------------------------------- |
| 🟢 Beginner     | Copy/Paste, Right-click    | ✅ ป้องกันได้ 100%                 |
| 🟢 Beginner     | Keyboard shortcuts         | ✅ ป้องกันได้ 100%                 |
| 🟡 Intermediate | F12 → Console → innerText  | ✅ ป้องกันได้ 100%                 |
| 🟡 Intermediate | querySelector + innerText  | ✅ ป้องกันได้ 100%                 |
| 🟠 Advanced     | iframe console bypass      | ✅ ป้องกันได้ 100%                 |
| 🔴 Expert       | Network Tab → API response | ⚠️ ป้องกันยาก (ต้อง encrypt)       |
| 🔴 Expert       | Screenshot → OCR           | ❌ ป้องกันไม่ได้ (ลดความเสี่ยงได้) |

---

## 🔬 วิธีทดสอบระบบป้องกัน

### Test 1: ทดสอบ Console Override

```javascript
// ลองใช้ console.log
console.log("test");
// Expected: ไม่มีอะไรแสดงใน Console
```

### Test 2: ทดสอบ innerText Protection

```javascript
var x = document.querySelector(".episode-content");
x.innerText;
// Expected: "🔒" หรือ "⚠️ เนื้อหาได้รับการปกป้อง"
```

### Test 3: ทดสอบ iframe Blocking

```javascript
try {
  var iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
} catch (e) {
  console.error(e.message);
}
// Expected: Error: iframe creation is not allowed
```

### Test 4: ทดสอบ Protected Content

```javascript
var words = document.querySelectorAll(".protected-word");
words[0].innerText;
// Expected: "" (empty string)

words[0].getAttribute("data-content");
// Expected: ข้อความจริง (แต่ใช้ไม่ได้เพราะ console.log ถูก override)
```

### Test 5: ทดสอบ DevTools Detection

```
1. เปิดหน้าอ่าน
2. กด F12
3. Expected: DevTools ไม่เปิด (preventDefault)

4. เปิด DevTools ก่อนโหลดหน้า
5. Expected: หลัง ~1 วินาที จะเห็นข้อความ "⚠️ กรุณาปิด Developer Tools"
```

---

## 💡 คำแนะนำสำหรับ Developers

### การทดสอบระบบป้องกัน (ในระหว่างพัฒนา)

หากต้องการ disable การป้องกันเพื่อ debug:

```typescript
// ใน src/app/read/[episodeId]/page.tsx

// Comment out useEffect ที่มีการป้องกัน
useEffect(() => {
  // ... protection code
}, [episode]);
```

หรือเพิ่ม environment variable:

```typescript
const DISABLE_PROTECTION =
  process.env.NEXT_PUBLIC_DISABLE_PROTECTION === "true";

useEffect(() => {
  if (DISABLE_PROTECTION) return; // Skip protection in dev mode

  // ... protection code
}, [episode]);
```

### การ Log ข้อมูลในระหว่างพัฒนา

ใช้ `console.warn` หรือ `console.error` แทน `console.log`:

```typescript
// ใน protectContent()
const noop = () => {};
(window as any).console.log = noop;
// console.warn และ console.error ยังใช้ได้อยู่
```

---

## 📊 Performance Impact

การป้องกันนี้มีผลกระทบต่อ performance:

| การป้องกัน                 | Performance Impact | ความคิดเห็น           |
| -------------------------- | ------------------ | --------------------- |
| user-select: none          | 🟢 ไม่มี           | CSS only              |
| preventDefault events      | 🟢 น้อยมาก         | Event listeners       |
| DevTools detection         | 🟡 ปานกลาง         | setInterval 1s        |
| Console override           | 🟢 น้อยมาก         | Run once              |
| DOM Properties override    | 🟢 น้อยมาก         | Run once per element  |
| iframe blocking            | 🟢 น้อยมาก         | Override methods      |
| MutationObserver           | 🟡 ปานกลาง         | Continuous monitoring |
| ProtectedContent component | 🟠 ปานกลาง-สูง     | Parse และแบ่ง DOM     |

**โดยรวม**: Performance impact ต่ำ-ปานกลาง, ยอมรับได้สำหรับระดับการป้องกันที่ได้

---

**หมายเหตุ**: ไฟล์นี้เป็นเอกสารสำหรับทีมพัฒนาเท่านั้น ไม่ควร commit ไปยัง public repository
