import * as React from "react";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Input, Button, notification, Upload, Select, Steps, ConfigProvider } from 'antd';
import { UploadOutlined, UserOutlined, BankOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { registerWriter, updateWriter, fetchWriterProfile, checkWriterStatus, getBankList, getBankIdCardAccount, updateBankIdCardAccount } from '@/services/apiServices';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const { Option } = Select;

interface MyBookWriterInfoTabProps {
  user: any;
  token: string | null;
  isWriter: boolean;
  updateToken: (token: string) => void;
}

const MyBookWriterInfoTab: React.FC<MyBookWriterInfoTabProps> = ({ user, token, isWriter }) => {
  useRouter();
  const [api, contextHolder] = notification.useNotification();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);

  // --- Step 1: Personal & Address Info ---
  const [regWriterName, setRegWriterName] = useState('');
  const [regFullname, setRegFullname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  
  // Detailed Address Fields
  const [regAddress, setRegAddress] = useState('');
  const [regMoo, setRegMoo] = useState('');
  const [regSoi, setRegSoi] = useState('');
  const [regRoad, setRegRoad] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regAmphoe, setRegAmphoe] = useState('');
  const [regProvince, setRegProvince] = useState('');
  const [regZipcode, setRegZipcode] = useState('');

  // --- Step 2: Bank & ID Card Info ---
  // ID Card
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardFileName, setIdCardFileName] = useState('');
  const [existingIdCard, setExistingIdCard] = useState<string | null>(null);
  const [idNumber, setIdNumber] = useState('');

  // Bank Account
  const [bankCertFile, setBankCertFile] = useState<File | null>(null);
  const [bankCertFileName, setBankCertFileName] = useState('');
  const [existingBankCert, setExistingBankCert] = useState<string | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch writer info (Profile Data)
  const { data: writerInfo, isLoading: isWriterInfoLoading } = useQuery({
    queryKey: ['writerProfile', token],
    queryFn: () => fetchWriterProfile(token ?? undefined),
    enabled: !!token, 
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // Fetch writer status
  const { data: writerStatus } = useQuery({
    queryKey: ['writerStatus', token],
    queryFn: () => checkWriterStatus(token),
    enabled: !!token,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // Fetch Bank List
  const { data: bankList = [] } = useQuery({
    queryKey: ['bankList'],
    queryFn: getBankList,
  });

  // Fetch Existing Account Info (for Step 2 pre-fill)
  const { data: accountInfo } = useQuery({
    queryKey: ['accountInfo'],
    queryFn: getBankIdCardAccount,
    enabled: !!token, 
  });

  // Populate Step 1 (Personal)
  useEffect(() => {
    // 1. Try filling from Writer Profile
    if (writerInfo?.data) {
      const data = (writerInfo as any).data;
      if (data.writer_name) setRegWriterName(data.writer_name);
      if (data.fullname) setRegFullname(data.fullname);
      if (data.email) setRegEmail(data.email);
      if (data.phone) setRegPhone(data.phone);
      
      // Address fields
      if (data.address) setRegAddress(data.address);
      if (data.moo) setRegMoo(data.moo);
      if (data.soi) setRegSoi(data.soi);
      if (data.road) setRegRoad(data.road);
      if (data.district || data.district) setRegDistrict(data.district || data.district);
      if (data.amphoe || data.amphoe) setRegAmphoe(data.amphoe || data.amphoe);
      if (data.province) setRegProvince(data.province);
      if (data.zipcode) setRegZipcode(data.zipcode);
    } 
    // 2. Fallback to User prop
    else if (user) {
      if (!regFullname) setRegFullname(user.fullname || '');
      if (!regEmail) setRegEmail(user.email || '');
    }
  }, [writerInfo, user, regEmail, regFullname]);

  // Populate Step 2 (Bank/ID)
  useEffect(() => {
    if (accountInfo?.data && Array.isArray(accountInfo.data) && accountInfo.data.length > 0) {
      const data = accountInfo.data[0];
      const bank = bankList.find((b: any) => b.code === data.bankID);
      if (bank) setBankName(bank.name);

      if (data.acc_name) setAccountName(data.acc_name);
      if (data.acc_number) setAccountNumber(data.acc_number);
      if (data.IDcard) setIdNumber(data.IDcard);
      
      if (data.acc_img) setExistingBankCert(data.acc_img);
      if (data.IDcard_img) setExistingIdCard(data.IDcard_img);
    }
  }, [accountInfo, bankList]);

  // Sync Account Name with Fullname if empty
  useEffect(() => {
    if (regFullname && !accountName) {
      setAccountName(regFullname);
    }
  }, [regFullname, accountName]);


  // Combined Submit Handler for Existing Writer (Single Step)
  const handleUpdateProfile = async () => {
    // Validation for Personal Info
    if (!regWriterName) { api.error({ message: 'กรุณาระบุนามปากกา' }); return; }
    if (!regFullname) { api.error({ message: 'กรุณาระบุชื่อ-นามสกุล' }); return; }
    if (!regEmail) { api.error({ message: 'กรุณาระบุอีเมล' }); return; }
    if (!regPhone) { api.error({ message: 'กรุณาระบุเบอร์โทรศัพท์' }); return; }
    if (!regAddress) { api.error({ message: 'กรุณาระบุที่อยู่' }); return; }
    if (!regMoo) { api.error({ message: 'กรุณาระบุหมู่' }); return; }
    if (!regSoi) { api.error({ message: 'กรุณาระบุซอย' }); return; }
    if (!regRoad) { api.error({ message: 'กรุณาระบุถนน' }); return; }
    if (!regDistrict) { api.error({ message: 'กรุณาระบุแขวง/ตำบล' }); return; }
    if (!regAmphoe) { api.error({ message: 'กรุณาระบุเขต/อำเภอ' }); return; }
    if (!regProvince) { api.error({ message: 'กรุณาระบุจังหวัด' }); return; }
    if (!regZipcode) { api.error({ message: 'กรุณาระบุรหัสไปรษณีย์' }); return; }

    setIsSubmitting(true);

    try {
      const writerData = {
        writer_name: regWriterName.trim(),
        fullname: regFullname.trim(),
        email: regEmail.trim() || undefined,
        phone: regPhone.trim() || undefined,
        address: regAddress.trim() || undefined,
        moo: regMoo.trim() || undefined,
        soi: regSoi.trim() || undefined,
        road: regRoad.trim() || undefined,
        district: regDistrict.trim() || undefined,
        amphoe: regAmphoe.trim() || undefined,
        province: regProvince.trim() || undefined,
        zipcode: regZipcode.trim() || undefined,
      };

      const response = await updateWriter(writerData, token!);

      if (response.status === 'success' || response.code === 200) {
          api.success({
              message: 'บันทึกข้อมูลสำเร็จ',
              description: 'ระบบได้ทำการบันทึกข้อมูลเรียบร้อยแล้ว',
          });
          queryClient.invalidateQueries({ queryKey: ['writerProfile'] });
      } else {
        api.error({ message: response.message || 'ไม่สามารถบันทึกข้อมูลได้' });
      }
    } catch (error: any) {
      api.error({ message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    // Validation for Step 1
    if (!regWriterName) { api.error({ message: 'กรุณาระบุนามปากกา' }); return; }
    if (!regFullname) { api.error({ message: 'กรุณาระบุชื่อ-นามสกุล' }); return; }
    if (!regEmail) { api.error({ message: 'กรุณาระบุอีเมล' }); return; }
    if (!regPhone) { api.error({ message: 'กรุณาระบุเบอร์โทรศัพท์' }); return; }
    if (!regAddress) { api.error({ message: 'กรุณาระบุที่อยู่' }); return; }
    if (!regMoo) { api.error({ message: 'กรุณาระบุหมู่' }); return; }
    if (!regSoi) { api.error({ message: 'กรุณาระบุซอย' }); return; }
    if (!regRoad) { api.error({ message: 'กรุณาระบุถนน' }); return; }
    if (!regDistrict) { api.error({ message: 'กรุณาระบุแขวง/ตำบล' }); return; }
    if (!regAmphoe) { api.error({ message: 'กรุณาระบุเขต/อำเภอ' }); return; }
    if (!regProvince) { api.error({ message: 'กรุณาระบุจังหวัด' }); return; }
    if (!regZipcode) { api.error({ message: 'กรุณาระบุรหัสไปรษณีย์' }); return; }

    // If already a writer, update immediately (No Step 2)
    if (isWriter) {
      handleUpdateProfile();
    } else {
      // If registering new, go to Step 2
      setCurrentStep(1); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep(0); // Go back to Step 1
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [isSuccessLocal, setIsSuccessLocal] = useState(false);

  const handleFinalSubmit = async () => {
    // Validation for Step 2
    if ((!idCardFile && !existingIdCard)) { api.error({ message: 'กรุณาอัปโหลดรูปหน้าบัตรประชาชน' }); return; }
    if (!idNumber) { api.error({ message: 'กรุณาระบุเลขบัตรประจำตัวประชาชน' }); return; }
    
    if ((!bankCertFile && !existingBankCert)) { api.error({ message: 'กรุณาอัปโหลดรูปสมุดบัญชี' }); return; }
    if (!accountName) { api.error({ message: 'กรุณาระบุชื่อบัญชี' }); return; }
    if (!bankName) { api.error({ message: 'กรุณาเลือกธนาคาร' }); return; }
    if (!accountNumber) { api.error({ message: 'กรุณาระบุเลขบัญชี' }); return; }

    setIsSubmitting(true);

    try {
      // 1. Submit Profile Info
      const writerData = {
        writer_name: regWriterName.trim(),
        fullname: regFullname.trim(),
        email: regEmail.trim() || undefined,
        phone: regPhone.trim() || undefined,
        address: regAddress.trim() || undefined,
        moo: regMoo.trim() || undefined,
        soi: regSoi.trim() || undefined,
        road: regRoad.trim() || undefined,
        district: regDistrict.trim() || undefined,
        amphoe: regAmphoe.trim() || undefined,
        province: regProvince.trim() || undefined,
        zipcode: regZipcode.trim() || undefined,
      };

      // Only 'registerWriter' here because isWriter updates are handled in handleNext/handleUpdateProfile
      const response = await registerWriter(writerData, token!);

      if (response.status === 'success' || response.code === 200 || response.data?.status === 'wait') {
          // 2. Submit Bank/ID Info
          const formData = new FormData();
          const selectedBank = bankList.find((b: any) => b.name === bankName);
          
          if (selectedBank) formData.append('bankID', selectedBank.code);
          formData.append('acc_name', accountName);
          formData.append('acc_number', accountNumber);
          formData.append('IDcard', idNumber);
          
          const fullAddress = `${regAddress} ม.${regMoo} ซ.${regSoi} ถ.${regRoad} ต.${regDistrict} อ.${regAmphoe} จ.${regProvince} ${regZipcode}`;
          formData.append('current_address', fullAddress); 
          
          if (bankCertFile) formData.append('acc_img', bankCertFile);
          if (idCardFile) formData.append('IDcard_img', idCardFile);

          const bankRes = await updateBankIdCardAccount(formData);

          if (bankRes && (bankRes.code === 200 || bankRes.status === 'success')) {
              api.success({
                  message: 'สมัครนักเขียนและบันทึกข้อมูลเรียบร้อย',
                  description: 'ข้อมูลของท่านกำลังอยู่ระหว่างการตรวจสอบ',
              });
              setIsSuccessLocal(true); // Immediate feedback
              queryClient.invalidateQueries({ queryKey: ['writerProfile'] });
              queryClient.invalidateQueries({ queryKey: ['accountInfo'] });
          } else {
              api.warning({
                  message: 'บันทึกข้อมูลส่วนตัวสำเร็จ แต่บันทึกข้อมูลบัญชีไม่สำเร็จ',
                  description: bankRes?.message || 'กรุณาลองใหม่ภายหลัง',
              });
          }

      } else {
        api.error({
          message: response.message || 'ไม่สามารถบันทึกข้อมูลได้',
        });
      }

    } catch (error: any) {
      api.error({
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWaitingForApproval = (writerStatus?.data?.status === 'wait' || isSuccessLocal) && !isWriter;

  if (isWaitingForApproval) {
     return (
      <div className='py-16 flex flex-col items-center justify-center min-h-[500px] animate-fade-in'>
         <div className="bg-white border border-yellow-100 rounded-3xl p-10 text-center max-w-2xl w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
            {/* ... Waiting UI ... */}
            <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
              <div className="absolute w-full h-full rounded-full bg-yellow-100 animate-ping opacity-20"></div>
              <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4 font-primary">ได้รับข้อมูลเรียบร้อยแล้ว</h3>
            <div className="w-16 h-1 bg-yellow-400 mx-auto rounded-full mb-6"></div>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-md mx-auto">
              ระบบกำลังตรวจสอบข้อมูลการสมัครนักเขียนของท่าน <br/>
              กรุณารอการอนุมัติจากผู้ดูแลระบบ
            </p>
            <div className="bg-yellow-50 text-yellow-700 py-3 px-6 rounded-xl inline-flex items-center gap-3 text-sm font-medium">
               <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
               สถานะ: รอการอนุมัติ
            </div>
         </div>
      </div>
    );
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#E31C3D' } }}>
      <div className='py-6'>
        {contextHolder}
        <div className='max-w-5xl mx-auto'>
          <h2 className='text-3xl font-bold mb-8 text-center'>ข้อมูลนักเขียน</h2>

          {!isWriter && (
            <div className="mb-8 max-w-2xl mx-auto">
                <Steps 
                    current={currentStep} 
                    items={[
                        { title: <span className="font-medium">ข้อมูลส่วนตัว และที่อยู่</span>, icon: <UserOutlined /> },
                        { title: <span className="font-medium">ข้อมูลบัญชี และเอกสาร</span>, icon: <BankOutlined /> }
                    ]}
                />
            </div>
          )}

          {/* STEP 1 */}
          {currentStep === 0 && (
            <div className="animate-fade-in bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100">
              <h3 className='text-xl font-bold mb-6 text-gray-800 border-b pb-4'>ข้อมูลส่วนตัว</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-700'>นามปากกา <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกนามปากกา'
                    value={regWriterName}
                    onChange={(e) => setRegWriterName(e.target.value)}
                    size="large"
                  />
                </div>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-700'>เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกเบอร์โทรศัพท์'
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    size="large"
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                <div>
                    <label className='block mb-2 text-sm font-medium text-gray-700'>อีเมล <span className="text-red-500">*</span></label>
                    <Input 
                      placeholder='กรอกอีเมล'
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      type="email"
                      size="large"
                    />
                </div>
              </div>

              <h3 className='text-xl font-bold mb-6 text-gray-800 border-b pb-4 mt-8'>ที่อยู่สำหรับจัดส่งเอกสาร</h3>
              
              <div className='mb-6'>
                <label className='block mb-2 text-sm font-medium text-gray-700'>บ้านเลขที่ / อาคาร / หมู่บ้าน <span className="text-red-500">*</span></label>
                <Input
                  placeholder='เช่น บ้านเลขที่ 123'
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  size="large"
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-700'>หมู่ <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกหมู่'
                    value={regMoo}
                    onChange={(e) => setRegMoo(e.target.value)}
                    size="large"
                  />
                </div>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-700'>ซอย <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกซอย'
                    value={regSoi}
                    onChange={(e) => setRegSoi(e.target.value)}
                    size="large"
                  />
                </div>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-700'>ถนน <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกถนน'
                    value={regRoad}
                    onChange={(e) => setRegRoad(e.target.value)}
                    size="large"
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-700'>แขวง/ตำบล <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกแขวง/ตำบล'
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    size="large"
                  />
                </div>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-700'>เขต/อำเภอ <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกเขต/อำเภอ'
                    value={regAmphoe}
                    onChange={(e) => setRegAmphoe(e.target.value)}
                    size="large"
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-700'>จังหวัด <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกจังหวัด'
                    value={regProvince}
                    onChange={(e) => setRegProvince(e.target.value)}
                    size="large"
                  />
                </div>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-700'>รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกรหัสไปรษณีย์'
                    value={regZipcode}
                    onChange={(e) => setRegZipcode(e.target.value)}
                    size="large"
                  />
                </div>
              </div>
              
              <div className='flex justify-end mt-10'>
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleNext}
                  style={{
                    paddingLeft: '40px',
                    paddingRight: '40px',
                    height: '48px',
                    fontSize: '16px'
                  }}
                >
                  {isWriter ? 'บันทึกข้อมูล' : 'ถัดไป'}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 1 && (
            <div className="animate-fade-in bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100">
              
              {/* ID Card Section */}
              <div className='mb-10'>
                  <h3 className='text-xl font-bold text-gray-800 border-b pb-4 mb-6'>ข้อมูลบัตรประชาชน</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    {/* Upload */}
                    <div>
                        <label className='block mb-3 text-sm font-medium text-gray-700'>รูปถ่ายหน้าบัตรประชาชน <span className="text-red-500">*</span></label>
                        <div className='border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 text-center hover:bg-gray-100 transition-colors'>
                            {(!idCardFileName && !existingIdCard) && (
                              <div className="mb-4 text-gray-400">
                                <div className="text-4xl mb-2">📷</div>
                                <div className="text-xs">อัปโหลดรูปภาพ (jpg, png)</div>
                              </div>
                            )}
                            
                            {(existingIdCard && !idCardFile) && (
                                <Image src={existingIdCard} alt="ID Card" width={640} height={400} sizes="160px" unoptimized className="h-40 w-auto object-contain mx-auto border rounded mb-4" />
                            )}

                            <Upload
                              beforeUpload={(file) => {
                                  setIdCardFileName(file.name);
                                  setIdCardFile(file);
                                  return false;
                              }}
                              showUploadList={false}
                              maxCount={1}
                            >
                              <Button icon={<UploadOutlined />}>เลือกรูปภาพ</Button>
                            </Upload>
                            
                            {idCardFileName && (
                                <div className="mt-3 text-sm text-green-600 flex items-center justify-center gap-2">
                                    <span>{idCardFileName}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setIdCardFileName(''); setIdCardFile(null); }} className="text-red-500 hover:underline text-xs">ลบ</button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Input */}
                    <div>
                        <label className='block mb-3 text-sm font-medium text-gray-700'>เลขบัตรประจำตัวประชาชน <span className="text-red-500">*</span></label>
                        <Input 
                            placeholder='กรอกเลขบัตร 13 หลัก'
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            maxLength={13}
                            size="large"
                        />
                        <p className="text-xs text-gray-400 mt-2">กรอกเฉพาะตัวเลข ไม่ต้องมีเครื่องหมายขีด (-)</p>
                    </div>
                  </div>
              </div>

              {/* Bank Section */}
              <div className='mb-8'>
                  <h3 className='text-xl font-bold text-gray-800 border-b pb-4 mb-6'>ข้อมูลบัญชีธนาคาร</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    {/* Upload */}
                    <div>
                        <label className='block mb-3 text-sm font-medium text-gray-700'>รูปถ่ายหน้าสมุดบัญชี <span className="text-red-500">*</span></label>
                        <div className='border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 text-center hover:bg-gray-100 transition-colors'>
                            {(!bankCertFileName && !existingBankCert) && (
                              <div className="mb-4 text-gray-400">
                                <div className="text-4xl mb-2">📒</div>
                                <div className="text-xs">อัปโหลดรูปภาพ (jpg, png)</div>
                              </div>
                            )}

                            {(existingBankCert && !bankCertFile) && (
                                <Image src={existingBankCert} alt="Bank Book" width={640} height={400} sizes="160px" unoptimized className="h-40 w-auto object-contain mx-auto border rounded mb-4" />
                            )}

                            <Upload
                              beforeUpload={(file) => {
                                  setBankCertFileName(file.name);
                                  setBankCertFile(file);
                                  return false;
                              }}
                              showUploadList={false}
                              maxCount={1}
                            >
                              <Button icon={<UploadOutlined />}>เลือกรูปภาพ</Button>
                            </Upload>

                            {bankCertFileName && (
                                <div className="mt-3 text-sm text-green-600 flex items-center justify-center gap-2">
                                    <span>{bankCertFileName}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setBankCertFileName(''); setBankCertFile(null); }} className="text-red-500 hover:underline text-xs">ลบ</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className='block mb-2 text-sm font-medium text-gray-700'>ชื่อบัญชี (ต้องตรงกับชื่อ-สกุล) <span className="text-red-500">*</span></label>
                            <Input 
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                size="large"
                            />
                        </div>
                        
                        <div>
                            <label className='block mb-2 text-sm font-medium text-gray-700'>ธนาคาร <span className="text-red-500">*</span></label>
                            <Select
                              placeholder='เลือกธนาคาร'
                              value={bankName}
                              onChange={setBankName}
                              className='w-full'
                              size="large"
                            >
                              {bankList.map((bank: any) => (
                                <Option key={bank.code} value={bank.name}>{bank.name}</Option>
                              ))}
                            </Select>
                        </div>

                        <div>
                            <label className='block mb-2 text-sm font-medium text-gray-700'>เลขที่บัญชี <span className="text-red-500">*</span></label>
                            <Input 
                                placeholder='กรอกเลขที่บัญชี'
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                maxLength={15}
                                size="large"
                            />
                        </div>
                    </div>
                  </div>
              </div>

              <div className='flex justify-between mt-10 border-t pt-8'>
                  <Button 
                    size="large"
                    onClick={handlePrev}
                    className="min-w-[120px]"
                  >
                    ย้อนกลับ
                  </Button>
                  
                  <Button 
                    type="primary" 
                    size="large" 
                    loading={isSubmitting || isWriterInfoLoading}
                    onClick={handleFinalSubmit}
                    style={{
                      paddingLeft: '40px',
                      paddingRight: '40px',
                      height: '48px',
                      fontSize: '16px'
                    }}
                  >
                    {isWriter ? 'บันทึกข้อมูล' : 'สมัครนักเขียน'}
                  </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </ConfigProvider>
  );
};

export default MyBookWriterInfoTab;
