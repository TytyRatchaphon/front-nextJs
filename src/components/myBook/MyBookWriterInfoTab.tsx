import React, { useState, useEffect } from 'react';
import { Input, Button, notification } from 'antd';
import { useRouter } from 'next/navigation';
import { registerWriter, updateWriter } from '@/services/apiServices';

const { TextArea } = Input;

interface MyBookWriterInfoTabProps {
  user: any;
  token: string | null;
  isWriter: boolean;
  updateToken: (token: string) => void;
}

const MyBookWriterInfoTab: React.FC<MyBookWriterInfoTabProps> = ({ user, token, isWriter, updateToken }) => {
  const router = useRouter();
  const [api, contextHolder] = notification.useNotification();

  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddressDetail, setRegAddressDetail] = useState('');
  const [regSubdistrict, setRegSubdistrict] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regProvince, setRegProvince] = useState('');
  const [regProvince2, setRegProvince2] = useState('');
  const [regSubdistrict2, setRegSubdistrict2] = useState('');
  const [regPostalCode, setRegPostalCode] = useState('');
  const [regNationality, setRegNationality] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set user data when component mounts
  useEffect(() => {
    if (user) {
      setRegLastName(user.fullname || '');
      setRegEmail(user.email || '');
    }
  }, [user]);

  // Prefill registration fields from decoded token
  useEffect(() => {
    if (!token) return;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const decodedToken = JSON.parse(jsonPayload);
      console.debug('MyBook: decodedToken for prefill ->', decodedToken);

      if (decodedToken.writer_name && !regFirstName) {
        setRegFirstName(String(decodedToken.writer_name));
      }

      if ((decodedToken.phone || decodedToken.tel) && !regPhone) {
        setRegPhone(String(decodedToken.phone ?? decodedToken.tel));
      }
      if (decodedToken.fullname && !regLastName) {
        setRegLastName(String(decodedToken.fullname));
      }
      if (decodedToken.email && !regEmail) {
        setRegEmail(String(decodedToken.email));
      }
      const maybeAddress = decodedToken.address || decodedToken.addr || decodedToken.addressDetail || decodedToken.location;
      if (maybeAddress && !regAddressDetail) setRegAddressDetail(String(maybeAddress));

      if (decodedToken.address_main && typeof decodedToken.address_main === 'string') {
        const addr = decodedToken.address_main as string;
        try {
          const firstMooMatch = addr.match(/หมู่\s+\S+/i);
          if (firstMooMatch && firstMooMatch.index !== undefined && firstMooMatch.index > 0 && !regAddressDetail) {
            setRegAddressDetail(addr.slice(0, firstMooMatch.index).trim());
          }

          const extractAfter = (keywordRegex: RegExp) => {
            const mm = addr.match(keywordRegex);
            if (!mm) return '';
            const after = mm[0].replace(/^[^\s]+\s*/i, '').trim();
            return after.split(/\s+/)[0] || '';
          };

          const moo = extractAfter(/หมู่\s+[^\s]+/i);
          const soi = extractAfter(/ซอย\s+[^\s]+/i);
          const road = extractAfter(/ถนน\s+[^\s]+/i);
          const tambon = extractAfter(/(?:แขวง\/ตำบล|แขวง|ตำบล)\s+[^\s]+/i);
          const amphoe = extractAfter(/(?:เขต\/อำเภอ|เขต|อำเภอ)\s+[^\s]+/i);
          const province = extractAfter(/จังหวัด\s+[^\s]+/i);
          const zipcode = extractAfter(/รหัสไปรษณีย์\s+[^\s]+/i);

          if (moo && !regSubdistrict) setRegSubdistrict(moo);
          if (soi && !regDistrict) setRegDistrict(soi);
          if (road && !regProvince) setRegProvince(road);
          if (tambon && !regProvince2) setRegProvince2(tambon);
          if (amphoe && !regSubdistrict2) setRegSubdistrict2(amphoe);
          if (province && !regPostalCode) setRegPostalCode(province);
          if (zipcode && !regNationality) setRegNationality(zipcode);
        } catch (e) {
          console.debug('address_main parse failed', e);
        }
      }
      if ((decodedToken.moo || decodedToken.village) && !regSubdistrict) setRegSubdistrict(String(decodedToken.moo ?? decodedToken.village));
      if ((decodedToken.soi || decodedToken.alley) && !regDistrict) setRegDistrict(String(decodedToken.soi ?? decodedToken.alley));
      if ((decodedToken.road || decodedToken.roadName) && !regProvince) setRegProvince(String(decodedToken.road ?? decodedToken.roadName));
      if ((decodedToken.district || decodedToken.county) && !regProvince2) setRegProvince2(String(decodedToken.district ?? decodedToken.county));
      if ((decodedToken.amphoe || decodedToken.district2) && !regSubdistrict2) setRegSubdistrict2(String(decodedToken.amphoe ?? decodedToken.district2));
      if ((decodedToken.province) && !regPostalCode) setRegPostalCode(String(decodedToken.province));
      if ((decodedToken.zipcode || decodedToken.postalCode) && !regNationality) setRegNationality(String(decodedToken.zipcode ?? decodedToken.postalCode));
    } catch (e) {
      console.debug('Prefill token decode failed', e);
    }
  }, [token]);

  const handleWriterRegistration = async () => {
    if (!regFirstName) { api.error({ message: 'กรุณาระบุนามปากกา' }); return; }
    if (!regLastName) { api.error({ message: 'กรุณาระบุชื่อ-นามสกุล' }); return; }
    if (!regEmail) { api.error({ message: 'กรุณาระบุอีเมล' }); return; }
    if (!regPhone) { api.error({ message: 'กรุณาระบุเบอร์โทรศัพท์' }); return; }
    if (!regAddressDetail) { api.error({ message: 'กรุณาระบุที่อยู่สำหรับจัดส่งเอกสาร' }); return; }
    if (!regSubdistrict) { api.error({ message: 'กรุณาระบุหมู่' }); return; }
    if (!regDistrict) { api.error({ message: 'กรุณาระบุซอย' }); return; }
    if (!regProvince) { api.error({ message: 'กรุณาระบุถนน' }); return; }
    if (!regProvince2) { api.error({ message: 'กรุณาระบุแขวง/ตำบล' }); return; }
    if (!regSubdistrict2) { api.error({ message: 'กรุณาระบุเขต/อำเภอ' }); return; }
    if (!regPostalCode) { api.error({ message: 'กรุณาระบุจังหวัด' }); return; }
    if (!regNationality) { api.error({ message: 'กรุณาระบุรหัสไปรษณีย์' }); return; }

    setIsSubmitting(true);

    try {
      const writerData = {
        writer_name: regFirstName.trim(),
        fullname: regLastName.trim(),
        email: regEmail.trim() || undefined,
        phone: regPhone.trim() || undefined,
        address: regAddressDetail.trim() || undefined,
        moo: regSubdistrict.trim() || undefined,
        soi: regDistrict.trim() || undefined,
        road: regProvince.trim() || undefined,
        district: regProvince2.trim() || undefined,
        amphoe: regSubdistrict2.trim() || undefined,
        province: regPostalCode.trim() || undefined,
        zipcode: regNationality.trim() || undefined,
      };

      const response = isWriter ? await updateWriter(writerData, token!) : await registerWriter(writerData, token!);

      if (response.status === 'success' && response.data?.token) {
        const newToken = response.data.token;
        api.success({
          message: response.message || 'สมัครนักเขียนสำเร็จ!',
          description: 'อัปเดตการเข้าสู่ระบบและรีเฟรชหน้าเพื่อใช้งานระบบนักเขียน',
        });

        try {
          if (newToken) {
            updateToken(newToken);
            setTimeout(() => {
              try {
                router.replace(window.location.pathname + window.location.search);
              } catch (e) {
                window.location.reload();
              }
            }, 300);
          } else {
            router.replace('/w/mybook');
          }
        } catch (err) {
          console.error('Error applying new token after registration:', err);
        }
      } else if (response.status === 'success' && !response.data?.token) {
        api.success({
          message: response.message || 'อัปเดตข้อมูลนักเขียนสำเร็จ',
        });
        setTimeout(() => {
          try {
            router.replace(window.location.pathname + window.location.search);
          } catch (e) {
            window.location.reload();
          }
        }, 300);
      } else if (response.status === 'successwarning' || response.status === 'warning') {
        api.warning({
          message: response.message || 'มีข้อผิดพลาด: โปรดตรวจสอบข้อมูลอีกครั้ง',
        });
      } else {
        api.error({
          message: response.message || 'ไม่สามารถสมัครนักเขียนได้',
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครนักเขียน';
      api.error({
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='py-6'>
      {contextHolder}
      <div className='max-w-5xl mx-auto'>
        <h2 className='text-2xl font-semibold mb-8'>ข้อมูลนักเขียน</h2>

        {/* Two Column Grid - First Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          <div>
            <label className='block mb-2 text-sm'>นามปากกา <span className="text-red-500">*</span></label>
            <Input 
              placeholder='กรอกนามปากกา'
              value={regFirstName}
              onChange={(e) => setRegFirstName(e.target.value)}
              required={!isWriter}
              aria-required={!isWriter}
            />
          </div>
          <div>
            <label className='block mb-2 text-sm'>ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
            <Input 
              placeholder='กรอกชื่อ-นามสกุล'
              value={regLastName}
              onChange={(e) => setRegLastName(e.target.value)}
              required={!isWriter}
              aria-required={!isWriter}
            />
          </div>
        </div>

        {/* Second Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          <div>
            <label className='block mb-2 text-sm'>อีเมล <span className="text-red-500">*</span></label>
            <Input 
              placeholder='กรอกอีเมล'
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              type="email"
              required={!isWriter}
              aria-required={!isWriter}
            />
          </div>
          <div>
            <label className='block mb-2 text-sm'>เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
            <Input 
              placeholder='กรอกเบอร์โทรศัพท์'
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              required={!isWriter}
              aria-required={!isWriter}
            />
          </div>
        </div>

        {/* Address Section Title */}
        <h3 className='text-xl font-semibold mb-6 mt-8'>ที่อยู่สำหรับจัดส่งเอกสาร</h3>

        {/* Address Detail - Full Width */}
        <div className='mb-6'>
          <label className='block mb-2 text-sm'>ที่อยู่ปัจจุบัน { !isWriter && <span className="text-red-500">*</span> }</label>
          <TextArea
            placeholder='กรอกที่อยู่ปัจจุบัน เช่น บ้านเลขที่ 123'
            value={regAddressDetail}
            onChange={(e) => setRegAddressDetail(e.target.value)}
            rows={4}
            required={!isWriter}
            aria-required={!isWriter}
          />
        </div>

        {/* Three Columns Row */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
          <div>
            <label className='block mb-2 text-sm'>หมู่ { !isWriter && <span className="text-red-500">*</span> }</label>
            <Input 
              placeholder='กรอกหมู่'
              value={regSubdistrict}
              onChange={(e) => setRegSubdistrict(e.target.value)}
              required={!isWriter}
              aria-required={!isWriter}
            />
          </div>
          <div>
            <label className='block mb-2 text-sm'>ซอย { !isWriter && <span className="text-red-500">*</span> }</label>
            <Input 
              placeholder='กรอกซอย'
              value={regDistrict}
              onChange={(e) => setRegDistrict(e.target.value)}
              required={!isWriter}
              aria-required={!isWriter}
            />
          </div>
          <div>
            <label className='block mb-2 text-sm'>ถนน { !isWriter && <span className="text-red-500">*</span> }</label>
            <Input 
              placeholder='กรอกถนน'
              value={regProvince}
              onChange={(e) => setRegProvince(e.target.value)}
              required={!isWriter}
              aria-required={!isWriter}
            />
          </div>
        </div>

        {/* Two Columns Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          <div>
            <label className='block mb-2 text-sm'>แขวง/ตำบล { !isWriter && <span className="text-red-500">*</span> }</label>
            <Input 
              placeholder='กรอกแขวง/ตำบล'
              value={regProvince2}
              onChange={(e) => setRegProvince2(e.target.value)}
              required={!isWriter}
              aria-required={!isWriter}
            />
          </div>
          <div>
            <label className='block mb-2 text-sm'>เขต/อำเภอ { !isWriter && <span className="text-red-500">*</span> }</label>
            <Input 
              placeholder='กรอกเขต/อำเภอ'
              value={regSubdistrict2}
              onChange={(e) => setRegSubdistrict2(e.target.value)}
              required={!isWriter}
              aria-required={!isWriter}
            />
          </div>
        </div>

        {/* Last Two Columns Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
          <div>
            <label className='block mb-2 text-sm'>จังหวัด { !isWriter && <span className="text-red-500">*</span> }</label>
            <Input 
              placeholder='กรอกจังหวัด'
              value={regPostalCode}
              onChange={(e) => setRegPostalCode(e.target.value)}
              required={!isWriter}
              aria-required={!isWriter}
            />
          </div>
          <div>
            <label className='block mb-2 text-sm'>รหัสไปรษณีย์ { !isWriter && <span className="text-red-500">*</span> }</label>
            <Input 
              placeholder='กรอกรหัสไปรษณีย์'
              value={regNationality}
              onChange={(e) => setRegNationality(e.target.value)}
              required={!isWriter}
              aria-required={!isWriter}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className='flex justify-center mt-8'>
          <Button
            type='primary'
            size='large'
            loading={isSubmitting}
            style={{
              backgroundColor: '#E31C3D',
              borderColor: '#E31C3D',
              paddingLeft: '48px',
              paddingRight: '48px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF4D6D';
              e.currentTarget.style.borderColor = '#FF4D6D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#E31C3D';
              e.currentTarget.style.borderColor = '#E31C3D';
            }}
            onClick={handleWriterRegistration}
          >
            {isWriter ? 'บันทึก' : 'สมัครนักเขียน'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MyBookWriterInfoTab;
