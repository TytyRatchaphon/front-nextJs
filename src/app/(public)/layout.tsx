import type { ReactNode } from "react";
import AppShell from "@/app/app-shell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
