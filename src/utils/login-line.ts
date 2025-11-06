// src/utils/login-line.ts
"use client";

import apiClient from "@/services/apiClient";
import { message } from "antd";

// LINE Configuration
export const LIFF_ID = "2008384593-5BLnp8gx";

// Types
export interface LIFFProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LIFFDecodedIDToken {
  email?: string;
  name?: string;
  picture?: string;
}

export interface LineLoginPayload {
  name: string;
  email: string;
  userId: string;
  picture?: string;
}

// LIFF types are already declared in LoginButtonHeader.tsx
// We'll use 'any' type to avoid conflicts

// Load LIFF Script
export const loadLIFFScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.liff) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load LIFF script"));
    document.head.appendChild(script);
  });
};

// Initialize LIFF
export const initializeLIFF = async (liffId: string): Promise<void> => {
  try {
    if (typeof window !== "undefined" && window.liff) {
      await window.liff.init({ liffId });
      console.log("LIFF initialized successfully");
    }
  } catch (error) {
    console.error("LIFF initialization failed:", error);
    throw error;
  }
};

// LINE Login Handler
export const handleLineLogin = async (
  onSuccess: (userData: any, token: string) => void,
  onCancel?: () => void
) => {
  try {
    if (!window.liff) {
      message.error("LINE LIFF ยังไม่พร้อมใช้งาน");
      return;
    }

    if (!window.liff.isLoggedIn()) {
      // Redirect to LINE login
      window.liff.login();
      return;
    }

    // Get LINE profile
    const profile = await window.liff.getProfile();
    const decoded = window.liff.getDecodedIDToken();
    const email = decoded?.email || "";

    console.log("LINE Profile:", profile);
    console.log("LINE Email:", email);

    // เตรียมข้อมูลที่จะส่งไป Backend
    const linePayload: LineLoginPayload = {
      name: profile.displayName,
      email: email,
      userId: profile.userId,
      picture: profile.pictureUrl,
    };

    console.log("=".repeat(60));
    console.log("📤 SENDING TO BACKEND - LINE LOGIN");
    console.log("=".repeat(60));
    console.log("🌐 Endpoint: POST /login/line");
    console.log("📦 Full Payload:");
    console.log(JSON.stringify(linePayload, null, 2));
    console.log("👤 User Details:");
    console.log("   👨 Display Name:", linePayload.name);
    console.log("   📧 Email:", linePayload.email || "Not provided");
    console.log("   🆔 User ID:", linePayload.userId);
    console.log("   🖼️ Picture URL:", linePayload.picture);
    console.log("=".repeat(60));

    // ส่งข้อมูลไปยัง Backend
    const apiResponse = await apiClient.post("/login/line", linePayload);

    console.log("✅ BACKEND RESPONSE - LINE LOGIN");
    console.log("Full Response:", apiResponse.data);
    console.log("=".repeat(60));

    if (
      apiResponse.data &&
      apiResponse.data.data &&
      apiResponse.data.data.token
    ) {
      const userData = apiResponse.data.data;
      const token = apiResponse.data.data.token;
      
      // Call success callback
      onSuccess(userData, token);
      
      message.success("เข้าสู่ระบบด้วย LINE สำเร็จ!");
      
      // Close modal if callback provided
      if (onCancel) {
        onCancel();
      }
    }
  } catch (error: any) {
    console.error("LINE Login Error:", error);

    // ตรวจสอบประเภทของ error
    if (error.code === "ERR_NETWORK") {
      message.error(
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือลองใหม่อีกครั้ง"
      );
    } else if (error.response) {
      message.error(
        error.response?.data?.message || "เข้าสู่ระบบด้วย LINE ไม่สำเร็จ"
      );
    } else {
      message.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    }
  }
};

// LINE Logout
export const handleLineLogout = () => {
  if (typeof window !== "undefined" && window.liff && window.liff.isLoggedIn()) {
    window.liff.logout();
    message.success("ออกจากระบบ LINE สำเร็จ");
  }
};
