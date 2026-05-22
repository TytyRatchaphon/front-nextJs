import type * as React from "react";
import { Library, Sparkles, UserRoundCheck } from "lucide-react";
import type { UpdateContentType, UpdateScope, UpdateSort } from "@/services/api/bookUpdatesApi";

export const BOOK_UPDATES_LIMIT = 200;

export const scopeOptions: Array<{
  value: UpdateScope;
  label: string;
  description: string;
  requiresLogin?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "all", label: "ทั้งหมด", description: "ทุกเรื่องที่อัปเดต", icon: Sparkles },
  {
    value: "shelf",
    label: "ชั้นหนังสือ",
    description: "เฉพาะเรื่องที่เก็บไว้",
    requiresLogin: true,
    icon: Library,
  },
  {
    value: "following",
    label: "นักเขียนที่ติดตาม",
    description: "จากนักเขียนคนโปรด",
    requiresLogin: true,
    icon: UserRoundCheck,
  },
];

export const contentTypeOptions: Array<{ value: UpdateContentType; label: string }> = [
  { value: "all", label: "นิยายทั้งหมด" },
  { value: "novel", label: "นิยายรายตอน" },
  { value: "novel_pack", label: "นิยายมัดแพ็ค" },
];

export const sortOptions: Array<{ value: UpdateSort; label: string }> = [
  { value: "publish_time", label: "เวลาที่ลง" },
  { value: "view", label: "ยอดวิวสูงสุด" },
  { value: "bestseller", label: "ขายดี" },
];

export const sortSelectOptions = sortOptions.map((option) => ({
  value: option.value,
  label: option.label,
}));
