# 🔄 Group-Aware Navigation Fix

## ปัญหาที่พบ

เมื่อตอนถูกแบ่งเป็น **groups** (เล่มๆ) การนำทางระหว่างตอนอาจมีปัญหา:

### ตัวอย่างโครงสร้างข้อมูล:

```json
{
  "groups": [
    {
      "group_id": 1,
      "name": "เล่ม 1",
      "list": [
        { "ep_id": 1, "epID": "EP001", "order_by": 1 },
        { "ep_id": 2, "epID": "EP002", "order_by": 2 }
      ]
    },
    {
      "group_id": 2,
      "name": "เล่ม 2",
      "list": [
        { "ep_id": 3, "epID": "EP003", "order_by": 1 }, // ⚠️ order_by ซ้ำกับเล่ม 1!
        { "ep_id": 4, "epID": "EP004", "order_by": 2 }
      ]
    }
  ]
}
```

### ⚠️ ปัญหา:

1. **order_by ซ้ำกันระหว่าง groups** → การเรียงลำดับผิด
2. **ไม่รู้ว่าตอนอยู่ group ไหน** → ไม่สามารถแสดงข้อมูล group
3. **การนำทางข้าม group** → อาจไม่ทำงานถูกต้อง

---

## ✅ วิธีแก้ไข

### 1. เพิ่มข้อมูล Group ให้แต่ละตอน

```typescript
const fetchBookEpisodes = async (bookId: number | string) => {
  // ...

  if (data.code === 200 && data.data?.groups) {
    const allEpisodes: any[] = [];

    // เรียง groups ก่อน
    const sortedGroups = [...data.data.groups].sort(
      (a, b) => (a.group_id || 0) - (b.group_id || 0)
    );

    sortedGroups.forEach((group: any, groupIndex: number) => {
      if (group.list && Array.isArray(group.list)) {
        // ✨ เพิ่มข้อมูล group ให้แต่ละตอน
        const episodesWithGroupInfo = group.list.map((ep: any) => ({
          ...ep,
          _groupId: group.group_id, // เก็บ group ID
          _groupIndex: groupIndex, // เก็บลำดับ group
          _groupName: group.name, // เก็บชื่อ group
        }));
        allEpisodes.push(...episodesWithGroupInfo);
      }
    });

    // เรียงตาม: groupIndex ก่อน, แล้วค่อย order_by
    return allEpisodes.sort((a, b) => {
      if (a._groupIndex !== b._groupIndex) {
        return a._groupIndex - b._groupIndex; // เรียง group ก่อน
      }
      return (a.order_by || 0) - (b.order_by || 0); // แล้วค่อยเรียงในกลุ่ม
    });
  }

  return [];
};
```

### 2. แสดงข้อมูล Group ใน Console Logs

```typescript
console.log("📖 Current episode:", {
  name: currentEp.name,
  epID: currentEp.epID,
  group: currentEp._groupName, // ✨ แสดงชื่อ group
  groupIndex: currentEp._groupIndex, // ✨ แสดงลำดับ group
  order: currentEp.order_by,
});

console.log("⬅️ Prev episode:", {
  epID: prevEp.epID,
  name: prevEp.name,
  group: prevEp._groupName,
  sameGroup: prevEp._groupIndex === currentEp._groupIndex, // ✨ เช็คว่าอยู่ group เดียวกันไหม
});
```

### 3. Debug UI แสดงชื่อ Group

```tsx
{
  process.env.NODE_ENV === "development" && allEpisodes && (
    <div className="text-xs text-gray-500 mb-2 text-center space-y-1">
      <div>
        Debug: Prev={prevEpisode || "none"} | Next={nextEpisode || "none"} |
        Total={allEpisodes?.length || 0}
      </div>
      {(() => {
        const currentIndex = allEpisodes.findIndex(
          (ep: any) => ep.epID === episodeId
        );
        if (currentIndex !== -1) {
          const current = allEpisodes[currentIndex];
          const prev = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
          const next =
            currentIndex < allEpisodes.length - 1
              ? allEpisodes[currentIndex + 1]
              : null;
          return (
            <div className="text-[10px]">
              {/* ✨ แสดงชื่อ group ของแต่ละตอน */}
              {prev && `⬅️ ${prev._groupName || "Group ?"}`} | Current: {current._groupName ||
                "Group ?"} |{next && `${next._groupName || "Group ?"} ➡️`}
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
```

---

## 🎯 ผลลัพธ์

### ก่อนแก้ไข:

```
❌ order_by ซ้ำกัน → การเรียงผิด
❌ ไม่รู้ว่าตอนอยู่ group ไหน
❌ ไม่แน่ใจว่านำทางข้าม group ได้
```

### หลังแก้ไข:

```
✅ เรียงตาม groupIndex แล้วค่อย order_by
✅ แต่ละตอนมีข้อมูล _groupId, _groupIndex, _groupName
✅ นำทางข้าม group ได้อย่างถูกต้อง
✅ แสดงชื่อ group ใน console และ debug UI
```

---

## 📊 ตัวอย่างการทำงาน

### ตัวอย่างข้อมูล:

```javascript
// Group 1: เล่ม 1
EP001 (order_by: 1, _groupIndex: 0)
EP002 (order_by: 2, _groupIndex: 0)
EP003 (order_by: 3, _groupIndex: 0)

// Group 2: เล่ม 2
EP004 (order_by: 1, _groupIndex: 1)  // ⚠️ order_by เริ่มใหม่
EP005 (order_by: 2, _groupIndex: 1)
EP006 (order_by: 3, _groupIndex: 1)

// Group 3: เล่ม 3
EP007 (order_by: 1, _groupIndex: 2)
EP008 (order_by: 2, _groupIndex: 2)
```

### การเรียงลำดับ:

```javascript
// ❌ ถ้าเรียงแค่ order_by (ผิด)
[EP001, EP004, EP007, EP002, EP005, EP008, EP003, EP006][
  // ✅ เรียงตาม groupIndex แล้วค่อย order_by (ถูก)
  (EP001, EP002, EP003, EP004, EP005, EP006, EP007, EP008)
];
```

### การนำทาง:

```
อยู่ที่: EP003 (ตอนสุดท้ายของเล่ม 1)
↓
คลิก "ตอนถัดไป"
↓
ไปที่: EP004 (ตอนแรกของเล่ม 2) ✅
```

---

## 🐛 Console Logs ที่จะเห็น

### เมื่อโหลดหน้า:

```javascript
🔍 Finding navigation for episode: EP003
📚 Total episodes: 8

📍 Current index: 2

📖 Current episode: {
  name: "ตอนที่ 3",
  epID: "EP003",
  group: "เล่ม 1",          // ✨ แสดงชื่อ group
  groupIndex: 0,
  order: 3
}

⬅️ Prev episode: {
  epID: "EP002",
  name: "ตอนที่ 2",
  group: "เล่ม 1",
  sameGroup: true           // ✨ อยู่ group เดียวกัน
}

➡️ Next episode: {
  epID: "EP004",
  name: "ตอนที่ 4",
  group: "เล่ม 2",          // ✨ ข้ามไป group ใหม่!
  sameGroup: false          // ✨ ต่างกัน
}
```

### Debug UI จะแสดง:

```
Debug: Prev=EP002 | Next=EP004 | Total=8
⬅️ เล่ม 1 | Current: เล่ม 1 | เล่ม 2 ➡️
```

---

## 🧪 การทดสอบ

### Test Case 1: นำทางภายใน Group เดียวกัน

```
✅ อยู่ที่ EP001 (เล่ม 1)
✅ คลิก "ตอนถัดไป" → ไป EP002 (เล่ม 1)
✅ Console แสดง: sameGroup: true
```

### Test Case 2: นำทางข้าม Group

```
✅ อยู่ที่ EP003 (เล่ม 1 - ตอนสุดท้าย)
✅ คลิก "ตอนถัดไป" → ไป EP004 (เล่ม 2 - ตอนแรก)
✅ Console แสดง: sameGroup: false
✅ Debug UI แสดง: เล่ม 1 → เล่ม 2
```

### Test Case 3: ตอนแรกของ Group แรก

```
✅ อยู่ที่ EP001 (เล่ม 1 - ตอนแรก)
✅ ปุ่ม "ตอนก่อนหน้า" disabled
✅ Console แสดง: "No prev episode (first episode)"
```

### Test Case 4: ตอนสุดท้ายของ Group สุดท้าย

```
✅ อยู่ที่ EP008 (เล่ม 3 - ตอนสุดท้าย)
✅ ปุ่ม "ตอนถัดไป" disabled
✅ Console แสดง: "No next episode (last episode)"
```

### Test Case 5: หลาย Group ที่มี order_by ซ้ำกัน

```
✅ เล่ม 1: EP001(order:1), EP002(order:2)
✅ เล่ม 2: EP003(order:1), EP004(order:2)  // ⚠️ order ซ้ำ!
✅ เรียงได้ถูก: [EP001, EP002, EP003, EP004]
✅ ไม่สับสน: [EP001, EP003, EP002, EP004] ❌
```

---

## 🔍 วิธีตรวจสอบปัญหา

### 1. เช็คว่า Groups มีลำดับถูกต้องไหม

```javascript
// ใน Console
const groups = data.data.groups;
console.log(
  "Groups order:",
  groups.map((g) => ({
    id: g.group_id,
    name: g.name,
    episodes: g.list.length,
  }))
);
```

### 2. เช็คว่าตอนถูกเรียงถูกต้องไหม

```javascript
// ใน Console
console.log(
  "Episodes order:",
  allEpisodes.map((ep, i) => ({
    index: i,
    epID: ep.epID,
    group: ep._groupName,
    groupIndex: ep._groupIndex,
    order: ep.order_by,
  }))
);
```

### 3. เช็คว่าการนำทางข้าม Group ทำงานไหม

```javascript
// หาตอนสุดท้ายของแต่ละ group
allEpisodes.forEach((ep, i) => {
  const next = allEpisodes[i + 1];
  if (next && ep._groupIndex !== next._groupIndex) {
    console.log("🔀 Cross-group navigation:", {
      from: { epID: ep.epID, group: ep._groupName },
      to: { epID: next.epID, group: next._groupName },
    });
  }
});
```

---

## 💡 เพิ่มเติม: แสดงชื่อ Group บนหน้าอ่าน

ถ้าต้องการแสดงชื่อ group บนหน้าอ่าน:

```tsx
{
  /* Episode Info */
}
<div className="text-center">
  {/* ✨ แสดงชื่อ group */}
  {allEpisodes &&
    (() => {
      const currentIndex = allEpisodes.findIndex(
        (ep: any) => ep.epID === episodeId
      );
      if (currentIndex !== -1) {
        const current = allEpisodes[currentIndex];
        return (
          <p className="text-xs text-gray-500 mb-2">📚 {current._groupName}</p>
        );
      }
      return null;
    })()}

  <h1 className="text-xl sm:text-2xl font-bold mb-1">
    {episode?.name || "กำลังโหลด..."}
  </h1>
</div>;
```

---

## 📝 สรุป

### การแก้ไขหลัก:

1. ✅ เพิ่ม `_groupId`, `_groupIndex`, `_groupName` ให้แต่ละตอน
2. ✅ เรียงตาม `groupIndex` ก่อน แล้วค่อย `order_by`
3. ✅ แสดงข้อมูล group ใน console logs
4. ✅ แสดงชื่อ group ใน debug UI

### ผลลัพธ์:

- ✅ การนำทางข้าม group ทำงานถูกต้อง
- ✅ ลำดับตอนถูกต้องแม้ order_by จะซ้ำกัน
- ✅ รู้ว่าตอนไหนอยู่ group ไหน
- ✅ Debug ง่ายขึ้นด้วย console logs ที่ละเอียด

---

**หมายเหตุ**: หาก backend ส่ง groups ที่ไม่มี `group_id` หรือไม่เรียงลำดับ อาจต้องปรับเพิ่มเติม
