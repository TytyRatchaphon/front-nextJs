import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCartItems, updateCartItem, removeCartItem } from '@/services/cartService';
import { Button, Collapse, App } from 'antd';
import { ShoppingCartOutlined, BookOutlined, DeleteOutlined, MinusOutlined, PlusOutlined, ShopOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import GifLoader from '@/components/utility/GifLoader';
import { CartItem } from '@/interfaces/cart.interface';
import { useWebsiteStore } from '@/stores/websiteStore';
import { CheckCircleOutlined } from '@ant-design/icons';
import { QUERY_CONFIG } from '@/constants/query';


interface CartPopoverProps {
    onClose?: () => void;
}

const CartPopover: React.FC<CartPopoverProps> = ({ onClose }) => {
    const { settings } = useWebsiteStore();
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    const { data: cartStores, isLoading } = useQuery({
        queryKey: ['cartItems'],
        queryFn: fetchCartItems,
        staleTime: QUERY_CONFIG.CART_STALE_TIME,
        gcTime: QUERY_CONFIG.CART_GC_TIME,
        refetchOnWindowFocus: false,
    });

    const updateMutation = useMutation({
        mutationFn: updateCartItem,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['cartItems'] });
             queryClient.invalidateQueries({ queryKey: ['cartSummary'] });
             queryClient.invalidateQueries({ queryKey: ['checkoutItems'] });
             queryClient.invalidateQueries({ queryKey: ['checkoutAddress'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: removeCartItem,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['cartItems'] });
             queryClient.invalidateQueries({ queryKey: ['cartSummary'] });
             queryClient.invalidateQueries({ queryKey: ['checkoutItems'] });
             queryClient.invalidateQueries({ queryKey: ['checkoutAddress'] });
             notification.success({
                message: 'ลบสินค้าเรียบร้อย',
                description: 'ลบสินค้าเรียบร้อยแล้ว',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                placement: 'topRight',
            });
        },
    });

    const handleQuantityChange = (id: number, currentQty: number, change: number) => {
        const newQty = currentQty + change;
        if (newQty < 1) return;
        updateMutation.mutate({ cart_item_id: id, quantity: newQty });
    };

    const totalItems = React.useMemo(() => {
        if (!cartStores) return 0;
        return cartStores.reduce((acc, store) => acc + (store.items?.length || 0), 0);
    }, [cartStores]);
    
    // Calculate totals by currency type
    const totals = React.useMemo(() => {
        if (!cartStores) return {};
        const allItems = cartStores.flatMap(s => s.items || []);
        return allItems.reduce((acc, item) => {
            const type = item.store_pack?.type_use || 'coin';
            const price = item.store_pack?.price || item.price || 0;
            const total = (Number(price) * item.quantity);
            acc[type] = (acc[type] || 0) + total;
            return acc;
        }, {} as Record<string, number>);
    }, [cartStores]);

    if (isLoading) {
        return (
            <div className="w-full max-w-[350px] h-[300px] flex justify-center items-center">
                <GifLoader width={100} height={100} />
            </div>
        );
    }

    return (
        <div className="w-[85vw] max-w-[350px] sm:w-[400px] flex flex-col bg-white rounded-xl overflow-hidden font-bai-jamjuree shadow-2xl border border-gray-100 ring-1 ring-black/5">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <ShoppingCartOutlined className="text-2xl text-gray-700" />
                        {totalItems > 0 && (
                            <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-[#E31C3D] rounded-full px-1 border-2 border-white">
                                {totalItems}
                            </span>
                        )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 m-0">ตะกร้าสินค้า</h3>
                </div>
            </div>

            {/* List */}
            {!Array.isArray(cartStores) || cartStores.length === 0 ? (
                <div className="w-full h-[300px] flex flex-col justify-center items-center gap-3 text-gray-400">
                     <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                        <ShoppingCartOutlined className="text-xl opacity-30" />
                    </div>
                    <p className="m-0 text-sm">ไม่มีสินค้าในตะกร้า</p>
                </div>
            ) : (
                <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto bg-white">
                    <Collapse 
                        defaultActiveKey={cartStores.map(s => s.store_id)} 
                        ghost 
                        expandIconPosition="end"
                        className="[&_.ant-collapse-header]:!px-4 [&_.ant-collapse-header]:!py-3 [&_.ant-collapse-header]:!bg-gray-50 [&_.ant-collapse-content-box]:!p-0"
                        items={cartStores.map((store) => ({
                            key: store.store_id,
                            label: (
                                <div className="flex items-center gap-2 text-gray-700">
                                    <ShopOutlined /> 
                                    <span className="font-bold">{store.store_name}</span>
                                    <span className="text-xs text-gray-400 font-normal">({store.items?.length || 0})</span>
                                </div>
                            ),
                            children: (
                                <>
                                    {store.items && store.items.map((item: CartItem) => {
                                        const type = item.store_pack?.type_use || 'coin';
                                        const price = item.store_pack?.price || item.price || 0;
                                        const itemTotal = Number(price) * item.quantity;

                                        return (
                                        <div key={item.cart_item_id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-4 last:border-0 pl-6">
                                             {/* Cover Image */}
                                             <div className="relative w-[60px] h-[90px] flex-shrink-0 rounded-md overflow-hidden shadow-sm border border-gray-200">
                                                {item.book_cover ? (
                                                    <Image
                                                        src={(item.book_cover || '').startsWith('http') ? (item.book_cover || '') : `https://img.enjoybook.co/img/book/thumbnail/${item.book_cover}`}
                                                        alt={item.book_name || 'Item'}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                                                        <BookOutlined />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                                <div>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 pr-2">
                                                            {item.book_name}
                                                        </h4>
                                                        <button 
                                                            onClick={() => deleteMutation.mutate(item.cart_item_id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-2 -mt-2"
                                                        >
                                                            <DeleteOutlined />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center border border-gray-200 rounded-md bg-white">
                                                            <button 
                                                                onClick={() => handleQuantityChange(item.cart_item_id, item.quantity, -1)}
                                                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors rounded-l-md"
                                                                disabled={item.quantity <= 1 || updateMutation.isPending}
                                                            >
                                                                <MinusOutlined className="text-[10px]" />
                                                            </button>
                                                            <span className="min-w-[24px] text-center text-xs font-bold text-gray-700 select-none">{item.quantity}</span>
                                                            <button 
                                                                onClick={() => handleQuantityChange(item.cart_item_id, item.quantity, 1)}
                                                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-r-md"
                                                                disabled={updateMutation.isPending}
                                                            >
                                                                <PlusOutlined className="text-[10px]" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-red-600 font-bold text-sm flex items-center gap-1 justify-end">
                                                    <Image
                                                        src={
                                                            type === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                                                            type === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                                                            type === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") :
                                                            type === 'rp' ? (settings?.rp || "/images/rp.png") :
                                                            "/images/e-coin.png"
                                                        }
                                                        width={16}
                                                        height={16}
                                                        alt={type}
                                                        unoptimized
                                                    />
                                                    {itemTotal.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        )})}
                                </>
                            )
                        }))}
                    />
                </div>
            )}
            
            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
                {Object.keys(totals).length > 0 && (
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-500 font-bold text-sm">ยอดรวมทั้งหมด</span>
                        <div className="flex flex-wrap items-center justify-end gap-3">
                             {Object.entries(totals).map(([type, amount]) => (
                                 <div key={type} className="flex items-center gap-1 text-red-600 font-bold text-base leading-tight">
                                    <Image
                                        src={
                                            type === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                                            type === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                                            type === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") :
                                            type === 'rp' ? (settings?.rp || "/images/rp.png") :
                                            "/images/e-coin.png"
                                        }
                                        width={18}
                                        height={18}
                                        alt={type}
                                        unoptimized
                                    />
                                    {amount.toLocaleString()}
                                 </div>
                             ))}
                        </div>
                    </div>
                )}
                <Link href="/cart" onClick={onClose}>
                    <Button type="primary" danger block size="large" className="rounded-lg font-bold">
                        ดูตะกร้าสินค้าทั้งหมด
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default CartPopover;
