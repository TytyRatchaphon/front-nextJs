"use client";

import { Select } from "antd";
import { ArrowDownUp } from "lucide-react";
import type { UpdateContentType, UpdateScope, UpdateSort } from "@/services/api/bookUpdatesApi";
import { contentTypeOptions, scopeOptions, sortSelectOptions } from "../bookUpdatesConstants";
import { FilterPill } from "./FilterPill";

type FilterBarProps = {
  scope: UpdateScope;
  contentType: UpdateContentType;
  sort: UpdateSort;
  isLoggedIn: boolean;
  onScopeChange: (scope: UpdateScope) => void;
  onContentTypeChange: (contentType: UpdateContentType) => void;
  onSortChange: (sort: UpdateSort) => void;
};

export function FilterBar({
  scope,
  contentType,
  sort,
  isLoggedIn,
  onScopeChange,
  onContentTypeChange,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="mb-6 rounded-[30px] border border-rose-100 bg-white/85 p-4 shadow-[0_20px_70px_rgba(84,30,35,0.06)]">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-black text-stone-800">ดูจาก</p>
            <div className="flex flex-wrap gap-2">
              {scopeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <FilterPill
                    key={option.value}
                    active={scope === option.value}
                    locked={option.requiresLogin && !isLoggedIn}
                    onClick={() => onScopeChange(option.value)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </FilterPill>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-black text-stone-800">ประเภทนิยาย</p>
            <div className="flex flex-wrap gap-2">
              {contentTypeOptions.map((option) => (
                <FilterPill
                  key={option.value}
                  active={contentType === option.value}
                  onClick={() => onContentTypeChange(option.value)}
                >
                  {option.label}
                </FilterPill>
              ))}
            </div>
          </div>
        </div>

        <div className="block lg:pt-0">
          <span className="mb-2 flex items-center gap-2 text-sm font-black text-stone-800">
            <ArrowDownUp className="h-4 w-4" />
            เรียงตาม
          </span>
          <Select<UpdateSort>
            value={sort}
            onChange={onSortChange}
            options={sortSelectOptions}
            size="large"
            className="book-updates-sort-select w-full"
            classNames={{ popup: { root: "book-updates-sort-dropdown" } }}
          />
        </div>
      </div>
    </div>
  );
}
