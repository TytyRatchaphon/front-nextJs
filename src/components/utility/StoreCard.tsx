import React from 'react';
import Image from 'next/image';
import { StorePack } from '@/types/api';
import { useWebsiteStore } from '@/stores/websiteStore';
import { App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import AddToCartSvg from '@/components/utility/AddToCartSvg';
import { addToCart, fetchCartItems } from '@/services/cartService';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import '@/utils/imageUtils';


interface StoreCardProps {
  pack: StorePack;
  onBuy: (pack: StorePack, quantity: number) => void;
}


const StoreCard: React.FC<StoreCardProps> = ({ pack, onBuy }) => {
  const { settings } = useWebsiteStore()
  const { token } = useAuthStore() as any;
  const { notification } = App.useApp();
  useRouter();
  const queryClient = useQueryClient();

  const { data: cartStores } = useQuery({
    queryKey: ['cartItems'],
    queryFn: fetchCartItems,
    enabled: !!token, // Only fetch if logged in
    staleTime: 1000 * 60, // 1 min cache
  });

  const qtyInCart = React.useMemo(() => {
    if (!cartStores) return 0;
    const item = cartStores.flatMap(s => s.items).find(i => i.store_pack?.store_pack_id === pack.store_pack_id);
    return item ? item.quantity : 0;
  }, [cartStores, pack.store_pack_id]);

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
      notification.success({
        message: 'เพิ่มลงตะกร้าเรียบร้อย',
        description: 'สินค้าได้ถูกเพิ่มลงในตะกร้าของคุณแล้ว',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        placement: 'topRight',
      });
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: msg,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
    }
  });

  const handleAddToCart = (pack: StorePack) => {
    if (!token) {
      notification.warning({
        message: 'กรุณาเข้าสู่ระบบก่อน',
        description: 'กรุณาเข้าสู่ระบบก่อน',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
        return;
    }
    addToCartMutation.mutate({ store_pack_id: pack.store_pack_id, quantity: 1 });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center text-center h-full hover:shadow-md transition-shadow">
      <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3 relative flex-shrink-0">
        <Image
          src={pack.img || '/images/ejb.png'}
          alt={pack.name}
          fill
          className="object-contain"
          unoptimized
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
            {['coin', 'heart', 'flower', 'stamp', 'exp', 'freecoin'].includes(pack.type_use) ? (
              <>
                <Image
                  src={
                    pack.type_use === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                      pack.type_use === 'heart' ? (settings?.heart || "/images/heart.png") :
                        pack.type_use === 'flower' ? (settings?.flower || "/images/flower.png") :
                          pack.type_use === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                            pack.type_use === 'exp' ? (settings?.exp || "/images/exp.png") :
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
                    onClick={() => handleAddToCart(pack)}
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

  );
};


export default StoreCard;
