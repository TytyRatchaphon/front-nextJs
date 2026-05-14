import type { ReactNode } from "react";
import AppShell from "@/app/app-shell";

export default function WriterLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
