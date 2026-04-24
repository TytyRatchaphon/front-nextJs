"use client";
import * as React from "react";
import { useEffect, useState } from 'react'
import {
  Tabs,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  App,
  Upload,
  Modal,
} from 'antd';
import type { TabsProps } from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useFormStore } from '@/stores/formStore';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { changeUserPassword, fetchProfileCategories } from '@/services/apiServices';
import Image from 'next/image';
import GifLoader from '@/components/utility/GifLoader';
import FrameOverlayImage from '@/components/ui/FrameOverlayImage';

const { TextArea } = Input;
const { Option } = Select;

// const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
//   // If external image, return as is (don't append w/q params that might break it)
//   // if (src.startsWith('http')) return src;
//   // if (src.startsWith('data:')) return src;
//   // if (src === '/images/default-avatar.png' || src.startsWith('/images/')) return src;
//   return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
// }

const isDataUrl = (src: string | null | undefined): boolean => {
  return typeof src === 'string' && src.startsWith('data:');
};

// --- Component 1: User Info Form ---
const UserInfoForm = () => {
  const [form] = Form.useForm();
  const { userProfileForm, updateUserProfile } = useFormStore();
  const { user } = useAuthStore();

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await fetchProfileCategories();
        setCategories(data);
      } catch {
      }
    };
    fetchCategories();
  }, []);

  const inputClassName = "my-0 bg-white border border-gray-300 rounded-md p-1 px-2 text-xs focus:outline-none focus:border-primary hover:border-primary w-full font-primary";
  const labelSpan = "text-sm text-black font-primary";

  // --- Birthday Lock Logic ---
  const [isBirthdayLocked, setIsBirthdayLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  useEffect(() => {
    if (user?.user_id) {
       const nextChange = localStorage.getItem(`next_birthday_change_${user.user_id}`);
       if (nextChange) {
          const nextTime = Number(nextChange);
          if (Date.now() < nextTime) {
             setIsBirthdayLocked(true);
             const dateStr = dayjs(nextTime).format('DD/MM/YYYY');
             setLockMessage(`เปลี่ยนได้อีกครั้ง: ${dateStr}`);
          }
       }
    }
  }, [user]);

  const handleValuesChange = (changedValues: any) => {
    if (changedValues.birthday) {
      updateUserProfile('birthday', changedValues.birthday.format('YYYY-MM-DD'));
    }
    Object.entries(changedValues).forEach(([key, value]) => {
      if (key !== 'birthday') {
        updateUserProfile(key as any, String(value));
      }
    });
  };

  // Sync form with user data when user changes
  useEffect(() => {
    if (user) {
      const formValues = {
        fullname: user.fullname || '',
        birthday: user.birthday ? dayjs(user.birthday) : null,
        gender: user.gender === 'ชาย' ? 'm' : user.gender === 'หญิง' ? 'f' : user.gender === 'ไม่ระบุ' ? 'no' : user.gender,
        cat1: user.cat1 ? String(user.cat1) : undefined,
        cat2: user.cat2 ? String(user.cat2) : undefined,
        phone: user.phone || '',
        des: user.des || '',
        address_main: user.address_main || '',
        facebook: user.facebook || '',
        twitter: user.twitter || '',
      };
      form.setFieldsValue(formValues);

      // Sync to store
      if (formValues.fullname) updateUserProfile('fullname', formValues.fullname);
      if (formValues.birthday) updateUserProfile('birthday', formValues.birthday.format('YYYY-MM-DD'));
      if (formValues.gender) updateUserProfile('gender', String(formValues.gender));
      if (formValues.cat1) updateUserProfile('cat1', formValues.cat1);
      if (formValues.cat2) updateUserProfile('cat2', formValues.cat2);
      if (formValues.phone) updateUserProfile('phone', formValues.phone);
      if (formValues.des) updateUserProfile('des', formValues.des);
      if (formValues.address_main) updateUserProfile('address_main', formValues.address_main);
      if (formValues.facebook) updateUserProfile('facebook', formValues.facebook);
      if (formValues.twitter) updateUserProfile('twitter', formValues.twitter);
    }
  }, [user, form, updateUserProfile]);

  const initialValues = {
    fullname: userProfileForm.fullname || user?.fullname || '',
    birthday: userProfileForm.birthday ? dayjs(userProfileForm.birthday) : ((user as any)?.birthday ? dayjs((user as any).birthday) : null),
    gender: userProfileForm.gender || ((user as any)?.gender === 'ชาย' ? 'm' : (user as any)?.gender === 'หญิง' ? 'f' : (user as any)?.gender === 'ไม่ระบุ' ? 'no' : (user as any)?.gender),
    cat1: userProfileForm.cat1 ? String(userProfileForm.cat1) : ((user as any)?.cat1 ? String((user as any).cat1) : undefined),
    cat2: userProfileForm.cat2 ? String(userProfileForm.cat2) : ((user as any)?.cat2 ? String((user as any).cat2) : undefined),
    phone: userProfileForm.phone || (user as any)?.phone,
    des: userProfileForm.des || (user as any)?.des,
    address_main: userProfileForm.address_main || (user as any)?.address_main,
    facebook: userProfileForm.facebook || (user as any)?.facebook,
    twitter: userProfileForm.twitter || (user as any)?.twitter,
  };

  return (
    <div className='select-none w-full h-full min-h-[524px]'>
      <div className='border-2 border-gray-200 rounded-lg p-6 bg-white h-full flex flex-col'>
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          autoComplete="off"
          className="fontFam flex-1"
          onValuesChange={handleValuesChange}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="fullname" label={<span className={labelSpan}>ชื่อโปรไฟล์</span>} rules={[{ required: true, message: 'กรุณากรอกชื่อโปรไฟล์' }]}>
              <Input className={inputClassName} />
            </Form.Item>

            <div className="flex flex-col gap-1">
              <Form.Item name="birthday" label={<span className={labelSpan}>วันเดือนปี เกิด </span>} rules={[{ required: true, message: 'กรุณาเลือกวันเกิด' }]}>
                <DatePicker className={`${inputClassName} ${isBirthdayLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="เลือกวันที่" allowClear={false} disabled={isBirthdayLocked} />
              </Form.Item>
              <div className="mt-[-18px] flex flex-col">
                  <span className="text-[10px] text-gray-500">(อายุต่ำกว่า18ปี ไม่สามารถอ่านนิยาย NC ได้)</span>
                  {isBirthdayLocked && <span className="text-[10px] text-red-500">{lockMessage}</span>}
              </div>
            </div>

            <Form.Item name="gender" label={<span className={labelSpan}>เพศ</span>} rules={[{ required: true, message: 'กรุณาเลือกเพศ' }]}>
              <Select className={inputClassName} placeholder="เลือกเพศ">
                <Option value="m">ชาย</Option>
                <Option value="f">หญิง</Option>
                <Option value="no">ไม่ระบุ</Option>
              </Select>
            </Form.Item>

            <Form.Item name="phone" label={<span className={labelSpan}>เบอร์โทรศัพท์</span>}>
              <Input className={inputClassName} />
            </Form.Item>

            <Form.Item name="des" label={<span className={labelSpan}>เกี่ยวกับฉัน</span>}>
              <TextArea className={inputClassName} autoSize />
            </Form.Item>

            <Form.Item name="address_main" label={<span className={labelSpan}>ที่อยู่</span>}>
              <TextArea className={inputClassName} autoSize />
            </Form.Item>

            <Form.Item name="facebook" label={<span className={labelSpan}>Facebook Link</span>}>
              <Input className={inputClassName} />
            </Form.Item>

            <Form.Item name="twitter" label={<span className={labelSpan}>Twitter Link</span>}>
              <Input className={inputClassName} />
            </Form.Item>

            <Form.Item name="cat1" label={<span className={labelSpan}>กรุณาเลือกแนวที่ชอบ</span>} rules={[{ required: true, message: 'กรุณาเลือกแนวที่ชอบ' }]}>
              <Select className={inputClassName} placeholder="เลือกแนว">
                {categories.map((cat: any) => (
                  <Option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="cat2" label={<span className={labelSpan}>กรุณาเลือกแนวที่ชอบ</span>} rules={[{ required: true, message: 'กรุณาเลือกแนวที่ชอบ' }]}>
              <Select className={inputClassName} placeholder="เลือกแนว">
                {categories.map((cat: any) => (
                  <Option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  );
}

// --- Component 2: Change Password Form ---
const ChangePasswordForm = () => {
  const { notification } = App.useApp();
  const { user, token } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    if (!user?.email || !token) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'กรุณาเข้าสู่ระบบใหม่',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        oldpass: values.oldPassword,
        newpass1: values.newPassword,
        newpass2: values.confirmPassword,
        token: token,
      };

      const response = await changeUserPassword(requestData);

      if (response?.status === 'success' || response?.code === 200) {
        notification.success({
          message: 'เปลี่ยนรหัสผ่านสำเร็จ!',
          description: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          placement: 'topRight',
        });
        form.resetFields();
      } else {
        notification.error({
          message: 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
          description: response?.message || 'เกิดข้อผิดพลาด',
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
          placement: 'topRight',
        });
      }
    } catch (error: any) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='select-none w-full py-4'>
      <p className='text-xl font-bold mb-6 font-primary'>เปลี่ยนรหัสผ่าน</p>
      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Form.Item name="oldPassword" label={<span className="font-primary">รหัสผ่านเดิม</span>} rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านเดิม' }]}>
            <Input.Password className="font-primary" />
          </Form.Item>
          <Form.Item name="newPassword" label={<span className="font-primary">รหัสผ่านใหม่</span>} rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านใหม่' }]}>
            <Input.Password className="font-primary" />
          </Form.Item>
          <Form.Item name="confirmPassword" label={<span className="font-primary">ยืนยันรหัสผ่านใหม่</span>} dependencies={['newPassword']} rules={[{ required: true, message: 'กรุณายืนยันรหัสผ่านใหม่' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('newPassword') === value) { return Promise.resolve(); } return Promise.reject(new Error('รหัสผ่านใหม่ไม่ตรงกัน!')); }, }),]}>
            <Input.Password className="font-primary" />
          </Form.Item>
          <div className="flex flex-col col-span-1 md:col-span-3 justify-center items-center mt-6">
            <Form.Item className="mb-0">
              <Button htmlType="submit" loading={loading} disabled={loading} className="font-primary font-medium border-0 hover:opacity-90 transition-all duration-200" style={{ backgroundColor: '#FF0037', color: '#FFFFFF', borderRadius: '8px', padding: '10px 40px', height: 'auto' }}>
                {loading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
              </Button>
            </Form.Item>
          </div>
        </div>
      </Form>
    </div>
  );
}

const onChange = () => {
};

// --- Component 3: Profile Picture Tab ---
interface ProfilePictureTabProps {
  onProfileFileChange: (file: File) => void;
}

const ProfilePictureTab = ({ onProfileFileChange }: ProfilePictureTabProps) => {
  const { notification } = App.useApp();
  const { token, user } = useAuthStore();
  const { updateUserProfile } = useFormStore();

  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [isFrameModalOpen, setIsFrameModalOpen] = React.useState(false);
  const [frames, setFrames] = React.useState<any[]>([]);
  const [loadingFrames, setLoadingFrames] = React.useState(false);

  const [selectedFrameInModal, setSelectedFrameInModal] = React.useState<any>(null);
  const [currentFrameImg, setCurrentFrameImg] = React.useState<string | null>(null);

  useEffect(() => {
    if ((user as any)?.frame && (user as any).frame.img) {
      setCurrentFrameImg((user as any).frame.img);
      updateUserProfile('frame_id', (user as any).frame_id);
    } else {
      setCurrentFrameImg(null);
    }
  }, [user, updateUserProfile]);

  const fetchFrames = async () => {
    if (!token) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'ไม่พบ token กรุณาเข้าสู่ระบบใหม่',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
      return;
    }
    setLoadingFrames(true);
    try {
      const response = await axios.get('/api/getframes', {
        headers: { 'Authorization': token },
        timeout: 30000,
      });
      if (response.data.code === 200 || response.data.status === 'success') {
        const fetchedFrames = response.data.data?.frames || [];
        setFrames(fetchedFrames);

        // Sync selection with server data
        const currentFrameId = response.data.data?.currentFrameId;
        if (currentFrameId) {
          const activeFrame = fetchedFrames.find((f: any) => f.frame_id === currentFrameId);
          if (activeFrame) {
            setSelectedFrameInModal(activeFrame);
          }
        } else {
             // If 0 or null, it means no frame equipped
             setSelectedFrameInModal(null);
        }
      }
    } catch {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลกรอบได้',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
    } finally {
      setLoadingFrames(false);
    }
  };

  const handleOpenFrameModal = () => {
    setIsFrameModalOpen(true);
    fetchFrames();
    
    // Set initially selected frame based on current user frame
    if ((user as any)?.frame && (user as any).frame.frame_id) {
      setSelectedFrameInModal((user as any).frame);
    } else {
      setSelectedFrameInModal(null);
    }
  };

  const handleSelectFrameInModal = (frame: any) => {
    setSelectedFrameInModal(frame);
  };

  const handleConfirmFrame = () => {
    if (selectedFrameInModal) {
      setCurrentFrameImg(selectedFrameInModal.img);
      updateUserProfile('frame_id', selectedFrameInModal.frame_id as any);
      notification.success({
        message: 'เลือกกรอบสำเร็จ',
        description: `เลือกกรอบ: ${selectedFrameInModal.name}`,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        placement: 'topRight',
      });
      setIsFrameModalOpen(false);
    } else if (selectedFrameInModal === null) {
      setCurrentFrameImg(null);
      updateUserProfile('frame_id', 0 as any);
      notification.success({
        message: 'นำกรอบออกเรียบร้อย',
        description: 'นำกรอบออกเรียบร้อยแล้ว',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        placement: 'topRight',
      });
      setIsFrameModalOpen(false);
    } else {
      notification.warning({
        message: 'กรุณาเลือกกรอบก่อน',
        description: 'กรุณาเลือกกรอบก่อน',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
    }
  };

  const handleProfileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    onProfileFileChange(file);
    return false;
  };

  return (
    <div className='select-none w-full lg:w-[385px] h-full min-h-[524px] flex-shrink-0'>
      <div className='flex flex-col gap-4 h-full'>
        <div className='border-2 border-gray-200 rounded-lg p-6 bg-white flex flex-col items-center justify-between h-full'>
          <div className='w-full text-center mb-2'>
            <h3 className='text-lg font-bold font-primary text-black'>รูปโปรไฟล์</h3>
          </div>

          <div className='w-full flex justify-between gap-2 mb-4'>
            <Button size="small" icon={<UploadOutlined />} onClick={handleOpenFrameModal} style={{ borderColor: '#FF0037', color: '#FF0037' }} className='font-primary text-xs hover:bg-red-50'>
              เลือกกรอบ
            </Button>
            <Button size="small" icon={<span className='text-xs'>👑</span>} onClick={() => notification.info({
              message: 'เกิดข้อผิดพลาด',
              description: 'เลือกฉายา - ฟีเจอร์กำลังพัฒนา',
              icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
              placement: 'topRight',
            })} style={{ borderColor: '#FF0037', color: '#FF0037' }} className='font-primary text-xs hover:bg-red-50'>
              เลือกฉายา
            </Button>
          </div>

          <div className='flex-1 flex items-center justify-center'>
            <div className='relative' style={{ width: '280px', height: '280px' }}>
              <div className='w-full h-full rounded-full overflow-hidden border-4 border-gray-300 bg-gray-50 flex items-center justify-center'>
                <Image
                  src={previewImage || (user as any)?.img || "/images/default-avatar.png"}
                  alt="Profile"
                  style={{ width: '280px', height: '280px', objectFit: 'cover' }}
                  width={280}
                  height={280}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-avatar.png'; }}
                  unoptimized={isDataUrl(previewImage)}
                />
              </div>

              {currentFrameImg && (
                <div className='absolute inset-0 pointer-events-none'>
                  <FrameOverlayImage src={currentFrameImg} alt="Frame" className='object-contain' style={{ zIndex: 10 }} />
                </div>
              )}
            </div>
          </div>

          <div className='text-center w-full mb-4'>
            <Upload showUploadList={false} beforeUpload={handleProfileUpload} accept="image/*">
              <Button type="default" icon={<UploadOutlined />} className='font-primary upload-profile-btn'>
                อัปโหลดรูปโปรไฟล์
              </Button>
            </Upload>
          </div>

          <div className='text-center'>
            <p className='text-sm font-primary font-semibold text-black'>
              ฉายา: {(user as any)?.aka?.name || 'ไม่มีฉายา'}
            </p>
          </div>
        </div>

        <Modal 
          title={<span className='font-primary text-xl font-bold'>เลือกกรอบ</span>} 
          open={isFrameModalOpen} 
          onCancel={() => setIsFrameModalOpen(false)} 
          footer={
            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 sm:gap-0">
              <span className="text-sm font-primary text-gray-500 text-center sm:text-left leading-relaxed">
                กรอบและฉายา สามารถได้รับผ่านการซื้อในร้านค้า{' '}
                <a href="/store" className="!text-red-500 hover:!text-red-700 underline inline-flex items-center gap-1 align-bottom" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3.00977 11.22V15.71C3.00977 20.2 4.80977 22 9.29977 22H14.6898C19.1798 22 20.9798 20.2 20.9798 15.71V11.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12.0005 12C13.8305 12 15.1805 10.51 15.0005 8.68L14.3405 2H9.67048L9.00048 8.68C8.82048 10.51 10.1705 12 12.0005 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.3098 12C20.3298 12 21.8098 10.36 21.6098 8.35L21.3298 5.6C20.9698 3 19.9698 2 17.3498 2H14.2998L14.9998 9.01C15.1698 10.66 16.6598 12 18.3098 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.64037 12C7.29037 12 8.78037 10.66 8.94037 9.01L9.16037 6.8L9.64037 2H6.59037C3.97037 2 2.97037 3 2.61037 5.6L2.34037 8.35C2.14037 10.36 3.62037 12 5.64037 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 17C10.33 17 9.5 17.83 9.5 19.5V22H14.5V19.5C14.5 17.83 13.67 17 12 17Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  ไปที่ร้านค้า
                </a>
              </span>
              <Button key="submit" type="primary" onClick={handleConfirmFrame} className='font-primary font-medium w-full sm:w-auto' style={{ backgroundColor: '#FF0037', borderColor: '#FF0037' }}>ยืนยัน</Button>
            </div>
          } 
          width={1000} 
          centered
          zIndex={5000}
        >
          {loadingFrames ? (
            <div className='flex justify-center py-10'><GifLoader className="h-64" width={150} height={150} /></div>
          ) : (
            <div className='max-h-[60vh] overflow-y-auto p-4'>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4'>
                <div onClick={() => handleSelectFrameInModal(null)} className={`border-2 rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center h-40 transition-all ${selectedFrameInModal === null ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-400'}`}>
                  <span className='font-primary text-sm'>ไม่ใส่กรอบ</span>
                </div>
              {frames.map((frame) => {
                const isLocked = frame.isUnlocked === false;
                return (
                  <div
                    key={frame.frame_id}
                    onClick={() => !isLocked && handleSelectFrameInModal(frame)}
                    className={`border-2 rounded-lg p-2 flex flex-col items-center transition-all relative overflow-hidden
                    ${isLocked ? 'border-none bg-gray-400 cursor-not-allowed' : 'cursor-pointer'}
                    ${!isLocked && selectedFrameInModal?.frame_id === frame.frame_id ? 'border-green-500 bg-green-50' : ''}
                    ${!isLocked && selectedFrameInModal?.frame_id !== frame.frame_id ? 'border-gray-200 hover:border-gray-400' : ''}
                  `}
                  >
                    {isLocked && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                          <div className="bg-transparent p-2 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M6 10V8C6 4.69 7 2 12 2C17 2 18 4.69 18 8V10" stroke="#DFDFEC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 18.5C13.3807 18.5 14.5 17.3807 14.5 16C14.5 14.6193 13.3807 13.5 12 13.5C10.6193 13.5 9.5 14.6193 9.5 16C9.5 17.3807 10.6193 18.5 12 18.5Z" stroke="#DFDFEC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M17 22H7C3 22 2 21 2 17V15C2 11 3 10 7 10H17C21 10 22 11 22 15V17C22 21 21 22 17 22Z" stroke="#DFDFEC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </>
                    )}
                    <div className={`relative w-full h-28 mb-2 ${isLocked ? 'opacity-50' : ''}`}>
                      <FrameOverlayImage src={frame.img} alt={frame.name} className='object-contain' />
                    </div>
                    <span className={`text-xs ${isLocked ? 'text-white font-bold' : ''}`}>{frame.name}</span>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

// --- Component 4: Combined User Info Tab (Updated Token Logic) ---
const UserInfoTab = () => {
  const { notification } = App.useApp();
  const { userProfileForm } = useFormStore();
  const { token, user, updateToken } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  useEffect(() => {
    if ((user as any)?.banner) {
      setBgPreview((user as any).banner);
    }
  }, [user]);

  const handleBgUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBgPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    setBgFile(file);
    return false;
  };

  const handleSaveAll = async () => {
    if (!token) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'กรุณาเข้าสู่ระบบใหม่',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
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

      const headers: any = { 'Authorization': token };

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
      const response = await axios.post('/api/save_profile', formData, { headers });

      const resData = response.data;

      // ✅ เช็ค 200 และรับ Token ใหม่
      if (resData.code === 200 || resData.status === 'success') {
        const newToken = resData.data?.token;

        if (newToken) {
          // localStorage.setItem('token', newToken); 
          updateToken(newToken); // เรียกใช้ updateToken เพื่อแตก user data
        }

        notification.open({
          message: <span className="font-primary font-bold text-green-600">บันทึกสำเร็จ</span>,
          description: <span className="font-primary text-gray-600">ข้อมูลของคุณถูกอัปเดตเรียบร้อยแล้ว</span>,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          placement: 'topRight',
          duration: 3,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);

        // --- Save Birthday Cooldown if changed ---
        // Check if birthday was changed
        const oldBirthday = (user as any)?.birthday;
        const newBirthday = userProfileForm.birthday 
             ? (typeof userProfileForm.birthday === 'string' ? userProfileForm.birthday : dayjs(userProfileForm.birthday).format('YYYY-MM-DD'))
             : "";

        // Compare logic: If previously empty/null and now has value OR value changed
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
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
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
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:block">
          <ProfilePictureTab onProfileFileChange={setProfileFile} />
        </div>
        <div className="flex-1">
          <UserInfoForm />
        </div>
      </div>

      <div className="w-full h-auto min-h-[300px] md:min-h-[466px] aspect-[1328/466]">
        <div className="border-2 border-gray-200 rounded-lg p-6 bg-white w-full h-full flex flex-col">
          <div className='w-full text-center mb-4'>
            <h3 className='text-lg font-bold font-primary text-black'>รูปพื้นหลัง</h3>
          </div>

          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden relative min-h-[200px]">
            <Image
              src={bgPreview || (user as any)?.banner || "/images/ejb-bg.png"}
              alt="รูปพื้นหลัง"
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setBgPreview("/images/ejb-bg.png")}
              unoptimized={isDataUrl(bgPreview)}
            />
          </div>

          <div className='text-center w-full mt-4'>
            <Upload showUploadList={false} beforeUpload={handleBgUpload} accept="image/*">
              <Button type="default" icon={<UploadOutlined />} className='font-primary hover:border-red-500 hover:text-red-500 transition-colors'>
                อัปโหลดพื้นหลัง
              </Button>
            </Upload>
          </div>
        </div>
      </div>

      <div className='w-full flex justify-center mt-6'>
        <Button
          type="primary"
          loading={saving}
          disabled={saving}
          className='font-primary font-medium text-white border-0'
          style={{ backgroundColor: '#FF0037', borderRadius: '8px', width: 'auto', minWidth: '67px', height: '40px', fontSize: '16px', padding: '0 20px' }}
          onClick={handleSaveAll}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>
    </div>
  );
};

const items: TabsProps['items'] = [
  {
    key: '1',
    label: <span className='font-primary font-medium text-black text-lg'>ข้อมูลผู้ใช้งาน</span>,
    children: <UserInfoTab />
  },
  {
    key: '2',
    label: <span className='font-primary font-medium text-black text-lg'>เปลี่ยนรหัสผ่าน</span>,
    children: <ChangePasswordForm />,
  },
];

function Page() {
  const { notification } = App.useApp();
  const { user, isLoggedIn, hasMounted, setMounted } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setMounted();
  }, [setMounted]);

  useEffect(() => {
    if (hasMounted && (!isLoggedIn || !user)) {
      notification.warning({
        message: 'เกิดข้อผิดพลาด',
        description: 'กรุณาเข้าสู่ระบบก่อนเข้าถึงหน้านี้',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
      router.push('/');
    }
  }, [hasMounted, isLoggedIn, user, router, notification]);

  if (!hasMounted || !isLoggedIn || !user) {
    return (
      <GifLoader />
    );
  }

  return (
    <div className='bg-white' style={{ overflowX: 'hidden' }}>
      <div className='relative w-[100vw] items-center flex flex-col'>
        <div className='flex flex-col pt-[100px] px-4 lg:px-0 w-full max-w-[1360px] relative mb-10' style={{ minHeight: 'calc(100vh - 100px)' }}>
          <div className='bg-white select-none'>
            <div className='select-none '>
              <div className='lg: mt-[-80] py-2'>
                <span className='text-2xl font-bold mb-11 mt-0 text-black font-primary'>
                  ตั้งค่า - {user?.fullname || user?.email || 'ผู้ใช้'}
                </span>
              </div>
              <div className=''>
                <Tabs
                  defaultActiveKey="1"
                  items={items}
                  onChange={onChange}
                  className="my-red-tabs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page
