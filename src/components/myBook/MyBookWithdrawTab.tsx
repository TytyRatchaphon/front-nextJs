import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Tabs, Upload, Input, Select, Table, Tag, Modal, InputNumber, notification } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { getBankList, updateBankIdCardAccount, getBankIdCardAccount, postWriterWithdraw, fetchWriterWithdrawHistory, fetchWriterWithdrawSetting } from '@/services/apiServices';
import GifLoader from '@/components/utility/GifLoader';

const { TextArea } = Input;
const { Option } = Select;

interface MyBookWithdrawTabProps {
  token: string | null;
  coinIncome: string | number;
  setCoinIncome: (val: number | string) => void;
  updateToken: (token: string) => void;
}

const MyBookWithdrawTab: React.FC<MyBookWithdrawTabProps> = ({ token, coinIncome, setCoinIncome, updateToken }) => {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountCardTab, setAccountCardTab] = useState('info');
  const [bankCertFileName, setBankCertFileName] = useState('');
  const [idCardFileName, setIdCardFileName] = useState('');
  const [bankCertFile, setBankCertFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [existingBankCert, setExistingBankCert] = useState<string | null>(null);
  const [existingIdCard, setExistingIdCard] = useState<string | null>(null);
  
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [api, contextHolder] = notification.useNotification();

  // Fetch Bank List
  const { data: bankList = [] } = useQuery({
    queryKey: ['bankList'],
    queryFn: getBankList,
  });

  // Fetch Existing Account Info
  const { data: accountInfo } = useQuery({
    queryKey: ['accountInfo'],
    queryFn: getBankIdCardAccount,
    enabled: !!token, 
  });

  useEffect(() => {
    if (accountInfo?.data && Array.isArray(accountInfo.data) && accountInfo.data.length > 0) {
      const data = accountInfo.data[0];
      const { bankID, acc_name, acc_number, IDcard, current_address, acc_img, IDcard_img } = data;
      
      // Find bank name from bankID
      const bank = bankList.find((b: any) => b.code === bankID);
      if (bank) {
        setBankName(bank.name);
      }

      setAccountName(acc_name || '');
      setAccountNumber(acc_number || '');
      setIdNumber(IDcard || '');
      setAddress(current_address || '');
      setExistingBankCert(acc_img || null);
      setExistingIdCard(IDcard_img || null);
    }
  }, [accountInfo, bankList]);

  const handleSaveAccountInfo = async () => {
    if (!bankName || !accountNumber || !accountName || !idNumber || !address) {
      api.error({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      return;
    }

    const formData = new FormData();
    const selectedBank = bankList.find((b: any) => b.name === bankName);
    if (!selectedBank) {
      api.error({ message: 'กรุณาเลือกธนาคาร' });
      return;
    }

    formData.append('bankID', selectedBank.code);
    formData.append('acc_name', accountName);
    formData.append('acc_number', accountNumber);
    formData.append('IDcard', idNumber);
    formData.append('current_address', address);
    
    if (bankCertFile) {
      formData.append('acc_img', bankCertFile);
    }
    if (idCardFile) {
      formData.append('IDcard_img', idCardFile);
    }

    setSaveLoading(true);
    try {
      const res = await updateBankIdCardAccount(formData);
      if (res && (res.code === 200 || res.status === 'success')) {
        api.success({ message: 'บันทึกข้อมูลสำเร็จ' });
      } else {
        api.error({ message: res?.message || 'บันทึกข้อมูลไม่สำเร็จ' });
      }
    } catch (err: any) {
      api.error({ message: err?.response?.data?.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setSaveLoading(false);
    }
  };

  // Fetch withdraw settings
  const { data: withdrawSetting = null } = useQuery({
    queryKey: ['withdrawSetting'],
    queryFn: async () => {
      try {
        const res = await fetchWriterWithdrawSetting();
        return res?.data ?? res ?? null;
      } catch (e) {
        console.error('Error fetching withdraw settings', e);
        return null;
      }
    },
    enabled: !!token,
  });

  const minBaht = Number(withdrawSetting?.min_baht ?? withdrawSetting?.min_bath ?? 100);
  const vatPercent = Number(withdrawSetting?.vat ?? withdrawSetting?.vat ?? 3);
  const serviceFee = Number(withdrawSetting?.service ?? 10);
  const maxBaht = Number(withdrawSetting?.max_baht ?? withdrawSetting?.max_bath ?? 100000);
  const formattedMaxBaht = Number.isFinite(maxBaht) ? maxBaht.toLocaleString('en-US') : String(maxBaht ?? '');

  // Keep withdrawAmount clamped
  useEffect(() => {
    const avail = Number(coinIncome || 0);
    if (!Number.isFinite(avail)) return;
    if (withdrawAmount > avail) {
      setWithdrawAmount(avail);
    }
  }, [coinIncome, withdrawAmount]);

  // Withdraw history
  const { data: withdrawHistory = [], isLoading: isLoadingWithdrawHistory, error: withdrawHistoryError, refetch: refetchWithdrawHistory } = useQuery({
    queryKey: ['withdrawHistory'],
    queryFn: fetchWriterWithdrawHistory,
    enabled: !!token,
  });

  const handleConfirmWithdraw = async () => {
    const amount = Number(withdrawAmount) || 0;
    const avail = Number(coinIncome) || 0;
    if (!Number.isFinite(amount) || amount <= 0) {
      api.error({ message: 'กรุณาระบุจำนวนเงินที่ถูกต้อง' });
      return;
    }
    if (amount < minBaht) {
      api.error({ message: `ยอดถอนขั้นต่ำคือ ${minBaht} บาท` });
      return;
    }
    if (amount > avail) {
      api.error({ message: 'จำนวนเงินถอนมากกว่ายอดที่ถอนได้' });
      return;
    }

    setWithdrawLoading(true);
    try {
      const res = await postWriterWithdraw(amount);
      const data = res.data;
      if (data && (data.code === 200 || data.status === 'success')) {
// ...
        const tax = +((amount * (vatPercent / 100))).toFixed(2);
        const service = Number(serviceFee || 0);
        const receive = +(amount - tax - service).toFixed(2);
        api.success({ message: data.message || 'ส่งคำขอถอนเงินเรียบร้อย', description: `ยอดที่คุณจะได้รับ ${receive.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท` });
        
        const newBalance = +(avail - amount).toFixed(2);
        setCoinIncome(newBalance >= 0 ? newBalance : 0);

        try {
          const returnedToken = data?.token ?? data?.data?.token ?? data?.data?.data?.token;
          if (returnedToken) {
            const nt = String(returnedToken);
            updateToken(nt);
            if (typeof window !== 'undefined') localStorage.setItem('authToken', nt);
          }
        } catch (e) {
          console.debug('No token in withdraw response or error reading it', e);
        }

        setShowWithdrawModal(false);
        setWithdrawAmount(0);

        try {
          if (typeof refetchWithdrawHistory === 'function') refetchWithdrawHistory();
        } catch (e) {
          console.debug('refetchWithdrawHistory failed', e);
        }
      } else {
        api.error({ message: data?.message || 'ไม่สามารถส่งคำขอถอนเงินได้' });
      }
    } catch (err: any) {
      console.error('Withdraw API error:', err);
      const msg = err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      api.error({ message: msg });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const withdrawColumns = [
    {
      title: 'วันที่',
      dataIndex: 'date_withdraw',
      key: 'date_withdraw',
      render: (val: string) => {
        try {
          const d = new Date(val);
          return d.toLocaleString('th-TH');
        } catch (e) {
          return val;
        }
      }
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const color = s === 'done' || s === 'success' ? 'green' : (s === 'wait' ? 'orange' : 'red');
        return <Tag color={color}>{s}</Tag>;
      }
    },
    {
      title: 'จำนวนที่ขอ',
      dataIndex: 'get_amount',
      key: 'get_amount',
      render: (v: number) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })
    },
    {
      title: 'ค่าบริการ',
      dataIndex: 'service',
      key: 'service',
      render: (v: number) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })
    },
    {
      title: 'ภาษี',
      dataIndex: 'tax_amount',
      key: 'tax_amount',
      render: (v: number) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })
    },
    {
      title: 'จำนวนที่ได้รับสุทธิ',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })
    },
    {
      title: 'เลขบัญชี',
      dataIndex: 'acc_number',
      key: 'acc_number',
    },
  ];

  return (
    <div className='py-6'>
      {contextHolder}
      {/* Top Action Buttons */}
      <div className='mb-6 flex gap-4 flex-wrap items-center'>
        <Button
          type='primary'
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.125 10.3122C7.125 11.0397 7.68751 11.6247 8.37751 11.6247H9.78749C10.3875 11.6247 10.875 11.1147 10.875 10.4772C10.875 9.79468 10.575 9.54719 10.1325 9.38969L7.875 8.60218C7.4325 8.44468 7.13251 8.20469 7.13251 7.51469C7.13251 6.88469 7.61999 6.36719 8.21999 6.36719H9.63C10.32 6.36719 10.8825 6.95219 10.8825 7.67969" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 5.625V12.375" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.5 9C16.5 13.14 13.14 16.5 9 16.5C4.86 16.5 1.5 13.14 1.5 9C1.5 4.86 4.86 1.5 9 1.5" stroke="#DFDFEC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.5 4.5V1.5H13.5" stroke="#DFDFEC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12.75 5.25L16.5 1.5" stroke="#DFDFEC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          style={{
            backgroundColor: '#E31C3D',
            borderColor: '#E31C3D',
            borderRadius: '6px',
            height: '40px',
            fontSize: '14px',
            fontWeight: '500',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#C41230';
            e.currentTarget.style.borderColor = '#C41230';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#E31C3D';
            e.currentTarget.style.borderColor = '#E31C3D';
          }}
          onClick={() => setShowWithdrawModal(true)}
        >
          แจ้งถอนเงิน
        </Button>
        
        <span className='text-sm text-red-600'>*ยอดขั้นต่ำที่สามารถถอนเงิน {minBaht ?? 100} บาท*</span>
        
        <div className='flex gap-4 ml-auto'>
          <Link href="/howto/howincome" className='inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800'>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 16.5C13.125 16.5 16.5 13.125 16.5 9C16.5 4.875 13.125 1.5 9 1.5C4.875 1.5 1.5 4.875 1.5 9C1.5 13.125 4.875 16.5 9 16.5Z" stroke="#777777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6V9.75" stroke="#777777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.99609 12H9.00283" stroke="#DFDFEC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            ส่วนแบ่งรายได้นักเขียน
          </Link>
          
          <Link href="/howto/howwithdraw" className='inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800'>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 16.5C13.125 16.5 16.5 13.125 16.5 9C16.5 4.875 13.125 1.5 9 1.5C4.875 1.5 1.5 4.875 1.5 9C1.5 13.125 4.875 16.5 9 16.5Z" stroke="#777777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6V9.75" stroke="#777777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.99609 12H9.00283" stroke="#DFDFEC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            ขั้นตอนการจ่ายเงินให้นักเขียน
          </Link>
        </div>
      </div>

      {/* Tabs with Card Style */}
      <Tabs
        type="card"
        activeKey={accountCardTab}
        onChange={setAccountCardTab}
        items={[
          {
            key: 'info',
            label: 'ข้อมูลบัญชี',
            children: (
              <div className='p-6'>
                {/* สำเนาบัตรประชาชน Section */}
                <div className='mb-8'>
                  <div className='flex items-center mb-6'>
                    <div className='border-t border-gray-300 w-12'></div>
                    <h3 className='text-xl font-bold text-black px-4'>สำเนาบัตรประชาชน</h3>
                    <div className='flex-grow border-t border-gray-300'></div>
                  </div>
                  
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* ID Card Upload - Left */}
                    <div>
                      <label className='block mb-2 text-sm'>รูปหน้าบัตรประจำตัวประชาชน <span className="text-red-500">*</span></label>
                      <div className='border-2 border-dashed border-gray-300 rounded p-4 bg-gray-50'>
                        <div className='flex items-center gap-3'>
                          <Upload
                            beforeUpload={(file) => {
                              setIdCardFileName(file.name);
                              setIdCardFile(file);
                              return false;
                            }}
                            showUploadList={false}
                            maxCount={1}
                          >
                            <Button icon={<UploadOutlined />}>
                              อัพโหลดรูปภาพ
                            </Button>
                          </Upload>
                          {(idCardFileName || existingIdCard) && (
                            <div className='flex items-center gap-2 text-sm text-blue-600'>
                              <span className="truncate max-w-[150px]">{idCardFileName || (existingIdCard ? 'มีภาพเดิมอยู่แล้ว' : '')}</span>
                              <button 
                                className='text-red-500 hover:text-red-700'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIdCardFileName('');
                                  setIdCardFile(null);
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4.625 1.87402H4.5C4.56875 1.87402 4.625 1.81777 4.625 1.74902V1.87402H9.375V1.74902C9.375 1.81777 9.43125 1.87402 9.5 1.87402H9.375V2.99902H10.5V1.74902C10.5 1.19746 10.0516 0.749023 9.5 0.749023H4.5C3.94844 0.749023 3.5 1.19746 3.5 1.74902V2.99902H4.625V1.87402ZM12.5 2.99902H1.5C1.22344 2.99902 1 3.22246 1 3.49902V3.99902C1 4.06777 1.05625 4.12402 1.125 4.12402H2.06875L2.45469 12.2959C2.47969 12.8287 2.92031 13.249 3.45313 13.249H10.5469C11.0813 13.249 11.5203 12.8303 11.5453 12.2959L11.9313 4.12402H12.875C12.9438 4.12402 13 4.06777 13 3.99902V3.49902C13 3.22246 12.7766 2.99902 12.5 2.99902ZM10.4266 12.124H3.57344L3.19531 4.12402H10.8047L10.4266 12.124Z" fill="black" fillOpacity="0.45"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        {existingIdCard && !idCardFile && (
                           <div className="mt-4 flex justify-center">
                             <img src={existingIdCard} alt="ID Card" className="h-32 object-contain border rounded" />
                           </div>
                        )}
                        {!existingIdCard && !idCardFile && (
                          <div className='mt-4 bg-gray-200 h-40 rounded flex items-center justify-center text-gray-400'>
                            <span>ตัวอย่างรูปภาพ</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side - ID Number and Address */}
                    <div className='space-y-4'>
                      {/* ID Number Input */}
                      <div>
                        <label className='block mb-2 text-sm'>เลขบัตรประจำตัวประชาชน <span className="text-red-500">*</span></label>
                        <Input 
                          placeholder='กรอกเลขบัตร'
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                        />
                      </div>

                      {/* Address Input */}
                      <div>
                        <label className='block mb-2 text-sm'>ที่อยู่ปัจจุบัน <span className="text-red-500">*</span></label>
                        <TextArea
                          placeholder='กรอกที่อยู่ปัจจุบัน'
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* บัญชีธนาคาร Section */}
                <div className='mb-8'>
                  <div className='flex items-center mb-6'>
                    <div className='border-t border-gray-300 w-12'></div>
                    <h3 className='text-xl font-bold text-black px-4'>บัญชีธนาคาร</h3>
                    <div className='flex-grow border-t border-gray-300'></div>
                  </div>
                  
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* Bank Book Upload - Left */}
                    <div>
                      <label className='block mb-2 text-sm'>รูปสำเนาบัญชีธนาคาร <span className="text-red-500">*</span></label>
                      <div className='border-2 border-dashed border-gray-300 rounded p-4 bg-gray-50'>
                        <div className='flex items-center gap-3'>
                          <Upload
                            beforeUpload={(file) => {
                              setBankCertFileName(file.name);
                              setBankCertFile(file);
                              return false;
                            }}
                            showUploadList={false}
                            maxCount={1}
                          >
                            <Button icon={<UploadOutlined />}>
                              อัพโหลดรูปภาพ
                            </Button>
                          </Upload>
                          {(bankCertFileName || existingBankCert) && (
                            <div className='flex items-center gap-2 text-sm text-blue-600'>
                              <span className="truncate max-w-[150px]">{bankCertFileName || (existingBankCert ? 'มีภาพเดิมอยู่แล้ว' : '')}</span>
                              <button 
                                className='text-red-500 hover:text-red-700'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBankCertFileName('');
                                  setBankCertFile(null);
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4.625 1.87402H4.5C4.56875 1.87402 4.625 1.81777 4.625 1.74902V1.87402H9.375V1.74902C9.375 1.81777 9.43125 1.87402 9.5 1.87402H9.375V2.99902H10.5V1.74902C10.5 1.19746 10.0516 0.749023 9.5 0.749023H4.5C3.94844 0.749023 3.5 1.19746 3.5 1.74902V2.99902H4.625V1.87402ZM12.5 2.99902H1.5C1.22344 2.99902 1 3.22246 1 3.49902V3.99902C1 4.06777 1.05625 4.12402 1.125 4.12402H2.06875L2.45469 12.2959C2.47969 12.8287 2.92031 13.249 3.45313 13.249H10.5469C11.0813 13.249 11.5203 12.8303 11.5453 12.2959L11.9313 4.12402H12.875C12.9438 4.12402 13 4.06777 13 3.99902V3.49902C13 3.22246 12.7766 2.99902 12.5 2.99902ZM10.4266 12.124H3.57344L3.19531 4.12402H10.8047L10.4266 12.124Z" fill="black" fillOpacity="0.45"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        {existingBankCert && !bankCertFile && (
                           <div className="mt-4 flex justify-center">
                             <img src={existingBankCert} alt="Bank Cert" className="h-32 object-contain border rounded" />
                           </div>
                        )}
                        {!existingBankCert && !bankCertFile && (
                          <div className='mt-4 bg-gray-200 h-40 rounded flex items-center justify-center text-gray-400'>
                            <span>ตัวอย่างรูปภาพ</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side - Bank Info */}
                    <div className='space-y-4'>
                      {/* Account Name */}
                      <div>
                        <label className='block mb-2 text-sm'>ชื่อ - นามสกุล (ภาษาไทยเท่านั้น) <span className="text-red-500">*</span></label>
                        <Input 
                          placeholder='กรอกชื่อ-นามสกุล'
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                        />
                      </div>

                      {/* Bank Selection */}
                      <div>
                        <label className='block mb-2 text-sm'>ธนาคาร <span className="text-red-500">*</span></label>
                        <Select
                          placeholder='เลือกธนาคาร'
                          value={bankName}
                          onChange={setBankName}
                          className='w-full'
                        >
                          {bankList.map((bank: any) => (
                            <Option key={bank.code} value={bank.name}>{bank.name}</Option>
                          ))}
                        </Select>
                      </div>

                      {/* Account Number */}
                      <div>
                        <label className='block mb-2 text-sm'>เลขบัญชี <span className="text-red-500">*</span></label>
                        <Input 
                          placeholder='กรอกเลขบัญชี'
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          maxLength={15}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className='flex justify-center mt-8'>
                  <Button
                    type='primary'
                    size='large'
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
                    onClick={handleSaveAccountInfo}
                    loading={saveLoading}
                  >
                    บันทึก
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: 'history',
            label: 'ประวัติถอนเงิน',
            children: (
              <div className='p-6'>
                {isLoadingWithdrawHistory ? (
                  <GifLoader className="py-12" width={100} height={100} />
                ) : withdrawHistoryError ? (
                  <div className='text-center text-red-500'>เกิดข้อผิดพลาดในการโหลดประวัติ</div>
                ) : Array.isArray(withdrawHistory) && withdrawHistory.length > 0 ? (
                  <Table
                    columns={withdrawColumns}
                    dataSource={withdrawHistory.map((r: any, index: number) => ({ 
                            ...r, 
                            key: r.id || r._id || `withdraw-${index}` 
                          }))}
                    pagination={{ pageSize: 10 }}
                  />
                ) : (
                  <div className='p-12 text-center text-gray-500'>ยังไม่มีประวัติการถอนเงิน</div>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Withdraw Modal */}
      <Modal
        title={<div className='text-center text-lg font-semibold'>แบบฟอร์มแจ้งถอนเงิน</div>}
        open={showWithdrawModal}
        className="withdraw-modal"
        onCancel={() => setShowWithdrawModal(false)}
        onOk={handleConfirmWithdraw}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{ style: { backgroundColor: '#E31C3D', borderColor: '#E31C3D', color: '#ffffff' }, loading: withdrawLoading }}
      >
        <div className='space-y-4'>
          <div className='flex justify-between'>
            <div>
              <div className='text-sm font-medium'>จำนวนเงิน</div>
              <div className='flex items-center justify-between gap-4'>
                <div className='text-xs text-gray-500 whitespace-nowrap'>ถอนขั้นต่ำ {minBaht ?? 100} บาท</div>
                <span className='text-gray-500 text-xs whitespace-nowrap'>|</span>
                <div className='text-xs text-gray-500 whitespace-nowrap text-right flex-shrink-0' style={{ minWidth: 0 }}>
                  <span className='block'>ถอนสูงสุด <span className='font-medium'>{formattedMaxBaht ?? 100}</span> บาท</span>
                </div>
              </div>
            </div>
          </div>

          <div className='flex items-center justify-center'>
              <InputNumber
                min={0}
                max={Math.min(Number(coinIncome || 0), Number.isFinite(maxBaht) ? maxBaht : Number(coinIncome || 0))}
              value={withdrawAmount}
              onChange={(v) => {
                const num = Number(v) || 0;
                const avail = Number(coinIncome || 0);
                setWithdrawAmount(Number.isFinite(avail) ? Math.min(num, avail) : num);
              }}
              formatter={(v) => `${v}`}
              parser={(v) => (v ? Number(v.replace(/,/g, '')) : 0)}
              style={{ width: '100%', textAlign: 'center' }}
              step={1}
            />
          </div>

          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div>ยอดเงินที่ต้องการถอน</div>
            <div className='text-right'>{Number(withdrawAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</div>

            <div>ภาษี ณ ที่จ่าย {Math.round(vatPercent)}%</div>
            <div className='text-right'>{(Number(withdrawAmount || 0) * (vatPercent / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</div>

            <div>ค่าบริการถอน</div>
            <div className='text-right'>{Number(serviceFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</div>

            <div>ยอดจริงที่คุณจะได้รับ</div>
            <div className='text-right'>{(Math.max(0, Number(withdrawAmount || 0) - (Number(withdrawAmount || 0) * (vatPercent / 100)) - Number(serviceFee || 0))).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</div>
          </div>

          <div className='text-sm text-gray-500'>ยอดที่ถอนได้ปัจจุบัน: {Number(coinIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</div>
        </div>
      </Modal>
    </div>
  );
};

export default MyBookWithdrawTab;
