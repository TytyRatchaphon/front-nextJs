"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { resolveSettingsImageSrc } from "@/utils/imageUtils";

type NavbarLogoProps = {
  logoSrc?: string | null;
  onOpenMobileMenu: () => void;
};

export default function NavbarLogo({ logoSrc, onOpenMobileMenu }: NavbarLogoProps) {
  return (
    <div className="flex flex-row items-center justify-center gap-2">
      <button
        type="button"
        aria-label="เปิดเมนู"
        onClick={onOpenMobileMenu}
        className="reader-mobile-nav-trigger flex h-10 w-10 items-center justify-center rounded-2xl border border-[#f0e5e2] bg-white text-[#1f1a1c] transition-all duration-200 hover:border-[#e5c2bb] hover:bg-[#fff6f5] active:scale-95 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Link className="w-10 lg:w-12 md:ms-[10px]" href="/">
        <Image
          className="w-full h-auto"
          src={resolveSettingsImageSrc(logoSrc, "/images/default-avatar.png")}
          unoptimized
          alt="Logo"
          width={48}
          height={48}
          style={{ color: "transparent" }}
        />
      </Link>
    </div>
  );
}
