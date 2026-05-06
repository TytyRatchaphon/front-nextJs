import * as React from 'react';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCartItems } from '@/services/cartService';
import { updateUserAddress } from '@/services/apiServices';
import { requestNavbarRankRefresh } from '@/utils/rankRefresh';
import { isValidPhoneNumber } from 'libphonenumber-js';
import dayjs from 'dayjs';
import type { StorePack, StorePackSelectableOption } from '@/types/api';

interface UseStorePurchaseParams {
  notification: any;
  settings: any;
}

export function useStorePurchase({ notification, settings }: UseStorePurchaseParams) {
  const { user, updateToken, token } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedPack, setSelectedPack] = useState<StorePack | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  const [addressInput, setAddressInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [selectedStorePackListIds, setSelectedStorePackListIds] = useState<Array<number | string>>([]);

  // Fetch cart items for limit checking
  const { data: cartStores } = useQuery({
    queryKey: ['cartItems'],
    queryFn: fetchCartItems,
    enabled: !!token, 
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const getSelectionLimit = useCallback((pack: StorePack | null) => {
    if (!pack) return 1;
    return typeof pack.selection_limit === 'number' && pack.selection_limit > 0
      ? pack.selection_limit
      : 1;
  }, []);

  const getInitialSelectedStorePackListIds = useCallback((pack: StorePack): Array<number | string> => {
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

  const handleCloseBuyModal = useCallback(() => {
    setSelectedPack(null);
    setSelectedStorePackListIds([]);
  }, []);

  const handleBuyClick = useCallback((pack: StorePack, quantity: number = 1) => {
    setSelectedPack(pack);
    setSelectedQty(quantity);
    setSelectedStorePackListIds(getInitialSelectedStorePackListIds(pack));
    // Initialize address input if missing
    if (pack.type === 'gift' && !user?.address_main) {
      setAddressInput('');
    }
    if (!user?.phone) {
      setPhoneInput('');
    }
  }, [getInitialSelectedStorePackListIds, user?.address_main, user?.phone]);

  const handleIncrement = useCallback(() => {
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
  }, [selectedPack, cartStores, selectedQty]);

  const handleDecrement = useCallback(() => {
    if (selectedQty > 1) {
        setSelectedQty(prev => prev - 1);
    }
  }, [selectedQty]);

  const handleSelectableOptionChange = useCallback((option: StorePackSelectableOption, checked: boolean) => {
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
        notification.warning({
          message: 'เลือกเกินจำนวนที่กำหนด',
          description: `แพ็กนี้เลือกได้สูงสุด ${selectionLimit} รายการ`,
          placement: 'topRight',
        });
        return;
      }

      setSelectedStorePackListIds((prev: Array<number | string>) => [...prev, optionId]);
      return;
    }

    setSelectedStorePackListIds((prev: Array<number | string>) => prev.filter((id) => id !== optionId));
  }, [selectedPack, getSelectionLimit, selectedStorePackListIds, notification]);

  const handleConfirmBuy = useCallback(async () => {
    if (!selectedPack) return;

    try {
      setConfirmLoading(true);

      // 1. If gift and missing address, save address first
        if (selectedPack.type === 'gift' && !user?.address_main) {
           if (!addressInput.trim()) {
             notification.warning({
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
               notification.warning({
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
               notification.warning({
                   message: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
                   description: 'กรุณากรอกเบอร์โทรศัพท์มือถือที่ขึ้นต้นด้วย 06, 08 หรือ 09 เท่านั้น',
                   placement: 'topRight',
               });
               setConfirmLoading(false);
               return;
           }
        }

        // Only update profile if we gathered new info (Gift Address OR Phone)
        const needUpdateAddress = (selectedPack.type === 'gift' && !user?.address_main);
        const needUpdatePhone = (selectedPack.type === 'gift' && !user?.phone);

        if (needUpdateAddress || needUpdatePhone) {
        
        if (!token) {
           notification.error({ message: 'กรุณาเข้าสู่ระบบใหม่' });
           setConfirmLoading(false);
           return;
        }

        // Construct simplified payload for address update
        const formData = new FormData();
        const getVal = (v: any) => (v !== undefined && v !== null ? String(v) : "");
        
        formData.append('fullname', getVal(user?.fullname));
        formData.append('phone', needUpdatePhone ? phoneInput : getVal(user?.phone)); 
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

        const bday = user?.birthday ? dayjs(user.birthday).format('YYYY-MM-DD') : "";
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
          notification.warning({
            message: 'ไม่พบตัวเลือกสินค้า',
            description: 'แพ็กนี้ไม่มีรายการที่เลือกได้ในขณะนี้',
            placement: 'topRight',
          });
          setConfirmLoading(false);
          return;
        }

        if (selectedStorePackListIds.length === 0) {
          notification.warning({
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
          notification.success({
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
            placement: 'topRight',
          });
        }
        notification.success({
          message: `ซื้อ ${selectedPack.name} สำเร็จ`,
          description: `ได้รับสินค้าจำนวน ${selectedQty} ชิ้น เรียบร้อยแล้ว`,
          placement: 'topRight',
        });

        // Token update as backup/source of truth if provided
        if (res.data && res.data.token) {
          updateToken(res.data.token);
        }
        await requestNavbarRankRefresh(queryClient, user?.user_id);

        handleCloseBuyModal();
      } else {
        notification.error({
          message: 'เกิดข้อผิดพลาด',
          description: res.message || 'ไม่สามารถซื้อสินค้าได้',
          placement: 'topRight',
        });
      }
    } catch (error: any) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error?.response?.data?.message || error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
        placement: 'topRight',
      });
    } finally {
      setConfirmLoading(false);
    }
  }, [selectedPack, user, token, addressInput, phoneInput, selectedStorePackListIds, selectedQty, notification, settings, updateToken, queryClient, handleCloseBuyModal]);

  return {
    selectedPack,
    selectedQty,
    confirmLoading,
    addressInput,
    setAddressInput,
    phoneInput,
    setPhoneInput,
    selectedStorePackListIds,
    handleBuyClick,
    handleIncrement,
    handleDecrement,
    handleSelectableOptionChange,
    handleConfirmBuy,
    handleCloseBuyModal,
    getSelectionLimit,
  };
}
