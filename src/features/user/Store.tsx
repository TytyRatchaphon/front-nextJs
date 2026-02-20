'use client'

import { StoreBanner } from '@/components/home/Banner'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Tabs, Spin, Modal, notification, Input } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { fetchStoreData, buyStorePack, updateUserAddress } from '@/services/apiServices'
import { useAuthStore } from '@/stores/authStore'
import type { StoreCategory, StorePack } from '@/types/api'
import Link from 'next/link'
import StoreCard from '@/components/utility/StoreCard'
import { useWebsiteStore } from '@/stores/websiteStore';
import GifLoader from '@/components/utility/GifLoader';
import AmountPill from '@/components/utility/AmountPill';
import FreeCoinPill from '@/components/utility/FreeCoinPill'
import dayjs from 'dayjs'
import { isValidPhoneNumber } from 'libphonenumber-js'

import { imageLoader } from '@/utils/imageUtils';
import { fetchCartItems } from '@/services/cartService';
import { useQuery, useQueryClient } from '@tanstack/react-query';


function Store() {
  const { user, updateToken, updateUserBalance, token } = useAuthStore() // Added token
  const [storeData, setStoreData] = useState<StoreCategory[]>([])
  const [loading, setLoading] = useState(true)

  const balance = {
    coin: user?.coin ?? 0,
    flower: user?.flower ?? 0,
    heart: user?.heart ?? 0,
    stamp: user?.stamp ?? 0,
    exp_point: user?.exp ?? 0,
    free_coin: user?.freecoin ?? 0
  }

  const [selectedPack, setSelectedPack] = useState<StorePack | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [selectedQty, setSelectedQty] = useState(1);
  const [addressInput, setAddressInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  const [api, contextHolder] = notification.useNotification();
  const queryClient = useQueryClient();

  // Fetch cart items for limit checking
  const { data: cartStores } = useQuery({
    queryKey: ['cartItems'],
    queryFn: fetchCartItems,
    enabled: !!token, 
    staleTime: 1000 * 60,
  });

  const handleBuyClick = (pack: StorePack, quantity: number = 1) => {
    setSelectedPack(pack)
    setSelectedQty(quantity)
    // Initialize address input if missing
    if (pack.type === 'gift' && !user?.address_main) {
      setAddressInput('');
    }
    if (!user?.phone) {
      setPhoneInput('');
    }
  }

  const handleIncrement = () => {
    if (!selectedPack) return;

    // Calculate current qty in cart for this pack
    let qtyInCart = 0;
    if (cartStores) {
        const item = cartStores.flatMap(s => s.items).find(i => i.store_pack?.store_pack_id === selectedPack.store_pack_id);
        if (item) qtyInCart = item.quantity;
    }

    if (selectedPack.remaining_count && selectedPack.remaining_count > 0) {
        if (qtyInCart + selectedQty >= selectedPack.remaining_count) return;
    }
    
    // Check individual limits
    const limits = [
        selectedPack.limit_unit, 
        selectedPack.limit_unit_month, 
        selectedPack.limit_unit_day
    ].filter(l => typeof l === 'number' && l > 0) as number[];

    if (limits.length > 0) {
        const minLimit = Math.min(...limits);
        if (qtyInCart + selectedQty >= minLimit) return;
    }
    
    setSelectedQty(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (selectedQty > 1) {
        setSelectedQty(prev => prev - 1);
    }
  };

  const handleConfirmBuy = async () => {
    if (!selectedPack) return;

    try {
      setConfirmLoading(true);

      // 1. If gift and missing address, save address first
        if (selectedPack.type === 'gift' && !user?.address_main) {
           if (!addressInput.trim()) {
             api.warning({
               message: 'กรุณากรอกที่อยู่',
               description: 'กรุณากรอกที่อยู่สำหรับจัดส่งก่อนยืนยัน',
               placement: 'topRight',
             });
             setConfirmLoading(false);
             return;
           }
        }
           
        if (selectedPack.type === 'gift' && !user?.phone) {
           if (!phoneInput.trim()) {
               api.warning({
                   message: 'กรุณากรอกเบอร์โทรศัพท์',
                   description: 'กรุณากรอกเบอร์โทรศัพท์เพื่อใช้ในการติดต่อ',
                   placement: 'topRight',
               });
               setConfirmLoading(false);
               return;
           }
           // Strict check for Thai mobile prefixes: 06, 08, 09
           const validPrefixes = ['06', '08', '09'];
           const hasValidPrefix = validPrefixes.some(prefix => phoneInput.startsWith(prefix));

           if (!hasValidPrefix || !isValidPhoneNumber(phoneInput, 'TH')) {
               api.warning({
                   message: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
                   description: 'กรุณากรอกเบอร์โทรศัพท์มือถือที่ขึ้นต้นด้วย 06, 08 หรือ 09 เท่านั้น',
                   placement: 'topRight',
               });
               setConfirmLoading(false);
               return;
           }
        }

        // Only update profile if we gathered new info (Gift Address OR Phone)
        // If neither is needed (user has both, or pack isn't gift and user has phone), we skip this block unless we force check.
        // But the previous logic for address was inside "if (gift && !address)". 
        // We should probably check if *either* is needed to trigger the update logic.
        
        const needUpdateAddress = (selectedPack.type === 'gift' && !user?.address_main);
        const needUpdatePhone = (selectedPack.type === 'gift' && !user?.phone);

        if (needUpdateAddress || needUpdatePhone) {
        
        if (!token) {
           api.error({ message: 'กรุณาเข้าสู่ระบบใหม่' });
           setConfirmLoading(false);
           return;
        }

        // Construct simplified payload for address update
        const formData = new FormData();
        const getVal = (v: any) => (v !== undefined && v !== null ? String(v) : "");
        
        formData.append('fullname', getVal(user?.fullname));
        // Use new phone input if user didn't have one, otherwise keep existing (though existing is in user object)
        // logic: if needUpdatePhone is true, use phoneInput. Else use user.phone.
        formData.append('phone', needUpdatePhone ? phoneInput : getVal(user?.phone)); 
        
        // Address: Only update if it was required and entered. If user already had address, we send it back?
        // Sprofile logic sends everything. safely send user.address_main if we didn't take new input.
        formData.append('address_main', needUpdateAddress ? addressInput : getVal(user?.address_main));
        
        formData.append('des', getVal(user?.des));
        formData.append('facebook', getVal(user?.facebook));
        formData.append('twitter', getVal(user?.twitter));
        
        // Simple mapping from Thai/Display to value code
        let genderVal = user?.gender || "no";
        if (genderVal === 'ชาย') genderVal = 'm';
        else if (genderVal === 'หญิง') genderVal = 'f';
        else if (genderVal === 'ไม่ระบุ') genderVal = 'no';
        formData.append('gender', genderVal);

        const bday = user?.birthday ? dayjs(user.birthday).format('YYYY-MM-DD') : ""; // Needs dayjs or careful string handling
        formData.append('birthday', bday);
        
        formData.append('cat1', getVal(user?.cat1));
        formData.append('cat2', getVal(user?.cat2));
        
        // Handle frame_id string "0" or null
        const frameId = user?.frame_id ? String(user.frame_id) : "";
        formData.append('frame_id', frameId);
        
        const resAddress = await updateUserAddress(formData, token);
        if (resAddress.code === 200 || resAddress.status === 'success') {
           const newToken = resAddress.data?.token;
           if (newToken) {
             localStorage.setItem('authToken', newToken);
             updateToken(newToken);
           }
        } else {
           throw new Error(resAddress.message || 'ไม่สามารถบันทึกที่อยู่ได้');
        }
      }

      // 2. Buy Pack
      let res;
      if (selectedQty > 1) {
         // Using new buy-now api for quantity > 1 (or always if appropriate, but buyStorePack is for qty=1 usually?)
         // Actually buyStorePack calls /user/store/buy/:id which implies qty=1 or default. 
         // Since we implemented buyStorePackNow, let's use it.
         // Wait, I need to import buyStorePackNow.
         // Assuming I will add it to imports later or auto-import.
          const { buyStorePackNow } = await import('@/services/apiServices');
          res = await buyStorePackNow(selectedPack.store_pack_id, selectedQty);
      } else {
          // Keep using existing logic for qty=1 if preferred, or switch consistency?
          // Let's use buyStorePackNow for consistency if it supports qty=1
          const { buyStorePackNow } = await import('@/services/apiServices');
          res = await buyStorePackNow(selectedPack.store_pack_id, selectedQty);
      }

      if (res.status === 'success' || res.code === 200) {
        api.success({
          message: `ซื้อ ${selectedPack.name} สำเร็จ`,
          description: `ได้รับสินค้าจำนวน ${selectedQty} ชิ้น เรียบร้อยแล้ว`,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          placement: 'topRight',
        });

        // Token update as backup/source of truth if provided
        if (res.data && res.data.token) {
          updateToken(res.data.token);
        }

        setSelectedPack(null);
      } else {
        api.error({
          message: 'เกิดข้อผิดพลาด',
          description: res.message || 'ไม่สามารถซื้อสินค้าได้',
          placement: 'topRight',
        });
      }
    } catch (error: any) {
      api.error({
        message: 'เกิดข้อผิดพลาด',
        description: error?.response?.data?.message || error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
        placement: 'topRight',
      });
    } finally {
      setConfirmLoading(false);
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await fetchStoreData()
        setStoreData(data)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Generate Tab Items
  const tabItems = storeData.map((category) => ({
    key: String(category.store_id),
    label: (
      <div className='flex items-center gap-2'>
        <span className="capitalize">{category.name}</span>
      </div>
    ),
    children: (
      <div className="mt-4">
        {category.StorePacks && category.StorePacks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {category.StorePacks.map((pack) => (
              <StoreCard key={pack.store_pack_id} pack={pack} onBuy={handleBuyClick} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">ไม่มีสินค้าในหมวดหมู่นี้</div>
        )}
      </div>
    )
  }));

  const allPacks = storeData.flatMap(c => c.StorePacks || []);
  const allTabItem = {
    key: 'all',
    label: (
      <div className='flex items-center gap-2'>
        <span>ทั้งหมด</span>
      </div>
    ),
    children: (
      <div className="mt-4">
        {allPacks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {allPacks.map((pack) => (
              <StoreCard key={`all-${pack.store_pack_id}`} pack={pack} onBuy={handleBuyClick} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">ไม่มีสินค้า</div>
        )}
      </div>
    )
  };

  const finalItems = [allTabItem, ...tabItems];
  const { settings } = useWebsiteStore();
  return (
    <div className="pb-20">
      {contextHolder}
      {/* <StoreBanner /> */}

      {/* Payment summary row */}
      <div className="max-w-[1128px] mx-auto px-4 mt-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {/* Main coin pill */}
            <AmountPill
              amount={balance.coin}
              icon={settings?.coin || '/images/e-coin.png'}
            />
            {/* Free Coin Pill */}
            <FreeCoinPill amount={balance.free_coin} />

            {/* Small badges pills */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-4 bg-white border border-gray-200 px-3 py-1 rounded-full whitespace-nowrap">
                {/* Stamp */}
                <div className="flex items-center gap-1">
                  <Image src={settings?.bigstamp || '/images/ejb-stamp.png'} alt="Stamp" width={20} height={20} unoptimized />
                  <span className="text-xs text-gray-700 font-medium">{balance.stamp.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          <Link href="/wallet/history">
            <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer ml-auto hover:text-red-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              <span>ประวัติการชำระ</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Store content area with Tabs */}
      <div className="max-w-[1128px] mx-auto px-4 mt-8">
        {loading ? (
          <GifLoader className="h-64" width={150} height={150} />
        ) : (
          <Tabs
            defaultActiveKey="all"
            items={finalItems}
            className="font-primary custom-tabs-red"
          />
        )}

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
      `}</style>
      </div>

      <Modal
        title={<div className="text-center text-xl font-bold font-primary">{selectedPack?.name}</div>}
        open={!!selectedPack}
        onCancel={() => setSelectedPack(null)}
        footer={null}
        centered
        zIndex={5000}
        width={380}
        style={{ maxWidth: '95vw', top: 20 }}
        closeIcon={null}
        className="custom-modal-store font-primary"
      >
            <div className="flex flex-col items-center pt-2 pb-6 px-2">
            
            {/* Item Card */}
            <div className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-start gap-4 mb-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
               <div className="relative w-24 h-24 flex-shrink-0 z-10 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <Image
                  src={selectedPack?.img || '/images/ejb.png'}
                  alt={selectedPack?.name || 'Pack'}
                  fill
                  unoptimized
                  className="object-contain p-1"
                />
              </div>
              <div className="flex-1 z-10 pt-1">
                <h3 className="font-bold text-lg text-gray-800 mb-1 leading-tight">{selectedPack?.name}</h3>
                <div className="w-full h-[1px] bg-gray-100 my-2"></div>
                {selectedPack?.items_description ? (
                  <ul className="text-sm text-gray-500 space-y-1">
                    {selectedPack.items_description.split(',').map((item, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                        {item.trim()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                     <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                     จำนวน x {selectedQty}
                  </p>
                )}
              </div>
            </div>

            {/* Address Input Section */}
            {selectedPack?.type === 'gift' && !user?.address_main && (
               <div className="w-full mb-4 animate-fadeIn">
                 <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3 text-red-600">
                        <span className="bg-red-100 p-1.5 rounded-full">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        </span>
                        <h3 className="font-bold text-sm">ที่อยู่สำหรับจัดส่ง</h3>
                        <span className="text-xs ml-auto text-red-400 font-normal">* จำเป็น</span>
                    </div>
                    <Input.TextArea 
                        rows={3} 
                        placeholder="กรุณากรอกชื่อ-นามสกุล และที่อยู่จัดส่งให้ครบถ้วน..."
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        className="w-full font-primary !bg-white !border-red-200 focus:!border-red-500 hover:!border-red-400 !rounded-lg !text-sm !shadow-none !resize-none"
                        style={{ minHeight: '80px' }}
                    />
                 </div>
               </div>
            )}

            {selectedPack?.type === 'gift' && !user?.phone && (
               <div className="w-full mb-6 animate-fadeIn">
                 <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3 text-red-600">
                        <span className="bg-red-100 p-1.5 rounded-full">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </span>
                        <h3 className="font-bold text-sm">เบอร์โทรศัพท์</h3>
                        <span className="text-xs ml-auto text-red-400 font-normal">* จำเป็น</span>
                    </div>
                    <Input
                        placeholder="กรอกเบอร์โทรศัพท์ (เช่น 0812345678)"
                        value={phoneInput}
                        onChange={(e) => {
                           const val = e.target.value.replace(/[^0-9]/g, '');
                           setPhoneInput(val);
                        }}
                        maxLength={10}
                        className="w-full font-primary !bg-white !border-red-200 focus:!border-red-500 hover:!border-red-400 !rounded-lg !text-sm !shadow-none h-10"
                    />
                 </div>
               </div>
            )}

            {/* Privacy Note */}
            {selectedPack?.type === 'gift' && ((!user?.address_main) || !user?.phone) && (
              <div className="w-full mb-6 px-1">
                 <p className="text-[10px] text-red-400 text-center">
                   ** ข้อมูลของท่านจะเป็นข้อมูลที่ให้สำหรับจัดส่งเท่านั้น และจะไม่มีการเปิดเผยต่อสาธารณะหรือบุคคลภายนอกโดยไม่ได้รับอนุญาต **
                 </p>
              </div>
            )}

            {/* Price Calculation & Quantity */}
            <div className="text-center mb-6 relative">
                 {/* Quantity Controls */}
                 <div className="flex items-center justify-center gap-4 mb-4">
                        <button 
                            onClick={handleDecrement}
                            className={`w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors ${selectedQty <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={selectedQty <= 1}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                        <span className="text-2xl font-bold w-12 text-center text-gray-800">{selectedQty}</span>
                        <button 
                            onClick={handleIncrement}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                    </div>

                <div className="inline-block relative">
                    <span className="text-gray-400 text-sm font-medium block mb-1">ยอดรวมทั้งหมด</span>
                    <div className="flex items-center justify-center gap-2.5">
                        {['coin', 'heart', 'flower', 'stamp', 'exp', 'freecoin'].includes(selectedPack?.type_use || '') && (
                        <div className="relative">
                            <Image
                                src={
                                selectedPack?.type_use === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                                    selectedPack?.type_use === 'heart' ? (settings?.heart || "/images/heart.png") :
                                    selectedPack?.type_use === 'flower' ? (settings?.flower || "/images/flower.png") :
                                        selectedPack?.type_use === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                                        selectedPack?.type_use === 'exp' ? (settings?.exp || "/images/exp.png") :
                                            (settings?.freecoin || "/images/freecoin.png")
                                }
                                width={36}
                                height={36}
                                alt={selectedPack?.type_use || 'currency'}
                                unoptimized
                                className="object-contain drop-shadow-sm"
                            />
                        </div>
                        )}
                        <span className="text-3xl font-bold font-primary text-gray-800 tracking-tight">
                            {((selectedPack?.price || 0) * selectedQty).toLocaleString()}
                        </span>
                        {!['coin', 'heart', 'flower', 'stamp', 'exp', 'freecoin'].includes(selectedPack?.type_use || '') &&
                           <span className="text-lg text-gray-500 font-medium self-end mb-1">{selectedPack?.type_use}</span>
                        }
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setSelectedPack(null)}
                className="flex-1 border-2 border-gray-200 text-gray-500 py-3 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all duration-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmBuy}
                disabled={confirmLoading}
                className="flex-1 bg-[#FF0037] !text-white py-3 rounded-xl font-bold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex justify-center items-center disabled:opacity-70 disabled:grayscale disabled:pointer-events-none"
              >
                {confirmLoading ? <Spin size="small" className="!mr-2 custom-spin-white" /> : null}
                { (selectedPack?.type === 'gift' && (!user?.address_main || !user?.phone)) ? 'บันทึกและยืนยัน' : 'ยืนยันสั่งซื้อ' }
              </button>
            </div>
          </div>
        <style jsx global>{`
           .custom-spin-white .ant-spin-dot-item {
              background-color: white !important;
           }
         `}</style>
      </Modal>
    </div>
  )
}

export default Store