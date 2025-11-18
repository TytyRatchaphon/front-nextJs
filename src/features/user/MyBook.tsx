'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs, Input, Select, Button, DatePicker, Table, Pagination, Card, Upload, notification, Modal, InputNumber, Spin, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import type { TabsProps } from 'antd';
import { SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import MyCardBook from '@/components/MyBookCard';
import type { Dayjs } from 'dayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { registerWriter, updateWriter } from '@/services/apiServices';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

function MyBook() {
  const router = useRouter();
  const { user, token, isLoggedIn, updateToken, hasMounted } = useAuthStore();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  
  // Check if user is logged in — wait until persisted store has hydrated
  useEffect(() => {
    if (!hasMounted) return; // wait for hydration

    if (!isLoggedIn || !token) {
      // Try to recover from localStorage backup first (in case hydration missed)
      try {
        const backupToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        if (backupToken) {
          // Apply backup token to auth store and avoid redirect
          useAuthStore.getState().updateToken(backupToken);
          return;
        }
      } catch (e) {
        console.warn('Error reading backup token from localStorage', e);
      }

      router.push('/');
    }
  }, [hasMounted, isLoggedIn, token, router]);
  
  // Decode token to check writer_name
  const [isWriter, setIsWriter] = useState(false);
  
  React.useEffect(() => {
    if (token) {
      try {
        // Decode JWT token (base64)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decodedToken = JSON.parse(jsonPayload);
        console.log('Decoded token:', decodedToken);
        
        // Check if writer_name exists and is not null
        setIsWriter(decodedToken.writer_name !== null && decodedToken.writer_name !== undefined);
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsWriter(false);
      }
    }
  }, [token]);
  
  // State for statistics tab
  // replaced free-text search with multiple-select of user's books
  const [statsSelectedBooks, setStatsSelectedBooks] = useState<any[]>([]);
  const [statsCategory, setStatsCategory] = useState('จำนวนครั้งที่อ่าน');
  const [statsSearched, setStatsSearched] = useState(false);
  // AntD notification hook to avoid static notification theme warning
  const [api, contextHolder] = notification.useNotification();



  
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  
  // State for sales report tab
  // Default to start of current month -> now so initial query covers the month to date
  const [salesDateRange, setSalesDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs().startOf('month'), dayjs()]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for withdrawal tab
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawalTab, setWithdrawalTab] = useState('1');
  const [accountCardTab, setAccountCardTab] = useState('info');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipFileName, setSlipFileName] = useState('');
  const [bankCertFile, setBankCertFile] = useState<File | null>(null);
  const [bankCertFileName, setBankCertFileName] = useState('');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardFileName, setIdCardFileName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  
  // State for registration tab
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
  const [coinIncome, setCoinIncome] = useState<string | number>('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch withdraw settings (min_baht, vat, service)
  const { data: withdrawSetting = null, isLoading: isLoadingWithdrawSetting } = useQuery({
    queryKey: ['withdrawSetting'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/user/withdraw/setting');
        return res.data?.data ?? res.data ?? null;
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

  // Keep withdrawAmount clamped to available coinIncome whenever coinIncome changes
  React.useEffect(() => {
    const avail = Number(coinIncome || 0);
    if (!Number.isFinite(avail)) return;
    if (withdrawAmount > avail) {
      setWithdrawAmount(avail);
    }
  }, [coinIncome]);
  
  // Set user data when component mounts
  React.useEffect(() => {
    if (user) {
      setRegLastName(user.fullname || '');
      setRegEmail(user.email || '');
      if ((user as any).coinIncome !== undefined && (user as any).coinIncome !== null) {
        const raw = (user as any).coinIncome;
        const parsed = Number(raw);
        setCoinIncome(Number.isFinite(parsed) ? parsed : String(raw));
      }
    }
  }, [user]);

  // Prefill registration fields from decoded token when available
  React.useEffect(() => {
    if (!token) return;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const decodedToken = JSON.parse(jsonPayload);
      console.debug('MyBook: decodedToken for prefill ->', decodedToken);

      // coinIncome from token (if present) - show in stats
      if (decodedToken.coinIncome !== undefined && decodedToken.coinIncome !== null) {
        // prefer numeric if possible
        const parsed = Number(decodedToken.coinIncome);
        setCoinIncome(Number.isFinite(parsed) ? parsed : String(decodedToken.coinIncome));
      }

      // If writer_name exists in token and regFirstName is empty, prefill it
      if (decodedToken.writer_name && !regFirstName) {
        setRegFirstName(String(decodedToken.writer_name));
      }

      // If phone exists in token and regPhone is empty, prefill it
      if ((decodedToken.phone || decodedToken.tel) && !regPhone) {
        // token might use `phone` or `tel` depending on backend
        setRegPhone(String(decodedToken.phone ?? decodedToken.tel));
      }
      // Additional token fields to prefill other form inputs if they are empty
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
        console.debug('MyBook: address_main raw ->', addr);
        try {
          // Find the first standalone 'หมู่ <something>' occurrence and use the text before it
          // as the main address detail (handles cases like 'หมู่บ้านเจริญลาภ 5 หมู่ 3 ...').
          const firstMooMatch = addr.match(/หมู่\s+\S+/i);
          if (firstMooMatch && firstMooMatch.index !== undefined && firstMooMatch.index > 0 && !regAddressDetail) {
            setRegAddressDetail(addr.slice(0, firstMooMatch.index).trim());
          }

          // Helper to extract the first token after a keyword using space-aware regex (works with Thai)
          const extractAfter = (keywordRegex: RegExp) => {
            const mm = addr.match(keywordRegex);
            if (!mm) return '';
            // mm[0] is like 'ซอย 28' or 'ถนน รังสิต-นครนายก ...', so capture after keyword
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
      // ignore decode errors
      console.debug('Prefill token decode failed', e);
    }
  }, [token]);

  // Handle writer registration - รื้อใหม่หมด
  const handleWriterRegistration = async () => {
    // Validation
    if (!regFirstName) {
      api.error({
        message: 'กรุณาระบุนามปากกา',
      });
      return;
    }
    if (!regLastName) {
      api.error({
        message: 'กรุณาระบุชื่อ-นามสกุล',
      });
      return;
    }
    if (!regEmail) {
      api.error({
        message: 'กรุณาระบุอีเมล',
      });
      return;
    }
    // Additional required fields
    if (!regPhone) {
      api.error({ message: 'กรุณาระบุเบอร์โทรศัพท์' });
      return;
    }
    if (!regAddressDetail) {
      api.error({ message: 'กรุณาระบุที่อยู่สำหรับจัดส่งเอกสาร' });
      return;
    }
    if (!regSubdistrict) {
      api.error({ message: 'กรุณาระบุหมู่' });
      return;
    }
    if (!regDistrict) {
      api.error({ message: 'กรุณาระบุซอย' });
      return;
    }
    if (!regProvince) {
      api.error({ message: 'กรุณาระบุถนน' });
      return;
    }
    if (!regProvince2) {
      api.error({ message: 'กรุณาระบุแขวง/ตำบล' });
      return;
    }
    if (!regSubdistrict2) {
      api.error({ message: 'กรุณาระบุเขต/อำเภอ' });
      return;
    }
    if (!regPostalCode) {
      api.error({ message: 'กรุณาระบุจังหวัด' });
      return;
    }
    if (!regNationality) {
      api.error({ message: 'กรุณาระบุรหัสไปรษณีย์' });
      return;
    }

    setIsSubmitting(true);

    try {
      const writerData = {
        writer_name: regFirstName.trim(),
        fullname: regLastName.trim(),
        // email is optional - backend may use token's email; include if provided
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

      console.log('========================================');
      console.log('📤 ข้อมูลที่จะส่งไป Backend:');
      console.log(JSON.stringify(writerData, null, 2));
      console.log('🔑 Token:', token);
      console.log('========================================');

  // ส่งข้อมูลไป backend (ถ้าเป็น writer อยู่แล้วให้เรียก updateWriter)
  const response = isWriter ? await updateWriter(writerData, token!) : await registerWriter(writerData, token!);

      console.log('========================================');
      console.log('📥 Response จาก Backend:');
      console.log('Full response:', response);
      console.log('Status:', response.status);
      console.log('Code:', response.code);
      console.log('Message:', response.message);
      console.log('Data:', response.data);
      console.log('Token in response:', response.data?.token);
      console.log('========================================');

      // ตรวจสอบ response
      // Handle both registerWriter and updateWriter responses. Backend may or may not return a new token for update.
      if (response.status === 'success' && response.data?.token) {
        const newToken = response.data.token;
        
        // Decode token ใหม่เพื่อดูข้อมูล
        try {
          const base64Url = newToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(decodeURIComponent(
            atob(base64).split('').map(c => 
              '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
          ));
          
          console.log('========================================');
          console.log('🔓 Decoded NEW Token:');
          console.log('fullname:', decoded.fullname);
          console.log('writer_name:', decoded.writer_name);
          console.log('email:', decoded.email);
          console.log('========================================');
        } catch (e) {
          console.error('Error decoding token:', e);
        }
        
        // สำเร็จ - ได้ token ใหม่
        api.success({
          message: response.message || 'สมัครนักเขียนสำเร็จ!',
          description: 'อัปเดตการเข้าสู่ระบบและรีเฟรชหน้าเพื่อใช้งานระบบนักเขียน',
        });

        // อัปเดต token ใน auth store แล้วรีเฟรชหน้า (แทนการ forced logout)
        try {
          const newToken = response.data.token;
          if (newToken) {
            // ใช้ action ใน Zustand store เพื่ออัปเดต token และ user จาก payload
            const { updateToken } = useAuthStore.getState();
            updateToken(newToken);

            // ให้เวลา state อัปเดตก่อนรีโหลดหน้าสักนิด (ไม่จำเป็นแต่ช่วยให้ log ปรากฏ)
            setTimeout(() => {
              try {
                // รีเฟรชโดยไม่เปลี่ยน route — อยู่ที่หน้าเดิม เช่น /w/mybook
                router.replace(window.location.pathname + window.location.search);
              } catch (e) {
                // fallback: full reload
                window.location.reload();
              }
            }, 300);
          } else {
            // หากไม่มี token ให้ fallback เป็น redirect ไปที่หน้า /w/mybook
            router.replace('/w/mybook');
          }
        } catch (err) {
          console.error('Error applying new token after registration:', err);
          // fallback: logout to be safe
          const { logout } = useAuthStore.getState();
          logout();
        }
      } else if (response.status === 'success' && !response.data?.token) {
        // Update succeeded but no new token returned
        api.success({
          message: response.message || 'อัปเดตข้อมูลนักเขียนสำเร็จ',
        });
        // Refresh current page to reflect changes
        setTimeout(() => {
          try {
            router.replace(window.location.pathname + window.location.search);
          } catch (e) {
            window.location.reload();
          }
        }, 300);
      } else if (response.status === 'successwarning' || response.status === 'warning') {
        // Backend ส่งเตือน (เช่น นามปากกาหรืออีเมลถูกใช้งานแล้ว)
        console.warn('⚠️ Registration warning:', response.message);
        api.warning({
          message: response.message || 'มีข้อผิดพลาด: โปรดตรวจสอบข้อมูลอีกครั้ง',
        });
      } else {
        // ไม่สำเร็จ - แสดง error
        console.error('❌ Registration failed or no token received', response);
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

  // Withdraw modal confirm handler
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
      const payload = { amount };
      const res = await apiClient.post('/user/withdraw', payload);
      // Expect ApiResponse shape
      const data = res.data;
      if (data && (data.code === 200 || data.status === 'success')) {
        // Compute receive amount for message using dynamic vat/service
        const tax = +((amount * (vatPercent / 100))).toFixed(2);
        const service = Number(serviceFee || 0);
        const receive = +(amount - tax - service).toFixed(2);
        api.success({ message: data.message || 'ส่งคำขอถอนเงินเรียบร้อย', description: `ยอดที่คุณจะได้รับ ${receive.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท` });
        // Update local displayed balance immediately
        const newBalance = +(avail - amount).toFixed(2);
        setCoinIncome(newBalance >= 0 ? newBalance : 0);
        // If backend returned a refreshed token, apply it to auth store and localStorage
        try {
          const returnedToken = data?.token ?? data?.data?.token ?? data?.data?.data?.token;
          if (returnedToken) {
            const nt = String(returnedToken);
            try {
              if (updateToken && typeof updateToken === 'function') {
                updateToken(nt);
              } else {
                useAuthStore.getState().updateToken(nt);
              }
              if (typeof window !== 'undefined') localStorage.setItem('authToken', nt);
              console.log('🔁 Applied token returned from withdraw response');
            } catch (e) {
              console.warn('Failed to apply returned token from withdraw response', e);
            }
          }
        } catch (e) {
          console.debug('No token in withdraw response or error reading it', e);
        }

        // Close modal and reset amount
        setShowWithdrawModal(false);
        setWithdrawAmount(0);

        // Refresh withdraw history list if available
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

  // Stats: fetch book-level series from backend and transform into chart rows
  // Map statsCategory to backend metric query param
  const metricParam = React.useMemo(() => (statsCategory === 'รายได้' ? 'income' : 'read'), [statsCategory]);

  const formattedStatsRange = React.useMemo(() => {
    if (salesDateRange && salesDateRange[0] && salesDateRange[1]) {
      const s = (salesDateRange[0] as any).startOf ? (salesDateRange[0] as any).startOf('day').format('YYYY-MM-DD') : dayjs(salesDateRange[0]).startOf('day').format('YYYY-MM-DD');
      const e = (salesDateRange[1] as any).endOf ? (salesDateRange[1] as any).endOf('day').format('YYYY-MM-DD') : dayjs(salesDateRange[1]).endOf('day').format('YYYY-MM-DD');
      return [s, e];
    }
    const end = dayjs();
    const start = end.startOf('day').subtract(13, 'day');
    return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')];
  }, [salesDateRange]);

  const bookIdsParam = React.useMemo(() => {
    if (!Array.isArray(statsSelectedBooks) || statsSelectedBooks.length === 0) return '';
    return statsSelectedBooks.join(',');
  }, [statsSelectedBooks]);

  // Reset the "searched" flag when user changes filters so they must press ค้นหา again
  React.useEffect(() => {
    setStatsSearched(false);
  }, [statsSelectedBooks, statsCategory, salesDateRange]);

  const { data: bookStatsResponse = null, isLoading: isLoadingBookStats, refetch: refetchBookStats } = useQuery({
    queryKey: ['bookStats', bookIdsParam, metricParam, formattedStatsRange[0], formattedStatsRange[1]],
    queryFn: async () => {
      if (!bookIdsParam) return null;
      try {
        const params: Record<string, string> = {
          book_id: bookIdsParam,
          metric: metricParam,
          start: formattedStatsRange[0],
          end: formattedStatsRange[1],
          groupBy: 'day',
        };
        const res = await apiClient.get('/user/bookstats', { params });
        return res.data;
      } catch (e) {
        console.error('Error fetching bookstats:', e);
        return null;
      }
    },
    enabled: !!token && !!bookIdsParam,
  });

  // Transform backend shape (see attachments) into rows like [{ date: '2025-11-12', 'Book A': 406, 'Book B': 3 }, ...]
  const { statsChartData, statsSeriesKeys } = React.useMemo(() => {
    const dataRows: Record<string, any> = {};
    const seriesKeys: string[] = [];
    try {
      const d = bookStatsResponse?.data ?? bookStatsResponse;
      if (!d || !Array.isArray(d.books)) return { statsChartData: [], statsSeriesKeys: [] };
      for (const book of d.books) {
        const bookName = String(book.name ?? book.title ?? `#${book.book_id ?? book.bookID ?? book.id}`);
        seriesKeys.push(bookName);
        if (Array.isArray(book.series)) {
          for (const point of book.series) {
            const date = point.date || point.x || point[0];
            const value = Number(point.value ?? point.y ?? 0) || 0;
            if (!date) continue;
            if (!dataRows[date]) dataRows[date] = { date };
            dataRows[date][bookName] = value;
          }
        }
      }
      // Convert map to sorted array by date
      const rows = Object.keys(dataRows).sort().map(dk => dataRows[dk]);
      return { statsChartData: rows, statsSeriesKeys: seriesKeys };
    } catch (e) {
      console.error('Error transforming bookStats response', e);
      return { statsChartData: [], statsSeriesKeys: [] };
    }
  }, [bookStatsResponse]);

  // Normalize salesDateRange into formatted start/end strings to avoid timezone surprises
  const formattedSalesRange = React.useMemo(() => {
    if (salesDateRange && salesDateRange[0] && salesDateRange[1]) {
      const s = (salesDateRange[0] as any).startOf ? (salesDateRange[0] as any).startOf('day').format('YYYY-MM-DD HH:mm:ss') : dayjs(salesDateRange[0]).startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const e = (salesDateRange[1] as any).endOf ? (salesDateRange[1] as any).endOf('day').format('YYYY-MM-DD HH:mm:ss') : dayjs(salesDateRange[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss');
      return [s, e];
    }
    const end = dayjs();
    const start = end.startOf('day').subtract(13, 'day'); // last 14 days default
    return [start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss')];
  }, [salesDateRange]);

  // Sales report - fetch from backend and map to table
  const { data: salesResponse = null, isLoading: isLoadingSales, error: salesError, refetch: refetchSales } = useQuery({
    queryKey: ['salesReport', formattedSalesRange[0], formattedSalesRange[1]],
    queryFn: async () => {
      try {
        const params = {
          start: formattedSalesRange[0],
          end: formattedSalesRange[1],
        } as Record<string, string>;

        console.debug('Fetching sales-report with params:', params);
        const res = await apiClient.get('/user/sales-report', { params });
        console.debug('sales-report raw response:', res.data);
        // Return the full response data object so we can extract rows and totals
        return res.data;
      } catch (err) {
        console.error('Error fetching sales report:', err);
        return [];
      }
    },
    enabled: !!token,
  });

  // Export sales report to Excel (calls backend export endpoint and triggers download)
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        start: formattedSalesRange[0],
        end: formattedSalesRange[1],
      } as Record<string, string>;

      const res = await apiClient.get('/user/sales-report/export', { params, responseType: 'blob' as const });

      const contentType = res.headers?.['content-type'] || res.headers?.['Content-Type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });

      // Try to extract filename from content-disposition header if available
      let filename = `sales-report-${formattedSalesRange[0]}_to_${formattedSalesRange[1]}.xlsx`;
      const cd = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'];
      if (cd) {
        try {
          const m = cd.match(/filename\*?=(?:UTF-8'')?"?([^;\"\n]+)"?/);
          if (m && m[1]) filename = decodeURIComponent(m[1]);
        } catch (e) {
          // ignore
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      api.success({ message: 'เริ่มดาวน์โหลดไฟล์ Excel' });
    } catch (err: any) {
      console.error('Export error:', err);
      const msg = err?.response?.data?.message || err?.message || 'ไม่สามารถดาวน์โหลดไฟล์ได้';
      api.error({ message: msg });
    } finally {
      setExporting(false);
    }
  };
  const salesColumns: ColumnsType<{ key: any; name: any; coin_sales_total: any; freecoin_sales_total: any; revenue: any; }> = [
    {
      title: 'เรื่อง',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'ยอดเหรียญ',
      dataIndex: 'coin_sales_total',
      key: 'coin_sales_total',
      align: 'right',
      render: (v: any) => {
        const n = Number(v) || 0;
        return `${n.toLocaleString('en-US')}`;
      }
    },
    {
      title: 'ยอดถุงเงิน',
      dataIndex: 'freecoin_sales_total',
      key: 'freecoin_sales_total',
      align: 'right',
      render: (v: any) => {
        const n = Number(v) || 0;
        return `${n.toLocaleString('en-US')}`;
      }
    },
    {
      title: 'รายได้ (บาท)',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (v: any, record: any) => {
        // Prefer explicit revenue field, otherwise fallback to common aliases
        const raw = v ?? record.total ?? record.income ?? record.revenue ?? record.amount ?? record.total_money ?? record.money ?? 0;
        const n = Number(raw) || 0;
        return `${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
      }
    },
  ];
  

  // Derive rows and totals from the salesResponse
  const salesRows: any[] = React.useMemo(() => {
    if (!salesResponse) return [];
    const d = salesResponse;
    if (Array.isArray(d)) return d as any[];
    if (Array.isArray(d.data)) return d.data as any[];
    if (Array.isArray(d.items)) return d.items as any[];
    if (d.data && Array.isArray((d.data as any).books)) return (d.data as any).books;
    if (Array.isArray((d as any).books)) return (d as any).books;
    if (d.data && Array.isArray((d.data as any).rows)) return (d.data as any).rows;
    if (d.data && Array.isArray((d.data as any).items)) return (d.data as any).items;
    return [];
  }, [salesResponse]);

  const salesTotals = React.useMemo(() => {
    if (!salesResponse) return null;
    const d = salesResponse;
    return d?.data?.totals ?? null;
  }, [salesResponse]);

  const salesData = Array.isArray(salesRows) ? salesRows.map((r: any, idx: number) => ({
    // Prefer `book_id` as the stable key if backend provides it
    key: r.book_id ?? r.id ?? r._id ?? idx,
    name: r.name ?? r.title ?? r.book_name ?? '-',
    coin_sales_total: r.coin_sales_total ?? r.coin_sales ?? r.coin_sales_total_amount ?? 0,
    freecoin_sales_total: r.freecoin_sales_total ?? r.freecoin_sales ?? r.freecoin_sales_total_amount ?? 0,
    // Backend sometimes returns income as `income_baht` — include that alias
    revenue: r.income_baht ?? r.total ?? r.income ?? r.revenue ?? r.amount ?? r.total_money ?? r.money ?? 0,
  })) : [];

  // Debug: log the exact shapes used by the table to help diagnose mismatches with Postman
  React.useEffect(() => {
    console.debug('salesRows (from API):', salesRows);
    console.debug('salesData (mapped for Table):', salesData);
    console.debug('salesTotals (from API):', salesTotals);
  }, [salesRows, salesData, salesTotals]);

  // Fetch user's books for the "งานเขียน" tab
  const [booksPage, setBooksPage] = React.useState<number>(1);
  const booksLimit = 12;
  // Keep the raw response so we can read pagination totals
  const { data: myBooksResponse = null, isLoading: isLoadingMyBooks, error: myBooksError } = useQuery({
    queryKey: ['myBooks', booksPage, booksLimit],
    queryFn: async () => {
      const res = await apiClient.get('/user/mybook/search', { params: { page: booksPage, limit: booksLimit } });
      return res.data;
    },
    enabled: !!token,
  });

  // Derive items array and total count from the API response (handle common shapes)
  const myBooks: any[] = React.useMemo(() => {
    const d = myBooksResponse;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.data)) return d.data;
    if (d.data && Array.isArray(d.data.items)) return d.data.items;
    if (d.data && Array.isArray(d.data.books)) return d.data.books;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.books)) return d.books;
    return [];
  }, [myBooksResponse]);

  const myBooksTotal: number | null = React.useMemo(() => {
    const d = myBooksResponse as any;
    if (!d) return null;
    // common locations for total
    return d.total ?? d.count ?? d.data?.total ?? d.data?.total_items ?? d.data?.total_count ?? d.data?.totalBooks ?? null;
  }, [myBooksResponse]);

  // Withdraw history fetch using react-query
  const { data: withdrawHistory = [], isLoading: isLoadingWithdrawHistory, error: withdrawHistoryError, refetch: refetchWithdrawHistory } = useQuery({
    queryKey: ['withdrawHistory'],
    queryFn: async () => {
      const res = await apiClient.get('/user/withdraw');
      const d = res.data;
      if (!d) return [];
      if (Array.isArray(d)) return d;
      if (d.data && Array.isArray(d.data)) return d.data;
      // fallback
      return d.items ?? [];
    },
    enabled: !!token,
  });

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

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: (
        <div className='flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <g clipPath="url(#clip0_1334_2725)">
            <path d="M10.1922 3.90412C10.4891 3.60881 10.4891 3.12756 10.1922 2.83224L9.09999 1.74006L9.10155 1.74162C8.81249 1.45256 8.31561 0.955681 7.61249 0.254119C7.28124 -0.0693187 6.7453 -0.0661937 6.41718 0.261931L0.26405 6.41037C0.185325 6.48856 0.122846 6.58155 0.0802105 6.68399C0.0375748 6.78643 0.015625 6.89629 0.015625 7.00725C0.015625 7.1182 0.0375748 7.22806 0.0802105 7.3305C0.122846 7.43294 0.185325 7.52593 0.26405 7.60412L6.41561 13.751C6.57422 13.9093 6.78916 13.9983 7.01327 13.9983C7.23737 13.9983 7.45232 13.9093 7.61093 13.751L10.1906 11.1729C10.4875 10.8776 10.4875 10.3963 10.1906 10.101C10.048 9.95911 9.85505 9.87946 9.65389 9.87946C9.45274 9.87946 9.25977 9.95911 9.11718 10.101L7.16405 12.0572C7.0828 12.1385 6.95624 12.1385 6.87499 12.0572L1.96092 7.14787C1.87967 7.06662 1.87967 6.94006 1.96092 6.85881L6.87343 1.94943C6.87968 1.94318 6.88749 1.93849 6.89374 1.93224C6.97499 1.86818 7.08749 1.87443 7.16249 1.94943L9.11874 3.90412C9.41561 4.20099 9.89686 4.20099 10.1922 3.90412ZM5.38436 7.0385C5.38436 7.47859 5.55935 7.90066 5.87084 8.21185C6.18233 8.52304 6.60479 8.69787 7.0453 8.69787C7.48581 8.69787 7.90827 8.52304 8.21976 8.21185C8.53125 7.90066 8.70624 7.47859 8.70624 7.0385C8.70624 6.5984 8.53125 6.17633 8.21976 5.86514C7.90827 5.55395 7.48581 5.37912 7.0453 5.37912C6.60479 5.37912 6.18233 5.55395 5.87084 5.86514C5.55935 6.17633 5.38436 6.5984 5.38436 7.0385ZM13.7625 6.43537L11.8422 4.52443C11.5453 4.22912 11.0641 4.22912 10.7687 4.52599C10.6982 4.59626 10.6422 4.67978 10.6039 4.77175C10.5657 4.86372 10.546 4.96234 10.546 5.06193C10.546 5.16153 10.5657 5.26014 10.6039 5.35211C10.6422 5.44408 10.6982 5.5276 10.7687 5.59787L12.0656 6.89318C12.1469 6.97443 12.1469 7.10099 12.0656 7.18224L10.7875 8.45881C10.7169 8.52907 10.6609 8.61259 10.6227 8.70456C10.5845 8.79653 10.5648 8.89515 10.5648 8.99474C10.5648 9.09434 10.5845 9.19295 10.6227 9.28493C10.6609 9.3769 10.7169 9.46041 10.7875 9.53068C10.9301 9.67257 11.1231 9.75221 11.3242 9.75221C11.5254 9.75221 11.7183 9.67257 11.8609 9.53068L13.7641 7.62912C13.8425 7.55073 13.9047 7.45763 13.9471 7.35515C13.9895 7.25267 14.0113 7.14282 14.0111 7.03192C14.011 6.92102 13.9889 6.81123 13.9463 6.70886C13.9036 6.60649 13.8411 6.51355 13.7625 6.43537Z" fill="black" fillOpacity="0.85"/>
            </g>
            <defs>
            <clipPath id="clip0_1334_2725">
            <rect width="14" height="14" fill="white"/>
            </clipPath>
            </defs>
          </svg>
          งานเขียน
        </div>
      ),
      children: (
        <div className='py-6'>
          {/* Search Bar */}
          <div className='flex gap-4 mb-6'>
            <Input
              placeholder="พิมพ์ชื่อเรื่อง"
              prefix={<SearchOutlined className='text-gray-400' />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className='flex-1'
              size='large'
            />
            <Select
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value)}
              style={{ width: 200 }}
              size='large'
            >
              <Option value="ทั้งหมด">ทั้งหมด</Option>
              <Option value="โรแมนติก">โรแมนติก</Option>
              <Option value="แฟนตาซี">แฟนตาซี</Option>
              <Option value="ดราม่า">ดราม่า</Option>
            </Select>
            <Button 
              type="primary" 
              danger 
              size='large'
              style={{ backgroundColor: '#E31C3D', borderColor: '#E31C3D' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF4D6D';
                e.currentTarget.style.borderColor = '#FF4D6D';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#E31C3D';
                e.currentTarget.style.borderColor = '#E31C3D';
              }}
            >
              + สร้างนิยาย
            </Button>
          </div>

          {/* Books Grid */}
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
            {isLoadingMyBooks ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='h-40 bg-gray-100 rounded animate-pulse' />
              ))
            ) : (Array.isArray(myBooks) && myBooks.length > 0) ? (
              myBooks.map((book: any) => (
                <MyCardBook key={book.book_id ?? book.id ?? book._id} book={book} />
              ))
            ) : (
              <div className='col-span-full text-center text-gray-500 py-8'>ยังไม่มีนิยาย</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div className='flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <g clipPath="url(#clip0_1334_2725)">
            <path d="M10.1922 3.90412C10.4891 3.60881 10.4891 3.12756 10.1922 2.83224L9.09999 1.74006L9.10155 1.74162C8.81249 1.45256 8.31561 0.955681 7.61249 0.254119C7.28124 -0.0693187 6.7453 -0.0661937 6.41718 0.261931L0.26405 6.41037C0.185325 6.48856 0.122846 6.58155 0.0802105 6.68399C0.0375748 6.78643 0.015625 6.89629 0.015625 7.00725C0.015625 7.1182 0.0375748 7.22806 0.0802105 7.3305C0.122846 7.43294 0.185325 7.52593 0.26405 7.60412L6.41561 13.751C6.57422 13.9093 6.78916 13.9983 7.01327 13.9983C7.23737 13.9983 7.45232 13.9093 7.61093 13.751L10.1906 11.1729C10.4875 10.8776 10.4875 10.3963 10.1906 10.101C10.048 9.95911 9.85505 9.87946 9.65389 9.87946C9.45274 9.87946 9.25977 9.95911 9.11718 10.101L7.16405 12.0572C7.0828 12.1385 6.95624 12.1385 6.87499 12.0572L1.96092 7.14787C1.87967 7.06662 1.87967 6.94006 1.96092 6.85881L6.87343 1.94943C6.87968 1.94318 6.88749 1.93849 6.89374 1.93224C6.97499 1.86818 7.08749 1.87443 7.16249 1.94943L9.11874 3.90412C9.41561 4.20099 9.89686 4.20099 10.1922 3.90412ZM5.38436 7.0385C5.38436 7.47859 5.55935 7.90066 5.87084 8.21185C6.18233 8.52304 6.60479 8.69787 7.0453 8.69787C7.48581 8.69787 7.90827 8.52304 8.21976 8.21185C8.53125 7.90066 8.70624 7.47859 8.70624 7.0385C8.70624 6.5984 8.53125 6.17633 8.21976 5.86514C7.90827 5.55395 7.48581 5.37912 7.0453 5.37912C6.60479 5.37912 6.18233 5.55395 5.87084 5.86514C5.55935 6.17633 5.38436 6.5984 5.38436 7.0385ZM13.7625 6.43537L11.8422 4.52443C11.5453 4.22912 11.0641 4.22912 10.7687 4.52599C10.6982 4.59626 10.6422 4.67978 10.6039 4.77175C10.5657 4.86372 10.546 4.96234 10.546 5.06193C10.546 5.16153 10.5657 5.26014 10.6039 5.35211C10.6422 5.44408 10.6982 5.5276 10.7687 5.59787L12.0656 6.89318C12.1469 6.97443 12.1469 7.10099 12.0656 7.18224L10.7875 8.45881C10.7169 8.52907 10.6609 8.61259 10.6227 8.70456C10.5845 8.79653 10.5648 8.89515 10.5648 8.99474C10.5648 9.09434 10.5845 9.19295 10.6227 9.28493C10.6609 9.3769 10.7169 9.46041 10.7875 9.53068C10.9301 9.67257 11.1231 9.75221 11.3242 9.75221C11.5254 9.75221 11.7183 9.67257 11.8609 9.53068L13.7641 7.62912C13.8425 7.55073 13.9047 7.45763 13.9471 7.35515C13.9895 7.25267 14.0113 7.14282 14.0111 7.03192C14.011 6.92102 13.9889 6.81123 13.9463 6.70886C13.9036 6.60649 13.8411 6.51355 13.7625 6.43537Z" fill="black" fillOpacity="0.85"/>
            </g>
            <defs>
            <clipPath id="clip0_1334_2725">
            <rect width="14" height="14" fill="white"/>
            </clipPath>
            </defs>
          </svg>
          สถิติ
        </div>
      ),
      children: (
        <div className='py-6'>
          {/* Search Bar for Statistics */}
          <div className='flex gap-4 mb-6 flex-wrap'>
            <Select
              mode="multiple"
              placeholder={isLoadingMyBooks ? 'กำลังโหลด...' : 'เลือกนิยายที่ต้องการวิเคราะห์'}
              value={statsSelectedBooks}
              onChange={(vals) => setStatsSelectedBooks(vals)}
              className='flex-1'
              style={{ minWidth: '200px' }}
              options={Array.isArray(myBooks) ? myBooks.map((b: any) => ({
                label: b.name ?? b.title ?? b.book_name ?? '-',
                value: b.book_id ?? b.id ?? b._id,
              })) : []}
              optionFilterProp="label"
              allowClear
            />
            <Select
              value={statsCategory}
              onChange={setStatsCategory}
              style={{ width: 150 }}
            >
              <Option value="จำนวนครั้งที่อ่าน">จำนวนครั้งที่อ่าน</Option>
              <Option value="รายได้">รายได้</Option>
            </Select>
            <RangePicker
              placeholder={['วันที่สั่งซื้อ', 'วันที่สิ้นสุด']}
              value={salesDateRange}
              onChange={setSalesDateRange}
              style={{ width: 300 }}
            />
            <Button
              type="primary"
              danger
              style={{
                backgroundColor: '#E31C3D',
                borderColor: '#E31C3D',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF4D6D';
                e.currentTarget.style.borderColor = '#FF4D6D';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#E31C3D';
                e.currentTarget.style.borderColor = '#E31C3D';
              }}
                onClick={() => {
                try {
                  setStatsSearched(true);
                  if (typeof refetchBookStats === 'function') refetchBookStats();
                } catch (e) {
                  console.debug('refetchBookStats failed', e);
                }
              }}
              disabled={isLoadingBookStats}
            >
              ค้นหา
            </Button>
          </div>

          {/* Statistics Content Area */}
          <div className='py-6'>
            <div className='bg-white rounded-lg shadow p-6'>
              <h3 className='text-lg font-semibold mb-4'>{statsCategory}</h3>
              <div style={{ width: '100%', height: 400 }}>
                {!statsSearched ? (
                  <div className='text-center text-gray-500 py-16'>กรุณากดค้นหาเพื่อแสดงกราฟ</div>
                ) : isLoadingBookStats ? (
                  <div className='flex items-center justify-center h-96'><Spin /></div>
                ) : statsChartData && statsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={statsChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                      {statsSeriesKeys.map((k: string, i: number) => (
                        <Line key={k} type="monotone" dataKey={k} stroke={["#4ade80", "#818cf8", "#60a5fa", "#f59e0b", "#ef4444"][i % 5]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='text-center text-gray-500 py-16'>ไม่มีข้อมูลสำหรับการเลือกนี้</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <div className='flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <g clipPath="url(#clip0_1334_2725)">
            <path d="M10.1922 3.90412C10.4891 3.60881 10.4891 3.12756 10.1922 2.83224L9.09999 1.74006L9.10155 1.74162C8.81249 1.45256 8.31561 0.955681 7.61249 0.254119C7.28124 -0.0693187 6.7453 -0.0661937 6.41718 0.261931L0.26405 6.41037C0.185325 6.48856 0.122846 6.58155 0.0802105 6.68399C0.0375748 6.78643 0.015625 6.89629 0.015625 7.00725C0.015625 7.1182 0.0375748 7.22806 0.0802105 7.3305C0.122846 7.43294 0.185325 7.52593 0.26405 7.60412L6.41561 13.751C6.57422 13.9093 6.78916 13.9983 7.01327 13.9983C7.23737 13.9983 7.45232 13.9093 7.61093 13.751L10.1906 11.1729C10.4875 10.8776 10.4875 10.3963 10.1906 10.101C10.048 9.95911 9.85505 9.87946 9.65389 9.87946C9.45274 9.87946 9.25977 9.95911 9.11718 10.101L7.16405 12.0572C7.0828 12.1385 6.95624 12.1385 6.87499 12.0572L1.96092 7.14787C1.87967 7.06662 1.87967 6.94006 1.96092 6.85881L6.87343 1.94943C6.87968 1.94318 6.88749 1.93849 6.89374 1.93224C6.97499 1.86818 7.08749 1.87443 7.16249 1.94943L9.11874 3.90412C9.41561 4.20099 9.89686 4.20099 10.1922 3.90412ZM5.38436 7.0385C5.38436 7.47859 5.55935 7.90066 5.87084 8.21185C6.18233 8.52304 6.60479 8.69787 7.0453 8.69787C7.48581 8.69787 7.90827 8.52304 8.21976 8.21185C8.53125 7.90066 8.70624 7.47859 8.70624 7.0385C8.70624 6.5984 8.53125 6.17633 8.21976 5.86514C7.90827 5.55395 7.48581 5.37912 7.0453 5.37912C6.60479 5.37912 6.18233 5.55395 5.87084 5.86514C5.55935 6.17633 5.38436 6.5984 5.38436 7.0385ZM13.7625 6.43537L11.8422 4.52443C11.5453 4.22912 11.0641 4.22912 10.7687 4.52599C10.6982 4.59626 10.6422 4.67978 10.6039 4.77175C10.5657 4.86372 10.546 4.96234 10.546 5.06193C10.546 5.16153 10.5657 5.26014 10.6039 5.35211C10.6422 5.44408 10.6982 5.5276 10.7687 5.59787L12.0656 6.89318C12.1469 6.97443 12.1469 7.10099 12.0656 7.18224L10.7875 8.45881C10.7169 8.52907 10.6609 8.61259 10.6227 8.70456C10.5845 8.79653 10.5648 8.89515 10.5648 8.99474C10.5648 9.09434 10.5845 9.19295 10.6227 9.28493C10.6609 9.3769 10.7169 9.46041 10.7875 9.53068C10.9301 9.67257 11.1231 9.75221 11.3242 9.75221C11.5254 9.75221 11.7183 9.67257 11.8609 9.53068L13.7641 7.62912C13.8425 7.55073 13.9047 7.45763 13.9471 7.35515C13.9895 7.25267 14.0113 7.14282 14.0111 7.03192C14.011 6.92102 13.9889 6.81123 13.9463 6.70886C13.9036 6.60649 13.8411 6.51355 13.7625 6.43537Z" fill="black" fillOpacity="0.85"/>
            </g>
            <defs>
            <clipPath id="clip0_1334_2725">
            <rect width="14" height="14" fill="white"/>
            </clipPath>
            </defs>
          </svg>
          รายงานขาย
        </div>
      ),
      children: (
        <div className='py-6'>
          {/* Date Range Filter */}
          <div className='flex items-center justify-between gap-4 mb-6 flex-wrap'>
            <div className='flex items-center gap-4'>
              <span className='text-sm'>วันที่เริ่มต้น - วันที่สิ้นสุด</span>
              <RangePicker showTime 
                value={salesDateRange}
                onChange={setSalesDateRange}
                style={{ width: 400 }}
                format="YYYY-MM-DD HH:mm:ss"
              />
            </div>

            <div className='flex items-center gap-3'>
              <Button
                type="primary"
                danger
                style={{
                  backgroundColor: '#E31C3D',
                  borderColor: '#E31C3D',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF4D6D';
                  e.currentTarget.style.borderColor = '#FF4D6D';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E31C3D';
                  e.currentTarget.style.borderColor = '#E31C3D';
                }}
                onClick={() => {
                  try {
                    if (typeof refetchSales === 'function') refetchSales();
                  } catch (e) {
                    console.debug('refetchSales failed', e);
                  }
                }}
                disabled={isLoadingSales}
              >
                ค้นหา
              </Button>

              <Button
                loading={exporting}
                onClick={handleExport}
                style={{
                  backgroundColor: '#28a745',
                  borderColor: '#28a745',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#218838';
                  e.currentTarget.style.borderColor = '#1e7e34';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#28a745';
                  e.currentTarget.style.borderColor = '#28a745';
                }}
              >
                Export to Excel
              </Button>
            </div>
          </div>

          {/* Section Title */}
          <h3 className='text-lg font-semibold mb-4'>รวมทุกเรื่อง</h3>

          {/* Sales Table */}
          <Table
            columns={salesColumns}
            dataSource={salesData}
            pagination={false}
            className='mb-6'
          />

          {/* Summary Row (totals from API if available) - styled like the provided screenshot */}
          <div className='border-t border-gray-200 pt-3 pb-3 mb-6'>
            <div className='flex items-center justify-between gap-4 flex-col md:flex-row'>
              <div className='flex items-center gap-4'>
                <div className='text-sm text-gray-600 whitespace-nowrap'>รวมยอดขาย</div>

                <div className='flex items-center gap-2'>
                  <div className='flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 border border-yellow-200'>
                    <Image src="/images/e-coin.png" alt="Coins" width={20} height={20} />
                    <span className='text-sm font-medium'>{salesTotals ? (Number(salesTotals.coin_sales_total || 0)).toLocaleString('en-US') : '0'}</span>
                  </div>

                  <div className='flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200'>
                    <Image src="/images/money-bag.png" alt="Freecoin" width={20} height={20} />
                    <span className='text-sm font-medium'>{salesTotals ? (Number(salesTotals.freecoin_sales_total || 0)).toLocaleString('en-US') : '0'}</span>
                  </div>
                </div>
              </div>

              <div className='text-right mt-3 md:mt-0'>
                <div className='text-sm text-gray-600'>รวมรายได้</div>
                <div className='text-lg font-semibold'>
                  {salesTotals ? (Number(salesTotals.overall_income_baht ?? salesTotals.total_income_baht ?? salesTotals.overall_income ?? salesTotals.income_baht ?? 0)).toLocaleString('en-US') : '0'} บาท
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className='flex justify-center'>
            <Pagination
              current={currentPage}
              onChange={setCurrentPage}
              total={10}
              showSizeChanger={false}
            />
          </div>
        </div>
      ),
    },
    {
      key: '4',
      label: (
        <div className='flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <g clipPath="url(#clip0_1334_2725)">
            <path d="M10.1922 3.90412C10.4891 3.60881 10.4891 3.12756 10.1922 2.83224L9.09999 1.74006L9.10155 1.74162C8.81249 1.45256 8.31561 0.955681 7.61249 0.254119C7.28124 -0.0693187 6.7453 -0.0661937 6.41718 0.261931L0.26405 6.41037C0.185325 6.48856 0.122846 6.58155 0.0802105 6.68399C0.0375748 6.78643 0.015625 6.89629 0.015625 7.00725C0.015625 7.1182 0.0375748 7.22806 0.0802105 7.3305C0.122846 7.43294 0.185325 7.52593 0.26405 7.60412L6.41561 13.751C6.57422 13.9093 6.78916 13.9983 7.01327 13.9983C7.23737 13.9983 7.45232 13.9093 7.61093 13.751L10.1906 11.1729C10.4875 10.8776 10.4875 10.3963 10.1906 10.101C10.048 9.95911 9.85505 9.87946 9.65389 9.87946C9.45274 9.87946 9.25977 9.95911 9.11718 10.101L7.16405 12.0572C7.0828 12.1385 6.95624 12.1385 6.87499 12.0572L1.96092 7.14787C1.87967 7.06662 1.87967 6.94006 1.96092 6.85881L6.87343 1.94943C6.87968 1.94318 6.88749 1.93849 6.89374 1.93224C6.97499 1.86818 7.08749 1.87443 7.16249 1.94943L9.11874 3.90412C9.41561 4.20099 9.89686 4.20099 10.1922 3.90412ZM5.38436 7.0385C5.38436 7.47859 5.55935 7.90066 5.87084 8.21185C6.18233 8.52304 6.60479 8.69787 7.0453 8.69787C7.48581 8.69787 7.90827 8.52304 8.21976 8.21185C8.53125 7.90066 8.70624 7.47859 8.70624 7.0385C8.70624 6.5984 8.53125 6.17633 8.21976 5.86514C7.90827 5.55395 7.48581 5.37912 7.0453 5.37912C6.60479 5.37912 6.18233 5.55395 5.87084 5.86514C5.55935 6.17633 5.38436 6.5984 5.38436 7.0385ZM13.7625 6.43537L11.8422 4.52443C11.5453 4.22912 11.0641 4.22912 10.7687 4.52599C10.6982 4.59626 10.6422 4.67978 10.6039 4.77175C10.5657 4.86372 10.546 4.96234 10.546 5.06193C10.546 5.16153 10.5657 5.26014 10.6039 5.35211C10.6422 5.44408 10.6982 5.5276 10.7687 5.59787L12.0656 6.89318C12.1469 6.97443 12.1469 7.10099 12.0656 7.18224L10.7875 8.45881C10.7169 8.52907 10.6609 8.61259 10.6227 8.70456C10.5845 8.79653 10.5648 8.89515 10.5648 8.99474C10.5648 9.09434 10.5845 9.19295 10.6227 9.28493C10.6609 9.3769 10.7169 9.46041 10.7875 9.53068C10.9301 9.67257 11.1231 9.75221 11.3242 9.75221C11.5254 9.75221 11.7183 9.67257 11.8609 9.53068L13.7641 7.62912C13.8425 7.55073 13.9047 7.45763 13.9471 7.35515C13.9895 7.25267 14.0113 7.14282 14.0111 7.03192C14.011 6.92102 13.9889 6.81123 13.9463 6.70886C13.9036 6.60649 13.8411 6.51355 13.7625 6.43537Z" fill="black" fillOpacity="0.85"/>
            </g>
            <defs>
            <clipPath id="clip0_1334_2725">
            <rect width="14" height="14" fill="white"/>
            </clipPath>
            </defs>
          </svg>
          การถอนเงิน
        </div>
      ),
      children: (
        <div className='py-6'>
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
            
            <span className='text-sm text-gray-400'>*ยอดขั้นต่ำที่สามารถถอนเงิน {minBaht ?? 100} บาท*</span>
            
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
                          <label className='block mb-2 text-sm'>รูปหน้าบัตรประจำตัวประชาชน</label>
                          <div className='border-2 border-dashed border-gray-300 rounded p-4 bg-gray-50'>
                            <div className='flex items-center gap-3'>
                              <Upload
                                beforeUpload={(file) => {
                                  setIdCardFile(file);
                                  setIdCardFileName(file.name);
                                  return false;
                                }}
                                showUploadList={false}
                              >
                                <Button icon={<UploadOutlined />}>
                                  อัพโหลดรูปภาพ
                                </Button>
                              </Upload>
                              {idCardFileName && (
                                <div className='flex items-center gap-2 text-sm text-blue-600'>
                                  <span>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.1766 2.07461C9.7047 0.602734 7.30783 0.602734 5.83751 2.07461L1.75939 6.14961C1.73283 6.17617 1.71876 6.21211 1.71876 6.24961C1.71876 6.28711 1.73283 6.32305 1.75939 6.34961L2.33595 6.92617C2.36231 6.95241 2.39798 6.96714 2.43517 6.96714C2.47236 6.96714 2.50804 6.95241 2.53439 6.92617L6.61251 2.85117C7.11877 2.34492 7.7922 2.0668 8.50783 2.0668C9.22345 2.0668 9.89689 2.34492 10.4016 2.85117C10.9078 3.35742 11.186 4.03086 11.186 4.74492C11.186 5.46055 10.9078 6.13242 10.4016 6.63867L6.24533 10.7934L5.57189 11.4668C4.9422 12.0965 3.91876 12.0965 3.28908 11.4668C2.98439 11.1621 2.8172 10.7574 2.8172 10.3262C2.8172 9.89492 2.98439 9.49024 3.28908 9.18555L7.41252 5.06367C7.5172 4.96055 7.6547 4.90273 7.80158 4.90273H7.80314C7.95002 4.90273 8.08595 4.96055 8.18908 5.06367C8.29376 5.16836 8.35002 5.30586 8.35002 5.45273C8.35002 5.59805 8.2922 5.73555 8.18908 5.83867L4.81876 9.20586C4.7922 9.23242 4.77814 9.26836 4.77814 9.30586C4.77814 9.34336 4.7922 9.3793 4.81876 9.40586L5.39533 9.98242C5.42168 10.0087 5.45736 10.0234 5.49455 10.0234C5.53174 10.0234 5.56741 10.0087 5.59377 9.98242L8.96251 6.61367C9.27345 6.30273 9.44377 5.89023 9.44377 5.45117C9.44377 5.01211 9.27189 4.59805 8.96251 4.28867C8.32033 3.64648 7.27658 3.64805 6.63439 4.28867L6.23439 4.69023L2.51251 8.41055C2.25991 8.66167 2.05967 8.96045 1.92341 9.28956C1.78716 9.61866 1.7176 9.97154 1.71876 10.3277C1.71876 11.0512 2.00158 11.7309 2.51251 12.2418C3.0422 12.7699 3.73595 13.034 4.4297 13.034C5.12345 13.034 5.8172 12.7699 6.34533 12.2418L11.1766 7.41367C11.8875 6.70117 12.2813 5.75273 12.2813 4.74492C12.2828 3.73555 11.8891 2.78711 11.1766 2.07461Z" fill="black" fillOpacity="0.45"/>
                                    </svg>
                                  </span>
                                  <span>{idCardFileName}</span>
                                  <button 
                                    className='text-red-500 hover:text-red-700'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIdCardFile(null);
                                      setIdCardFileName('');
                                    }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4.625 1.87402H4.5C4.56875 1.87402 4.625 1.81777 4.625 1.74902V1.87402H9.375V1.74902C9.375 1.81777 9.43125 1.87402 9.5 1.87402H9.375V2.99902H10.5V1.74902C10.5 1.19746 10.0516 0.749023 9.5 0.749023H4.5C3.94844 0.749023 3.5 1.19746 3.5 1.74902V2.99902H4.625V1.87402ZM12.5 2.99902H1.5C1.22344 2.99902 1 3.22246 1 3.49902V3.99902C1 4.06777 1.05625 4.12402 1.125 4.12402H2.06875L2.45469 12.2959C2.47969 12.8287 2.92031 13.249 3.45313 13.249H10.5469C11.0813 13.249 11.5203 12.8303 11.5453 12.2959L11.9313 4.12402H12.875C12.9438 4.12402 13 4.06777 13 3.99902V3.49902C13 3.22246 12.7766 2.99902 12.5 2.99902ZM10.4266 12.124H3.57344L3.19531 4.12402H10.8047L10.4266 12.124Z" fill="black" fillOpacity="0.45"/>
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className='mt-4 bg-gray-200 h-40 rounded flex items-center justify-center text-gray-400'>
                              {/* Image Preview Area */}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - ID Number and Address */}
                        <div className='space-y-4'>
                          {/* Certificate Number Input */}
                          <div>
                            <label className='block mb-2 text-sm'>เลขบัตรประจำตัวประชาชน</label>
                            <Input 
                              placeholder='กรอกเลขบัตร'
                              value={idNumber}
                              onChange={(e) => setIdNumber(e.target.value)}
                            />
                          </div>

                          {/* Address Input */}
                          <div>
                            <label className='block mb-2 text-sm'>ที่อยู่ปัจจุบัน</label>
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
                          <label className='block mb-2 text-sm'>รูปสำเนาบัญชีธนาคาร</label>
                          <div className='border-2 border-dashed border-gray-300 rounded p-4 bg-gray-50'>
                            <div className='flex items-center gap-3'>
                              <Upload
                                beforeUpload={(file) => {
                                  setBankCertFile(file);
                                  setBankCertFileName(file.name);
                                  return false;
                                }}
                                showUploadList={false}
                              >
                                <Button icon={<UploadOutlined />}>
                                  อัพโหลดรูปภาพ
                                </Button>
                              </Upload>
                              {bankCertFileName && (
                                <div className='flex items-center gap-2 text-sm text-blue-600'>
                                  <span>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.1766 2.07461C9.7047 0.602734 7.30783 0.602734 5.83751 2.07461L1.75939 6.14961C1.73283 6.17617 1.71876 6.21211 1.71876 6.24961C1.71876 6.28711 1.73283 6.32305 1.75939 6.34961L2.33595 6.92617C2.36231 6.95241 2.39798 6.96714 2.43517 6.96714C2.47236 6.96714 2.50804 6.95241 2.53439 6.92617L6.61251 2.85117C7.11877 2.34492 7.7922 2.0668 8.50783 2.0668C9.22345 2.0668 9.89689 2.34492 10.4016 2.85117C10.9078 3.35742 11.186 4.03086 11.186 4.74492C11.186 5.46055 10.9078 6.13242 10.4016 6.63867L6.24533 10.7934L5.57189 11.4668C4.9422 12.0965 3.91876 12.0965 3.28908 11.4668C2.98439 11.1621 2.8172 10.7574 2.8172 10.3262C2.8172 9.89492 2.98439 9.49024 3.28908 9.18555L7.41252 5.06367C7.5172 4.96055 7.6547 4.90273 7.80158 4.90273H7.80314C7.95002 4.90273 8.08595 4.96055 8.18908 5.06367C8.29376 5.16836 8.35002 5.30586 8.35002 5.45273C8.35002 5.59805 8.2922 5.73555 8.18908 5.83867L4.81876 9.20586C4.7922 9.23242 4.77814 9.26836 4.77814 9.30586C4.77814 9.34336 4.7922 9.3793 4.81876 9.40586L5.39533 9.98242C5.42168 10.0087 5.45736 10.0234 5.49455 10.0234C5.53174 10.0234 5.56741 10.0087 5.59377 9.98242L8.96251 6.61367C9.27345 6.30273 9.44377 5.89023 9.44377 5.45117C9.44377 5.01211 9.27189 4.59805 8.96251 4.28867C8.32033 3.64648 7.27658 3.64805 6.63439 4.28867L6.23439 4.69023L2.51251 8.41055C2.25991 8.66167 2.05967 8.96045 1.92341 9.28956C1.78716 9.61866 1.7176 9.97154 1.71876 10.3277C1.71876 11.0512 2.00158 11.7309 2.51251 12.2418C3.0422 12.7699 3.73595 13.034 4.4297 13.034C5.12345 13.034 5.8172 12.7699 6.34533 12.2418L11.1766 7.41367C11.8875 6.70117 12.2813 5.75273 12.2813 4.74492C12.2828 3.73555 11.8891 2.78711 11.1766 2.07461Z" fill="black" fillOpacity="0.45"/>
                                    </svg>
                                  </span>
                                  <span>{bankCertFileName}</span>
                                  <button 
                                    className='text-red-500 hover:text-red-700'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBankCertFile(null);
                                      setBankCertFileName('');
                                    }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4.625 1.87402H4.5C4.56875 1.87402 4.625 1.81777 4.625 1.74902V1.87402H9.375V1.74902C9.375 1.81777 9.43125 1.87402 9.5 1.87402H9.375V2.99902H10.5V1.74902C10.5 1.19746 10.0516 0.749023 9.5 0.749023H4.5C3.94844 0.749023 3.5 1.19746 3.5 1.74902V2.99902H4.625V1.87402ZM12.5 2.99902H1.5C1.22344 2.99902 1 3.22246 1 3.49902V3.99902C1 4.06777 1.05625 4.12402 1.125 4.12402H2.06875L2.45469 12.2959C2.47969 12.8287 2.92031 13.249 3.45313 13.249H10.5469C11.0813 13.249 11.5203 12.8303 11.5453 12.2959L11.9313 4.12402H12.875C12.9438 4.12402 13 4.06777 13 3.99902V3.49902C13 3.22246 12.7766 2.99902 12.5 2.99902ZM10.4266 12.124H3.57344L3.19531 4.12402H10.8047L10.4266 12.124Z" fill="black" fillOpacity="0.45"/>
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className='mt-4 bg-gray-200 h-40 rounded flex items-center justify-center text-gray-400'>
                              {/* Image Preview Area */}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Bank Info */}
                        <div className='space-y-4'>
                          {/* Bank Name and Account Number */}
                          <div>
                            <label className='block mb-2 text-sm'>ชื่อ - นามสกุล (ภาษาไทยเท่านั้น)</label>
                            <Input 
                              placeholder='กรอกชื่อเลข'
                              value={accountName}
                              onChange={(e) => setAccountName(e.target.value)}
                            />
                          </div>

                          {/* Bank Selection */}
                          <div>
                            <label className='block mb-2 text-sm'>ธนาคาร</label>
                            <Select
                              placeholder='เลือกธนาคาร'
                              value={bankName}
                              onChange={setBankName}
                              className='w-full'
                            >
                              <Option value='กสิกรไทย'>ธนาคารกสิกรไทย</Option>
                              <Option value='กรุงเทพ'>ธนาคารกรุงเทพ</Option>
                              <Option value='ไทยพาณิชย์'>ธนาคารไทยพาณิชย์</Option>
                              <Option value='กรุงไทย'>ธนาคารกรุงไทย</Option>
                              <Option value='กรุงศรี'>ธนาคารกรุงศรีอยุธยา</Option>
                              <Option value='ทหารไทย'>ธนาคารทหารไทยธนชาต</Option>
                            </Select>
                          </div>

                          {/* Account Number */}
                          <div>
                            <label className='block mb-2 text-sm'>เลขบัญชี</label>
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
                      <div className='flex items-center justify-center py-12'>
                        <Spin />
                      </div>
                    ) : withdrawHistoryError ? (
                      <div className='text-center text-red-500'>เกิดข้อผิดพลาดในการโหลดประวัติ</div>
                    ) : Array.isArray(withdrawHistory) && withdrawHistory.length > 0 ? (
                      <Table
                        columns={withdrawColumns}
                        dataSource={withdrawHistory.map((r: any) => ({ ...r, key: r.id || r._id || Math.random().toString() }))}
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
        </div>
      ),
    },
    {
      key: '5',
      label: (
        <div className='flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <g clipPath="url(#clip0_1334_2725)">
            <path d="M10.1922 3.90412C10.4891 3.60881 10.4891 3.12756 10.1922 2.83224L9.09999 1.74006L9.10155 1.74162C8.81249 1.45256 8.31561 0.955681 7.61249 0.254119C7.28124 -0.0693187 6.7453 -0.0661937 6.41718 0.261931L0.26405 6.41037C0.185325 6.48856 0.122846 6.58155 0.0802105 6.68399C0.0375748 6.78643 0.015625 6.89629 0.015625 7.00725C0.015625 7.1182 0.0375748 7.22806 0.0802105 7.3305C0.122846 7.43294 0.185325 7.52593 0.26405 7.60412L6.41561 13.751C6.57422 13.9093 6.78916 13.9983 7.01327 13.9983C7.23737 13.9983 7.45232 13.9093 7.61093 13.751L10.1906 11.1729C10.4875 10.8776 10.4875 10.3963 10.1906 10.101C10.048 9.95911 9.85505 9.87946 9.65389 9.87946C9.45274 9.87946 9.25977 9.95911 9.11718 10.101L7.16405 12.0572C7.0828 12.1385 6.95624 12.1385 6.87499 12.0572L1.96092 7.14787C1.87967 7.06662 1.87967 6.94006 1.96092 6.85881L6.87343 1.94943C6.87968 1.94318 6.88749 1.93849 6.89374 1.93224C6.97499 1.86818 7.08749 1.87443 7.16249 1.94943L9.11874 3.90412C9.41561 4.20099 9.89686 4.20099 10.1922 3.90412ZM5.38436 7.0385C5.38436 7.47859 5.55935 7.90066 5.87084 8.21185C6.18233 8.52304 6.60479 8.69787 7.0453 8.69787C7.48581 8.69787 7.90827 8.52304 8.21976 8.21185C8.53125 7.90066 8.70624 7.47859 8.70624 7.0385C8.70624 6.5984 8.53125 6.17633 8.21976 5.86514C7.90827 5.55395 7.48581 5.37912 7.0453 5.37912C6.60479 5.37912 6.18233 5.55395 5.87084 5.86514C5.55935 6.17633 5.38436 6.5984 5.38436 7.0385ZM13.7625 6.43537L11.8422 4.52443C11.5453 4.22912 11.0641 4.22912 10.7687 4.52599C10.6982 4.59626 10.6422 4.67978 10.6039 4.77175C10.5657 4.86372 10.546 4.96234 10.546 5.06193C10.546 5.16153 10.5657 5.26014 10.6039 5.35211C10.6422 5.44408 10.6982 5.5276 10.7687 5.59787L12.0656 6.89318C12.1469 6.97443 12.1469 7.10099 12.0656 7.18224L10.7875 8.45881C10.7169 8.52907 10.6609 8.61259 10.6227 8.70456C10.5845 8.79653 10.5648 8.89515 10.5648 8.99474C10.5648 9.09434 10.5845 9.19295 10.6227 9.28493C10.6609 9.3769 10.7169 9.46041 10.7875 9.53068C10.9301 9.67257 11.1231 9.75221 11.3242 9.75221C11.5254 9.75221 11.7183 9.67257 11.8609 9.53068L13.7641 7.62912C13.8425 7.55073 13.9047 7.45763 13.9471 7.35515C13.9895 7.25267 14.0113 7.14282 14.0111 7.03192C14.011 6.92102 13.9889 6.81123 13.9463 6.70886C13.9036 6.60649 13.8411 6.51355 13.7625 6.43537Z" fill="black" fillOpacity="0.85"/>
            </g>
            <defs>
            <clipPath id="clip0_1334_2725">
            <rect width="14" height="14" fill="white"/>
            </clipPath>
            </defs>
          </svg>
          ข้อมูลลงทะเบียน
        </div>
      ),
      children: (
        <div className='py-6'>
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
                />
              </div>
              <div>
                <label className='block mb-2 text-sm'>ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                <Input 
                  placeholder='กรอกชื่อ-นามสกุล'
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
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
                />
              </div>
              <div>
                <label className='block mb-2 text-sm'>เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                <Input 
                  placeholder='กรอกเบอร์โทรศัพท์'
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Address Section Title */}
            <h3 className='text-xl font-semibold mb-6 mt-8'>ที่อยู่สำหรับจัดส่งเอกสาร</h3>

            {/* Address Detail - Full Width */}
            <div className='mb-6'>
              <label className='block mb-2 text-sm'>ที่อยู่ปัจจุบัน</label>
              <TextArea
                placeholder='กรอกที่อยู่ปัจจุบัน เช่น บ้านเลขที่ 123'
                value={regAddressDetail}
                onChange={(e) => setRegAddressDetail(e.target.value)}
                rows={4}
              />
            </div>

            {/* Three Columns Row */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
              <div>
                <label className='block mb-2 text-sm'>หมู่</label>
                <Input 
                  placeholder='กรอกหมู่'
                  value={regSubdistrict}
                  onChange={(e) => setRegSubdistrict(e.target.value)}
                />
              </div>
              <div>
                <label className='block mb-2 text-sm'>ซอย</label>
                <Input 
                  placeholder='กรอกซอย'
                  value={regDistrict}
                  onChange={(e) => setRegDistrict(e.target.value)}
                />
              </div>
              <div>
                <label className='block mb-2 text-sm'>ถนน</label>
                <Input 
                  placeholder='กรอกถนน'
                  value={regProvince}
                  onChange={(e) => setRegProvince(e.target.value)}
                />
              </div>
            </div>

            {/* Two Columns Row */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
              <div>
                <label className='block mb-2 text-sm'>แขวง/ตำบล</label>
                <Input 
                  placeholder='กรอกแขวง/ตำบล'
                  value={regProvince2}
                  onChange={(e) => setRegProvince2(e.target.value)}
                />
              </div>
              <div>
                <label className='block mb-2 text-sm'>เขต/อำเภอ</label>
                <Input 
                  placeholder='กรอกเขต/อำเภอ'
                  value={regSubdistrict2}
                  onChange={(e) => setRegSubdistrict2(e.target.value)}
                />
              </div>
            </div>

            {/* Last Two Columns Row */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
              <div>
                <label className='block mb-2 text-sm'>จังหวัด</label>
                <Input 
                  placeholder='กรอกจังหวัด'
                  value={regPostalCode}
                  onChange={(e) => setRegPostalCode(e.target.value)}
                />
              </div>
              <div>
                <label className='block mb-2 text-sm'>รหัสไปรษณีย์</label>
                <Input 
                  placeholder='กรอกรหัสไปรษณีย์'
                  value={regNationality}
                  onChange={(e) => setRegNationality(e.target.value)}
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
                บันทึก
              </Button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Show loading or nothing while checking auth
  if (!isLoggedIn || !token) {
    return null; // or return a loading spinner
  }

  // If not a writer, show registration form
  if (!isWriter) {
    return (
      <div className="min-h-screen bg-white py-8">
        {contextHolder}
        <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
          <div className='py-6'>
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
                    required
                    aria-required
                  />
                </div>
                <div>
                  <label className='block mb-2 text-sm'>ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกชื่อ-นามสกุล'
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    required
                    aria-required
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
                    required
                    aria-required
                  />
                </div>
                <div>
                  <label className='block mb-2 text-sm'>เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกเบอร์โทรศัพท์'
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                    aria-required
                  />
                </div>
              </div>

              {/* Address Section Title */}
              <h3 className='text-xl font-semibold mb-6 mt-8'>ที่อยู่สำหรับจัดส่งเอกสาร</h3>

              {/* Address Detail - Full Width */}
              <div className='mb-6'>
                <label className='block mb-2 text-sm'>ที่อยู่ปัจจุบัน <span className="text-red-500">*</span></label>
                <TextArea
                  placeholder='กรอกที่อยู่ปัจจุบัน เช่น บ้านเลขที่ 123'
                  value={regAddressDetail}
                  onChange={(e) => setRegAddressDetail(e.target.value)}
                  rows={4}
                  required
                  aria-required
                />
              </div>

              {/* Three Columns Row */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
                <div>
                  <label className='block mb-2 text-sm'>หมู่ <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกหมู่'
                    value={regSubdistrict}
                    onChange={(e) => setRegSubdistrict(e.target.value)}
                    required
                    aria-required
                  />
                </div>
                <div>
                  <label className='block mb-2 text-sm'>ซอย <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกซอย'
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    required
                    aria-required
                  />
                </div>
                <div>
                  <label className='block mb-2 text-sm'>ถนน <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกถนน'
                    value={regProvince}
                    onChange={(e) => setRegProvince(e.target.value)}
                    required
                    aria-required
                  />
                </div>
              </div>

              {/* Two Columns Row */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                <div>
                  <label className='block mb-2 text-sm'>แขวง/ตำบล <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกแขวง/ตำบล'
                    value={regProvince2}
                    onChange={(e) => setRegProvince2(e.target.value)}
                    required
                    aria-required
                  />
                </div>
                <div>
                  <label className='block mb-2 text-sm'>เขต/อำเภอ <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกเขต/อำเภอ'
                    value={regSubdistrict2}
                    onChange={(e) => setRegSubdistrict2(e.target.value)}
                    required
                    aria-required
                  />
                </div>
              </div>

              {/* Last Two Columns Row */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                <div>
                  <label className='block mb-2 text-sm'>จังหวัด <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกจังหวัด'
                    value={regPostalCode}
                    onChange={(e) => setRegPostalCode(e.target.value)}
                    required
                    aria-required
                  />
                </div>
                <div>
                  <label className='block mb-2 text-sm'>รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder='กรอกรหัสไปรษณีย์'
                    value={regNationality}
                    onChange={(e) => setRegNationality(e.target.value)}
                    required
                    aria-required
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
                  สมัครนักเขียน
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      {contextHolder}
      <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
        {/* User Profile Header */}
        <div className='bg-white rounded-2xl mb-6 overflow-hidden' style={{ minHeight: '120px', paddingTop: '24px', paddingBottom: '24px' }}>
          <div className='flex items-center justify-between h-full px-6'>
            {/* Profile Section */}
            <div className='flex items-center gap-6'>
              {/* Profile Image */}
              <div className='flex-shrink-0'>
                <div className='w-20 h-20 rounded-full overflow-hidden bg-gray-100'>
                  {user?.profileImage ? (
                    <Image 
                      src={user.profileImage} 
                      alt="Profile" 
                      width={120} 
                      height={120}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-orange-100'>
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="16" r="8" fill="#FF6B9D"/>
                        <path d="M24 26C16 26 10 30 10 36V40H38V36C38 30 32 26 24 26Z" fill="#FF6B9D"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              {/* User Info */}
              <div className='flex flex-col gap-0.5'>
                <h2 className='text-lg font-bold font-primary text-black'>{user?.fullname || 'user#00001'}</h2>
                <p className='text-sm font-primary text-gray-500'>{user?.email || 'user@gmail.com'}</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className='flex items-center gap-6'>
              {/* ยอดที่ถอนได้ */}
              <div className='flex items-center gap-0 bg-white  shadow-sm overflow-hidden' style={{ width: '242px', height: '89px' }}>
                <div className='bg-gray-100 flex items-center justify-center' style={{ width: '105px', height: '89px', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 65 65" fill="none">
                    <path d="M29.1186 45.6636V51.1616C29.1186 55.8199 24.7852 59.5844 19.4498 59.5844C14.1144 59.5844 9.75391 55.8199 9.75391 51.1616V45.6636C9.75391 50.3219 14.0873 53.6261 19.4498 53.6261C24.7852 53.6261 29.1186 50.2948 29.1186 45.6636Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M29.1142 38.2146C29.1142 39.5688 28.7351 40.8146 28.0851 41.8979C26.4872 44.525 23.21 46.1771 19.4184 46.1771C15.6267 46.1771 12.3496 44.4979 10.7517 41.8979C10.1017 40.8146 9.72266 39.5688 9.72266 38.2146C9.72266 35.8854 10.8059 33.8 12.5393 32.2834C14.2997 30.7396 16.71 29.8188 19.3913 29.8188C22.0725 29.8188 24.483 30.7667 26.2434 32.2834C28.0309 33.7729 29.1142 35.8854 29.1142 38.2146Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M29.1186 38.2144V45.6623C29.1186 50.3206 24.7852 53.6248 19.4498 53.6248C14.1144 53.6248 9.75391 50.2935 9.75391 45.6623V38.2144C9.75391 33.556 14.0873 29.7915 19.4498 29.7915C22.131 29.7915 24.5415 30.7393 26.3019 32.256C28.0353 33.7727 29.1186 35.8852 29.1186 38.2144Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M59.5828 29.7101V35.2895C59.5828 36.7791 58.3911 37.9977 56.8744 38.0519H51.566C48.641 38.0519 45.9599 35.9123 45.7161 32.9873C45.5536 31.281 46.2036 29.6831 47.3411 28.5727C48.3431 27.5435 49.7244 26.9478 51.2411 26.9478H56.8744C58.3911 27.0019 59.5828 28.2206 59.5828 29.7101Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5.41602 28.4373V23.0207C5.41602 15.654 9.85769 10.5082 16.7639 9.6415C17.4681 9.53316 18.1993 9.479 18.9577 9.479H43.3327C44.0368 9.479 44.7139 9.50605 45.3639 9.61439C52.3514 10.4269 56.8743 15.5998 56.8743 23.0207V26.9478H51.241C49.7243 26.9478 48.343 27.5436 47.341 28.5727C46.2035 29.6831 45.5535 31.2811 45.716 32.9873C45.9598 35.9123 48.641 38.0519 51.566 38.0519H56.8743V41.979C56.8743 50.104 51.4577 55.5207 43.3327 55.5207H36.5618" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className='flex flex-col px-4'>
                  <span className='text-sm font-primary text-gray-600'>ยอดที่ถอนได้</span>
                    <span className='text-xs font-primary text-gray-600'>
                      {(() => {
                        const n = Number(coinIncome);
                        if (Number.isFinite(n)) {
                          return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' บาท';
                        }
                        // fallback: show raw string or 0.00
                        const s = coinIncome !== '' ? String(coinIncome) : '0';
                        // try to parse again
                        const p = Number(s);
                        if (Number.isFinite(p)) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' บาท';
                        return s + ' บาท';
                      })()}
                    </span>
                </div>
              </div>

              
              {/* นิยายทั้งหมด */}
              <div className='flex items-center gap-0 bg-white  shadow-sm overflow-hidden' style={{ width: '242px', height: '89px' }}>
                <div className='bg-gray-100 flex items-center justify-center' style={{ width: '105px', height: '89px', flexShrink: 0 }}>
                  <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24.3743 59.5832H40.6243C54.166 59.5832 59.5827 54.1665 59.5827 40.6248V24.3748C59.5827 10.8332 54.166 5.4165 40.6243 5.4165H24.3743C10.8327 5.4165 5.41602 10.8332 5.41602 24.3748V40.6248C5.41602 54.1665 10.8327 59.5832 24.3743 59.5832Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M49.7791 41.3563V20.5292C49.7791 18.4438 48.0999 16.9271 46.0415 17.0896H45.9333C42.3041 17.3875 36.8062 19.2563 33.7187 21.1792L33.4208 21.3688C32.9333 21.6668 32.0936 21.6668 31.579 21.3688L31.1457 21.098C28.0853 19.1751 22.5874 17.3604 18.9582 17.0625C16.8999 16.9 15.2207 18.4438 15.2207 20.5022V41.3563C15.2207 43.0084 16.5748 44.5792 18.2269 44.7688L18.7144 44.85C22.4519 45.3375 28.2479 47.2605 31.552 49.075L31.6332 49.1022C32.0936 49.373 32.8519 49.373 33.2852 49.1022C36.5894 47.2605 42.4123 45.3646 46.1769 44.85L46.7457 44.7688C48.4249 44.5792 49.7791 43.0354 49.7791 41.3563Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M32.5 21.9375V47.8292" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className='flex flex-col px-4'>
                  <span className='text-sm font-primary text-gray-600'>นิยายทั้งหมด</span>
                  <span className='text-xs font-primary text-gray-600'>
                    {myBooksTotal != null ? Number(myBooksTotal).toLocaleString('en-US') : (Array.isArray(myBooks) ? myBooks.length : 0)}
                  </span>
                </div>
              </div>
              
              {/* ผู้ติดตาม */}
              <div className='flex items-center gap-0 bg-white  shadow-sm overflow-hidden' style={{ width: '242px', height: '89px' }}>
                <div className='bg-gray-100 flex items-center justify-center' style={{ width: '105px', height: '89px', flexShrink: 0 }}>
                  <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24.8079 29.4394C24.5371 29.4123 24.2121 29.4123 23.9142 29.4394C17.4684 29.2228 12.3496 23.9415 12.3496 17.4415C12.3496 10.8061 17.7121 5.4165 24.3746 5.4165C31.01 5.4165 36.3996 10.8061 36.3996 17.4415C36.3725 23.9415 31.2538 29.2228 24.8079 29.4394Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M44.4439 10.8335C49.698 10.8335 53.923 15.0856 53.923 20.3127C53.923 25.4314 49.8605 29.6022 44.796 29.7918C44.5793 29.7647 44.3355 29.7647 44.0918 29.7918" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.2672 39.4335C4.71302 43.821 4.71302 50.971 11.2672 55.3314C18.7151 60.3147 30.9297 60.3147 38.3776 55.3314C44.9318 50.9439 44.9318 43.7939 38.3776 39.4335C30.9568 34.4772 18.7422 34.4772 11.2672 39.4335Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M49.6699 54.1665C51.6199 53.7603 53.4616 52.9748 54.9783 51.8103C59.2033 48.6415 59.2033 43.4144 54.9783 40.2457C53.4887 39.1082 51.6741 38.3498 49.7512 37.9165" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className='flex flex-col px-4'>
                  <span className='text-sm font-primary text-gray-600'>ผู้ติดตาม</span>
                  <span className='text-xs font-primary text-gray-600'>0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs 
          defaultActiveKey="1" 
          items={tabItems}
          className='font-primary custom-tabs-red'
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
                  // allow entering values below the business minimum in the input UI
                  // to avoid Antd's red invalid state; enforce min on submit
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

        <style jsx>{`
        :global(.ant-tabs-tab:hover) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover svg path) {
          fill: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active svg path) {
          fill: #dc2626 !important;
        }
        :global(.ant-tabs-ink-bar) {
          background: #dc2626 !important;
        }
        /* Withdraw modal button styles */
        :global(.withdraw-modal .ant-modal-footer .ant-btn) {
          transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease !important;
        }
        :global(.withdraw-modal .ant-modal-footer .ant-btn-primary) {
          background-color: #E31C3D !important;
          border-color: #E31C3D !important;
          color: #ffffff !important;
        }
        :global(.withdraw-modal .ant-modal-footer .ant-btn-primary:hover) {
          background-color: #C41230 !important;
          border-color: #C41230 !important;
          color: #ffffff !important;
        }
        :global(.withdraw-modal .ant-modal-footer .ant-btn:not(.ant-btn-primary)) {
          background-color: transparent !important;
          color: inherit !important;
          border-color: transparent !important;
        }
        :global(.withdraw-modal .ant-modal-footer .ant-btn:not(.ant-btn-primary):hover) {
          background-color: rgba(227,28,61,0.06) !important;
          color: #E31C3D !important;
          border-color: rgba(227,28,61,0.12) !important;
        }
      `}</style>
        
      </div>
    </div>
  );
}

export default MyBook;