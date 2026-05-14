import type { ReactNode } from "react";
import AppShell from "@/app/app-shell";

export default function ReaderLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
