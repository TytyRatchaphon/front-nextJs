# Daily Coin Pass - Web Frontend

เอกสารนี้อธิบาย API ที่หน้า web ต้องใช้สำหรับแสดง Daily Coin Pass, รับรางวัล, ดู calendar และดูประวัติ

## API Summary

| API | ใช้ตอนไหน | ใช้ทำอะไร |
|---|---|---|
| `GET /daily-coin-pass/me` | เข้า/refresh หน้า My Pass, หลัง login, หลังซื้อสำเร็จ, หลัง claim สำเร็จ | โหลด pass ของ user, claim state, summary และ countdown reset |
| `POST /daily-coin-pass/claim` | user กดรับรางวัลวันนี้หรือรับย้อนหลัง | สร้าง claim, เพิ่ม wallet, คืนรายการ reward และยอดก่อน/หลัง |
| `GET /daily-coin-pass/calendar?user_pass_id=...` | เปิด detail/calendar ของ pass | โหลดสถานะรายวัน ใช้เลือก claim ย้อนหลังและแสดง progress |
| `GET /daily-coin-pass/pass-history?page=1&limit=20` | เปิดหน้าประวัติ pass | โหลด pass ที่ user เคยถือ ใช้ดู active/expired/refunded |
| `GET /daily-coin-pass/history?page=1&limit=20` | เปิดหน้าประวัติการรับรางวัล | โหลด log claim reward รายครั้ง |

ทุกเส้นต้องส่ง `Authorization: Bearer <token>` และใช้ response ผ่าน wrapper มาตรฐานของ API โดยอ่าน payload หลักจาก `data`

## Common Rules

- ใช้ `server_date`, `reset_hour`, `next_reset_at` จาก backend เป็นเวลาหลัก ห้ามใช้ browser date ตัดสิน claim เอง
- ใช้ `claim_endpoint` จาก `/me` เพื่อเปิดปุ่ม claim วันนี้
- ใช้ `days[].status` จาก `/calendar` เพื่อ render calendar
- หลัง `POST /claim` สำเร็จ ให้ refresh `/me`, calendar ของ pass ที่เกี่ยวข้อง และ wallet/header balance
- ห้าม optimistic update wallet ก่อน backend ตอบ success

## `GET /daily-coin-pass/me`

```http
GET /daily-coin-pass/me
Authorization: Bearer <token>
```

### ใช้ตอนไหน

- หลัง user login แล้วเข้าหน้า Daily Coin Pass
- หลัง flow ซื้อ/เติมเงินฝั่ง web สำเร็จ เพื่อ reload pass ใหม่
- หลัง claim สำเร็จ เพื่อ refresh claim state และ summary
- หลังถึง `next_reset_at` เพื่อ refresh วันใหม่

### ข้อมูลที่ต้องใช้

| Field | วิธีใช้ใน UI |
|---|---|
| `server_date` | แสดงวันอ้างอิงของระบบ และใช้เทียบกับ calendar |
| `reset_hour` | แสดงเวลา reset หรือใช้ทำ tooltip |
| `next_reset_at` | ตั้ง timer refresh หลัง reset |
| `global_assets` | รูป popup, stamp, calendar background, fallback reward icon |
| `active_passes[]` | render pass card ในหน้า My Pass |
| `active_passes[].claim_endpoint` | ถ้ามีค่า ให้เปิดปุ่ม claim วันนี้ตาม body ที่ backend ส่งมา |
| `active_passes[].claim_state` | แสดง state เช่น claimable, locked, queued |
| `active_passes[].pass_state` | แสดง active/catchup state |
| `plan_summaries[]` | render summary รวมตาม plan |
| `claimable_count` | badge จำนวนรางวัลที่รับได้ |
| `claimable_total_freecoin` | freecoin รวมที่รับได้ |
| `claimable_totals_by_currency` | reward รวมแยก currency |
| `can_claim` | เปิด/ปิด CTA claim รวม |

### ผลลัพธ์ที่เป็นไปได้

| กรณี | UI ควรทำอะไร |
|---|---|
| success และ `active_passes.length > 0` | แสดงรายการ pass และ CTA ตาม `claim_endpoint` |
| success แต่ `active_passes` ว่าง | แสดง empty state ของ My Pass |
| success และ `can_claim = false` | ปิด CTA claim รวม แต่ยังแสดง pass/card ได้ |
| auth หมดอายุหรือไม่มี user | ส่ง user ไป login ใหม่ |
| error อื่น | แสดงข้อความ error และให้ลอง refresh |

### วิธีเทส

- login ด้วย user ที่ไม่มี pass ต้องได้ `active_passes = []`
- login ด้วย user ที่มี pass active ต้องเห็น pass ใน `active_passes[]`
- user ที่ claim วันนี้ได้ต้องมี `active_passes[].claim_endpoint`
- user ที่ claim วันนี้ไปแล้ว `claim_endpoint` ต้องเป็น `null` หรือไม่มี CTA ให้กด
- ตั้ง pass แบบ stack ซ้อนกัน แล้ว pass ถัดไปต้องมี state locked/queued ตาม backend

## `POST /daily-coin-pass/claim`

```http
POST /daily-coin-pass/claim
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_pass_id": 123,
  "claim_scope": "today"
}
```

Claim ย้อนหลัง:

```json
{
  "user_pass_id": 123,
  "claim_scope": "catchup",
  "claim_dates": ["2026-06-21", "2026-06-22"]
}
```

### ใช้ตอนไหน

- user กดปุ่ม claim วันนี้จาก `active_passes[].claim_endpoint`
- user เลือกวันย้อนหลังจาก calendar ที่มี status `claimable_catchup`

### Body ที่รองรับ

| Field | Type | ใช้เมื่อ |
|---|---|---|
| `user_pass_id` | number | claim เฉพาะ pass |
| `claim_scope` | `today`, `catchup`, `all` | ปกติใช้ `today` หรือ `catchup` |
| `day_no` | number | เลือก day เดียว |
| `day_nos` | number[] | เลือกหลาย day |
| `claim_date` | `YYYY-MM-DD` | เลือก service date วันเดียว |
| `claim_dates` | `YYYY-MM-DD`[] | เลือกหลาย service date |

หมายเหตุ: ถ้าต้องรับย้อนหลังให้ใช้ `claim_scope = "catchup"` พร้อม `day_nos` หรือ `claim_dates`

### ข้อมูลที่ต้องใช้

| Field | วิธีใช้ใน UI |
|---|---|
| `claimed_count` | แสดงจำนวนรางวัลที่รับสำเร็จ |
| `total_freecoin` | แสดง freecoin รวมใน result modal |
| `total_by_currency` | แสดง reward รวมแยก currency |
| `balance_before`, `balance_after` | ใช้เทียบยอด wallet หลัก |
| `balances_before_by_currency`, `balances_after_by_currency` | refresh wallet/header balance |
| `claimed_slots[]` | render รายการ reward ที่ได้รับ |
| `affected_passes[]` | update pass card ที่ถูกกระทบ |
| `affected_plan_summaries[]` | update summary ที่ถูกกระทบ |

### ผลลัพธ์ที่เป็นไปได้

| กรณี | UI ควรทำอะไร |
|---|---|
| success และ `claimed_count > 0` | แสดง result modal, refresh `/me`, refresh calendar, refresh wallet |
| `daily_coin_pass_no_claimable_reward` | refresh `/me` และ calendar แล้วปิด CTA ที่ claim ไม่ได้ |
| `daily_coin_pass_catchup_quota_exceeded` | แจ้งว่าเลือกวันย้อนหลังเกิน quota และให้เลือกใหม่น้อยลง |
| `daily_coin_pass_previous_stack_claimable` | แจ้งให้รับ pass ก่อนหน้าก่อน แล้ว refresh calendar |
| `daily_coin_pass_pass_not_found` | refresh `/me`; pass อาจหมดอายุหรือไม่ใช่ของ user |
| `invalid_request` | ตรวจ body ที่ส่ง เช่น `user_pass_id`, `claim_dates` |
| auth หมดอายุหรือไม่มี user | ส่ง user ไป login ใหม่ |

### วิธีเทส

- claim วันนี้ด้วย `claim_endpoint.body` จาก `/me` ต้อง success และ wallet เพิ่ม
- claim วันเดิมซ้ำ ต้องได้ error no claimable หรือไม่มี slot ให้รับ
- claim catchup ด้วยวันที่ status `claimable_catchup` ต้อง success
- claim catchup เกิน quota ต้องได้ `daily_coin_pass_catchup_quota_exceeded`
- claim pass ที่ locked ต้องได้ `daily_coin_pass_previous_stack_claimable`
- ส่ง body ผิดรูปแบบ เช่น `claim_dates` ไม่ใช่ `YYYY-MM-DD` ต้องได้ `invalid_request`

## `GET /daily-coin-pass/calendar`

```http
GET /daily-coin-pass/calendar?user_pass_id=123
Authorization: Bearer <token>
```

### ใช้ตอนไหน

- user เปิดหน้า detail ของ pass
- user เปิด calendar เพื่อดู reward รายวัน
- user ต้องเลือก claim ย้อนหลัง
- หลัง claim สำเร็จ เพื่อ refresh status รายวัน

### Query

| Field | Required | วิธีใช้ |
|---|---:|---|
| `user_pass_id` | yes | ใช้ id จาก `/me.active_passes[]` หรือ pass history |

### ข้อมูลที่ต้องใช้

| Field | วิธีใช้ใน UI |
|---|---|
| `server_date` | date อ้างอิงของ backend |
| `reset_hour` | เวลา reset |
| `user_pass_id`, `plan_id`, `code`, `name` | header/detail ของ pass |
| `assets`, `global_assets` | รูปใน calendar |
| `stack_order` | badge ลำดับ pass |
| `effective_start_date`, `effective_end_date` | แสดงช่วงใช้งานหลัก |
| `locked_by_previous_stack` | แสดง lock banner |
| `can_claim_today` | เปิด claim today CTA |
| `can_claim_catchup` | เปิด claim catchup CTA |
| `summary` | progress และ totals |
| `days[]` | render calendar cells |

### `days[].status`

| Status | UI ที่แนะนำ |
|---|---|
| `future` | disable, สี neutral |
| `no_reward` | แสดงช่องว่างหรือไม่มีรางวัล |
| `claimed` | แสดง stamp claimed |
| `reversed` | แสดงสถานะถูกคืน/ยกเลิก |
| `expired` | disable |
| `locked` | แสดง lock |
| `claimable_today` | highlight และเปิด claim today |
| `claimable_catchup` | highlight และให้เลือก claim ย้อนหลัง |
| `catchup_quota_exhausted` | disable พร้อมข้อความ quota หมด |

### ผลลัพธ์ที่เป็นไปได้

| กรณี | UI ควรทำอะไร |
|---|---|
| success | render calendar จาก `days[]` |
| success และ `locked_by_previous_stack = true` | แสดง lock banner และปิด claim CTA |
| success และ `can_claim_today = true` | เปิด claim today |
| success และ `can_claim_catchup = true` | เปิดเลือกวันย้อนหลัง |
| `daily_coin_pass_pass_not_found` | กลับไปหน้า My Pass และ refresh `/me` |
| `invalid_request` | ตรวจว่า query มี `user_pass_id` เป็น number |
| auth หมดอายุหรือไม่มี user | ส่ง user ไป login ใหม่ |

### วิธีเทส

- เปิด calendar ด้วย `user_pass_id` ที่ได้จาก `/me` ต้อง success
- ลบ query `user_pass_id` ต้องได้ `invalid_request`
- ใช้ `user_pass_id` ของ user อื่น ต้องได้ pass not found หรือ error สิทธิ์
- pass ที่ claim วันนี้ได้ต้องมี day status `claimable_today`
- pass ที่มีวันย้อนหลังต้องมี `claimable_catchup`
- pass ที่ถูก stack lock ต้องเห็น `locked_by_previous_stack = true` หรือ day status `locked`

## `GET /daily-coin-pass/pass-history`

```http
GET /daily-coin-pass/pass-history?page=1&limit=20
Authorization: Bearer <token>
```

### ใช้ตอนไหน

- user เปิดหน้าประวัติ pass
- user ต้องดู pass ที่หมดอายุ/refund/เคยถือ
- user เลือก pass เก่าบางใบเพื่อดู calendar ถ้า UI รองรับ

### Query

| Field | Required | ข้อจำกัด |
|---|---:|---|
| `page` | no | positive integer |
| `limit` | no | positive integer, max 100 |

### ข้อมูลที่ต้องใช้

| Field | วิธีใช้ใน UI |
|---|---|
| `page`, `limit`, `total` | pagination |
| `global_assets` | fallback asset |
| `rows[]` | render list ประวัติ pass |
| `rows[].user_pass_id` | ใช้เปิด calendar/detail |
| `rows[].status` | แสดง active/expired/refunded |
| `rows[].effective_start_date`, `rows[].effective_end_date` | แสดงช่วง pass |
| `rows[].store_pack` | แสดงข้อมูล pack ต้นทางถ้ามี |

### ผลลัพธ์ที่เป็นไปได้

| กรณี | UI ควรทำอะไร |
|---|---|
| success และ `rows.length > 0` | render list พร้อม pagination |
| success และ `rows` ว่าง | แสดง empty state |
| `invalid_request` | ตรวจ `page`/`limit` |
| auth หมดอายุหรือไม่มี user | ส่ง user ไป login ใหม่ |

### วิธีเทส

- user ที่มีหลาย pass ต้อง paginate ได้ถูกต้อง
- `limit > 100` ต้องได้ validation error
- user ที่ไม่มีประวัติต้องได้ `rows = []`
- กดเปิด calendar จาก row ต้องใช้ `rows[].user_pass_id`

## `GET /daily-coin-pass/history`

```http
GET /daily-coin-pass/history?page=1&limit=20
Authorization: Bearer <token>
```

### ใช้ตอนไหน

- user เปิดหน้าประวัติการรับรางวัล
- user ต้องดูรายการ claim/reversed รายครั้ง

### Query

| Field | Required | ข้อจำกัด |
|---|---:|---|
| `page` | no | positive integer |
| `limit` | no | positive integer, max 100 |

### ข้อมูลที่ต้องใช้

| Field | วิธีใช้ใน UI |
|---|---|
| `page`, `limit`, `total` | pagination |
| `rows[]` | render claim history |
| `rows[].claim_date` | วันที่รับรางวัล |
| `rows[].reward_type` | ประเภท reward |
| `rows[].amount` | จำนวน reward |
| `rows[].status` | claimed/reversed |
| `rows[].user_pass_id` | link กลับไป pass/calendar ถ้า UI รองรับ |

### ผลลัพธ์ที่เป็นไปได้

| กรณี | UI ควรทำอะไร |
|---|---|
| success และ `rows.length > 0` | render claim log |
| success และ `rows` ว่าง | แสดง empty state |
| row มี `status = reversed` | แสดงว่า reward ถูกคืน/ยกเลิก |
| `invalid_request` | ตรวจ `page`/`limit` |
| auth หมดอายุหรือไม่มี user | ส่ง user ไป login ใหม่ |

### วิธีเทส

- claim สำเร็จ 1 ครั้ง แล้ว history ต้องมี row เพิ่ม
- refund/reverse แล้ว row ต้องแสดง `reversed`
- `limit > 100` ต้องได้ validation error
- user ที่ไม่เคย claim ต้องได้ `rows = []`

## End-to-End Test Checklist

- login แล้วเรียก `/me` ได้
- user ไม่มี pass เห็น empty state
- user มี pass active เห็น pass card
- pass ที่ claim วันนี้ได้มีปุ่ม claim จาก `claim_endpoint`
- กด claim แล้ว wallet เพิ่มตาม `balances_after_by_currency`
- หลัง claim แล้ว `/me` และ calendar เปลี่ยนสถานะเป็น claimed
- claim ซ้ำวันเดิมไม่เพิ่ม wallet ซ้ำ
- calendar แสดง `claimable_catchup` และ claim ย้อนหลังได้
- stack ที่ถูก lock ต้องกด claim ไม่ได้และแสดงข้อความจาก backend
- pass-history paginate ได้
- claim history มีรายการหลัง claim สำเร็จ
