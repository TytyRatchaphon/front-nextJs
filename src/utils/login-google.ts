// src/utils/login-google.ts
"use client";

import apiClient from "@/services/apiClient";
import { message } from "antd";
import { parseJwt } from "./socialLogin";

// Google Configuration
export const GOOGLE_CLIENT_ID =
  "36558994619-rr5hree4o8jgjiugvrjprtj3padreg6o.apps.googleusercontent.com";

// Types
export interface GoogleLoginResponse {
  credential: string;
}

export interface GoogleUserData {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

export interface GoogleLoginPayload {
  token: string;
  email: string;
  name: string;
  picture: string;
}

// Load Google Script
export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.google) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
};

// Initialize Google Sign-In
export const initializeGoogleSignIn = (
  clientId: string,
  callback: (response: GoogleLoginResponse) => void
) => {
  if (typeof window !== "undefined" && window.google) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: callback,
    });
  }
};

// Google Login Handler
export const handleGoogleLogin = async (
  response: GoogleLoginResponse,
  onSuccess: (userData: any, token: string) => void,
  onCancel?: () => void
) => {
  try {
    console.log("Google JWT Token:", response.credential);

    // ถอดรหัส JWT token
    const userData = parseJwt(response.credential);
    if (!userData) {
      message.error("ไม่สามารถถอดรหัสข้อมูลจาก Google ได้");
      return;
    }

    console.log("Google User Info:", userData);

    // เตรียมข้อมูลที่จะส่งไป Backend
    const googlePayload: GoogleLoginPayload = {
      token: response.credential,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
    };

    console.log("=".repeat(60));
    console.log("📤 SENDING TO BACKEND - GOOGLE LOGIN");
    console.log("=".repeat(60));
    console.log("🌐 Endpoint: POST /login/google");
    console.log("📦 Full Payload:");
    console.log(JSON.stringify(googlePayload, null, 2));
    console.log("👤 User Details:");
    console.log("   📧 Email:", googlePayload.email);
    console.log("   👨 Name:", googlePayload.name);
    console.log("   🖼️ Picture URL:", googlePayload.picture);
    console.log("   🔑 Token Length:", googlePayload.token.length, "characters");
    console.log("=".repeat(60));

    // ส่งข้อมูลไป Backend
    const apiResponse = await apiClient.post("/login/google", googlePayload);

    console.log("✅ BACKEND RESPONSE - GOOGLE LOGIN");
    console.log("Full Response:", apiResponse.data);
    console.log("=".repeat(60));

    if (
      apiResponse.data &&
      apiResponse.data.data &&
      apiResponse.data.data.token
    ) {
      const backendUserData = apiResponse.data.data;
      const token = apiResponse.data.data.token;
      
      // Call success callback
      onSuccess(backendUserData, token);
      
      message.success("เข้าสู่ระบบด้วย Google สำเร็จ!");
      
      // Close modal if callback provided
      if (onCancel) {
        onCancel();
      }
    }
  } catch (error: any) {
    console.error("Google Login Error:", error);
    
    if (error.code === "ERR_NETWORK") {
      message.error(
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
      );
    } else if (error.response) {
      message.error(
        error.response?.data?.message || "เข้าสู่ระบบด้วย Google ไม่สำเร็จ"
      );
    } else {
      message.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    }
  }
};

// Trigger Google Sign-In Prompt
export const triggerGoogleSignIn = () => {
  if (typeof window !== "undefined" && window.google) {
    window.google.accounts.id.prompt();
  }
};
