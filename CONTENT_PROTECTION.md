# 🔒 ระบบป้องกันเนื้อหา (Content Protection System)

## ภาพรวม

ระบบป้องกันเนื้อหาแบบหลายชั้น (Multi-Layer Protection) สำหรับป้องกันการคัดลอกและขโมยเนื้อหาจากหน้าอ่านนิยาย

---

## 🛡️ ระดับการป้องกัน (Protection Layers)

### ✅ Layer 1: Basic UI Protection

**ที่ใช้งาน**: `src/app/read/[episodeId]/page.tsx`

```typescript
- user-select: none (ทุก browser)
- onCopy/onCut/onContextMenu preventDefault
- Disable right-click menu
```

**ป้องกัน**:

- ❌ การเลือกข้อความด้วยเมาส์
- ❌ Ctrl+C / Cmd+C
- ❌ Ctrl+X / Cmd+X
- ❌ คลิกขวาคัดลอก

---

### ✅ Layer 2: Keyboard Shortcuts Protection

**ที่ใช้งาน**: `src/app/read/[episodeId]/page.tsx` - `useEffect` hook

```typescript
// ป้องกันการเปิด DevTools
- F12
- Ctrl+Shift+I / Cmd+Option+I (Inspect)
- Ctrl+Shift+J / Cmd+Option+J (Console)
- Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
- Ctrl+U / Cmd+U (View Source)
- Ctrl+S / Cmd+S (Save Page)

// ป้องกันการเลือกและคัดลอก
- Ctrl+A / Cmd+A (Select All)
- Ctrl+C / Cmd+C (Copy)
- Ctrl+X / Cmd+X (Cut)
```

**ป้องกัน**:

- ❌ เปิด Developer Tools ด้วย keyboard shortcuts
- ❌ View Page Source
- ❌ บันทึกหน้าเว็บ
- ❌ Select All และคัดลอก

---

### ✅ Layer 3: DevTools Detection

**ที่ใช้งาน**: `src/app/read/[episodeId]/page.tsx` - `detectDevTools()`

```typescript
// ตรวจจับการเปิด DevTools จากขนาดหน้าต่าง
const widthThreshold = window.outerWidth - window.innerWidth > 160;
const heightThreshold = window.outerHeight - window.innerHeight > 160;
```

**การทำงาน**:

- 🔍 ตรวจสอบทุก 1 วินาที
- 🚫 ถ้าตรวจพบจะแสดงข้อความเตือน: "⚠️ กรุณาปิด Developer Tools"
- 🔄 ซ่อนเนื้อหาทั้งหมดจนกว่าจะปิด DevTools

**ป้องกัน**:

- ❌ การเปิด DevTools แล้วใช้งาน
- ❌ Inspect Element
- ❌ Console Tab

---

### ✅ Layer 4: Console Methods Override & Iframe Blocking

**ที่ใช้งาน**: `src/app/read/[episodeId]/page.tsx` - `protectContent()`

```typescript
// Override console methods
window.console.log = noop;
window.console.info = noop;
window.console.warn = noop;
window.console.error = noop;
window.console.debug = noop;

// 🔥 Block iframe creation (prevent console bypass)
document.createElement = function(tagName: string) {
  if (tagName.toLowerCase() === 'iframe') {
    throw new Error('iframe creation is not allowed');
  }
  return originalCreateElement(tagName);
};

// Block iframe insertion via appendChild/insertBefore
Node.prototype.appendChild = function(child: any) {
  if (child?.tagName === 'IFRAME') {
    throw new Error('iframe insertion is not allowed');
  }
  return originalAppendChild.call(this, child);
};

// Monitor DOM for iframe injection
MutationObserver → remove any iframe detected
```

**ป้องกัน**:

- ❌ `console.log(element.innerText)` → ไม่แสดงผล
- ❌ การใช้ console เพื่อ debug และดึงข้อความ
- ❌ **iframe console bypass**:
  ```javascript
  // วิธีนี้ใช้ไม่ได้แล้ว!
  var iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const realLog = iframe.contentWindow.console.log;
  ```
- ❌ `document.createElement('iframe')` → throw Error
- ❌ `document.body.appendChild(iframe)` → throw Error
- ❌ การแทรก iframe ผ่าน innerHTML
- ❌ MutationObserver จะลบ iframe ทันทีที่ตรวจพบ

---

### 🔥 Layer 5: DOM Properties Protection (Advanced)

**ที่ใช้งาน**: `src/components/ProtectedContent.tsx`

```typescript
// Override getters ของ DOM properties
Object.defineProperty(element, "innerText", {
  get: () => "🔒",
  configurable: false,
});

Object.defineProperty(element, "textContent", {
  get: () => "🔒",
  configurable: false,
});

Object.defineProperty(element, "innerHTML", {
  get: () => "🔒 Protected Content",
  configurable: false,
});
```

**ป้องกัน**:

- ❌ `element.innerText` → ได้แค่ "🔒"
- ❌ `element.textContent` → ได้แค่ "🔒"
- ❌ `element.innerHTML` → ได้แค่ "🔒 Protected Content"
- ❌ `$0.innerText` ใน Console
- ❌ `document.body.innerText`

---

### 🔥 Layer 6: DOM Methods Protection

**ที่ใช้งาน**: `src/components/ProtectedContent.tsx`

```typescript
// Override DOM query methods
container.querySelector = function () {
  return null;
};
container.querySelectorAll = function () {
  return [];
};
```

**ป้องกัน**:

- ❌ `querySelector('.episode-content')`
- ❌ `querySelectorAll('p')`
- ❌ การใช้ DOM API เพื่อค้นหา elements

---

### 🔥 Layer 7: CSS-Based Content Rendering

**ที่ใช้งาน**: `src/components/ProtectedContent.tsx` + `src/app/globals.css`

**การทำงาน**:

```typescript
// แบ่งข้อความออกเป็นคำ
<span class="protected-word" data-content="สวัสดี"></span>

// แสดงผลด้วย CSS ::before
.protected-word::before {
  content: attr(data-content);
}
```

**CSS**:

```css
.protected-word {
  font-size: 0; /* ซ่อนตัวอักษรจริง */
  line-height: 0;
}

.protected-word::before {
  font-size: 1rem; /* แสดงผลด้วย CSS */
  content: attr(data-content);
}
```

**ป้องกัน**:

- ❌ ตัวอักษรจริงถูกซ่อนไว้ (font-size: 0)
- ❌ ที่เห็นเป็น CSS-generated content
- ❌ innerText จะได้ค่าว่างเปล่าหรือ whitespace
- ✅ แต่ยังเห็นและอ่านได้ปกติ

---

## 📋 สรุปการป้องกัน

| วิธีการโจมตี                     | Layer ที่ป้องกัน | สถานะ            |
| -------------------------------- | ---------------- | ---------------- |
| คลิกขวา → Copy                   | Layer 1          | ✅ ป้องกันได้    |
| Ctrl+C / Cmd+C                   | Layer 1, 2       | ✅ ป้องกันได้    |
| Select All → Copy                | Layer 1, 2       | ✅ ป้องกันได้    |
| F12 → Inspect                    | Layer 2, 3       | ✅ ป้องกันได้    |
| View Page Source                 | Layer 2          | ✅ ป้องกันได้    |
| console.log(element.innerText)   | Layer 4, 5       | ✅ ป้องกันได้    |
| iframe console bypass            | Layer 4          | ✅ ป้องกันได้    |
| document.createElement('iframe') | Layer 4          | ✅ ป้องกันได้    |
| $0.textContent                   | Layer 5          | ✅ ป้องกันได้    |
| querySelector + innerText        | Layer 5, 6       | ✅ ป้องกันได้    |
| CSS Generated Content            | Layer 7          | ✅ ป้องกันได้    |
| Screenshot                       | -                | ⚠️ ป้องกันยาก    |
| OCR (อ่านจากภาพ)                 | -                | ❌ ป้องกันไม่ได้ |

---

## 🚀 การใช้งาน

### 1. หน้าอ่านตอน (`src/app/read/[episodeId]/page.tsx`)

```tsx
import ProtectedContent from "@/components/ProtectedContent";

// ใช้ ProtectedContent แทน parse()
<ProtectedContent content={episode.des} className="episode-content" />;
```

### 2. CSS Styles (`src/app/globals.css`)

- `.episode-content` - styles สำหรับเนื้อหา
- `.protected-content-wrapper` - wrapper ป้องกัน
- `.protected-word` - แต่ละคำที่ถูกป้องกัน

---

## ⚠️ ข้อจำกัด

### สิ่งที่ป้องกันได้:

✅ การคัดลอกด้วย UI/Keyboard  
✅ การใช้ DevTools แบบปกติ  
✅ การใช้ Console API  
✅ การใช้ DOM API เพื่อดึงข้อความ

### สิ่งที่ป้องกันยาก:

⚠️ Screenshot (จับภาพหน้าจอ)  
⚠️ การถ่ายภาพด้วยโทรศัพท์  
⚠️ การเปิด DevTools ก่อนโหลดหน้า  
❌ OCR (อ่านข้อความจากรูปภาพ)  
❌ Network Tab (ดูข้อมูลจาก API Response)

---

## 🔧 การแก้ไขปัญหา

### ถ้า Console ยังใช้ได้

```typescript
// ตรวจสอบว่า useEffect ทำงานหรือยัง
console.log("Protection loaded:", typeof window.console.log);
```

### ถ้าลอง bypass ด้วย iframe

```javascript
// ลองทดสอบการป้องกัน iframe
var iframe = document.createElement("iframe"); // ควร throw Error
document.body.appendChild(iframe); // ควร throw Error
// Output: Error: iframe creation is not allowed
```

### ถ้า innerText ยังดึงได้

```typescript
// ตรวจสอบว่า ProtectedContent render แล้วหรือยัง
document.querySelector(".protected-word")?.getAttribute("data-content");
// หรือลองดู element ใน Console
// innerText ควรได้ "🔒" แทนข้อความจริง
```

### ถ้า DevTools เปิดได้

```typescript
// ตรวจสอบ interval ทำงานหรือไม่
// ลอง refresh หน้าใหม่หลังปิด DevTools
// หรือตรวจสอบว่า window size detection ทำงานหรือไม่
```

---

## 💡 คำแนะนำเพิ่มเติม

1. **Server-Side Protection**: พิจารณาเพิ่มการตรวจสอบ token/session ที่ backend
2. **Watermark**: เพิ่ม user ID หรือ session watermark แบบโปร่งใส
3. **Rate Limiting**: จำกัดจำนวนตอนที่อ่านได้ต่อชั่วโมง
4. **DRM**: พิจารณาใช้ Digital Rights Management สำหรับเนื้อหาพรีเมียม
5. **Legal**: ระบุข้อความ copyright และเงื่อนไขการใช้งานอย่างชัดเจน

---

## 📝 บันทึกการอัพเดท

### Version 1.1 (2025-11-03 - Evening Update)

- ✅ **เพิ่มการป้องกัน iframe console bypass**
- ✅ Block `document.createElement('iframe')`
- ✅ Block `appendChild/insertBefore` สำหรับ iframe
- ✅ MutationObserver สำหรับตรวจจับ iframe injection
- ✅ ป้องกันเทคนิค: `iframe.contentWindow.console.log`

### Version 1.0 (2025-11-03 - Initial Release)

- ✅ เพิ่ม Layer 1-7 ครบถ้วน
- ✅ สร้าง ProtectedContent component
- ✅ Override DOM properties และ methods
- ✅ CSS-based content rendering
- ✅ DevTools detection

---

**หมายเหตุ**: ระบบนี้ช่วยลดความเสี่ยงการคัดลอกได้มาก แต่ไม่มีระบบใดที่ป้องกันได้ 100% หากผู้ใช้มีความมุ่งมั่นสูงมาก
