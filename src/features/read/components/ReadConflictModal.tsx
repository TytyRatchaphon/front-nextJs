import React, { useState } from 'react';
import { Modal, Button, App } from 'antd';
import { useRouter } from 'next/navigation';
import { ActiveDevice, ReadingSessionActiveData, logoutOtherDevice } from '@/services/apiServices';
import { LaptopOutlined, MobileOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface ReadConflictModalProps {
  open: boolean;
  bookId: string;
  conflictData: ReadingSessionActiveData | null;
  onTakeover: () => Promise<void>;
  onRefreshList: () => Promise<void>;
}

export const ReadConflictModal: React.FC<ReadConflictModalProps> = ({
  open,
  bookId,
  conflictData,
  onTakeover,
  onRefreshList,
}) => {
  const router = useRouter();
  const { notification, modal } = App.useApp();
  const [takeoverLoading, setTakeoverLoading] = useState(false);
  const [logoutLoadingId, setLogoutLoadingId] = useState<string | null>(null);

  const handleTakeover = async () => {
    setTakeoverLoading(true);
    try {
      await onTakeover();
    } finally {
      setTakeoverLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push(`/book/${bookId}`);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleLogoutOther = (deviceId: string) => {
    modal.confirm({
      title: 'ยืนยันการออกจากระบบ',
      icon: <ExclamationCircleOutlined />,
      content: 'คุณต้องการให้อุปกรณ์นี้ออกจากระบบใช่หรือไม่?',
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      zIndex: 5002,
      onOk: async () => {
        setLogoutLoadingId(deviceId);
        try {
          await logoutOtherDevice(deviceId);
          notification.success({
            message: 'ออกจากระบบสำเร็จ',
            description: 'อุปกรณ์ดังกล่าวถูกออกจากระบบแล้ว',
            placement: 'topRight',
          });
          await onRefreshList();
        } catch (error: any) {
          notification.error({
            message: 'ไม่สามารถออกจากระบบได้',
            description: error?.response?.data?.message || 'เกิดข้อผิดพลาดบางอย่าง',
            placement: 'topRight',
          });
        } finally {
          setLogoutLoadingId(null);
        }
      },
    });
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <MobileOutlined className="text-lg" />;
    }
    return <LaptopOutlined className="text-lg" />;
  };

  const getDeviceLabel = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    const device = ua.includes('iphone')
      ? 'iPhone'
      : ua.includes('ipad')
        ? 'iPad'
        : ua.includes('android')
          ? 'Android'
          : ua.includes('windows')
            ? 'Windows'
            : ua.includes('mac')
              ? 'Mac'
              : 'อุปกรณ์ไม่ทราบชนิด';

    const browser = ua.includes('edg/')
      ? 'Edge'
      : ua.includes('chrome/')
        ? 'Chrome'
        : ua.includes('safari/')
          ? 'Safari'
          : ua.includes('firefox/')
            ? 'Firefox'
            : '';

    return browser ? `${device} · ${browser}` : device;
  };

  const formatLastSeen = (value?: string) => {
    if (!value) return 'ไม่พบเวลาใช้งานล่าสุด';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'ไม่พบเวลาใช้งานล่าสุด';

    return new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Bangkok',
    }).format(date);
  };

  const activeDevices = [...(conflictData?.active_devices || [])].sort((a, b) => {
    if (a.is_current_device !== b.is_current_device) return a.is_current_device ? -1 : 1;
    if (a.is_reading !== b.is_reading) return a.is_reading ? -1 : 1;
    return 0;
  });

  const renderDevice = (device: ActiveDevice) => {
    if (!device) return null;

    const userAgent = device.user_agent || 'ไม่ทราบอุปกรณ์';
    const canLogout = !device.is_current_device && device.can_logout;

    return (
      <article
        key={device.device_id}
        className={`rounded-2xl border bg-white p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.45)] transition ${
          device.is_current_device
            ? 'border-blue-200 bg-blue-50/60'
            : device.is_reading
              ? 'border-red-100'
              : 'border-slate-200'
        }`}
      >
        <div className="flex gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              device.is_current_device
                ? 'bg-blue-100 text-blue-600'
                : device.is_reading
                  ? 'bg-red-50 text-red-500'
                  : 'bg-slate-100 text-slate-500'
            }`}
          >
            {getDeviceIcon(userAgent)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate text-sm font-bold text-slate-900">
                {getDeviceLabel(userAgent)}
              </h4>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  device.is_current_device
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-50 text-orange-600'
                }`}
              >
                {device.is_current_device ? 'เครื่องนี้' : 'เครื่องอื่น'}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  device.is_reading
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {device.is_reading ? 'กำลังอ่าน' : 'เปิดหน้าอ่านอยู่'}
              </span>
            </div>

            <p className="mt-1 line-clamp-1 text-xs text-slate-500" title={userAgent}>
              {userAgent}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              ใช้งานล่าสุด: {formatLastSeen(device.last_seen_at)}
            </p>
          </div>
        </div>

        {canLogout ? (
          <div className="mt-3 flex justify-end">
            <Button
              danger
              size="small"
              loading={logoutLoadingId === device.device_id}
              onClick={() => handleLogoutOther(device.device_id)}
              className="font-primary font-semibold"
            >
              ออกจากระบบเครื่องนี้
            </Button>
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <Modal
      open={open}
      closable={false}
      maskClosable={false}
      footer={null}
      width={640}
      centered
      zIndex={5001}
      title={null}
    >
      <div className="font-primary">
        <section className="rounded-[24px] border border-red-100 bg-gradient-to-br from-red-50 via-white to-white p-5">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-500">
              <ExclamationCircleOutlined className="text-xl" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-500">Reading Conflict</p>
              <h3 className="mt-1 text-xl font-bold leading-snug text-slate-950">
                บัญชีนี้กำลังอ่านจากอุปกรณ์อื่น
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                เพื่อป้องกันข้อมูลการอ่านทับกัน เลือกอ่านต่อบนอุปกรณ์นี้ หรือกลับไปอ่านบนอุปกรณ์เดิม
              </p>
            </div>
          </div>
        </section>

        <div className="my-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-slate-900">อุปกรณ์ที่เปิดหน้าอ่านอยู่</h4>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {activeDevices.length} เครื่อง
            </span>
          </div>

          <div className="max-h-[340px] space-y-3 overflow-y-auto rounded-[22px] border border-slate-200 bg-slate-50 p-3">
            {activeDevices.length > 0 ? (
              activeDevices.map(renderDevice)
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm font-medium text-slate-500">
                ไม่พบอุปกรณ์อื่น
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            size="large"
            onClick={handleGoHome}
            className="w-full border-none font-primary font-medium sm:w-auto"
          >
            กลับหน้าหลัก
          </Button>
          <Button
            size="large"
            onClick={handleGoBack}
            className="w-full font-primary font-medium sm:w-auto"
          >
            กลับหน้าหนังสือ
          </Button>
          <Button
            type="primary"
            size="large"
            loading={takeoverLoading}
            onClick={handleTakeover}
            className="w-full border-none bg-[#FF0037] font-primary font-semibold hover:bg-red-600 sm:w-auto"
          >
            อ่านบนอุปกรณ์นี้
          </Button>
        </div>
      </div>
    </Modal>
  );
};
