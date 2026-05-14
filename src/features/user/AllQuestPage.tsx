"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "antd";
import { ChevronLeft } from "lucide-react";

import GifLoader from "@/components/utility/GifLoader";
import { useAuthStore } from "@/stores/authStore";
import RpQuestPanel from "@/features/user/components/RpQuestPanel";

const AllQuestPage = () => {
  const { isLoggedIn, hasMounted } = useAuthStore();

  React.useEffect(() => {
    document.title = "เควสทั้งหมด - EnjoyBook";
  }, []);

  if (!hasMounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white font-primary">
        <GifLoader width={150} height={150} />
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center font-primary">
        <h1 className="text-2xl font-black text-slate-950">กรุณาเข้าสู่ระบบก่อนดูเควส</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          ภารกิจเพิ่มแต้ม จะอ้างอิงความคืบหน้าจากบัญชีของคุณ
        </p>
        <Link href="/" className="mt-5 inline-flex">
          <Button type="primary" danger className="h-11 rounded-full px-6 font-bold">
            กลับหน้าหลัก
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-10 pt-6 font-primary">
      <div className="container mx-auto px-4">
        <Link
          href="/mprofile"
          className="mb-4 inline-flex h-10 items-center gap-2 rounded-full border border-red-100 bg-white px-4 text-sm font-bold !text-red-600 shadow-sm transition-all hover:!border-red-600 hover:!bg-red-600 hover:!text-white"
        >
          <ChevronLeft size={16} />
          กลับโปรไฟล์
        </Link>

        <RpQuestPanel mode="full" />
      </div>
    </main>
  );
};

export default AllQuestPage;
