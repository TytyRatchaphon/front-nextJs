"use client";

import type * as React from "react";
import { LockKeyhole } from "lucide-react";

export function FilterPill({
  active,
  children,
  onClick,
  locked,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active ? { color: "#ffffff" } : undefined}
      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#0891B2] ${
        active
          ? "border-[#ef304b] bg-[#ef304b] !text-white [&_svg]:!text-white"
          : "border-rose-100 bg-white text-stone-700 hover:border-rose-300 hover:bg-rose-50"
      }`}
    >
      {locked ? <LockKeyhole className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}
