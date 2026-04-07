# เอกสารการใช้งาน Obfuscation ของ `GET /readep/:ep_id`

เอกสารนี้อธิบาย response จริงของ endpoint อ่านตอน, field ที่ frontend ต้องใช้, และตัวอย่าง Next.js ที่เอาไปใช้ render หน้าอ่านได้เลย

## สรุปสั้นที่สุด

- `GET /readep/:ep_id` ส่งเนื้อหาใน `data.des`
- `data.des` เป็น HTML string ที่ **ถูก obfuscate แล้ว**
- frontend ต้อง render `data.des` เป็น HTML และต้องใช้ `font-family` จาก `data.readerConfig.fonts[].fontFamily`
- frontend ต้องโหลด stylesheet จาก `data.readerConfig.cssUrl`
- ถ้า render `data.des` ด้วยฟอนต์ปกติ ข้อความจะกลายเป็นตัวอักษรอ่านไม่ออก

## หลักการทำงาน

ระบบนี้ไม่ได้ส่งข้อความไทยจริงใน DOM แต่ใช้วิธี:

1. แปลง text content ใน HTML ไปเป็น codepoint ชุดใหม่
2. ส่ง HTML ที่ยังมี tag เดิมอยู่ เช่น `<p>`, `<br>`, `&nbsp;`
3. ให้ frontend โหลดชุดฟอนต์ obfuscated
4. ตั้ง `font-family` ของ container ให้เป็นฟอนต์ที่อยู่ใน `readerConfig`

ดังนั้น:

- สิ่งที่เห็นใน response เช่น `...` เป็นเรื่องปกติ
- สิ่งที่ทำให้ข้อความอ่านออกคือฟอนต์ใน `readerConfig`

## Endpoint

```http
GET /readep/:ep_id
```

ตัวอย่าง:

```http
GET /readep/1568902
Authorization: Bearer <token>
```

หมายเหตุ:

- บางตอนเปิดอ่านได้โดยไม่ต้องมี token
- ถ้าเป็นตอนที่ต้องมีสิทธิ์อ่าน, token ยังสำคัญ
- ถ้ายังไม่มีสิทธิ์อ่าน `data.des` อาจเป็นค่าว่าง

## Success Response ตัวอย่าง

ตัวอย่างนี้ย่อจาก response จริงของ `GET /readep/1568902`

```json
{
  "code": 200,
  "status": "success",
  "message": "เปิดอ่านตอนฟรี",
  "data": {
    "ep_id": 1568902,
    "epID": "EP2025ZQDjLlP1006125858",
    "book_id": 4598,
    "group_id": 7761,
    "name": "บทที่ 1 การกลับชาติมาเกิดและการไลฟ์สดทำนายโชคชะตา",
    "isEligibleToRead": true,
    "des": "<p>...</p>",
    "readerConfig": {
      "defaultFontKey": "baijamjuree",
      "sharedCharacters": 455,
      "cssUrl": "/reader-assets/fonts.css",
      "fonts": [
        {
          "key": "sarabun",
          "label": "Sarabun",
          "fontFamily": "contentENJOYSarabun",
          "file": "fonts/contentENJOYSarabun.ttf",
          "source": "Sarabun-Regular.ttf",
          "remappedCharacters": 455
        },
        {
          "key": "thsarabunnew",
          "label": "THSarabunNew",
          "fontFamily": "contentENJOYTHSarabunNew",
          "file": "fonts/contentENJOYTHSarabunNew.ttf",
          "source": "THSarabunNew.ttf",
          "remappedCharacters": 455
        },
        {
          "key": "baijamjuree",
          "label": "Bai Jamjuree",
          "fontFamily": "contentENJOYBaiJamjuree",
          "file": "fonts/contentENJOYBaiJamjuree.ttf",
          "source": "BaiJamjuree-Regular.ttf",
          "remappedCharacters": 455
        }
      ]
    }
  }
}
```

## Warning Response ตัวอย่าง

```json
{
  "code": 401,
  "status": "warning",
  "message": "คุณไม่มีสิทธิ์อ่านตอนนี้",
  "data": {
    "ep_id": 1568902,
    "des": ""
  }
}
```

## Field ที่ frontend ต้องใช้จริง

### `data.des`

- type: `string`
- เป็น HTML ที่ถูก obfuscate แล้ว
- ต้อง render เป็น HTML ไม่ใช่แสดงเป็น plain text

### `data.readerConfig.cssUrl`

- type: `string`
- path ของ stylesheet ที่ประกาศ `@font-face`
- ถ้า Next/frontend อยู่คนละ origin กับ API ต้องต่อ base URL ก่อนใช้งาน

ตัวอย่าง:

```ts
const cssHref = `${process.env.NEXT_PUBLIC_API_URL}${data.readerConfig.cssUrl}`;
```

### `data.readerConfig.fonts`

- type: `ReaderFont[]`
- ใช้สร้าง dropdown หรือรายการฟอนต์ที่ระบบอนุญาต
- field สำคัญที่สุดคือ `fontFamily`

### `data.readerConfig.defaultFontKey`

- type: `string`
- เป็นค่าเริ่มต้นที่ backend ต้องการให้ใช้
- ไม่ควร hardcode ว่าเป็น `sarabun` หรือฟอนต์ใดฟอนต์หนึ่งเสมอไป

## Datatype ที่แนะนำสำหรับ Frontend

```ts
export type ApiResponse<T> = {
  code: number;
  status: "success" | "warning" | "error" | "successwarning";
  message: string;
  data: T | null;
};

export type ReaderFont = {
  key: string;
  label: string;
  fontFamily: string;
  file: string;
  source?: string;
  remappedCharacters?: number;
};

export type ReaderConfig = {
  defaultFontKey: string;
  sharedCharacters: number;
  cssUrl: string;
  fonts: ReaderFont[];
};

export type EarlyAccess = {
  fast_ticket: boolean;
  fast_coin: boolean;
  isFast_buyable: boolean;
  fastTicketPrice: number;
  fastCoinPrice: number;
};

export type ReadEpData = {
  ep_id: number;
  epID: string;
  book_id: number;
  group_id: number | null;
  name: string;
  coin: number;
  freecoin: number;
  publish_datetime: string;
  update_at: string;
  publish: string;
  view: number;
  order_by: number;
  Discount: Record<string, unknown> | null;
  isRead: boolean;
  isBuy: boolean;
  use_freecoin: number;
  isNewEp: boolean;
  early_access: EarlyAccess;
  rp_campaign: Record<string, unknown> | null;
  group_name: string;
  checkbuybook: number;
  coin_discount: number | null;
  isEligibleToRead: boolean;
  des: string;
  readerConfig: ReaderConfig;
};
```

## Flow ที่ frontend ควรทำ

1. เรียก `GET /readep/:ep_id`
2. เก็บ `data.des` และ `data.readerConfig`
3. โหลด stylesheet จาก `readerConfig.cssUrl`
4. ตั้งค่าเริ่มต้นของฟอนต์จาก `readerConfig.defaultFontKey`
5. render `data.des` ด้วย `dangerouslySetInnerHTML`
6. ตั้ง `font-family` ของ container ให้เป็น `selectedFont.fontFamily`

## ตัวอย่าง Next.js ที่ใช้ได้เลย

โค้ดตัวอย่างนี้ใช้ Next.js App Router และ fetch ฝั่ง client เพื่อให้เปลี่ยนฟอนต์ได้ทันที

ไฟล์ `app/reader/[epId]/page.tsx`

```tsx
import ReaderClient from "./reader-client";

type PageProps = {
  params: { epId: string };
};

export default function ReaderPage({ params }: PageProps) {
  return <ReaderClient epId={params.epId} />;
}
```

ไฟล์ `app/reader/[epId]/reader-client.tsx`

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ApiResponse<T> = {
  code: number;
  status: "success" | "warning" | "error" | "successwarning";
  message: string;
  data: T | null;
};

type ReaderFont = {
  key: string;
  label: string;
  fontFamily: string;
  file: string;
  source?: string;
  remappedCharacters?: number;
};

type ReaderConfig = {
  defaultFontKey: string;
  sharedCharacters: number;
  cssUrl: string;
  fonts: ReaderFont[];
};

type ReadEpData = {
  ep_id: number;
  epID: string;
  book_id: number;
  group_id: number | null;
  name: string;
  des: string;
  isEligibleToRead: boolean;
  checkbuybook: number;
  readerConfig: ReaderConfig;
};

function toApiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return base ? `${base}${path}` : path;
}

function loadReaderCss(href: string) {
  const id = "reader-obfuscation-css";
  const oldNode = document.getElementById(id) as HTMLLinkElement | null;

  if (oldNode?.href === href) return;
  if (oldNode) oldNode.remove();

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export default function ReaderClient({ epId }: { epId: string }) {
  const [data, setData] = useState<ReadEpData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFontKey, setSelectedFontKey] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchEpisode() {
      setLoading(true);

      const response = await fetch(toApiUrl(`/readep/${epId}`), {
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const result: ApiResponse<ReadEpData> = await response.json();
      if (!mounted) return;

      setMessage(result.message);

      if (result.status !== "success" || !result.data) {
        setData(null);
        setLoading(false);
        return;
      }

      setData(result.data);
      setSelectedFontKey(result.data.readerConfig.defaultFontKey);
      loadReaderCss(toApiUrl(result.data.readerConfig.cssUrl));
      setLoading(false);
    }

    fetchEpisode().catch((error) => {
      console.error("Failed to load episode", error);
      if (!mounted) return;
      setMessage("โหลดข้อมูลไม่สำเร็จ");
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [epId]);

  const selectedFontFamily = useMemo(() => {
    if (!data) return "inherit";

    const found = data.readerConfig.fonts.find(
      (font) => font.key === selectedFontKey,
    );

    return found?.fontFamily || data.readerConfig.fonts[0]?.fontFamily || "inherit";
  }, [data, selectedFontKey]);

  if (loading) return <div>Loading...</div>;

  if (!data) {
    return <div>{message || "ไม่พบข้อมูลตอน"}</div>;
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>{data.name}</h1>

      <label style={{ display: "block", marginBottom: 12 }}>
        เลือกฟอนต์:{" "}
        <select
          value={selectedFontKey}
          onChange={(event) => setSelectedFontKey(event.target.value)}
        >
          {data.readerConfig.fonts.map((font) => (
            <option key={font.key} value={font.key}>
              {font.label}
            </option>
          ))}
        </select>
      </label>

      {!data.des ? (
        <div>{message || "ตอนนี้ยังไม่สามารถอ่านเนื้อหาได้"}</div>
      ) : (
        <div
          className="reader-content"
          style={{
            fontFamily: selectedFontFamily,
            lineHeight: 1.9,
            wordBreak: "break-word",
            fontSize: 20,
          }}
          dangerouslySetInnerHTML={{ __html: data.des }}
        />
      )}
    </div>
  );
}
```

## ข้อควรระวัง

- อย่าใช้ชื่อฟอนต์ปกติ เช่น `Bai Jamjuree` หรือ `Sarabun` ไป render `data.des` โดยตรง
- ต้องใช้ `fontFamily` จาก `readerConfig.fonts`
- ต้องโหลด `readerConfig.cssUrl` ก่อนหรือพร้อมตอน render
- ถ้า API กับ frontend คนละ origin ต้องแปลง `cssUrl` ให้เป็น absolute URL
- ถ้า `status !== "success"` หรือ `des === ""` ให้แสดง state ว่ายังไม่มีสิทธิ์อ่าน

## หมายเหตุเรื่อง spacing

ใน `data.des` อาจมี `<p>&nbsp;</p>` หรือ `<p><br></p>` ปนมาจาก editor เดิมได้ จึงอาจเห็นช่องไฟมากกว่าปกติเมื่อ render

นั่นไม่ใช่ปัญหาของ obfuscation แต่เป็นรูปแบบ HTML ต้นทางของบท
