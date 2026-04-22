"use client";
import * as React from "react";

import '@/components/home/Banner';
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Tabs, Spin, Modal, Input, Image as AntdImage, App, Checkbox } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useSearchParams } from 'next/navigation'
import { fetchStoreData, updateUserAddress } from '@/services/apiServices';
import { useAuthStore } from '@/stores/authStore'
import type { StoreCategory, StorePack, StorePackSelectableOption } from '@/types/api'
import Link from 'next/link'
import StoreCard from '@/components/utility/StoreCard'
import { useWebsiteStore } from '@/stores/websiteStore';
import GifLoader from '@/components/utility/GifLoader';
import AmountPill from '@/components/utility/AmountPill';
import FreeCoinPill from '@/components/utility/FreeCoinPill'
import dayjs from 'dayjs'
import { isValidPhoneNumber } from 'libphonenumber-js'

import { fetchCartItems } from '@/services/cartService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import StampPill from '@/components/utility/StampPill';
import RPPill from '@/components/utility/RPPill';
import { imageLoader, resolveStoreImageSrc } from '@/utils/imageUtils';
import UserRankShowcase from '@/features/user/components/UserRankShowcase';
import FastTicketPill from '@/components/utility/FastTicketPill';
import { requestNavbarRankRefresh } from '@/utils/rankRefresh';


function Store() {
  const { user, updateToken, token } = useAuthStore(); // Added token
  const searchParams = useSearchParams()
  const [storeData, setStoreData] = useState<StoreCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [bannerError, setBannerError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [activeStoreTab, setActiveStoreTab] = useState<string>('all')

  const balance = {
    coin: user?.coin ?? 0,
    flower: user?.flower ?? 0,
    heart: user?.heart ?? 0,
    stamp: user?.stamp ?? 0,
    exp_point: user?.exp ?? 0,
    free_coin: user?.freecoin ?? 0,
    rp: user?.current_rp ?? 0,
    fast_ticket: user?.fast_ticket ?? 0
  }

  const [selectedPack, setSelectedPack] = useState<StorePack | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [selectedQty, setSelectedQty] = useState(1);
  const [addressInput, setAddressInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [selectedStorePackListIds, setSelectedStorePackListIds] = useState<Array<number | string>>([]);

  const { notification: api } = App.useApp();
  const queryClient = useQueryClient();

  const getSelectionLimit = React.useCallback((pack: StorePack | null) => {
    if (!pack) return 1;
    return typeof pack.selection_limit === 'number' && pack.selection_limit > 0
      ? pack.selection_limit
      : 1;
  }, []);

  const getInitialSelectedStorePackListIds = React.useCallback((pack: StorePack): Array<number | string> => {
    if (!pack.is_selection || !Array.isArray(pack.selectable_options)) {
      return [];
    }

    const limit = getSelectionLimit(pack);
    const selectableOptions = pack.selectable_options.filter((option) => option.can_select !== false);
    const preSelectedIds = selectableOptions
      .filter((option) => option.selected)
      .map((option) => option.store_pack_list_id);

    if (preSelectedIds.length > 0) {
      return preSelectedIds.slice(0, limit);
    }

    return selectableOptions.slice(0, limit).map((option) => option.store_pack_list_id);
  }, [getSelectionLimit]);

  const handleCloseBuyModal = React.useCallback(() => {
    setSelectedPack(null);
    setSelectedStorePackListIds([]);
  }, []);

  // Fetch cart items for limit checking
  const { data: cartStores } = useQuery({
    queryKey: ['cartItems'],
    queryFn: fetchCartItems,
    enabled: !!token, 
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const handleBuyClick = (pack: StorePack, quantity: number = 1) => {
    setSelectedPack(pack)
    setSelectedQty(quantity)
    setSelectedStorePackListIds(getInitialSelectedStorePackListIds(pack));
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

  const handleSelectableOptionChange = (option: StorePackSelectableOption, checked: boolean) => {
    if (option.can_select === false || !selectedPack) return;

    const selectionLimit = getSelectionLimit(selectedPack);
    const optionId = option.store_pack_list_id;

    if (selectionLimit <= 1) {
      setSelectedStorePackListIds(checked ? [optionId] : []);
      return;
    }

    if (checked) {
      if (selectedStorePackListIds.includes(optionId)) return;
      if (selectedStorePackListIds.length >= selectionLimit) {
        api.warning({
          message: 'เลือกเกินจำนวนที่กำหนด',
          description: `แพ็กนี้เลือกได้สูงสุด ${selectionLimit} รายการ`,
          placement: 'topRight',
        });
        return;
      }

      setSelectedStorePackListIds((prev) => [...prev, optionId]);
      return;
    }

    setSelectedStorePackListIds((prev) => prev.filter((id) => id !== optionId));
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
             updateToken(newToken);
           }
        } else {
           throw new Error(resAddress.message || 'ไม่สามารถบันทึกที่อยู่ได้');
        }
      }

      if (selectedPack.is_selection) {
        const selectableOptions = Array.isArray(selectedPack.selectable_options)
          ? selectedPack.selectable_options.filter((option) => option.can_select !== false)
          : [];

        if (selectableOptions.length === 0) {
          api.warning({
            message: 'ไม่พบตัวเลือกสินค้า',
            description: 'แพ็กนี้ไม่มีรายการที่เลือกได้ในขณะนี้',
            placement: 'topRight',
          });
          setConfirmLoading(false);
          return;
        }

        if (selectedStorePackListIds.length === 0) {
          api.warning({
            message: 'กรุณาเลือกสินค้าในแพ็ก',
            description: 'โปรดเลือกรายการที่ต้องการก่อนยืนยันสั่งซื้อ',
            placement: 'topRight',
          });
          setConfirmLoading(false);
          return;
        }
      }

      // 2. Buy Pack
      let res;
      {
          const { buyStorePackNow } = await import('@/services/apiServices');
          res = await buyStorePackNow(
            selectedPack.store_pack_id,
            selectedQty,
            selectedPack.is_selection ? selectedStorePackListIds : undefined
          );
      }

      if (res.status === 'success' || res.code === 200) {
        const rpEarned = Number(
          res?.data?.rp_earned
          ?? res?.data?.data?.rp_earned
          ?? res?.rp_earned
          ?? 0
        );

        if (rpEarned > 0) {
          api.success({
            message: 'ยินดีด้วย!',
            description: (
              <div className="flex items-center gap-1">
                <span>คุณได้รับ {rpEarned}</span>
                {settings?.rp ? (
                  <Image src={settings.rp} alt="RP" width={16} height={16} unoptimized className="object-contain" />
                ) : (
                  <span>RP</span>
                )}
              </div>
            ),
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            placement: 'topRight',
          });
        }
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
        await requestNavbarRankRefresh(queryClient, user?.user_id);

        handleCloseBuyModal();
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
      } catch {
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    // Clear previous load error when changing tabs so each banner can attempt loading.
    setBannerError(false)
  }, [activeStoreTab, storeData])

  useEffect(() => {
    if (!storeData.length) return;

    const requestedTab = searchParams.get('tab')?.trim().toLowerCase();
    if (!requestedTab) return;

    const normalizedRequestedTab = requestedTab.replace(/[-_\s]+/g, '');
    const findCategoryByAlias = () => {
      if (/^\d+$/.test(requestedTab)) {
        return storeData.find((category) => String(category.store_id) === requestedTab) ?? null;
      }

      if (normalizedRequestedTab === 'all') {
        return null;
      }

      return (
        storeData.find((category) => {
          const normalizedName = category.name
            .toLowerCase()
            .replace(/[-_\s]+/g, '');

          if (normalizedName.includes(normalizedRequestedTab)) {
            return true;
          }

          if (normalizedRequestedTab === 'points') {
            return (
              category.name.includes('แต้ม')
              || category.StorePacks.some((pack) =>
                [
                  pack.name,
                  pack.detail,
                  pack.type,
                  pack.type_use,
                ]
                  .filter(Boolean)
                  .some((value) => String(value).toLowerCase().includes('fast'))
              )
            );
          }

          return false;
        }) ?? null
      );
    };

    const matchedCategory = findCategoryByAlias();
    if (!matchedCategory) {
      if (normalizedRequestedTab === 'all') {
        setActiveStoreTab('all');
      }
      return;
    }

    const nextTab = String(matchedCategory.store_id);
    if (activeStoreTab !== nextTab) {
      setActiveStoreTab(nextTab);
    }
  }, [activeStoreTab, searchParams, storeData])

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
  const selectedStoreCategory =
    activeStoreTab === 'all'
      ? null
      : storeData.find((category) => String(category.store_id) === activeStoreTab) ?? null;
  const selectedStoreBannerRaw = selectedStoreCategory?.banner
    || storeData.find((category) => Boolean(category.banner))?.banner
    || null;
  const selectedStoreBanner = (() => {
    if (!selectedStoreBannerRaw || selectedStoreBannerRaw === 'null' || selectedStoreBannerRaw === 'undefined') {
      return null;
    }
    if (
      selectedStoreBannerRaw.startsWith('http')
      || selectedStoreBannerRaw.startsWith('data:')
      || selectedStoreBannerRaw.startsWith('/')
    ) {
      return selectedStoreBannerRaw.replace('http:', 'https:');
    }
    return `https://img.enjoybook.co/${selectedStoreBannerRaw}`;
  })();
  const storePromoSrc = !bannerError && selectedStoreBanner
    ? imageLoader({ src: selectedStoreBanner, width: 1400 })
    : '/images/storeBanner.png';
  const rawAvatar = user?.img ?? (user as any)?.profileImage ?? '';
  const avatarSrc = (() => {
    if (!rawAvatar || rawAvatar === 'null' || rawAvatar === 'undefined') {
      return '/images/default-avatar.png';
    }
    if (rawAvatar.startsWith('http') || rawAvatar.startsWith('data:') || rawAvatar.startsWith('/')) {
      return rawAvatar.replace('http:', 'https:');
    }
    if (rawAvatar.startsWith('img/')) {
      return `https://img.enjoybook.co/${rawAvatar}`;
    }
    return `https://img.enjoybook.co/img/profile/${rawAvatar}`;
  })();
  const selectedPackImageSrc = resolveStoreImageSrc(selectedPack?.img || null, '/images/ejb.png');
  return (
    <div className="pb-20">
      <div className="max-w-[1128px] mx-auto px-4 mt-6">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="relative min-h-[148px] overflow-hidden rounded-[30px] border border-[#f0d9d4] bg-[linear-gradient(135deg,_#ffffff,_#fff9f7_55%,_#fff1ed)] shadow-[0_20px_42px_-34px_rgba(239,68,68,0.22)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,234,228,0.95),_transparent_35%),radial-gradient(circle_at_right,_rgba(255,243,239,0.9),_transparent_30%)]" />
            <div className="absolute -right-10 top-2 h-24 w-24 rounded-full bg-[#ffe5de] blur-3xl" />
            <div className="absolute bottom-0 left-16 h-16 w-16 rounded-full bg-[#fff0ea] blur-2xl" />

            <div className="relative z-10 flex h-full flex-col justify-center gap-3.5 p-3.5 md:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-2 py-1 shadow-sm">
                  <div className="relative h-7 w-7 overflow-hidden rounded-full border border-stone-200 bg-stone-100">
                    <Image
                      src={avatarError ? '/images/default-avatar.png' : avatarSrc}
                      alt={user?.fullname || 'Enjoybook user'}
                      fill
                      className="object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-500">Store</p>
                    <p className="truncate text-[11px] font-semibold text-stone-800 md:text-xs">
                      {user?.fullname || 'Enjoybook Member'}
                    </p>
                  </div>
                </div>

                <Link
                  href="/wallet/history"
                  className="inline-flex items-center gap-2 self-start rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-950 md:text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                  <span>ประวัติการชำระ</span>
                </Link>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <AmountPill
                  amount={balance.coin}
                  icon={settings?.coin || '/images/e-coin.png'}
                />
                <FreeCoinPill amount={balance.free_coin} />
                <StampPill amount={balance.stamp} />
                <RPPill amount={balance.rp} />
                <FastTicketPill amount={balance.fast_ticket} />
              </div>
            </div>
          </div>

          <UserRankShowcase variant="compact" className="lg:self-start" />
        </div>

        <div className="mt-4 relative overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-sm">
          <div className="relative h-[176px] sm:h-[204px] lg:h-[256px]">
            <AntdImage
              src={storePromoSrc}
              alt="Store promotion banner"
              width="100%"
              height="100%"
              style={{ objectFit: 'cover' }}
              preview={false}
              className="!absolute !inset-0"
              onError={() => setBannerError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/45 via-stone-950/10 to-transparent" />

            <div className="relative z-10 flex h-full items-start justify-between p-4">
              <div className="rounded-full bg-white/88 px-3 py-1 text-[11px] font-semibold text-stone-900 backdrop-blur-sm">
                Store Banner
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <StoreBanner /> */}

      {/* Payment summary row */}
      <div className="hidden max-w-[1128px] mx-auto px-4 mt-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {/* Main coin pill */}
            <AmountPill
              amount={balance.coin}
              icon={settings?.coin || '/images/e-coin.png'}
            />
            {/* Free Coin Pill */}
            <FreeCoinPill amount={balance.free_coin} />

            <StampPill amount={balance.stamp} />

            <RPPill amount={balance.rp} />
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
            activeKey={activeStoreTab}
            onChange={(tabKey) => setActiveStoreTab(tabKey)}
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
        title={<div className="px-8 text-center text-base font-bold leading-snug font-primary sm:text-xl">{selectedPack?.name}</div>}
        open={!!selectedPack}
        onCancel={handleCloseBuyModal}
        footer={null}
        centered
        zIndex={5000}
        width={selectedPack?.is_selection ? 560 : 380}
        style={{ maxWidth: 'calc(100vw - 20px)', top: 12 }}
        className="custom-modal-store font-primary"
      >
            <div className="flex max-h-[calc(100dvh-96px)] flex-col items-center overflow-y-auto px-0 pb-4 pt-2 sm:px-2 sm:pb-5">
            
            {/* Item Card */}
            <div className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl p-3 sm:p-4 flex items-start gap-3 mb-3 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
               <div className="relative h-20 w-20 flex-shrink-0 self-start z-10 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shadow-sm sm:h-24 sm:w-24">
                <Image
                  src={selectedPackImageSrc}
                  alt={selectedPack?.name || 'Pack'}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div className="min-w-0 flex-1 z-10 pt-0.5">
                <h3 className="line-clamp-2 font-bold text-base text-gray-800 mb-1 leading-tight sm:text-lg">{selectedPack?.name}</h3>
                <div className="w-full h-[1px] bg-gray-100 my-1.5"></div>
                {selectedPack?.items_description ? (
                  <ul className="text-xs text-gray-500 space-y-1 sm:text-sm">
                    {selectedPack.items_description.split(',').map((item, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                        {item.trim()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:text-sm">
                     <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                     จำนวน x {selectedQty}
                  </p>
                )}
              </div>
            </div>

            {selectedPack?.is_selection && Array.isArray(selectedPack?.selectable_options) && (
              <div className="w-full mb-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                  <span>เลือกได้สูงสุด {getSelectionLimit(selectedPack)} รายการ</span>
                  <span>เลือกแล้ว {selectedStorePackListIds.length}/{getSelectionLimit(selectedPack)}</span>
                </div>
                <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {selectedPack.selectable_options.map((option) => {
                    const checked = selectedStorePackListIds.includes(option.store_pack_list_id);
                    const disabled = option.can_select === false || confirmLoading;
                    return (
                      <label
                        key={option.store_pack_list_id}
                        className={`flex min-w-0 items-start gap-2 rounded-xl border bg-white p-2 text-sm transition ${checked ? 'border-red-200 bg-red-50/50 shadow-sm' : 'border-stone-200 hover:border-red-100'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onChange={(event) => handleSelectableOptionChange(option, event.target.checked)}
                          className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-red-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-red-500 hover:[&_.ant-checkbox-inner]:!border-red-500"
                        />
                        <div className="relative h-14 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100 shadow-sm">
                          <Image
                            src={resolveStoreImageSrc(option.item_img || null, '/images/ejb.png')}
                            alt={option.item_name}
                            fill
                            sizes="44px"
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p className="line-clamp-2 text-xs font-medium leading-snug text-stone-800 sm:text-sm">{option.item_name}</p>
                          {option.can_select === false && (
                            <p className="text-[11px] text-rose-500">คุณมีรายการนี้ครบแล้ว</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

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
            <div className="text-center mb-4 relative">
                 {/* Quantity Controls */}
                  <div className="flex items-center justify-center gap-3 mb-2">
                        <button 
                            onClick={handleDecrement}
                            className={`w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors ${selectedQty <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={selectedQty <= 1}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                        <span className="text-xl font-bold w-10 text-center text-gray-800">{selectedQty}</span>
                        <button 
                            onClick={handleIncrement}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                    </div>

                <div className="inline-block relative">
                    <span className="text-gray-400 text-xs font-medium block mb-0.5">ยอดรวมทั้งหมด</span>
                    <div className="flex items-center justify-center gap-2">
                        {['coin', 'heart', 'flower', 'stamp', 'exp', 'freecoin', 'rp'].includes(selectedPack?.type_use || '') && (
                        <div className="relative">
                            <Image
                                src={
                                selectedPack?.type_use === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                                    selectedPack?.type_use === 'heart' ? (settings?.heart || "/images/heart.png") :
                                    selectedPack?.type_use === 'flower' ? (settings?.flower || "/images/flower.png") :
                                        selectedPack?.type_use === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                                        selectedPack?.type_use === 'exp' ? (settings?.exp || "/images/exp.png") :
                                            selectedPack?.type_use === 'rp' ? (settings?.rp || "/images/rp.png") :
                                                (settings?.freecoin || "/images/freecoin.png")
                                }
                                width={30}
                                height={30}
                                alt={selectedPack?.type_use || 'currency'}
                                unoptimized
                                className="object-contain drop-shadow-sm"
                            />
                        </div>
                        )}
                        <span className="text-2xl font-bold font-primary text-gray-800 tracking-tight">
                            {((selectedPack?.price || 0) * selectedQty).toLocaleString()}
                        </span>
                        {!['coin', 'heart', 'flower', 'stamp', 'exp', 'freecoin', 'rp'].includes(selectedPack?.type_use || '') &&
                           <span className="text-lg text-gray-500 font-medium self-end mb-1">{selectedPack?.type_use}</span>
                        }
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="sticky bottom-0 z-20 flex w-full items-center gap-3 border-t border-transparent bg-white/95 pt-2 backdrop-blur">
              <button
                onClick={handleCloseBuyModal}
                className="flex-1 border-2 border-gray-200 text-gray-500 py-2.5 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all duration-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmBuy}
                disabled={confirmLoading}
                className="flex-1 bg-[#FF0037] !text-white py-2.5 rounded-xl font-bold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex justify-center items-center disabled:opacity-70 disabled:grayscale disabled:pointer-events-none"
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
