"use client";

import { Modal, Button } from "antd";
import { ExclamationCircleOutlined, UserOutlined, CalendarOutlined } from "@ant-design/icons";

interface AgeVerificationModalProps {
  open: boolean;
  type: "login_required" | "underage" | "birthday_missing";
  onAction: () => void;
}

export default function AgeVerificationModal({
  open,
  type,
  onAction,
}: AgeVerificationModalProps) {
  
  const getConfig = () => {
    switch (type) {
      case "login_required":
        return {
          title: "จำกัดอายุ 18+",
          description: "เนื้อหานี้มีการจำกัดอายุผู้เข้าชม กรุณาเข้าสู่ระบบเพื่อยืนยันตัวตน",
          buttonText: "เข้าสู่ระบบ",
          icon: <UserOutlined className="text-4xl text-blue-500" />,
          buttonColor: "!bg-red-600 hover:!bg-red-700",
        };
      case "birthday_missing":
        return {
          title: "ข้อมูลไม่ครบถ้วน",
          description: "ไม่พบข้อมูลวันเกิดของคุณ กรุณาระบุวันเกิดในหน้าโปรไฟล์เพื่อยืนยันอายุ",
          buttonText: "ไปที่หน้าโปรไฟล์",
          icon: <CalendarOutlined className="text-4xl text-orange-500" />,
          buttonColor: "bg-orange-500 hover:bg-orange-600",
        };
      case "underage":
        return {
          title: "ขออภัย เนื้อหานี้สำหรับผู้ที่มีอายุ 18 ปีขึ้นไป",
          description: "อายุของคุณไม่ถึงเกณฑ์ที่กำหนด กรุณาตรวจสอบข้อมูลวันเกิดอีกครั้งหากมีความผิดพลาด",
          buttonText: "ตรวจสอบข้อมูลส่วนตัว",
          icon: <ExclamationCircleOutlined className="text-4xl !text-red-500" />,
          buttonColor: "!bg-red-500 hover:!bg-red-600",
        };
    }
  };

  const config = getConfig();

  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      maskClosable={false}
      centered
      keyboard={false}
      width={500}
      className="text-center"
    >
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <div className="bg-gray-50 p-4 rounded-full mb-2">
            {config.icon}
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">
            {config.title}
        </h2>
        
        <p className="text-gray-600 text-center">
            {config.description}
        </p>

        <Button 
            type="primary" 
            size="large" 
            onClick={onAction}
            className={`w-full h-12 text-lg font-medium rounded-xl shadow-lg transition-all transform hover:scale-[1.02] ${config.buttonColor}`}
        >
            {config.buttonText}
        </Button>
      </div>
    </Modal>
  );
}
