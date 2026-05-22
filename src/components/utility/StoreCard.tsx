import * as React from "react";
import Image from 'next/image';
import { StorePack, StorePackSelectableOption } from '@/types/api';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { App, Checkbox, Image as AntImage, Modal, Spin } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import AddToCartSvg from '@/components/utility/AddToCartSvg';
import { addToCart, fetchCartItems } from '@/services/cartService';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { resolveStoreImageSrc } from '@/utils/imageUtils';
import { queryKeys } from '@/constants/query';


interface StoreCardProps {
  pack: StorePack;
  onBuy: (pack: StorePack, quantity: number) => void;
}


const StoreCard: React.FC<StoreCardProps> = ({ pack, onBuy }) => {
  const { settings } = useWebsiteSettings()
  const { token } = useAuthStore() as any;
  const { notification } = App.useApp();
  useRouter();
  const queryClient = useQueryClient();
  const [isCartSelectionOpen, setIsCartSelectionOpen] = React.useState(false);
  const [selectedStorePackListIds, setSelectedStorePackListIds] = React.useState<Array<number | string>>([]);

  const { data: cartStores } = useQuery({
    queryKey: queryKeys.cart.items(),
    queryFn: fetchCartItems,
    enabled: !!token, // Only fetch if logged in
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const qtyInCart = React.useMemo(() => {
    if (!cartStores) return 0;
    const item = cartStores.flatMap(s => s.items).find(i => i.store_pack?.store_pack_id === pack.store_pack_id);
    return item ? item.quantity : 0;
  }, [cartStores, pack.store_pack_id]);

  const getSelectionLimit = React.useCallback(() => {
    return typeof pack.selection_limit === 'number' && pack.selection_limit > 0
      ? pack.selection_limit
      : 1;
  }, [pack.selection_limit]);

  const selectableOptions = React.useMemo(() => {
    if (!pack.is_selection || !Array.isArray(pack.selectable_options)) {
      return [];
    }

    return pack.selectable_options.filter((option) => option.can_select !== false);
  }, [pack.is_selection, pack.selectable_options]);

  const getInitialSelectedStorePackListIds = React.useCallback((): Array<number | string> => {
    return [];
  }, []);

  React.useMemo(() => {
    // 1. Check Remaining Count (from BE) which handles day/month limits
    if (typeof pack.remaining_count === 'number') {
        // If remaining_count is negative (e.g. -1), it means unlimited
        if (pack.remaining_count < 0) return false;
        
        return qtyInCart >= pack.remaining_count;
    }
    
    // 2. Fallback: Check individual limits manually if remaining_count is missing
    const limits = [
        pack.limit_unit, 
        pack.limit_unit_month, 
        pack.limit_unit_day
    ].filter(l => typeof l === 'number' && l > 0) as number[];

    if (limits.length > 0) {
        const minLimit = Math.min(...limits);
        return qtyInCart >= minLimit;
    }

    return false;
  }, [pack, qtyInCart]);

  const addToCartMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      setIsCartSelectionOpen(false);
      setSelectedStorePackListIds([]);
      notification.success({
        message: 'เพิ่มลงตะกร้าเรียบร้อย',
        description: 'สินค้าได้ถูกเพิ่มลงในตะกร้าของคุณแล้ว',
        placement: 'topRight',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: msg,
        placement: 'topRight',
      });
    }
  });

  const addPackToCart = React.useCallback((selectedIds?: Array<number | string>) => {
    addToCartMutation.mutate({
      store_pack_id: pack.store_pack_id,
      quantity: 1,
      ...(selectedIds?.length ? { selected_store_pack_list_ids: selectedIds } : {}),
    });
  }, [addToCartMutation, pack.store_pack_id]);

  const handleSelectableOptionChange = (option: StorePackSelectableOption, checked: boolean) => {
    if (option.can_select === false) return;

    const selectionLimit = getSelectionLimit();
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

      setSelectedStorePackListIds((prev) => [...prev, optionId]);
      return;
    }

    setSelectedStorePackListIds((prev) => prev.filter((id) => id !== optionId));
  };

  const handleConfirmAddSelectionToCart = () => {
    if (selectedStorePackListIds.length === 0) {
      notification.warning({
        message: 'กรุณาเลือกสินค้าในแพ็ก',
        description: 'โปรดเลือกรายการที่ต้องการก่อนเพิ่มลงตะกร้า',
        placement: 'topRight',
      });
      return;
    }

    addPackToCart(selectedStorePackListIds);
  };

  const handleAddToCart = () => {
    if (!token) {
      notification.warning({
        message: 'กรุณาเข้าสู่ระบบก่อน',
        description: 'กรุณาเข้าสู่ระบบก่อน',
        placement: 'topRight',
      });
        return;
    }

    if (pack.is_selection) {
      if (selectableOptions.length === 0) {
        notification.warning({
          message: 'ไม่สามารถเพิ่มลงตะกร้าได้',
          description: 'ไม่พบรายการที่สามารถเลือกได้สำหรับแพ็กนี้',
          placement: 'topRight',
        });
        return;
      }

      setSelectedStorePackListIds(getInitialSelectedStorePackListIds());
      setIsCartSelectionOpen(true);
      return;
    }

    addPackToCart();
  };

  return (
    <>
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center text-center h-full hover:shadow-md transition-shadow">
      <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3 relative flex-shrink-0">
        <AntImage
          src={resolveStoreImageSrc(pack.img, '/images/ejb.png')}
          alt={pack.name}
          width="100%"
          height="100%"
          fallback="/images/ejb.png"
          preview={{
            mask: <span className="text-xs">Preview</span>,
          }}
          className="!h-full !w-full object-contain"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <h3 className="font-medium text-base sm:text-lg mb-1 line-clamp-1" title={pack.name}>
        {pack.name}
      </h3>
      <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.5em] opacity-80">
        {pack.name}
      </p>

      <div className="mt-auto w-full">
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="text-red-600 font-semibold whitespace-nowrap flex items-center gap-1 text-sm sm:text-base mb-1">
            {['coin', 'heart', 'flower', 'stamp', 'exp', 'freecoin', 'rp'].includes(pack.type_use) ? (
              <>
                <Image
                  src={
                    pack.type_use === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                      pack.type_use === 'heart' ? (settings?.heart || "/images/heart.png") :
                        pack.type_use === 'flower' ? (settings?.flower || "/images/flower.png") :
                          pack.type_use === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                            pack.type_use === 'exp' ? (settings?.exp || "/images/exp.png") :
                              pack.type_use === 'rp' ? (settings?.rp || "/images/rp.png") :
                                (settings?.freecoin || "/images/freecoin.png")
                  }
                  width={20}
                  height={20}
                  alt={pack.type_use}
                  unoptimized
                />
                <span>{pack.price.toLocaleString()}</span>
              </>
            ) : (
              <>
                {pack.price.toLocaleString()} {pack.type_use}
              </>
            )}
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                if (pack.can_purchase !== false) {
                    onBuy(pack, 1) // Default to 1, modal will handle qty
                }
              }}
              disabled={pack.can_purchase === false}
              className={`flex-1 !text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-bold ${pack.can_purchase === false
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
                }`}
            >
              {pack.can_purchase === false ? 'เป็นเจ้าของแล้ว' : 'ซื้อ'}
            </button>
            {pack.can_purchase !== false && (
                <button
                    onClick={handleAddToCart}
                    className="p-2 rounded-lg flex items-center justify-center transition-colors shadow-sm bg-red-500 hover:bg-red-600"
                    title="เพิ่มลงตะกร้า"
                >
                    <AddToCartSvg width={20} height={20} color="white" />
                </button>
            )}
          </div>
        </div>
      </div>
      </div>
      <Modal
        title={<div className="px-6 text-center text-base font-bold leading-snug">เลือกสินค้าก่อนเพิ่มลงตะกร้า</div>}
        open={isCartSelectionOpen}
        onCancel={() => setIsCartSelectionOpen(false)}
        footer={null}
        centered
        width={540}
        style={{ maxWidth: 'calc(100vw - 20px)' }}
        className="custom-modal-store font-primary"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
              <Image
                src={resolveStoreImageSrc(pack.img, '/images/ejb.png')}
                alt={pack.name}
                fill
                unoptimized
                className="object-contain p-1"
              />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900">{pack.name}</h3>
              <p className="mt-1 text-xs text-gray-500">
                เลือกได้ {getSelectionLimit()} รายการ เลือกแล้ว {selectedStorePackListIds.length}/{getSelectionLimit()}
              </p>
            </div>
          </div>

          <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 p-3 pr-2 sm:grid-cols-2">
            {pack.selectable_options?.map((option) => {
              const checked = selectedStorePackListIds.includes(option.store_pack_list_id);
              const disabled = option.can_select === false || addToCartMutation.isPending;
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
                  <div className="min-w-0 pt-0.5 text-left">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-stone-800 sm:text-sm">{option.item_name}</p>
                    {option.can_select === false && (
                      <p className="text-[11px] text-rose-500">คุณมีรายการนี้ครบแล้ว</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setIsCartSelectionOpen(false)}
              className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 font-bold text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirmAddSelectionToCart}
              disabled={addToCartMutation.isPending || selectedStorePackListIds.length === 0}
              className="flex flex-1 items-center justify-center rounded-xl bg-[#FF0037] py-2.5 font-bold !text-white shadow-lg shadow-red-200 transition hover:shadow-red-300 disabled:pointer-events-none disabled:opacity-70 disabled:grayscale"
            >
              {addToCartMutation.isPending ? <Spin size="small" className="!mr-2 custom-spin-white" /> : null}
              เพิ่มลงตะกร้า
            </button>
          </div>
        </div>
      </Modal>
    </>

  );
};


export default StoreCard;
