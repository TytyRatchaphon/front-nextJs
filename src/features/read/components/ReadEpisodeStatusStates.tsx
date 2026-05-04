"use client";

import { Alert, Button } from "antd";

import GifLoader from "@/components/utility/GifLoader";

type ReadEpisodeLoadingStateProps = {
  currentBg?: {
    bg?: string;
  } | null;
};

type ReadEpisodeErrorStateProps = {
  errorMessage: string;
  isAccessError: boolean;
  onBack: () => void;
  onRetry: () => void;
};

export function ReadEpisodeLoadingState({ currentBg }: ReadEpisodeLoadingStateProps) {
  return (
    <div className={`min-h-screen ${currentBg?.bg || "bg-white"}`}>
      <GifLoader />
    </div>
  );
}

export function ReadEpisodeErrorState({
  errorMessage,
  isAccessError,
  onBack,
  onRetry,
}: ReadEpisodeErrorStateProps) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Alert
          message={isAccessError ? "ไม่สามารถเข้าถึงตอนนี้ได้" : "เกิดข้อผิดพลาด"}
          description={
            <div>
              <p>{errorMessage}</p>
              {isAccessError && (
                <p className="mt-2 text-sm">
                  กรุณาตรวจสอบว่า:<br />• คุณได้ซื้อตอนนี้แล้วหรือไม่<br />• คุณได้เข้าสู่ระบบแล้วหรือไม่<br />• ลิงก์ที่คุณใช้ถูกต้องหรือไม่
                </p>
              )}
            </div>
          }
          type={isAccessError ? "warning" : "error"}
          showIcon
        />
        <div className="mt-6 text-center space-x-4">
          <Button type="primary" onClick={onBack}>← กลับหน้าก่อนหน้า</Button>
          {isAccessError && <Button onClick={onRetry}>🔄 ลองใหม่อีกครั้ง</Button>}
        </div>
      </div>
    </div>
  );
}
