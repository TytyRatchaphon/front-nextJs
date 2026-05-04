"use client";

import { Modal } from "antd";

type ReadQuotaModalsProps = {
  quotaLoginModalOpen: boolean;
  firstTopupModalOpen: boolean;
  onQuotaLoginClose: () => void;
  onFirstTopupClose: () => void;
  onLogin: () => void;
  onGoHome: () => void;
  onGoStore: () => void;
};

export function ReadQuotaModals({
  quotaLoginModalOpen,
  firstTopupModalOpen,
  onQuotaLoginClose,
  onFirstTopupClose,
  onLogin,
  onGoHome,
  onGoStore,
}: ReadQuotaModalsProps) {
  return (
    <>
      <Modal
        open={quotaLoginModalOpen}
        footer={null}
        closable={false}
        maskClosable
        onCancel={onQuotaLoginClose}
        centered
        width={420}
        zIndex={2100}
      >
        <div className="py-3 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 10V7a5 5 0 0 1 10 0v3" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <circle cx="12" cy="15" r="1" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">สิ้นสุดโควต้าอ่านฟรี</h3>
          <p className="mt-2 text-xl font-bold text-gray-800">อยากอ่านต่อฟรีอีก 30 ตอน?</p>
          <p className="mt-3 text-base leading-7 text-gray-500">
            แค่เข้าสู่ระบบก็รับสิทธิ์อ่านตอนฟรีแบบจุกๆ
            พร้อมสิทธิพิเศษอื่นๆ อีกมากมายได้ทันที
          </p>
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-red-600 py-3 text-lg font-bold !text-white hover:bg-red-700"
            onClick={() => {
              onQuotaLoginClose();
              onLogin();
            }}
          >
            เข้าสู่ระบบเพื่ออ่านต่อ
          </button>
          <button
            type="button"
            className="mt-4 w-full py-2 text-lg font-semibold text-gray-500 hover:text-gray-700"
            onClick={() => {
              onQuotaLoginClose();
              onGoHome();
            }}
          >
            กลับหน้าหลัก
          </button>
        </div>
      </Modal>
      <Modal
        open={firstTopupModalOpen}
        footer={null}
        closable={false}
        maskClosable
        onCancel={onFirstTopupClose}
        centered
        width={420}
        zIndex={2100}
      >
        <div className="py-3 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 7h18" strokeLinecap="round" />
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M16 13h2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">อ่านฟรีครบ 40 ตอนแล้ว</h3>
          <p className="hidden">
            รับสิทธิ์เติมเงินครั้งแรกราคาพิเศษ
            เพื่อปลดล็อกตอนต่อไปได้ทันที
          </p>
          <p className="mt-2 text-base leading-7 text-gray-500">
            อ่านฟรีครบแล้ว รับสิทธิ์เติมเงินครั้งแรกราคาพิเศษ
          </p>
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-red-600 py-3 text-lg font-bold !text-white hover:bg-red-700"
            onClick={() => {
              onFirstTopupClose();
              onGoStore();
            }}
          >
            เติมเงินครั้งแรกราคาพิเศษ
          </button>
          <button
            type="button"
            className="mt-4 w-full py-2 text-lg font-semibold text-gray-500 hover:text-gray-700"
            onClick={onFirstTopupClose}
          >
            ไว้ทีหลัง
          </button>
        </div>
      </Modal>
    </>
  );
}
