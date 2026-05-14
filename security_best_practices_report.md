# Security Best Practices Report

รีวิวเมื่อ: 2026-05-07
ขอบเขต: Next.js 16 App Router, React 19, TypeScript, Zustand, TanStack Query, Socket.IO client, API route/proxy, auth/session handling, HTML rendering, env/config, browser storage

## Executive Summary

ระบบยังใช้งานได้ แต่ security posture ยังไม่พร้อม production แบบเข้ม เพราะมี 3 กลุ่มเสี่ยงหลัก: content/asset ที่เกี่ยวกับหน้าอ่านยังมีทาง proxy โดยไม่ผูก auth ชัดเจน, session token ยังเป็น JS-readable cookie อายุยาว, และมี flow ที่ส่ง token ผ่าน URL query ไป external domain. โค้ดมีการแก้ XSS ไปหลายจุดแล้ว เช่น sanitizer กลางและ security headers พื้นฐาน แต่ยังเหลือ raw HTML parser หลายจุดและยังไม่มี CSP.

## Critical

### SEC-001: Reader asset proxy ไม่ส่ง auth ไป backend อาจทำให้ asset ของตอนอ่านถูกดึงได้โดยไม่ผ่าน session
- Problem: `/api/read/reader-assets/[...assetPath]` รับ path แล้ว proxy ไป backend โดยไม่อ่าน token/cookie/Authorization และไม่ส่ง auth header ใด ๆ ไป backend
- Evidence: [src/app/api/read/reader-assets/[...assetPath]/route.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/app/api/read/reader-assets/[...assetPath]/route.ts:34) เปิด `GET(_request...)` แต่ไม่ได้ใช้ request auth, และ [src/app/api/read/reader-assets/[...assetPath]/route.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/app/api/read/reader-assets/[...assetPath]/route.ts:48) fetch upstream ด้วย `{ method: "GET", cache: "no-store" }` ไม่มี headers
- Why it matters: ถ้า reader assets เป็นรูป/ไฟล์ประกอบตอนที่จ่ายเงินแล้ว route นี้จะเป็น public relay ได้ทันที แค่รู้ path ก็อาจดึงไฟล์ได้ โดยเฉพาะถ้า URL ถูกแชร์ หลุดใน HTML หรือ browser cache/history
- Fix: ใช้ token resolution แบบเดียวกับ `src/app/api/read/episode/[episodeId]/route.ts`, reject ถ้าไม่มี token สำหรับ asset ที่ sensitive, forward `Authorization`, `x-auth-token`, `x-access-token`, เพิ่ม allowlist extension/content-type และทดสอบ unauthenticated request ต้องได้ 401/403

## High

### SEC-002: Auth token อยู่ใน JS-readable cookie อายุ default 365 วัน
- Problem: token ถูกเก็บด้วย `js-cookie` ฝั่ง client จึงไม่สามารถตั้ง `HttpOnly` ได้ และ default TTL ยาว 365 วัน
- Evidence: [src/services/authPersistence.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/services/authPersistence.ts:4) กำหนด `DEFAULT_TOKEN_COOKIE_DAYS = 365`, [src/services/authPersistence.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/services/authPersistence.ts:122) `Cookies.set('token', token, ...)`, และ [src/services/apiClient.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/services/apiClient.ts:56) อ่าน token จาก `Cookies.get('token')`
- Why it matters: XSS, malicious browser extension, dependency compromise, หรือ script third-party ใด ๆ สามารถอ่าน token แล้ว hijack session ได้ทันที อายุ 365 วันทำให้ blast radius ใหญ่
- Fix: ย้าย session เป็น server-managed `HttpOnly; Secure; SameSite=Lax/Strict` cookie ผ่าน BFF/API route, ใช้ short-lived access token + refresh token ใน HttpOnly cookie, ลด TTL, และเลิกให้ client อ่าน session token โดยตรงในระยะยาว

### SEC-003: ส่ง auth token ไป external domain ผ่าน URL query `tk`
- Problem: `buildCoinEnjoyTopupUrl` เอา token ใส่ query string `tk` แล้วส่งไป `https://coinenjoy.enjoybook.co/`
- Evidence: [src/utils/navigationUtils.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/utils/navigationUtils.ts:86) สร้าง `COINENJOY_BASE_URL`, [src/utils/navigationUtils.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/utils/navigationUtils.ts:92) validate token pattern, และ [src/utils/navigationUtils.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/utils/navigationUtils.ts:93) `topupUrl.searchParams.set("tk", cleanToken)`
- Why it matters: Token ใน URL จะหลุดง่ายผ่าน browser history, server/CDN logs, analytics, screenshot, referrer, support logs และ reverse proxy logs ต่อให้เป็นโดเมนในเครือก็ยังเป็น credential leakage pattern
- Fix: เปลี่ยนเป็น one-time handoff code อายุสั้นมากจาก backend, หรือทำ server-side redirect ที่ set HttpOnly handoff cookie บน target domain, ห้ามส่ง bearer/session token ตรง ๆ ใน URL

### SEC-004: Secure proxy รองรับ state-changing methods แต่ไม่มี proxy-level auth gate/CSRF-origin check
- Problem: `/api/secure/[...path]` allowlist path แล้วก็ส่ง `X-API-Key` ไป backend ทุก method แต่ไม่ reject request ที่ไม่มี user token และไม่มี origin/CSRF validation สำหรับ POST/PUT/PATCH/DELETE
- Evidence: [src/app/api/secure/[...path]/route.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/app/api/secure/[...path]/route.ts:53) set privileged `X-API-Key`, [src/app/api/secure/[...path]/route.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/app/api/secure/[...path]/route.ts:56) อ่าน Authorization/cookie แบบ optional, และ [src/app/api/secure/[...path]/route.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/app/api/secure/[...path]/route.ts:117) ถึง [src/app/api/secure/[...path]/route.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/app/api/secure/[...path]/route.ts:139) เปิด GET/POST/PUT/PATCH/DELETE
- Why it matters: ถ้า backend endpoint ใดพลาด authz หรือพึ่ง `X-API-Key` มากเกินไป proxy นี้จะกลายเป็น confused-deputy ให้ browser เรียก action สำคัญได้ และ cookie-auth state change ควรมี origin/CSRF guard เพิ่ม
- Fix: แยก allowlist ตาม method, require Authorization สำหรับ `user/*`, validate `Origin`/`Referer` กับ app origin สำหรับ non-GET, จำกัด content-type/body size, และให้ backend enforce authorization ซ้ำเสมอ

### SEC-005: Socket.IO ยังบังคับ `transports: ['websocket']` และส่ง PII ผ่าน query string
- Problem: Socket client บังคับ websocket อย่างเดียว ทั้งที่ requirement ก่อนหน้าระบุให้ polling-first หรือไม่กำหนด transports เพื่อกัน handshake/proxy fail และยังส่ง `fullname` ผ่าน query
- Evidence: [src/providers/SocketProvider.tsx](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/providers/SocketProvider.tsx:122) สร้าง `io(SOCKET_URL, ...)`, [src/providers/SocketProvider.tsx](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/providers/SocketProvider.tsx:124) `transports: ['websocket']`, และ [src/providers/SocketProvider.tsx](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/providers/SocketProvider.tsx:144) ถึง [src/providers/SocketProvider.tsx](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/providers/SocketProvider.tsx:147) ส่ง `user_id/fullname` ใน query
- Why it matters: Availability/security observability แย่ลง เพราะ websocket handshake ที่ fail จะ reconnect loop ง่าย และ query string มักถูก log โดย proxy/backend ทำให้ชื่อผู้ใช้หลุดใน logs
- Fix: เปลี่ยนเป็น `transports: ['polling', 'websocket']` หรือไม่กำหนด transports, ส่ง identity ผ่าน `auth` token แทน query, ถ้าต้องส่ง user_id ให้ลดเหลือ non-PII และอย่าส่ง fullname ใน URL

### SEC-006: Reader HTML ยังผ่าน `html-react-parser` หลัง transform โดยไม่มี sanitizer ที่ชัดเจน
- Problem: HTML ตอนอ่านถูก transform ด้วย `modifiedHtml` แล้ว parse เป็น React element โดยตรง แต่ `modifiedHtml` ไม่ใช่ sanitizer
- Evidence: [src/features/read/page.client.internal.tsx](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/read/page.client.internal.tsx:184) เรียก `modifiedHtml(rawHtml, ...)`, [src/features/read/page.client.internal.tsx](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/read/page.client.internal.tsx:190) `parse(renderedEpisodeHtml)`, และ [src/utils/htmlUtils.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/utils/htmlUtils.ts:47) ถึง [src/utils/htmlUtils.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/utils/htmlUtils.ts:69) เป็น regex transform ไม่ได้ remove tag/attribute อันตรายครบ
- Why it matters: เนื้อหานิยายเป็น user-generated content จาก writer ถ้ามี tag/attribute/URL scheme อันตรายหลุดเข้ามา อาจเกิด stored XSS หรือ content injection ในหน้าที่มี token อยู่ใน JS-readable cookie
- Fix: sanitize HTML ด้วย allowlist ก่อน `modifiedHtml/parse` หรือ integrate sanitizer เข้า reader pipeline โดย preserve เฉพาะ tags ที่ reader ต้องใช้, เพิ่ม tests สำหรับ `<script>`, `onerror`, `javascript:`, `iframe`, `svg`, `style`

## Medium

### SEC-007: หลาย section title/detail ยังใช้ `html-react-parser` กับข้อมูล backend/CMS โดยไม่ผ่าน sanitizer กลาง
- Problem: มีหลายจุด parse string จาก backend เป็น HTML/React โดยตรง เช่น home section title, ranking title, article card, campaign detail
- Evidence: [src/components/home/BookSwiper.tsx](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/components/home/BookSwiper.tsx:70), [src/components/home/TopRanking.tsx](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/components/home/TopRanking.tsx:56), [src/components/swiper/RecommendSwiper.tsx](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/components/swiper/RecommendSwiper.tsx:82), [src/components/novelCard/ArticleCard.tsx](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/components/novelCard/ArticleCard.tsx:40), [src/features/campaign/CampaignDetail.tsx](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/campaign/CampaignDetail.tsx:94)
- Why it matters: ถึงข้อมูลจะมาจาก CMS/admin แต่ถ้าหลังบ้านโดนแก้, admin paste HTML แปลก ๆ, หรือ API ถูก inject จะกลายเป็น DOM injection path หลายจุด
- Fix: สร้าง `SafeHtml`/`SafeParsedHtml` กลาง ใช้ `sanitizeUserGeneratedHtml` ก่อน parse/render หรือเปลี่ยน title เป็น plain text ถ้าไม่จำเป็นต้องรองรับ HTML

### SEC-008: Security headers มีพื้นฐานแล้วแต่ยังไม่มี CSP
- Problem: มี `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` แล้ว แต่ไม่มี `Content-Security-Policy`
- Evidence: [next.config.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/next.config.ts:7) ถึง [next.config.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/next.config.ts:22) กำหนด headers แต่ไม่มี CSP
- Why it matters: เมื่อโปรเจคมี UGC HTML, third-party SDK, token ที่ client อ่านได้ CSP เป็น defense-in-depth สำคัญมาก ถ้าไม่มี CSP ความเสียหายจาก XSS จะกว้างขึ้น
- Fix: เริ่มจาก `Content-Security-Policy-Report-Only` ก่อน แล้วค่อย enforce เช่น `default-src 'self'; script-src 'self' https://accounts.google.com https://connect.facebook.net ...; object-src 'none'; base-uri 'self'; frame-ancestors 'none'` ปรับตาม dependency จริง

### SEC-009: Device fingerprint ถูกสร้างและเก็บใน localStorage
- Problem: ใช้ FingerprintJS สร้าง visitorId แล้วเก็บ `x-device-id` ใน localStorage
- Evidence: [src/utils/deviceUtils.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/utils/deviceUtils.ts:20) load FingerprintJS, [src/utils/deviceUtils.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/utils/deviceUtils.ts:29) ใช้ `result.visitorId`, และ [src/utils/deviceUtils.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/utils/deviceUtils.ts:35) `localStorage.setItem(STORAGE_KEY, deviceId)`
- Why it matters: เป็น privacy/compliance risk มากกว่า exploit ตรง ๆ เพราะ fingerprinting ต้องมีเหตุผล/consent/retention ชัดเจน และ localStorage แก้เองได้จึงไม่ควรถูกใช้เป็น security control
- Fix: ระบุ purpose ใน policy/consent, อย่าใช้เป็น auth factor เดี่ยว, ลด retention, หรือใช้ server-issued device binding แทนถ้าต้องการ security จริง

### SEC-010: Custom sanitizer ดีขึ้นแล้ว แต่ยังเป็น homegrown sanitizer ไม่ใช่ library battle-tested
- Problem: `sanitizeUserGeneratedHtml` มี allowlist แล้ว แต่เขียนเองด้วย DOMParser + regex fallback
- Evidence: [src/utils/sanitizeHtml.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/utils/sanitizeHtml.ts:1) ถึง [src/utils/sanitizeHtml.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/utils/sanitizeHtml.ts:168)
- Why it matters: HTML sanitization มี edge case เยอะมาก เช่น namespace, malformed HTML, browser quirks, data URI, SVG/MathML bypass; custom sanitizer ต้องแบก maintenance/security tests เอง
- Fix: ถ้ารับ dependency ได้ให้ใช้ DOMPurify/isomorphic-dompurify แล้วล็อก config เดียวทั้ง client/server; ถ้ายังไม่ใช้ library ให้เพิ่ม fuzz/regression tests และบังคับทุก HTML sink ผ่านตัวนี้

## Low

### SEC-011: `.env` และ `.env.development` อยู่ใน workspace แต่ถูก gitignore แล้ว
- Problem: มี env files ในเครื่อง local ซึ่งปกติได้ แต่ต้องระวังไม่ให้หลุดเข้า git/artifact
- Evidence: `.gitignore` มี `.env*` ที่ [C:/Users/MyPc/Documents/GitHub/front-nextJs/.gitignore](C:/Users/MyPc/Documents/GitHub/front-nextJs/.gitignore:34), และ `git ls-files` ไม่พบ `.env`/`.env.development`
- Why it matters: ตอนนี้ไม่ใช่ leak ใน git แต่ `.env` อาจหลุดผ่าน zip/artifact/manual deploy ได้ โดยเฉพาะ repo นี้มี `.next.rar` ใน workspace
- Fix: อย่า commit/package `.env*`, ตรวจ deploy artifact ก่อน upload, rotate secret ถ้าเคยถูกส่งใน chat/screenshot/log

## สิ่งที่ทำดีแล้ว

- `NEXT_PUBLIC_SECRET_KEY` ไม่เห็นใน source search แล้ว และ read episode ใช้ `process.env.SECRET_KEY` ฝั่ง server ที่ [src/app/api/read/episode/[episodeId]/route.ts](C:/Users/MyPc/Documents/GitHub/front-nextJs/src/app/api/read/episode/[episodeId]/route.ts:10)
- `.env*` ถูก ignore และไม่ได้ tracked จาก `git ls-files`
- `next.config.ts` ปิด `poweredByHeader` และมี security headers พื้นฐาน
- หลาย HTML sink ที่เคยเสี่ยงถูกเปลี่ยนให้ผ่าน `sanitizeUserGeneratedHtml` แล้ว เช่น book about, review modal, comments, article detail, policy/about pages
- `secure` proxy มี path allowlist และไม่ได้ blind-forward headers ทั้งหมด

## Priority Checklist

### Critical
- [ ] SEC-001 ใส่ auth forwarding/require auth ให้ `/api/read/reader-assets/[...assetPath]`

### High
- [ ] SEC-002 เปลี่ยน session token storage เป็น HttpOnly cookie/BFF หรืออย่างน้อยลด TTL และวาง migration plan
- [ ] SEC-003 เลิกส่ง token ผ่าน query `tk` ไป `coinenjoy.enjoybook.co`; เปลี่ยนเป็น one-time handoff code
- [ ] SEC-004 เพิ่ม auth gate + Origin/CSRF guard + method allowlist ให้ `/api/secure/[...path]`
- [ ] SEC-005 แก้ Socket.IO เป็น polling-first และเอา `fullname` ออกจาก query string
- [ ] SEC-006 sanitize reader episode HTML ก่อน parse/render

### Medium
- [ ] SEC-007 รวม HTML title/detail parser เข้ากับ SafeHtml/SafeParsedHtml กลาง
- [ ] SEC-008 เพิ่ม CSP แบบ Report-Only ก่อน enforce
- [ ] SEC-009 ทบทวน privacy/consent ของ FingerprintJS และอย่าใช้ `x-device-id` เป็น security control
- [ ] SEC-010 พิจารณา DOMPurify/isomorphic-dompurify หรือเพิ่ม sanitizer regression tests หนักขึ้น

### Low
- [ ] SEC-011 ตรวจ deploy artifact ไม่ให้แพ็ก `.env*`/secret และ rotate secret ที่เคยหลุดถ้าต้องการปิดความเสี่ยงสุด
