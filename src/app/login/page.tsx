"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Spin } from "antd";
import { useUIStore } from "@/stores/uiStore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openLoginModal = useUIStore((s: any) => s.openLoginModal);
  const { notification } = App.useApp();

  useEffect(() => {
    // If the URL contains message=logged_out, show a warning notification
    const message = searchParams.get("message");
    
    if (message === "logged_out") {
      notification.warning({
        message: "ออกจากระบบ",
        description: "บัญชีนี้ถูกเข้าสู่ระบบจากอุปกรณ์อื่น ระบบจึงทำการออกจากระบบโดยอัตโนมัติ",
        placement: "topRight",
        duration: 5,
      });
    }

    // Always trigger the login modal when visiting /login
    openLoginModal();
    
    // Redirect back to home so the user doesn't stay on an empty /login route
    router.replace("/");
  }, [router, searchParams, notification, openLoginModal]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Spin size="large" />
      <p className="mt-4 font-primary text-gray-500">กำลังพาคุณไปยังหน้าแรก...</p>
    </div>
  );
}
