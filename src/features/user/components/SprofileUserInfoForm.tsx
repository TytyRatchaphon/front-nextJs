"use client";
import * as React from "react";
import { useEffect, useState } from 'react'
import {
  Form,
  Input,
  DatePicker,
  Select,
} from 'antd';
import dayjs from 'dayjs';
import { useFormStore } from '@/stores/formStore';
import { useAuthStore } from '@/stores/authStore';
import { fetchUserProfileCategories } from '@/services/apiServices';

const { TextArea } = Input;
const { Option } = Select;

export const SprofileUserInfoForm = () => {
  const [form] = Form.useForm();
  const { userProfileForm, updateUserProfile } = useFormStore();
  const { user } = useAuthStore();

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await fetchUserProfileCategories();
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
