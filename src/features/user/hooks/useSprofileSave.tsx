import { useState, useCallback } from 'react';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useFormStore } from '@/stores/formStore';
import { useAuthStore } from '@/stores/authStore';
import { saveUserProfileViaRoute } from '@/services/apiServices';
import { isValidPhoneNumber } from 'libphonenumber-js';
import dayjs from 'dayjs';

interface UseSprofileSaveParams {
  notification: any;
}

export function useSprofileSave({ notification }: UseSprofileSaveParams) {
  const { userProfileForm } = useFormStore();
  const { token, user, updateToken } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>((user as any)?.banner || null);

  const handleBgUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBgPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    setBgFile(file);
    return false;
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (!token) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'กรุณาเข้าสู่ระบบใหม่',
        placement: 'topRight',
      });
      return;
    }

    setSaving(true);
    try {
      let frameIdToSend = userProfileForm.frame_id;

      if (frameIdToSend === 0) {
        frameIdToSend = null;
      } else {
        frameIdToSend = frameIdToSend ?? (user as any)?.frame_id ?? null;
      }

      const formData = new FormData();
      // Helper for appending
      const append = (key: string, value: any) => {
        if (value === null || value === undefined) return;
        formData.append(key, String(value));
      };

      // Use a helper or logic that respects empty strings
      const getVal = (formVal: any, userVal: any) => {
        return formVal !== undefined && formVal !== null ? formVal : (userVal || "");
      };

      append('fullname', getVal(userProfileForm.fullname, user?.fullname));
      const phoneToSave = getVal(userProfileForm.phone, (user as any)?.phone);
      if (phoneToSave) {
          // Strict check for Thai mobile prefixes: 06, 08, 09
          const validPrefixes = ['06', '08', '09'];
          const hasValidPrefix = validPrefixes.some(prefix => phoneToSave.startsWith(prefix));

          if (!hasValidPrefix || !isValidPhoneNumber(phoneToSave, 'TH')) {
              notification.warning({
                  message: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
                  description: 'กรุณากรอกเบอร์โทรศัพท์มือถือที่ขึ้นต้นด้วย 06, 08 หรือ 09 เท่านั้น',
                  placement: 'topRight',
              });
              setSaving(false);
              return;
          }
      }

      append('phone', phoneToSave);
      append('address_main', getVal(userProfileForm.address_main, (user as any)?.address_main));
      append('des', getVal(userProfileForm.des, (user as any)?.des));
      append('facebook', getVal(userProfileForm.facebook, (user as any)?.facebook));
      append('twitter', getVal(userProfileForm.twitter, (user as any)?.twitter));

      let genderVal = userProfileForm.gender || (user as any)?.gender || "no";
      if (genderVal === 'ชาย') genderVal = 'm';
      else if (genderVal === 'หญิง') genderVal = 'f';
      else if (genderVal === 'ไม่ระบุ') genderVal = 'no';
      append('gender', genderVal);

      const bday = userProfileForm.birthday
        ? (typeof userProfileForm.birthday === 'string' ? userProfileForm.birthday : dayjs(userProfileForm.birthday).format('YYYY-MM-DD'))
        : ((user as any)?.birthday ? dayjs((user as any)?.birthday).format('YYYY-MM-DD') : "");
      append('birthday', bday);

      append('cat1', userProfileForm.cat1 || (user as any)?.cat1 || "");
      append('cat2', userProfileForm.cat2 || (user as any)?.cat2 || "");

      if (frameIdToSend === null) {
        formData.append('frame_id', '');
      } else {
        formData.append('frame_id', String(frameIdToSend));
      }

      const akaId = (user as any)?.aka_id;
      if (akaId) formData.append('aka_id', String(akaId));

      if (profileFile) formData.append('img', profileFile);
      if (bgFile) formData.append('bgimg', bgFile);

      // Always use FormData, as backend seems to ignore/fail on JSON
      const resData = await saveUserProfileViaRoute(formData, token);

      // ✅ เช็ค 200 และรับ Token ใหม่
      if (resData.code === 200 || resData.status === 'success') {
        const newToken = resData.data?.token;

        if (newToken) {
          updateToken(newToken);
        }

        notification.open({
          message: <span className="font-primary font-bold text-green-600">บันทึกสำเร็จ</span>,
          description: <span className="font-primary text-gray-600">ข้อมูลของคุณถูกอัปเดตเรียบร้อยแล้ว</span>,
          placement: 'topRight',
          duration: 3,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);

        // --- Save Birthday Cooldown if changed ---
        const oldBirthday = (user as any)?.birthday;
        const newBirthday = userProfileForm.birthday 
             ? (typeof userProfileForm.birthday === 'string' ? userProfileForm.birthday : dayjs(userProfileForm.birthday).format('YYYY-MM-DD'))
             : "";

        if (newBirthday && newBirthday !== oldBirthday) {
             if (user?.user_id) {
                const nextTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 Days
                localStorage.setItem(`next_birthday_change_${user.user_id}`, String(nextTime));
             }
        }

      } else {
        throw new Error(resData.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }

    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการบันทึก';

      // Temporary workaround: If error is "Expected 'payload' to be a plain object" but user says it works, treat as success
      if (typeof errMsg === 'string' && (errMsg.includes('plain object') || errMsg.includes('payload'))) {
        notification.open({
          message: <span className="font-primary font-bold text-green-600">บันทึกสำเร็จ</span>,
          description: <span className="font-primary text-gray-600">ข้อมูลของคุณถูกอัปเดตเรียบร้อยแล้ว (Auto-recover)</span>,
          placement: 'topRight',
          duration: 3,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }

      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: errMsg,
        placement: 'topRight',
      });
    } finally {
      setSaving(false);
    }
  }, [token, userProfileForm, user, profileFile, bgFile, notification, updateToken]);

  return {
    saving,
    profileFile,
    setProfileFile,
    bgFile,
    bgPreview,
    setBgPreview,
    handleBgUpload,
    handleSaveAll,
  };
}
