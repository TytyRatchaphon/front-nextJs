"use client"

import React from 'react'
import { 
  Tabs, 
  Form, 
  Input, 
  DatePicker, 
  Select, 
  Button, 
  message 
} from 'antd';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs'; // Import dayjs
import { useQuery } from '@tanstack/react-query';
import { useFormStore } from '@/stores/formStore';

const { TextArea } = Input;
const { Option } = Select;

const UserInfoForm = () => {
  const [form] = Form.useForm();
  const { userProfileForm, updateUserProfile, setFormErrors, clearFormErrors } = useFormStore();

  // CSS ClassName ที่ใช้ซ้ำๆ จาก HTML ของคุณ
  const inputClassName = "my-0 bg-white border border-gray-300 rounded-md p-1 px-2 text-sm focus:outline-none focus:border-primary hover:border-primary  w-full font-primary";
  const labelSpan = "text-lg text-black font-primary";
  

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

  // ค่าเริ่มต้นจาก Zustand store
  const initialValues = {
    fullname: userProfileForm.fullname,
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
    <div className='select-none w-full'>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
        autoComplete="off"
        className="fontFam"
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
            label={<span className={labelSpan}>Facebook Link</span>}
          >
            <Input className={inputClassName} />
          </Form.Item>

          {/* Twitter Link */}
          <Form.Item
            name="twitter"
            label={<span className={labelSpan}>Twitter Link</span>}
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

          {/* ปุ่ม Submit */}
          <div className="flex flex-col gap-1 col-span-2 text-center mt-3">
            <Form.Item>
              {/* ใช้ <Button> ของ antd เพื่อให้ทำงานกับ Form ได้ดีที่สุด */}
              <Button type="primary" htmlType="submit" className="bg-red-600 text-white px-10">
                <span className='text-white font-primary font-medium'>
                    ยืนยัน
                </span>
              </Button>
            </Form.Item>
          </div>

        </div>
      </Form>
    </div>
  );
}

const ChangePasswordForm = () => {
  const [form] = Form.useForm();

  // Function เมื่อกด Submit
  const onFinish = (values: any) => {
    // *** คุณต้องเรียก API เปลี่ยนรหัสผ่านตรงนี้ ***
    // (ตอนนี้แค่ log และ reset form)
    console.log('Change Password Values:', {
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    });
    message.success('เปลี่ยนรหัสผ่านสำเร็จ!');
    form.resetFields(); // ล้างค่าในฟอร์ม
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
          <div className="flex flex-col col-span-1 md:col-span-3 text-center mt-6">
            <Form.Item>
              <Button 
                htmlType="submit" 
                // ใช้ className ที่คุณถามถึง (สีแดง, สูง 40px)
                className="bg-red-600 text-white px-10 h-10 font-primary font-medium"
              >
                เปลี่ยนรหัสผ่าน
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

const items: TabsProps['items'] = [
  {
    key: '1',
    label: <span className='font-primary font-medium text-black text-lg' style={{}} >ตกแต่งโปรไฟล์</span>,
    children: 
    <>
        <div className='select-none w-full'>
            <div className='grid grid-cols-1 gap-10'>
                <div className='grid grid-cols-4 py-4'>
                    <div className='flex flex-col gap-4'>
                        <p className='text-lg font-bold gap-4 font-primary'>รูปโปรไฟล์</p>
                    </div>
                </div>
            </div>
        </div>

    </>
  },
  {
    key: '2',
    label:  <span className='font-primary font-medium text-black text-lg' style={{}} >ข้อมูลผู้ใช้</span>,
    children: <UserInfoForm/>,
  },
  {
    key: '3',
    label:  <span className='font-primary font-medium text-black text-lg' style={{}} >ตั้งค่าบัญชี</span>,
    children: <ChangePasswordForm/>,    
  },
];


function page() {
  return (
    <div className='bg-white'>
        <div className='relative w-[100vw] items-center flex flex-col'>
            <div className='flex flex-col pt-[100px] min-h-[70vh] lg:px-0 lg:max-w-[1000px] w-full lg:w-full max-w-full relative  mb-10'>
                <div className='bg-white select-none'>
                    <div className='select-none '>
                        <div className='lg: mt-[-80] py-2'>
                            <span className='text-2xl font-bold mb-11 mt-0 text-black font-primary'>
                                ตั้งค่า
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

export default page