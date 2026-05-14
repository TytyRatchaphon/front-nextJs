"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Spin } from "antd";
import { useUIStore } from "@/stores/uiStore";

function LoginPageLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Spin size="large" />
      <p className="mt-4 font-primary text-gray-500">กำลังพาคุณไปยังหน้าแรก...</p>
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openLoginModal = useUIStore((s: any) => s.openLoginModal);
  const { notification } = App.useApp();

  useEffect(() => {
    const message = searchParams.get("message");

    if (message === "logged_out") {
      notification.warning({
        message: "ออกจากระบบ",
        description: "บัญชีนี้ถูกเข้าสู่ระบบจากอุปกรณ์อื่น ระบบจึงทำการออกจากระบบโดยอัตโนมัติ",
        placement: "topRight",
        duration: 5,
      });
    }

    openLoginModal();
    router.replace("/");
  }, [router, searchParams, notification, openLoginModal]);

  return <LoginPageLoading />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageContent />
    </Suspense>
  );
}
