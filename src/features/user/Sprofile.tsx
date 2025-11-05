"use client"

import React, { useEffect, useState } from 'react'
import { 
  Tabs, 
  Form, 
  Input, 
  DatePicker, 
  Select, 
  Button, 
  App,
  Spin,
  Upload 
} from 'antd';
import type { TabsProps, UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs'; // Import dayjs
import axios from 'axios';
// import { useQuery } from '@tanstack/react-query';
import { useFormStore } from '@/stores/formStore';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const { TextArea } = Input;
const { Option } = Select;

const UserInfoForm = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const { userProfileForm, updateUserProfile, setFormErrors, clearFormErrors } = useFormStore();
  const { user } = useAuthStore(); // ดึง user จาก authStore

  // CSS ClassName ที่ใช้ซ้ำๆ จาก HTML ของคุณ
  const inputClassName = "my-0 bg-white border border-gray-300 rounded-md p-1 px-2 text-xs focus:outline-none focus:border-primary hover:border-primary w-full font-primary";
  const labelSpan = "text-sm text-black font-primary";
  

  // Function เมื่อกด Submit
  const onFinish = (values: any) => {
    // แปลงค่า dayjs กลับเป็น string ก่อนส่ง (ถ้าต้องการ)
    const formattedValues = {
      ...values,
      birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
    };
    
    // Update Zustand store
    Object.entries(formattedValues).forEach(([key, value]) => {
      if (key !== 'birthday' || value) {
        updateUserProfile(key as keyof typeof userProfileForm, String(value));
      }
    });
    
    console.log('Form Submitted:', formattedValues);
    message.success('บันทึกข้อมูลผู้ใช้สำเร็จ!');
  };

  // ค่าเริ่มต้นจาก Zustand store หรือ user จาก authStore
  const initialValues = {
    fullname: userProfileForm.fullname || user?.fullname || '', // ใช้ fullname จาก user ถ้ามี
    birthday: dayjs(userProfileForm.birthday),
    gender: userProfileForm.gender,
    cat1: userProfileForm.cat1,
    cat2: userProfileForm.cat2,
    phone: userProfileForm.phone,
    des: userProfileForm.des,
    address_main: userProfileForm.address_main,
    facebook: userProfileForm.facebook,
    twitter: userProfileForm.twitter,
  };

  return (
    <div className='select-none w-full' style={{ width: '927px', height: '524px' }}>
      <div className='border-2 border-gray-200 rounded-lg p-6 bg-white h-full flex flex-col'>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={initialValues}
          autoComplete="off"
          className="fontFam flex-1"
        >
          {/* ใช้ grid-cols-2 ตาม HTML ของคุณ */}
          <div className="grid grid-cols-2 gap-4">
          
          {/* ชื่อโปรไฟล์ */}
          <Form.Item
            name="fullname"
            label={<span className={labelSpan}>ชื่อโปรไฟล์</span>}
            rules={[{ required: true, message: 'กรุณากรอกชื่อโปรไฟล์' }]}
          >
            <Input className={inputClassName} />
          </Form.Item>

          {/* วันเดือนปี เกิด */}
          <div className="flex flex-col gap-1">
            <Form.Item
              name="birthday"
              label={<span className={labelSpan}>วันเดือนปี เกิด </span>}
              rules={[{ required: true, message: 'กรุณาเลือกวันเกิด' }]}
            >
              <DatePicker className={inputClassName} placeholder="เลือกวันที่" allowClear={false} />
            </Form.Item>
            <span className="text-[10px] mt-[-18px]">(อายุต่ำกว่า18ปี ไม่สามารถอ่านนิยาย NC ได้)</span>
          </div>

          {/* เพศ */}
          <Form.Item
            name="gender"
            label={<span className={labelSpan}>เพศ</span>}
            rules={[{ required: true, message: 'กรุณาเลือกเพศ' }]}
          >
            <Select className={inputClassName} placeholder="เลือกเพศ">
              <Option value="ชาย">ชาย</Option>
              <Option value="หญิง">หญิง</Option>
              <Option value="ไม่ระบุ">ไม่ระบุ</Option>
            </Select>
          </Form.Item>

          {/* เบอร์โทรศัพท์ */}
          <Form.Item
            name="phone"
            label={<span className={labelSpan}>เบอร์โทรศัพท์</span>}
          >
            <Input className={inputClassName} />
          </Form.Item>

          {/* เกี่ยวกับฉัน */}
          <Form.Item
            name="des"
            label={<span className={labelSpan}>เกี่ยวกับฉัน</span>}
          >
            <TextArea className={inputClassName} autoSize />
          </Form.Item>

          {/* ที่อยู่ */}
          <Form.Item
            name="address_main"
            label={<span className={labelSpan}>ที่อยู่</span>}
          >
            <TextArea className={inputClassName} autoSize />
          </Form.Item>

          {/* Facebook Link */}
          <Form.Item
            name="facebook"
            label={<span className={labelSpan}>
              <span className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 9.3V12.2H16.6C16.8 12.2 16.9 12.4 16.9 12.6L16.5 14.5C16.5 14.6 16.3 14.7 16.2 14.7H14V22H11V14.8H9.3C9.1 14.8 9 14.7 9 14.5V12.6C9 12.4 9.1 12.3 9.3 12.3H11V9C11 7.3 12.3 6 14 6H16.7C16.9 6 17 6.1 17 6.3V8.7C17 8.9 16.9 9 16.7 9H14.3C14.1 9 14 9.1 14 9.3Z" stroke="black" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
                  <path d="M15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H15C20 2 22 4 22 9V15C22 20 20 22 15 22Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Facebook Link
              </span>
            </span>}
          >
            <Input className={inputClassName} />
          </Form.Item>

          {/* Twitter Link */}
          <Form.Item
            name="twitter"
            label={<span className={labelSpan}>
              <span className="flex items-center gap-2">
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.36 0C1.50432 0 0 1.50432 0 3.36V16.8C0 18.6557 1.50432 20.16 3.36 20.16H16.8C18.6557 20.16 20.16 18.6557 20.16 16.8V3.36C20.16 1.50432 18.6557 0 16.8 0H3.36ZM4.36125 4.32H8.17125L10.8769 8.16469L14.16 4.32H15.36L11.4187 8.93437L16.2787 15.84H12.4697L9.33 11.3794L5.52 15.84H4.32L8.78813 10.6097L4.36125 4.32ZM6.19875 5.28L12.9703 14.88H14.4412L7.66969 5.28H6.19875Z" fill="black"/>
                </svg>
                Twitter Link
              </span>
            </span>}
          >
            <Input className={inputClassName} />
          </Form.Item>

          {/* แนวที่ชอบ 1 */}
          <Form.Item
            name="cat1"
            label={<span className={labelSpan}>กรุณาเลือกแนวที่ชอบ</span>}
            rules={[{ required: true, message: 'กรุณาเลือกแนวที่ชอบ' }]}
          >
            <Select className={inputClassName} placeholder="เลือกแนว">
              <Option value="โรแมนติก">โรแมนติก</Option>
              <Option value="แฟนตาซี">แฟนตาซี</Option>
              <Option value="ดราม่า">ดราม่า</Option>
            </Select>
          </Form.Item>

          {/* แนวที่ชอบ 2 */}
          <Form.Item
            name="cat2"
            label={<span className={labelSpan}>กรุณาเลือกแนวที่ชอบ</span>}
            rules={[{ required: true, message: 'กรุณาเลือกแนวที่ชอบ' }]}
          >
            <Select className={inputClassName} placeholder="เลือกแนว">
              <Option value="โรแมนติก">โรแมนติก</Option>
              <Option value="แฟนตาซี">แฟนตาซี</Option>
              <Option value="ดราม่า">ดราม่า</Option>
            </Select>
          </Form.Item>
        </div>
      </Form>
      </div>
    </div>
  );
}

const ChangePasswordForm = () => {
  const { message } = App.useApp();
  const { user, token } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Function เมื่อกด Submit
  const onFinish = async (values: any) => {
    console.log('🔄 Starting password change...');
    console.log('User:', user);
    console.log('Token available:', token ? 'Yes ✓' : 'No ✗');
    console.log('Form values:', values);

    if (!user?.email) {
      message.error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    if (!token) {
      message.error('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        oldpass: values.oldPassword,
        newpass1: values.newPassword,
        newpass2: values.confirmPassword,
        token: token, // ส่ง token ไปด้วย
      };

      console.log('📤 Sending request to Next.js API Route');
      console.log('📦 Request data:', { ...requestData, token: '✓ Included' });

      // เรียก Next.js API Route แทนการเรียกตรงไป backend
      const response = await axios.post('/api/changepass', requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Change Password Response:', response.data);
      console.log('📊 Response status:', response.status);
      
      // ตรวจสอบ response ตาม format ของ backend
      if (response.status === 200 && (response.data.status === 'success' || response.data.code === 200)) {
        message.success(response.data.message || 'เปลี่ยนรหัสผ่านสำเร็จ!');
        form.resetFields(); // ล้างค่าในฟอร์ม
      } else {
        message.error(response.data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (error: any) {
      console.error('❌ Change Password Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='select-none w-full py-4'>
      <p className='text-xl font-bold mb-6 font-primary'>เปลี่ยนรหัสผ่าน</p>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        {/* ใช้ grid-cols-3 ตามรูป */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* รหัสผ่านเดิม */}
          <Form.Item
            name="oldPassword"
            label={<span className="font-primary">รหัสผ่านเดิม</span>}
            required // ใช้ required prop เพื่อให้มี * สีแดง
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านเดิม' }]}
          >
            {/* ใช้ Input.Password เพื่อให้มีปุ่มเปิด/ปิดตา */}
            <Input.Password className="font-primary" />
          </Form.Item>

          {/* รหัสผ่านใหม่ */}
          <Form.Item
            name="newPassword"
            label={<span className="font-primary">รหัสผ่านใหม่</span>}
            required
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านใหม่' }]}
          >
            <Input.Password className="font-primary" />
          </Form.Item>

          {/* ยืนยันรหัสผ่านใหม่ */}
          <Form.Item
            name="confirmPassword"
            label={<span className="font-primary">ยืนยันรหัสผ่านใหม่</span>}
            required
            dependencies={['newPassword']} // <-- สำคัญ: ทำให้ field นี้เช็ค newPassword
            rules={[
              { required: true, message: 'กรุณายืนยันรหัสผ่านใหม่' },
              // Rule สำหรับเช็คว่าตรงกับ newPassword หรือไม่
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('รหัสผ่านใหม่ไม่ตรงกัน!'));
                },
              }),
            ]}
          >
            <Input.Password className="font-primary" />
          </Form.Item>

          {/* ปุ่ม Submit */}
          <div className="flex flex-col col-span-1 md:col-span-3 justify-center items-center mt-6">
            <Form.Item className="mb-0">
              <Button 
                htmlType="submit" 
                loading={loading}
                disabled={loading}
                className="font-primary font-medium text-white border-0 hover:opacity-90 transition-all duration-200"
                style={{ 
                  backgroundColor: '#FF0037',
                  borderRadius: '8px',
                  padding: '10px 40px',
                  height: 'auto',
                  fontSize: '16px',
                  fontWeight: 500,
                }}
              >
                {loading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
              </Button>
            </Form.Item>
          </div>

        </div>
      </Form>
    </div>
  );
}

const onChange = (key: string) => {
  console.log(key);
};

// Profile Picture Component with Upload
const ProfilePictureTab = () => {
  const { message } = App.useApp();
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  const props: UploadProps = {
    action: 'https://660d2bd96ddfa2943b943748.mockapi.io/api/upload',
    onChange({ file, fileList }) {
      if (file.status !== 'uploading') {
        console.log(file, fileList);
      }
      
      // Create preview when file is selected
      if (file.originFileObj) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file.originFileObj);
      }
    },
    defaultFileList: [],
    showUploadList: false,
  };

  return (
    <div className='select-none w-full' style={{ width: '385px', height: '524px' }}>
      <div className='flex flex-col gap-4 h-full'>
        {/* Profile Picture Container with Border */}
        <div className='border-2 border-gray-200 rounded-lg p-6 bg-white flex flex-col items-center justify-between h-full'>
          {/* Header with Title (Centered) */}
          <div className='w-full text-center mb-2'>
            <h3 className='text-lg font-bold font-primary text-black'>รูปโปรไฟล์</h3>
          </div>

          {/* Action Buttons (Below Title) */}
          <div className='w-full flex justify-between gap-2 mb-4'>
            <Button 
              size="small"
              icon={<span className='text-xs'><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.25033 12.8332H8.75033C11.667 12.8332 12.8337 11.6665 12.8337 8.74984V5.24984C12.8337 2.33317 11.667 1.1665 8.75033 1.1665H5.25033C2.33366 1.1665 1.16699 2.33317 1.16699 5.24984V8.74984C1.16699 11.6665 2.33366 12.8332 5.25033 12.8332Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 1.1665V12.8332" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1.16699 7H12.8337" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>}
              onClick={() => {
                message.info('เลือกกรอบ - ฟีเจอร์กำลังพัฒนา');
              }}
              style={{ borderColor: '#FF0037', color: '#FF0037' }}
              className='font-primary text-xs hover:bg-red-50'
            >
              เลือกกรอบ
            </Button>
            <Button 
              size="small"
              icon={<span className='text-xs'><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.43272 8.92521L5.07522 11.5677C6.16022 12.6527 7.92189 12.6527 9.01272 11.5677L11.5736 9.00688C12.6586 7.92188 12.6586 6.16021 11.5736 5.06938L8.92522 2.43271C8.37106 1.87855 7.60689 1.58104 6.82522 1.62188L3.90856 1.76188C2.74189 1.81438 1.81439 2.74188 1.75606 3.90271L1.61606 6.81938C1.58106 7.60688 1.87856 8.37104 2.43272 8.92521Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5.54134 7.00016C6.34676 7.00016 6.99967 6.34724 6.99967 5.54183C6.99967 4.73641 6.34676 4.0835 5.54134 4.0835C4.73593 4.0835 4.08301 4.73641 4.08301 5.54183C4.08301 6.34724 4.73593 7.00016 5.54134 7.00016Z" fill="#B01F1F"/>
                    </svg>
                </span>}
              onClick={() => {
                message.info('เลือกฉาก - ฟีเจอร์กำลังพัฒนา');
              }}
              style={{ borderColor: '#FF0037', color: '#FF0037' }}
              className='font-primary text-xs hover:bg-red-50'
            >
              เลือกฉาก
            </Button>
          </div>

          {/* Profile Image */}
          <div className='flex-1 flex items-center justify-center'>
            <div className='relative' style={{ width: '280px', height: '280px' }}>
              <div className='w-full h-full rounded-full overflow-hidden border-4 border-gray-300 bg-gray-50 flex items-center justify-center'>
                <img 
                  src={previewImage || "https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"}
                  alt="Profile Preview" 
                  style={{ width: '280px', height: '280px', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/default-avatar.png';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Text - Upload Button */}
          <div className='text-center w-full mb-4'>
            <Upload {...props}>
              <Button 
                type="default"
                icon={<UploadOutlined />}
                className='font-primary upload-profile-btn'
                style={{
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF0037';
                  e.currentTarget.style.color = '#FF0037';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.color = '';
                }}
              >
                อัปโหลดรูปโปรไฟล์
              </Button>
            </Upload>
          </div>

          {/* Username Display */}
          <div className='text-center'>
            <p className='text-sm font-primary font-semibold text-black'>ฉายา: นักล่าอสูร</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Combined User Info Tab (Profile Picture + User Information)
const UserInfoTab = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* Top Section - Profile Picture + User Information */}
      <div className="flex gap-4">
        {/* Left Side - Profile Picture */}
        <div className="flex-shrink-0">
          <ProfilePictureTab />
        </div>
        
        {/* Right Side - User Information Form */}
        <div className="flex-1">
          <UserInfoForm />
        </div>
      </div>

      {/* Bottom Section - Background Image */}
      <div className="w-full" style={{ width: '1328px', height: '466px' }}>
        <div className="border-2 border-gray-200 rounded-lg p-6 bg-white w-full h-full flex flex-col">
          {/* Header */}
          <div className='w-full text-center mb-4'>
            <h3 className='text-lg font-bold font-primary text-black'>รูปพื้นหลัง</h3>
          </div>

          {/* Background Image Container */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
            <Image 
              src="/images/ejb-bg.png" 
              alt="รูปพื้นหลัง" 
              className="object-cover"
              width={885}
              height={358}
              onError={(e) => {
                // Fallback to placeholder if image not found
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/885x358?text=รูปพื้นหลัง';
              }}
            />
          </div>

          {/* Upload Button */}
          <div className='text-center w-full mt-4'>
            <Upload
              action='https://660d2bd96ddfa2943b943748.mockapi.io/api/upload'
              onChange={({ file }) => {
                if (file.status === 'done') {
                  console.log('Background uploaded:', file);
                }
              }}
              showUploadList={false}
            >
              <Button 
                type="default"
                icon={<UploadOutlined />}
                className='font-primary hover:border-red-500 hover:text-red-500 transition-colors'
                style={{
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF0037';
                  e.currentTarget.style.color = '#FF0037';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.color = '';
                }}
              >
                อัปโหลดพื้นหลัง
              </Button>
            </Upload>
          </div>
        </div>
      </div>

      {/* Save Button - Bottom Center */}
      <div className='w-full flex justify-center mt-6'>
        <Button 
          type="primary"
          className='font-primary font-medium text-white border-0'
          style={{ 
            backgroundColor: '#FF0037',
            borderRadius: '8px',
            width: '67px',
            height: '40px',
            fontSize: '16px',
            fontWeight: 500,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => {
            console.log('Save profile changes');
            // Add save logic here
          }}
        >
          บันทึก
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
    children: <ChangePasswordForm/>,    
  },
];


function Page() {
  const { message } = App.useApp();
  const { user, isLoggedIn, hasMounted, setMounted } = useAuthStore();
  const router = useRouter();

  // Mount the store when component loads
  useEffect(() => {
    setMounted();
  }, [setMounted]);

  // Check authentication after mount and redirect if not logged in
  useEffect(() => {
    if (hasMounted && (!isLoggedIn || !user)) {
      console.log('❌ Not logged in, redirecting to home...');
      message.warning('กรุณาเข้าสู่ระบบก่อนเข้าถึงหน้านี้');
      router.push('/');
    }
  }, [hasMounted, isLoggedIn, user, router, message]);

  // Show loading while waiting for hydration
  if (!hasMounted) {
    return (
      <div className='bg-white min-h-screen flex items-center justify-center'>
        <Spin size="large" />
      </div>
    );
  }

  // Show loading while redirecting if not logged in
  if (!isLoggedIn || !user) {
    return (
      <div className='bg-white min-h-screen flex items-center justify-center'>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className='bg-white'>
        <div className='relative w-[100vw] items-center flex flex-col'>
            <div className='flex flex-col pt-[100px] min-h-[70vh] lg:px-0 w-full max-w-[1360px] relative mb-10'>
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