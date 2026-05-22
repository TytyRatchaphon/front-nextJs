/**
 * API Services - Barrel Re-export
 * 
 * ไฟล์นี้ทำหน้าที่ re-export ทุก function และ interface จากไฟล์ domain ย่อย
 * เพื่อให้ import เดิมจาก "@/services/apiServices" ยังใช้งานได้ตามปกติ
 * 
 * Domain files อยู่ใน services/api/:
 * - homeApi.ts       → Home page data
 * - bookApi.ts       → Book CRUD & detail
 * - bookManageApi.ts → Book management (stats, groups, episodes, promotions)
 * - commentApi.ts    → Reviews, comments (book & episode)
 * - threadApi.ts     → Forum threads
 * - articleApi.ts    → Articles
 * - campaignApi.ts   → Campaigns, promotions, banners
 * - rankingApi.ts    → Rankings
 * - categoryApi.ts   → Categories, active category metadata
 * - notificationApi.ts → Notifications and promotion follows
 * - searchApi.ts     → Search history, popular searches, suggestions
 * - faqApi.ts        → FAQ
 * - activityApi.ts   → Activity logging
 * - readingProgressApi.ts → Reader progress sync/update
 * - userApi.ts       → User profile, auth, shelve, writer
 * - writerApi.ts     → Writer finance (bank, withdraw)
 * - storeApi.ts      → Store, stickers, coupons
 * - miscApi.ts       → Backward-compatible re-exports only
 */

export * from './api/homeApi';
export * from './api/bookApi';
export * from './api/bookManageApi';
export * from './api/commentApi';
export * from './api/threadApi';
export * from './api/articleApi';
export * from './api/campaignApi';
export * from './api/rankingApi';
export * from './api/categoryApi';
export * from './api/notificationApi';
export * from './api/searchApi';
export * from './api/faqApi';
export * from './api/activityApi';
export * from './api/readingProgressApi';
export * from './api/userApi';
export * from './api/writerApi';
export * from './api/storeApi';
export * from './api/miscApi';
export * from './api/collectionApi';
export * from './api/historyApi';
export * from './api/episodePurchaseRewardApi';
export * from './api/readingSessionApi';
export * from './api/bookQuestApi';
