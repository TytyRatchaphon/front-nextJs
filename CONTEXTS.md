# CONTEXTS.md — Enjoybook Frontend Coding Conventions

> เอกสารนี้ใช้เป็นแนวทางในการเขียน code ของโปรเจกต์ Enjoybook (Next.js)
> เพื่อให้ทุกคนในทีมเขียน code ไปในแนวทางเดียวกัน

---

## สารบัญ

1. [Tech Stack](#1-tech-stack)
2. [โครงสร้างโปรเจกต์ (Project Structure)](#2-โครงสร้างโปรเจกต์-project-structure)
3. [Naming Conventions](#3-naming-conventions)
4. [Component Guidelines](#4-component-guidelines)
5. [State Management](#5-state-management)
6. [Data Fetching & API](#6-data-fetching--api)
7. [TypeScript Guidelines](#7-typescript-guidelines)
8. [Styling Guidelines](#8-styling-guidelines)
9. [Routing (App Router)](#9-routing-app-router)
10. [Testing](#10-testing)
11. [Performance Best Practices](#11-performance-best-practices)
12. [Security](#12-security)
13. [Git & Workflow](#13-git--workflow)
14. [❌ Anti-Patterns (สิ่งที่ไม่ควรทำ)](#14--anti-patterns-สิ่งที่ไม่ควรทำ)
15. [Error Handling Patterns](#15-error-handling-patterns)
16. [Feature Module Blueprint](#16-feature-module-blueprint)
17. [Environment & Config Gotchas](#17-environment--config-gotchas)

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router + Turbopack) | 16.x |
| Language | TypeScript (strict mode) | 5.x |
| UI Library | React | 19.x |
| Styling | Tailwind CSS v4 + Ant Design | 4.x / 5.x |
| State | Zustand | 5.x |
| Data Fetching | TanStack React Query + Axios | 5.x / 1.x |
| Validation | Zod | 4.x |
| Font | Bai Jamjuree (Google Fonts) | — |
| Testing | Vitest (unit) + Playwright (e2e) | — |
| Package Manager | Bun / npm | — |
| Real-time | Socket.IO Client | 4.x |

---

## 2. โครงสร้างโปรเจกต์ (Project Structure)

```
src/
├── app/                    # Next.js App Router (routes, layouts, pages)
│   ├── (auth)/             # Route group: ต้อง login
│   ├── (public)/           # Route group: เปิดสาธารณะ (มี Navbar + Footer)
│   ├── (reader)/           # Route group: หน้าอ่าน
│   ├── (writer)/           # Route group: หน้านักเขียน
│   ├── api/                # API Route Handlers
│   ├── layout.tsx          # Root layout (Server Component)
│   ├── client-providers.tsx # Client providers wrapper
│   ├── app-shell.tsx       # AppShell: Navbar, Footer, Socket listeners
│   └── globals.css         # Global styles
│
├── components/             # Shared / reusable components (แยกตาม domain)
│   ├── auth/               # Login, Register, Token management
│   ├── bookdetail/         # Book detail page components
│   ├── common/             # General-purpose components
│   ├── home/               # Homepage-specific components
│   ├── modal/              # Modals
│   ├── navbar/             # Navigation bar
│   ├── novelCard/          # Novel card components
│   ├── search/             # Search components
│   ├── social/             # Social features
│   ├── socket/             # Socket event listeners
│   ├── swiper/             # Carousel/swiper components
│   ├── ui/                 # UI primitives (ImageWithFallback, ProfileAvatarLink, etc.)
│   └── utility/            # Utility components (Logger, etc.)
│
├── features/               # Feature modules (self-contained business logic)
│   ├── read/               # Reader feature
│   │   ├── components/     #   └─ Feature-specific components
│   │   ├── hooks/          #   └─ Feature-specific hooks
│   │   ├── page.client.internal.tsx  # Main client page
│   │   ├── readerApi.ts    #   └─ Feature-specific API calls
│   │   └── purchaseUtils.ts #  └─ Feature-specific utils
│   ├── book/               # Book listing feature
│   ├── campaign/           # Campaign feature
│   ├── payment/            # Payment feature
│   └── ...
│
├── hooks/                  # Shared custom hooks
├── stores/                 # Zustand stores (global state)
├── services/               # API client & service layer
│   ├── apiClient.ts        #   └─ Axios instance + interceptors
│   ├── apiServices.ts      #   └─ Barrel re-export ทุก domain API
│   └── api/                #   └─ Domain-specific API files
│       ├── homeApi.ts
│       ├── bookApi.ts
│       ├── userApi.ts
│       └── ...
│
├── types/                  # TypeScript type definitions (แยกตาม domain)
├── interfaces/             # Legacy interfaces (ไม่ควรเพิ่มใหม่ — ใช้ types/ แทน)
├── constants/              # Constants & configuration (query keys, etc.)
├── utils/                  # Pure utility functions
├── providers/              # React context providers
└── assets/                 # Static assets
```

### หลักสำคัญ: `components/` vs `features/`

| | `components/` | `features/` |
|---|---|---|
| **ใช้เมื่อ** | Component ที่ใช้ซ้ำได้หลาย page | Business logic ที่ผูกกับ feature เดียว |
| **ตัวอย่าง** | `NovelCard`, `ImageWithFallback` | `ReadPurchaseFallback`, `ReaderTopBar` |
| **มี hooks ของตัวเอง?** | ❌ ให้ไปไว้ที่ `hooks/` | ✅ ไว้ใน `features/xxx/hooks/` |
| **มี API ของตัวเอง?** | ❌ ให้ไปไว้ที่ `services/api/` | ✅ ได้ถ้า scoped เฉพาะ feature |

---

## 3. Naming Conventions

### ไฟล์ & โฟลเดอร์

| ประเภท | Convention | ตัวอย่าง |
|---|---|---|
| Component files | `PascalCase.tsx` | `BannerButtons.tsx`, `ReaderTopBar.tsx` |
| Hook files | `camelCase.ts` (ขึ้นต้น `use`) | `useWebsiteSettings.ts`, `useContents.ts` |
| Util files | `camelCase.ts` | `dateUtils.ts`, `bookMappers.ts` |
| Type files | `camelCase.ts` | `book.ts`, `campaign.ts` |
| Store files | `camelCase.ts` (ลงท้าย `Store`) | `authStore.ts`, `uiStore.ts` |
| API files | `camelCase.ts` (ลงท้าย `Api`) | `homeApi.ts`, `bookApi.ts` |
| Test files | `xxx.test.ts` | `authStore.test.ts`, `dateUtils.test.ts` |
| Page (App Router) | `page.tsx` | `app/(public)/book/page.tsx` |
| Client page logic | `page.client.internal.tsx` | `page.client.internal.tsx` |
| Folders | `camelCase` หรือ `kebab-case` | `bookdetail/`, `book-updates/` |

### ตัวแปร & ฟังก์ชัน

```ts
// ✅ ถูกต้อง
const isLoggedIn = true;                       // boolean → ขึ้นต้น is/has/can
const handleSubmit = () => {};                 // handler → ขึ้นต้น handle
const fetchBookDetail = async () => {};        // async function → ขึ้นต้น fetch
const normalizeBook = (data: BookData) => {};  // utility → ใช้ verb
const STALE_TIME_LONG = 60_000;                // constant → SCREAMING_SNAKE_CASE

// ❌ หลีกเลี่ยง
const data = {};          // ชื่อกว้างเกินไป
const temp = "";          // ไม่สื่อความหมาย
const d = new Date();     // ตัวแปรตัวเดียว
```

### Components & Types

```ts
// Components → PascalCase
export default function BookEpisodesTab() {}
export const BannerButtons = () => {};

// Types/Interfaces → PascalCase
interface BookData {}
type NormalizedBook = {};
enum BookType {}

// Zustand stores → camelCase ขึ้นต้น use
export const useAuthStore = create<AuthState>()(...);
export const useUIStore = create<UIState>(...);
```

---

## 4. Component Guidelines

### 4.1 Server vs Client Components

```tsx
// ✅ Default = Server Component (ไม่ต้องใส่ directive)
export default function BookPage() {
  return <div>...</div>;
}

// ✅ Client Component → ต้องใส่ "use client" เฉพาะเมื่อจำเป็น
"use client";
export default function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**เมื่อไหร่ควรใช้ `"use client"`**:
- ใช้ React hooks (`useState`, `useEffect`, `useContext`, etc.)
- ใช้ browser APIs (`window`, `document`, `localStorage`)
- ใช้ event handlers (`onClick`, `onChange`)
- ใช้ third-party client libraries (Swiper, Socket.IO)

**เมื่อไหร่ไม่ควรใช้**:
- แค่ render HTML/JSX
- Fetch data ด้วย `async/await` ใน component
- Layout หรือ page ที่ไม่ต้องการ interactivity

### 4.2 Component Structure

```tsx
"use client"; // (ถ้าจำเป็น)

// 1. Imports — จัดกลุ่ม: external → internal → relative
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/authStore";
import { queryKeys } from "@/constants/query";
import type { BookData } from "@/types/book";

import BookCard from "./BookCard";

// 2. Types (ถ้า local)
interface BookListProps {
  books: BookData[];
  isLoading?: boolean;
}

// 3. Component
export default function BookList({ books, isLoading = false }: BookListProps) {
  // a. Hooks
  const user = useAuthStore((state) => state.user);

  // b. Derived state
  const sortedBooks = useMemo(() => books.sort(...), [books]);

  // c. Handlers
  const handleClick = useCallback(() => { ... }, []);

  // d. Early returns
  if (isLoading) return <BookListSkeleton />;
  if (!books.length) return <EmptyState />;

  // e. Render
  return (
    <div className="grid grid-cols-2 gap-4">
      {sortedBooks.map((book) => (
        <BookCard key={book.book_id} book={book} />
      ))}
    </div>
  );
}
```

### 4.3 Component Best Practices

```tsx
// ✅ แยก component ย่อย เมื่อ:
// - JSX ยาวเกิน ~80 บรรทัด
// - มี logic ซ้ำ
// - สามารถ reuse ได้

// ✅ ใช้ Suspense boundary สำหรับ client component ที่ lazy load
<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>

// ✅ ใช้ default export สำหรับ page components
export default function HomePage() {}

// ✅ ใช้ named export สำหรับ component ที่ reuse ได้
export function NovelCard() {}

// ❌ อย่าเขียน inline style ยกเว้นจำเป็นจริงๆ (ใช้ Tailwind แทน)
// ❌ อย่าใส่ business logic หนักๆ ใน component — ย้ายไป hooks/utils
// ❌ อย่าใช้ index เป็น key ถ้า list มีการ reorder
```

### 4.4 SVG Icons

```tsx
// ✅ ใช้ stroke="currentColor" เพื่อให้สีเปลี่ยนตาม parent
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
</svg>

// ✅ SVG attributes ใน JSX ใช้ camelCase
// stroke-width → strokeWidth
// stroke-linecap → strokeLinecap
// stroke-linejoin → strokeLinejoin
// stroke-miterlimit → strokeMiterlimit

// ❌ อย่า hardcode สี เช่น stroke="#DFDFEC"
// ❌ อย่าใช้ kebab-case attributes ใน JSX
```

---

## 5. State Management

### 5.1 Zustand Stores

ใช้ **Zustand** สำหรับ global state (auth, UI modals, form state)

```ts
// ✅ Store pattern — แยก interface ก่อน, แล้ว create store
import { create } from 'zustand';

// 1. กำหนด State interface (รวม state + actions)
export interface AuthState {
  user: UserData | null;
  token: string | null;
  isLoggedIn: boolean;

  // Actions
  login: (userData: UserData, token: string) => void;
  logout: () => void;
}

// 2. สร้าง store
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isLoggedIn: false,

  login: (userData, token) => {
    set({ user: userData, token, isLoggedIn: true });
  },

  logout: () => {
    set({ user: null, token: null, isLoggedIn: false });
  },
}));
```

### 5.2 Selectors

```ts
// ✅ ใช้ inline selector เพื่อ prevent unnecessary re-renders
const user = useAuthStore((state) => state.user);
const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

// ✅ สร้าง reusable selector สำหรับ derived state ที่ใช้บ่อย
// src/stores/selectors.ts
export const useIsAuthenticated = () =>
  useAuthStore(
    (state) => state.isLoggedIn && state.user !== null && state.token !== null
  );

// ❌ อย่าดึง store ทั้งก้อน
const store = useAuthStore(); // ← re-render ทุกครั้งที่ store เปลี่ยน
```

### 5.3 เมื่อไหร่ใช้อะไร

| สถานการณ์ | ใช้ |
|---|---|
| Server data (books, episodes, user profile) | **React Query** |
| Auth state (user, token) | **Zustand** (`authStore`) |
| UI state (modals, animations) | **Zustand** (`uiStore`) |
| Form state (complex forms) | **Zustand** (`formStore`) |
| Component-local state | **useState / useReducer** |
| Prop drilling ≤ 2 levels | **Props** |
| Prop drilling > 2 levels | **Zustand** หรือ **Context** |

---

## 6. Data Fetching & API

### 6.1 API Client (Axios)

API client ตั้งค่าไว้ที่ `src/services/apiClient.ts` พร้อม interceptors:

```ts
import apiClient from "@/services/apiClient";

// ✅ ใช้ apiClient ทุกครั้ง — อย่าสร้าง axios instance ใหม่
const response = await apiClient.get("/books/detail", { params: { bookId } });

// ✅ Token จะถูกแนบ auto ผ่าน interceptor
// ❌ อย่าแนบ Authorization header เอง
```

### 6.2 API Service Layer

จัดกลุ่ม API calls ตาม domain ใน `src/services/api/`:

```ts
// src/services/api/bookApi.ts
import apiClient from "../apiClient";

export const fetchBookDetail = async (bookId: string) => {
  const response = await apiClient.get(`/books/${bookId}`);
  return response.data;
};

export const fetchBookEpisodes = async (bookId: string) => {
  const response = await apiClient.get(`/books/${bookId}/episodes`);
  return response.data;
};
```

**re-export** ผ่าน barrel file:

```ts
// src/services/apiServices.ts
export * from './api/bookApi';
export * from './api/homeApi';
export * from './api/userApi';
// ...
```

### 6.3 React Query

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, QUERY_CONFIG } from "@/constants/query";

// ✅ ใช้ query key factory จาก constants/query.ts
const { data, isLoading } = useQuery({
  queryKey: queryKeys.book.detail(bookId),
  queryFn: () => fetchBookDetail(bookId),
  staleTime: QUERY_CONFIG.STALE_TIME_MEDIUM,
  enabled: !!bookId,
});

// ✅ ใช้ QUERY_CONFIG สำหรับ timing values
// ❌ อย่า hardcode staleTime / gcTime

// ✅ Mutation + cache invalidation
const mutation = useMutation({
  mutationFn: updateBook,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.book.detailRoot() });
  },
});
```

### 6.4 Query Key Rules

```ts
// ✅ ทุก query key ต้องอยู่ใน src/constants/query.ts
export const queryKeys = {
  book: {
    detailRoot: () => ["bookDetail"] as const,
    detail: (bookId) => ["bookDetail", String(bookId ?? "")] as const,
  },
} as const;

// ✅ ใช้ xxxRoot() สำหรับ invalidate ทั้งกลุ่ม
queryClient.invalidateQueries({ queryKey: queryKeys.book.detailRoot() });

// ✅ Parameters ต้อง normalize เป็น string ด้วย String()
// ✅ ใช้ as const เพื่อ type safety
```

---

## 7. TypeScript Guidelines

### 7.1 Type vs Interface

```ts
// ✅ ใช้ interface สำหรับ object shapes (เช่น API response, component props)
interface BookData {
  book_id: number;
  name: string;
}

// ✅ ใช้ type สำหรับ unions, intersections, utility types
type BookStatus = "publish" | "private" | "delete";
type NormalizedBook = Pick<BookData, "book_id" | "name">;

// ✅ ใช้ enum สำหรับ fixed set ที่ต้องการ runtime value
enum BookType {
  WRITE = "write",
  TRAN = "tran",
}
```

### 7.2 Type Definitions Location

```
src/types/           # ← Global types ที่ใช้ข้าม feature
  ├── book.ts        #    BookData, Episode, BookDetail, etc.
  ├── campaign.ts
  ├── user.ts
  └── errors.ts

src/features/read/   # ← Feature-scoped types ให้ define ในไฟล์ที่ใช้
```

### 7.3 Best Practices

```ts
// ✅ ใช้ `type` imports
import type { BookData } from "@/types/book";

// ✅ ใช้ Zod สำหรับ runtime validation (form inputs, API responses ที่ไม่ trust)
import { z } from "zod";
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type LoginInput = z.infer<typeof LoginSchema>;

// ✅ ใช้ Partial<T>, Pick<T>, Omit<T> แทนสร้าง type ใหม่ทั้งหมด
const updateUser = (updates: Partial<UserData>) => {};

// ❌ อย่าใช้ `any` ถ้าหลีกเลี่ยงได้ (ใช้ `unknown` แล้ว narrow type แทน)
// ❌ อย่า define type ซ้ำ — check types/ ก่อน
```

---

## 8. Styling Guidelines

### 8.1 Tailwind CSS (Primary)

```tsx
// ✅ ใช้ Tailwind utility classes เป็นหลัก
<div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">

// ✅ Responsive: mobile-first
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">

// ✅ Hover / interactive states
<button className="bg-purple-50 hover:bg-purple-500 text-purple-500 hover:text-white transition-colors duration-300">

// ✅ group hover pattern
<div className="group">
  <div className="group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
</div>
```

### 8.2 Design Tokens

| Token | Value | Usage |
|---|---|---|
| Primary Color | `#dc2626` (red-600) | Brand accent, CTA buttons |
| Font | `Bai Jamjuree` (weight: 500) | ทั้ง app |
| Ant Design Primary | `#f5222d` | Ant Design components |
| Border Radius | `rounded-xl` | Cards, containers |
| Transition | `transition-all duration-300` | Hover effects |

### 8.3 Ant Design (Secondary)

```tsx
// ✅ ใช้ Ant Design สำหรับ complex components (Table, Form, Modal, ConfigProvider)
import { ConfigProvider, App } from "antd";

<ConfigProvider theme={{ token: { colorPrimary: "#f5222d" } }}>
  <App>{children}</App>
</ConfigProvider>

// ❌ อย่าผสม Ant Design กับ Tailwind ใน component เดียวมากเกินไป
// ❌ อย่า override Ant Design styles ด้วย !important
```

### 8.4 CSS Guidelines

```css
/* ✅ Custom CSS ให้เขียนใน globals.css */
/* ✅ ใช้ CSS variables สำหรับ theme values */
/* ❌ อย่าเขียน CSS module ใหม่ — ใช้ Tailwind แทน */
/* ❌ อย่าใช้ inline style={} ยกเว้นจำเป็นจริงๆ (dynamic values) */
```

---

## 9. Routing (App Router)

### 9.1 Route Groups

```
app/
├── (auth)/       # ต้อง login → ไม่มี Navbar/Footer (layout เฉพาะ)
├── (public)/     # หน้าสาธารณะ → มี AppShell (Navbar + Footer)
├── (reader)/     # หน้าอ่าน → layout เฉพาะ (ไม่มี Navbar)
├── (writer)/     # หน้านักเขียน → layout เฉพาะ
└── api/          # API Route Handlers
```

### 9.2 Page Pattern

```tsx
// app/(public)/book/[bookId]/page.tsx — Server Component (thin)
import { BookDetailClient } from "@/features/book/BookDetailClient";

export default async function BookPage({ params }: { params: { bookId: string } }) {
  // SSR: prefetch data ถ้าจำเป็น
  return <BookDetailClient bookId={params.bookId} />;
}

// features/book/BookDetailClient.tsx — Client Component (heavy logic)
"use client";
export function BookDetailClient({ bookId }: { bookId: string }) {
  // useQuery, useState, event handlers, etc.
}
```

**หลัก**: Page file (`page.tsx`) ให้ thin ที่สุด → delegate logic ไปที่ `features/` หรือ `components/`

### 9.3 Layouts

```tsx
// ✅ Layout = Server Component
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

// ✅ AppShell ประกอบ client islands: Navbar, TokenUpdater, Socket listeners
// แต่ละ client island ห่อด้วย <Suspense fallback={null}>
```

---

## 10. Testing

### 10.1 Unit Tests (Vitest)

```ts
// ✅ ไฟล์ test อยู่คู่กับไฟล์ที่ test: xxx.test.ts
// src/utils/dateUtils.ts → src/utils/dateUtils.test.ts
// src/stores/authStore.ts → src/stores/authStore.test.ts

import { describe, it, expect, vi } from "vitest";

describe("dateUtils", () => {
  it("should format date correctly", () => {
    expect(formatDate("2024-01-01")).toBe("1 ม.ค. 2567");
  });
});
```

### 10.2 E2E Tests (Playwright)

```
e2e/
├── example.spec.ts
└── ...
```

### 10.3 คำสั่ง

```bash
bun run test          # Run tests (watch mode)
bun run test:run      # Run tests (single run)
bun run test:coverage # Run with coverage
bun run test:e2e      # Run Playwright e2e tests
```

---

## 11. Performance Best Practices

### 11.1 Components

```tsx
// ✅ ใช้ React.memo สำหรับ component ที่ render บ่อยแต่ props ไม่เปลี่ยน
const BookCard = React.memo(function BookCard({ book }: { book: BookData }) {
  return <div>...</div>;
});

// ✅ ใช้ useCallback สำหรับ handlers ที่ pass ลง child component
const handleClick = useCallback(() => { ... }, [dependency]);

// ✅ ใช้ useMemo สำหรับ expensive computation
const sortedBooks = useMemo(() => heavySort(books), [books]);

// ✅ Code splitting ด้วย dynamic import
const HeavyEditor = dynamic(() => import("@/components/editor/Editor"), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### 11.2 Images

```tsx
// ✅ ใช้ next/image หรือ <img> กับ lazy loading
// ✅ ใส่ width/height หรือ fill + sizes เพื่อป้องกัน layout shift
// ✅ ใช้ ImageWithFallback สำหรับ user-uploaded images

import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
```

### 11.3 Data Fetching

```tsx
// ✅ ใช้ staleTime เพื่อลด refetch ที่ไม่จำเป็น
// ✅ Prefetch data ใน Server Component เมื่อเป็นไปได้
// ✅ ใช้ enabled option เพื่อ conditional fetching
useQuery({
  queryKey: queryKeys.book.detail(bookId),
  queryFn: () => fetchBookDetail(bookId),
  enabled: !!bookId,  // ไม่ fetch ถ้า bookId เป็น null
});
```

---

## 12. Security

### 12.1 Authentication

```ts
// ✅ Token เก็บใน HTTP-only cookie (ผ่าน authPersistence.ts)
// ✅ ใช้ apiClient interceptor จัดการ token — อย่าจัดการเอง
// ✅ ใช้ x-device-id header สำหรับ device fingerprinting
// ✅ Handle duplicate login & blocked user ผ่าน response interceptor
```

### 12.2 Input & Output

```ts
// ✅ Validate user input ด้วย Zod ก่อนส่ง API
// ✅ Sanitize HTML content ก่อน render (ใช้ sanitizeHtml.ts)
// ✅ ใช้ Secure Proxy Client สำหรับ sensitive operations

// ❌ อย่า trust API response blindly — ใช้ optional chaining
// ❌ อย่าเก็บ sensitive data ใน localStorage
// ❌ อย่า expose API keys ใน client code — ใช้ NEXT_PUBLIC_ prefix เฉพาะ public keys
```

---

## 13. Git & Workflow

### 13.1 Commit Messages

```
feat: เพิ่ม feature ใหม่
fix: แก้ bug
refactor: ปรับ code โดยไม่เปลี่ยน behavior
style: แก้ formatting / styling
docs: อัปเดต documentation
test: เพิ่ม/แก้ test
chore: งาน maintenance (deps update, config)
```

### 13.2 Pre-push Checklist

```bash
bun run lint          # ✅ ต้องผ่าน lint (ESLint + mojibake check)
bun run test:run      # ✅ ต้องผ่าน unit tests
bun run build         # ✅ ต้อง build ได้ (lint + next build)
```

### 13.3 Code Review Guidelines

- ✅ ตรวจว่า component อยู่ถูกที่ (`components/` vs `features/`)
- ✅ ตรวจว่า query keys อยู่ใน `constants/query.ts`
- ✅ ตรวจว่า types อยู่ใน `types/` ไม่ใช่ inline
- ✅ ตรวจว่าไม่มี `console.log` ที่ลืมลบ
- ✅ ตรวจว่า SVG ใช้ `currentColor` แทน hardcoded color
- ✅ ตรวจว่า `"use client"` ใส่เฉพาะเมื่อจำเป็น

---

## 14. ❌ Anti-Patterns (สิ่งที่ไม่ควรทำ)

รวบรวม pattern ที่เป็นปัญหาใน codebase จริง เพื่อไม่ให้เขียนซ้ำ

### 14.1 God Component (Component ใหญ่เกินไป)

```tsx
// ❌ BAD — Component เดียว 600+ บรรทัด, 15+ hooks, 20+ state variables
export default function ReadEpisodePage({ bookId, episodeId }: Props) {
  // 50 บรรทัดของ hooks...
  // 100 บรรทัดของ effects...
  // 200 บรรทัดของ JSX...
}

// ✅ GOOD — แยก logic ออกเป็น custom hooks + sub-components
export default function ReadEpisodePage({ bookId, episodeId }: Props) {
  const reader = useReaderState(bookId, episodeId);      // รวม hooks ที่เกี่ยวข้อง
  const purchase = usePurchaseState(reader.episode);      // แยก purchase logic
  const navigation = useEpisodeNavigation(bookId);        // แยก navigation logic

  if (reader.isLoading) return <LoadingState />;
  if (reader.isError) return <ErrorState error={reader.error} />;

  return (
    <ReaderLayout>
      <ReaderTopBar {...navigation} />
      <ReaderContent {...reader} />
      <PurchaseModals {...purchase} />
    </ReaderLayout>
  );
}
```

**Rule of thumb**: ถ้า component มี state > 5 ตัว → พิจารณาแยก custom hook

### 14.2 Unsafe Type Casting (`as any`)

```tsx
// ❌ BAD — ใช้ as any แล้วเข้าถึง property ตรงๆ
const ep = episode as any;
const bookTitle = (bookDetail as any)?.title || '';
const isOwned = Boolean((currentEpisodeMeta as any)?.isBuy);

// ✅ GOOD — สร้าง type guard หรือ define type ให้ถูกต้อง
interface EpisodeMeta {
  isBuy: boolean;
  publishDatetime?: string;
}

const isOwned = Boolean(currentEpisodeMeta?.isBuy);

// ✅ GOOD — ถ้า type ไม่แน่นอน ใช้ unknown + type guard
function isEpisodeWithBuy(ep: unknown): ep is { isBuy: boolean } {
  return typeof ep === 'object' && ep !== null && 'isBuy' in ep;
}
```

### 14.3 Prop Drilling ลึกเกินไป

```tsx
// ❌ BAD — ส่ง 30+ props ลงไป child component
<ReaderTopBar
  fontSize={fontSize}
  setFontSize={setFontSize}
  fontFamily={fontFamily}
  setFontFamily={setFontFamily}
  bgColor={bgColor}
  setBgColor={setBgColor}
  isBold={isBold}
  setIsBold={setIsBold}
  textAlign={textAlign}
  setTextAlign={setTextAlign}
  // ... อีก 20 props
/>

// ✅ GOOD — จัดกลุ่ม props เป็น object / ใช้ custom hook
interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  bgColor: string;
  isBold: boolean;
  textAlign: string;
}

interface ReaderSettingsActions {
  setFontSize: (v: number) => void;
  setFontFamily: (v: string) => void;
  // ...
}

<ReaderTopBar settings={readerSettings} actions={readerActions} />

// ✅ BETTER — ถ้า drilling ลึกมาก ใช้ Zustand store
// สร้าง useReaderSettingsStore แล้วให้ child component ดึงเอง
```

### 14.4 Effect-driven State Sync

```tsx
// ❌ BAD — ใช้ useEffect sync state จาก props (ทำให้ render 2 รอบ)
const [localValue, setLocalValue] = useState(propValue);
useEffect(() => {
  setLocalValue(propValue);
}, [propValue]);

// ✅ GOOD — ใช้ props ตรงๆ หรือ derive state
const displayValue = propValue ?? defaultValue;

// ✅ GOOD — ถ้าต้อง track local override ใช้ key pattern
<ChildComponent key={propValue} initialValue={propValue} />
```

### 14.5 Query Key ที่กระจัดกระจาย

```tsx
// ❌ BAD — hardcode query key ในหลายที่
useQuery({ queryKey: ["bookDetail", bookId], ... });
// แล้วไปอีกไฟล์:
queryClient.invalidateQueries({ queryKey: ["bookDetail"] });

// ✅ GOOD — ใช้ queryKeys จาก constants/query.ts เสมอ
useQuery({ queryKey: queryKeys.book.detail(bookId), ... });
queryClient.invalidateQueries({ queryKey: queryKeys.book.detailRoot() });
```

### 14.6 Inline Styles ที่ไม่จำเป็น

```tsx
// ❌ BAD — ใช้ style={} ทั้งที่ Tailwind มี utility
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

// ✅ GOOD — ใช้ Tailwind
<div className="flex items-center gap-2">

// ✅ ACCEPTABLE — dynamic values ที่ Tailwind ทำไม่ได้
<div style={{ height: `${dynamicHeight}px` }}>
```

### 14.7 ลืม Cleanup Effect

```tsx
// ❌ BAD — ลืม cleanup event listener
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
}, []);

// ✅ GOOD — cleanup เสมอ
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### 14.8 ใช้ `!important` มากเกินไป

```css
/* ❌ BAD — ใช้ !important ทุกที่เพื่อ override Ant Design */
.my-select .ant-select-selector {
  height: 48px !important;
  border-radius: 16px !important;
  border-color: #ffe4e6 !important;
}

/* ✅ GOOD — ใช้ Ant Design ConfigProvider theme token แทน */
<ConfigProvider theme={{ components: { Select: { controlHeight: 48, borderRadius: 16 } } }}>

/* ✅ ACCEPTABLE — เฉพาะกรณีที่ Ant Design ไม่มี token ให้ config */
```

### 14.9 Console.log ที่ลืมลบ

```tsx
// ❌ BAD — ลืม console.log ไว้ใน production code
console.log("bookData:", data);
console.log("user:", user);

// ✅ GOOD — ใช้ useLogger hook ที่มีอยู่แล้ว
const { log } = useLogger();
log('read_page', 'book', bookId, { ... });

// ✅ ACCEPTABLE — console.error สำหรับ error ที่ต้อง debug
console.error('Token update logic failed', error);
```

### 14.10 ไม่ Guard `typeof window`

```tsx
// ❌ BAD — เข้าถึง browser API โดยไม่ check environment
localStorage.setItem('key', 'value');
window.scrollTo(0, 0);

// ✅ GOOD — check ก่อนเสมอ (SSR-safe)
if (typeof window !== 'undefined') {
  localStorage.setItem('key', 'value');
  window.scrollTo(0, 0);
}
```

---

## 15. Error Handling Patterns

### 15.1 Error Boundary (App-level)

โปรเจกต์มี Error Boundary ใน `app/error.tsx` พร้อม auto-reload สำหรับ stale deployment:

```tsx
// app/error.tsx — จัดการ unhandled errors ทั้ง app
// ✅ Auto-reload เมื่อ detect ChunkLoadError (deploy ใหม่แต่ client ยัง cache chunk เก่า)
// ✅ มี retry button + link กลับหน้าหลัก
// ✅ Log error ก่อน render fallback UI
```

### 15.2 API Error Handling

```tsx
// ✅ ใช้ getErrorMessage() จาก types/errors.ts สำหรับ extract error message
import { getErrorMessage } from '@/types/errors';

try {
  await apiClient.post('/books', data);
} catch (error) {
  const message = getErrorMessage(error);  // handles unknown safely
  notification.error({ message });
}

// ✅ React Query — error handling ใน onError callback
const mutation = useMutation({
  mutationFn: updateBook,
  onError: (error) => {
    notification.error({ message: getErrorMessage(error) });
  },
});
```

### 15.3 Loading & Error States ใน UI

```tsx
// ✅ Pattern: ทุก data-driven component ต้องมี 3 states
function BookList() {
  const { data, isLoading, isError, error } = useQuery(...);

  // 1. Loading state
  if (isLoading) return <BookListSkeleton />;

  // 2. Error state (มี retry)
  if (isError) return (
    <div className="text-center py-8">
      <p className="text-red-600">{getErrorMessage(error)}</p>
      <button onClick={() => refetch()}>ลองใหม่</button>
    </div>
  );

  // 3. Empty state
  if (!data?.length) return <EmptyState message="ไม่พบข้อมูล" />;

  // 4. Success state
  return <div>{data.map(...)}</div>;
}
```

### 15.4 API Response Guards

```tsx
// ✅ ใช้ optional chaining สำหรับ API response ที่อาจไม่มีข้อมูล
const bookTitle = response?.data?.title || 'ไม่มีชื่อ';
const episodes = response?.data?.groups || [];

// ❌ อย่า destructure โดยไม่ guard
const { title } = response.data;  // ← crash ถ้า data เป็น null
```

### 15.5 Duplicate Login & Blocked User

ระบบ handle ผ่าน API interceptor → emit event → `ApiAuthEventBridge` → open modal:

```tsx
// ✅ อย่า handle เอง — ระบบจัดการผ่าน:
// 1. apiClient.ts interceptor ตรวจ status 400 + specific message
// 2. emitApiClientEvent('duplicate-login') หรือ emitApiClientEvent('blocked-user')
// 3. ApiAuthEventBridge component listen แล้วเปิด modal อัตโนมัติ
```

---

## 16. Feature Module Blueprint

Template สำหรับสร้าง feature module ใหม่:

### 16.1 โครงสร้าง Feature ใหม่

```
src/features/myFeature/
├── MyFeaturePage.tsx            # Main client component ("use client")
├── myFeatureConstants.ts        # Constants, config values
├── myFeatureUtils.ts            # Pure utility functions
├── myFeatureUtils.test.ts       # Unit tests
├── components/                  # Feature-specific components
│   ├── MyFeatureCard.tsx
│   ├── MyFeatureFilter.tsx
│   └── MyFeatureSkeletons.tsx   # Loading skeletons
└── hooks/                       # Feature-specific hooks (ถ้ามี)
    └── useMyFeatureData.ts
```

### 16.2 Checklist เมื่อสร้าง Feature ใหม่

```markdown
- [ ] สร้าง feature folder ใน `src/features/`
- [ ] สร้าง API functions ใน `src/services/api/myFeatureApi.ts`
- [ ] เพิ่ม re-export ใน `src/services/apiServices.ts`
- [ ] เพิ่ม query keys ใน `src/constants/query.ts`
- [ ] เพิ่ม types ใน `src/types/` (ถ้าใช้ข้าม feature)
- [ ] สร้าง route ใน `app/(group)/my-feature/page.tsx`
- [ ] เขียน unit tests สำหรับ utils/hooks
- [ ] ตรวจ loading / error / empty states
- [ ] ตรวจ responsive (mobile / desktop)
- [ ] ตรวจว่าใช้ `"use client"` เฉพาะที่จำเป็น
```

### 16.3 ตัวอย่าง Feature Module ที่ดี

ดูตัวอย่างจาก `features/bookUpdates/`:

```
features/bookUpdates/
├── BookUpdatesPage.tsx           # Main page ("use client")
├── bookUpdatesConstants.ts       # Limits, scope options
├── bookUpdatesUtils.ts           # getEmptyText, isLoginRequiredError
└── components/
    ├── BookUpdatesSwiper.tsx      # Book carousel
    ├── BookUpdatesSkeletons.tsx   # Loading states
    ├── CalendarStrip.tsx          # Calendar date selector
    └── FilterBar.tsx              # Scope/content type filters
```

**ทำไมดี:**
- มี constants แยกออกมา (ไม่ hardcode ใน component)
- มี utils แยกออกมา (testable, reusable)
- มี skeleton components สำหรับ loading state
- Components แยกเป็นไฟล์ย่อยๆ ที่ focused

---

## 17. Environment & Config Gotchas

### 17.1 Environment Variables

```bash
# .env — ใช้ทุก environment
# .env.development — ใช้เฉพาะ dev
# .env.production — ใช้เฉพาะ production (ถ้ามี)

# ✅ ตัวแปรที่ใช้ใน client ต้องขึ้นต้นด้วย NEXT_PUBLIC_
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXX

# ✅ ตัวแปรที่ใช้เฉพาะ server (API keys, secrets) ไม่ต้องขึ้นต้น NEXT_PUBLIC_
DATABASE_URL=postgres://...
SECRET_KEY=...

# ❌ อย่าเก็บ secrets ใน NEXT_PUBLIC_ → มันจะถูก bundle เข้า client code
```

### 17.2 Turbopack Gotchas

```bash
# Dev ใช้ Turbopack (เร็วกว่า Webpack)
bun run dev  # → next dev --turbopack

# ⚠️ บาง plugins/features อาจ behave ต่างจาก Webpack
# ⚠️ ถ้าเจอ issue แปลกๆ ใน dev → ลอง build เทียบกับ production
bun run build  # → next build --turbopack
```

### 17.3 React Query Default Config

ตั้งค่าไว้ใน `app/providers.tsx` — ทุก query จะได้ค่า default:

```ts
// Default options ที่ใช้ทั้ง app:
{
  staleTime: 60 * 1000,    // 1 minute
  retry: 1,                 // retry 1 ครั้ง
  retryDelay: 3000,          // รอ 3 วินาทีก่อน retry
  gcTime: 5 * 60 * 1000,    // garbage collect หลัง 5 นาที
}

// ⚠️ ถ้าต้องการค่าต่าง → override ใน useQuery เฉพาะตัว
// ⚠️ อย่าเปลี่ยน default ใน providers.tsx โดยไม่ปรึกษาทีม
```

### 17.4 Ant Design + React 19

ต้อง import patch ก่อน Ant Design components:

```tsx
// ✅ MUST — import patch ก่อน (ใน client-providers.tsx)
import "@ant-design/v5-patch-for-react-19";

// ⚠️ ถ้าลืม → อาจเจอ hydration mismatch หรือ runtime errors
```

### 17.5 Provider Order

ลำดับ providers สำคัญ — ห้ามสลับ:

```
QueryClientProvider           ← ชั้นนอกสุด (data layer)
  └─ SocketProvider           ← real-time events
      └─ ConfigProvider (Ant) ← theme config
          └─ App (Ant)        ← notification/message API
              └─ {children}   ← actual pages
```

---

## Quick Reference Cheat Sheet

```
สร้าง component ใหม่ → ดูว่า reusable ไหม → components/ หรือ features/
สร้าง API call ใหม่ → services/api/xxxApi.ts → re-export ใน apiServices.ts
สร้าง type ใหม่ → types/xxx.ts (global) หรือ inline ใน feature
สร้าง hook ใหม่ → hooks/ (shared) หรือ features/xxx/hooks/ (scoped)
สร้าง store ใหม่ → stores/xxxStore.ts (ตาม pattern authStore/uiStore)
สร้าง query key → constants/query.ts (ห้ามสร้างที่อื่น)
สร้างหน้าใหม่ → app/(group)/route/page.tsx → delegate ไป features/
```

## Decision Flowcharts

### "ควรสร้าง component ใหม่ที่ไหน?"

```
Component นี้จะถูกใช้ในหลาย feature/page ไหม?
├── ใช่ → src/components/[domain]/
│         └── มี domain เฉพาะไหม? (เช่น book, auth)
│             ├── ใช่ → src/components/bookdetail/
│             └── ไม่ → src/components/common/ หรือ src/components/ui/
└── ไม่ → src/features/[featureName]/components/
```

### "ควรเก็บ state ที่ไหน?"

```
Data มาจาก API ไหม?
├── ใช่ → React Query (useQuery)
└── ไม่ → State ต้องการ share ข้าม component ไหม?
          ├── ใช่ → ข้าม page ไหม?
          │         ├── ใช่ → Zustand store
          │         └── ไม่ → Props หรือ Context
          └── ไม่ → useState / useReducer
```

### "ควรเขียน test ไหม?"

```
เป็น utility function (pure logic)?
├── ใช่ → ✅ เขียน unit test เสมอ
└── ไม่ → เป็น Zustand store?
          ├── ใช่ → ✅ เขียน unit test (test actions + state changes)
          └── ไม่ → เป็น custom hook ที่มี logic ซับซ้อน?
                    ├── ใช่ → ✅ เขียน unit test
                    └── ไม่ → เป็น critical user flow (login, payment)?
                              ├── ใช่ → ✅ เขียน E2E test
                              └── ไม่ → optional (แต่แนะนำ)
```
