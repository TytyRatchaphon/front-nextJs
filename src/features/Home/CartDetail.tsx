"use client";

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCartItems, updateCartItem, removeCartItem, clearCart } from '@/services/cartService';
import { CartItem } from '@/interfaces/cart.interface';
import { Table, Checkbox, Button, InputNumber, Image as AntImage, Typography, Popconfirm, App, Empty, Collapse } from 'antd';
import { DeleteOutlined, ShopOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useWebsiteStore } from '@/stores/websiteStore';
import GifLoader from '@/components/utility/GifLoader';
import AmountPill from '@/components/utility/AmountPill';
import FreeCoinPill from '@/components/utility/FreeCoinPill';
import StampPill from '@/components/utility/StampPill';
import RPPill from '@/components/utility/RPPill';


const { Title, Text } = Typography;

export default function CartDetail() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore() as any;
    const { settings } = useWebsiteStore();
    const { notification } = App.useApp();


    const { data: cartStores, isLoading } = useQuery({
        queryKey: ['cartItems'],
        queryFn: fetchCartItems,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: 'always',
    });

    const cartSummary = React.useMemo(() => {
        if (!cartStores) return { total_items: 0, currency_list: [] };

        const summary: any = {
            total_items: 0,
            currency_list: []
        };

        const totals: Record<string, number> = {};

        cartStores.forEach(store => {
            store.items.forEach(item => {
                if (item.is_selected) {
                    summary.total_items += item.quantity;
                    const type = item.store_pack?.type_use || 'coin';
                    const price = Number(item.store_pack?.price || item.price || 0);
                    const total = price * item.quantity;
                    
                    if (!totals[type]) totals[type] = 0;
                    totals[type] += total;
                }
            });
        });

        const currencyMap: Record<string, string> = {
            coin: 'เหรียญ',
            freecoin: 'ถุงเงิน',
            stamp: 'แสตมป์',
            rp: 'RP'
        };

        summary.currency_list = Object.entries(totals).map(([type, amount]) => ({
            type,
            amount,
            name: currencyMap[type] || type
        })).sort((a, b) => {
             const order = ['coin', 'freecoin', 'stamp'];
             return order.indexOf(a.type) - order.indexOf(b.type);
        });

        return summary;
    }, [cartStores]);

    const updateMutation = useMutation({
        mutationFn: updateCartItem,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['cartItems'] });
             queryClient.invalidateQueries({ queryKey: ['cartSummary'] });
             queryClient.invalidateQueries({ queryKey: ['checkoutItems'] });
             queryClient.invalidateQueries({ queryKey: ['checkoutAddress'] });
        },
        onError: (error: any) => {
            notification.error({
                message: 'จำกัดการซื้อ',
                description: error?.response?.data?.message || 'ไม่สามารถอัปเดตสินค้าได้',
                icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
                placement: 'topRight',
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: removeCartItem,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['cartItems'] });
             queryClient.invalidateQueries({ queryKey: ['cartSummary'] });
             queryClient.invalidateQueries({ queryKey: ['checkoutItems'] });
             queryClient.invalidateQueries({ queryKey: ['checkoutAddress'] });
             notification.success({
                message: 'สำเร็จ',
                description: 'ลบรายการสินค้าสำเร็จ',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                placement: 'topRight',
             });
        },
    });

    const clearCartMutation = useMutation({
        mutationFn: clearCart,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['cartItems'] });
             queryClient.invalidateQueries({ queryKey: ['cartSummary'] });
             queryClient.invalidateQueries({ queryKey: ['checkoutItems'] });
             queryClient.invalidateQueries({ queryKey: ['checkoutAddress'] });
             notification.success({
                message: 'สำเร็จ',
                description: 'ลบรายการสินค้าทั้งหมดสำเร็จ',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                placement: 'topRight',
             });
        },
    });

    // Helper to flatten items for calculation
    const allItems = React.useMemo(() => {
        if (!cartStores) return [];
        return cartStores.flatMap(store => store.items || []);
    }, [cartStores]);

    // Handle Quantity Change
    const handleQuantityChange = (id: number, quantity: number) => {
        if (quantity < 1) return;
        updateMutation.mutate({ cart_item_id: id, quantity });
    };

    // Handle Item Selection
    const handleSelectionChange = (id: number, checked: boolean) => {
        updateMutation.mutate({ cart_item_id: id, selected: checked });
    };

    // Handle Store Selection
    const handleSelectStore = (storeId: number, checked: boolean) => {
        const store = cartStores?.find(s => s.store_id === storeId);
        if (!store || !store.items) return;

        const promises = store.items.map(item => 
            updateCartItem({ cart_item_id: item.cart_item_id, selected: checked })
        );

        Promise.all(promises).then(() => {
            queryClient.invalidateQueries({ queryKey: ['cartItems'] });
            queryClient.invalidateQueries({ queryKey: ['cartSummary'] });
            queryClient.invalidateQueries({ queryKey: ['checkoutItems'] });
            queryClient.invalidateQueries({ queryKey: ['checkoutAddress'] });
        });
    };

    // Handle Select All
    const handleSelectAll = (checked: boolean) => {
        if (!allItems.length) return;
        const promises = allItems.map(item => 
            updateCartItem({ cart_item_id: item.cart_item_id, selected: checked })
        );
        
        Promise.all(promises).then(() => {
            queryClient.invalidateQueries({ queryKey: ['cartItems'] });
            queryClient.invalidateQueries({ queryKey: ['cartSummary'] });
            queryClient.invalidateQueries({ queryKey: ['checkoutItems'] });
            queryClient.invalidateQueries({ queryKey: ['checkoutAddress'] });
        });
    };

    const columns = [
        {
            dataIndex: 'is_selected',
            key: 'is_selected',
            width: '5%',
            render: (checked: boolean, record: CartItem) => (
                <Checkbox 
                    checked={checked} 
                    onChange={(e) => handleSelectionChange(record.cart_item_id, e.target.checked)}
                    className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-red-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-red-500 hover:[&_.ant-checkbox-inner]:!border-red-500"
                />
            ),
        },
        {
            title: 'สินค้า',
            dataIndex: 'book_name',
            key: 'book_name',
            width: '45%',
            render: (text: string, record: CartItem) => (
                <div className="flex gap-4 items-center">
                    <div className="w-[60px] h-[90px] relative flex-shrink-0 bg-gray-100 rounded overflow-hidden border border-gray-200">
                         {record.book_cover ? (
                             <AntImage
                                src={record.book_cover.startsWith('http') ? record.book_cover : `https://img.enjoybook.co/img/book/thumbnail/${record.book_cover}`}
                                alt={text}
                                width="100%"
                                height="100%"
                                className="object-cover"
                                preview={false}
                             />
                         ) : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>}
                    </div>
                    <div className="flex flex-col">
                        <Text strong className="line-clamp-2">{text}</Text>
                        <Text type="secondary" className="text-xs">รหัสสินค้า: {record.book_id}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: 'ราคาต่อหน่วย',
            dataIndex: 'price',
            key: 'price',
            width: '15%',
            align: 'center',
            render: (_: number, record: CartItem) => {
                const price = record.store_pack?.price || record.price || 0;
                const type = record.store_pack?.type_use || 'coin';
                
                return (
                    <div className="flex items-center justify-center gap-1">
                        <AntImage 
                            src={
                                type === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                                type === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                                type === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") :
                                type === 'rp' ? (settings?.rp || "/images/rp.png") :
                                "/images/e-coin.png"
                            }
                            width={16}
                            height={16}
                            preview={false}
                        />
                         <Text>{Number(price).toLocaleString()}</Text>
                    </div>
                );
            },
        },
        {
            title: 'จำนวน',
            dataIndex: 'quantity',
            key: 'quantity',
            width: '15%',
            align: 'center',
            render: (quantity: number, record: CartItem) => (
                <InputNumber 
                    min={1} 
                    max={99} 
                    value={quantity} 
                    onChange={(val) => val && handleQuantityChange(record.cart_item_id, val)}
                    changeOnWheel={false}
                />
            ),
        },
        {
            title: 'ราคารวม',
            key: 'total',
            width: '15%',
            align: 'center',
            render: (_: any, record: CartItem) => {
                const price = record.store_pack?.price || record.price || 0;
                const type = record.store_pack?.type_use || 'coin';
                const total = Number(price) * record.quantity;
                return (
                    <div className="flex items-center justify-center gap-1">
                         <AntImage 
                            src={
                                type === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                                type === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                                type === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") :
                                type === 'rp' ? (settings?.rp || "/images/rp.png") :
                                "/images/e-coin.png"
                            }
                            width={16}
                            height={16}
                            preview={false}
                        />
                        <Text type="danger" strong>{total.toLocaleString()}</Text>
                    </div>
                );
            },
        },
        {
            title: '',
            key: 'action',
            width: '5%',
            align: 'center',
            render: (_: any, record: CartItem) => (
                <Popconfirm title="ลบสินค้า?" onConfirm={() => deleteMutation.mutate(record.cart_item_id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    if (isLoading) return <div className="h-screen flex justify-center items-center"><GifLoader /></div>;

    if (!cartStores || cartStores.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                <Empty description="ไม่มีสินค้าในตะกร้า" />
                <Link href="/store">
                    <Button type="primary" size="large" className="!bg-red-500 hover:!bg-red-600 transition-colors">
                        เลือกซื้อสินค้า
                    </Button>
                </Link>
            </div>
        );
    }

    const isAllSelected = allItems.length > 0 && allItems.every(i => i.is_selected);

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-8">
            <Title level={2} className="mb-6 font-bai-jamjuree">ตะกร้าสินค้า</Title>
            
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Cart List Section */}
                <div className="flex-1 overflow-x-auto">
                    {/* Desktop Header Row */}
                    <div className="hidden md:flex bg-white rounded-t-xl border-b border-gray-100 p-4 font-bold text-gray-500 items-center text-center">
                        <div className="w-[5%] text-left">
                            <Checkbox 
                                checked={isAllSelected}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-red-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-red-500 hover:[&_.ant-checkbox-inner]:!border-red-500"
                            />
                        </div>
                        <div className="w-[45%] text-left">สินค้า</div>
                        <div className="w-[15%]">ราคาต่อหน่วย</div>
                        <div className="w-[15%]">จำนวน</div>
                        <div className="w-[15%]">ราคารวม</div>
                        <div className="w-[5%]"></div>
                    </div>

                    {/* Stores Collapse */}
                    <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
                        <Collapse 
                            defaultActiveKey={cartStores.map(s => s.store_id)} 
                            ghost 
                            expandIconPosition="end"
                            className="bg-white [&_.ant-collapse-item]:!border-b [&_.ant-collapse-item]:!border-gray-50 [&_.ant-collapse-item:last-child]:!border-b-0 [&_.ant-collapse-header]:!bg-gray-50 [&_.ant-collapse-content-box]:!p-0"
                            items={cartStores.map((store) => {
                                const isStoreSelected = store.items?.every(i => i.is_selected);
                                return {
                                    key: store.store_id,
                                    label: (
                                        <div className="flex items-center gap-3 text-gray-800" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox 
                                                checked={isStoreSelected}
                                                onChange={(e) => handleSelectStore(store.store_id, e.target.checked)}
                                                className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-red-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-red-500 hover:[&_.ant-checkbox-inner]:!border-red-500"
                                            />
                                            <div className="flex items-center gap-2">
                                                <ShopOutlined className="text-lg" /> 
                                                <span className="font-bold text-base">{store.store_name}</span>
                                            </div>
                                        </div>
                                    ),
                                    children: (
                                        <>
                                            {/* Desktop Table View */}
                                            <div className="hidden md:block">
                                                <Table 
                                                    dataSource={store.items} 
                                                    columns={columns as any} 
                                                    rowKey="cart_item_id" 
                                                    pagination={false}
                                                    showHeader={false}
                                                    className="font-bai-jamjuree w-full"
                                                />
                                            </div>

                                            {/* Mobile Card View */}
                                            <div className="md:hidden p-4 space-y-4 bg-gray-50/30">
                                                {store.items?.map((item) => {
                                                    const price = item.store_pack?.price || item.price || 0;
                                                    const type = item.store_pack?.type_use || 'coin';
                                                    const total = Number(price) * item.quantity;

                                                    return (
                                                        <div key={item.cart_item_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative">
                                                            <div className="flex gap-3">
                                                                {/* Checkbox */}
                                                                <div className="pt-1">
                                                                    <Checkbox 
                                                                        checked={item.is_selected} 
                                                                        onChange={(e) => handleSelectionChange(item.cart_item_id, e.target.checked)}
                                                                        className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-red-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-red-500 hover:[&_.ant-checkbox-inner]:!border-red-500"
                                                                    />
                                                                </div>
                                                                
                                                                {/* Image */}
                                                                <div className="w-[70px] h-[105px] relative flex-shrink-0 bg-gray-100 rounded overflow-hidden border border-gray-200">
                                                                    {item.book_cover ? (
                                                                        <AntImage
                                                                            src={item.book_cover.startsWith('http') ? item.book_cover : `https://img.enjoybook.co/img/book/thumbnail/${item.book_cover}`}
                                                                            alt={item.book_name}
                                                                            width="100%"
                                                                            height="100%"
                                                                            className="object-cover"
                                                                            preview={false}
                                                                        />
                                                                    ) : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>}
                                                                </div>

                                                                {/* Info */}
                                                                <div className="flex-1 flex flex-col justify-between">
                                                                    <div>
                                                                        <div className="flex justify-between items-start gap-2">
                                                                            <Text strong className="line-clamp-2 text-sm leading-tight mb-1">{item.book_name}</Text>
                                                                            <Popconfirm title="ลบสินค้า?" onConfirm={() => deleteMutation.mutate(item.cart_item_id)}>
                                                                                <Button type="text" size="small" danger icon={<DeleteOutlined />} className="min-w-[24px] h-[24px] flex items-center justify-center -mr-2 -mt-2 opacity-60" />
                                                                            </Popconfirm>
                                                                        </div>
                                                                        <Text type="secondary" className="text-xs">รหัส: {item.book_id}</Text>
                                                                    </div>

                                                                    <div className="mt-2 flex flex-col gap-2">
                                                                        {/* Price & Total */}
                                                                        <div className="flex justify-between items-end">
                                                                            <div className="flex flex-col">
                                                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                                    <span>ต่อชิ้น:</span>
                                                                                    <AntImage 
                             src={
                                type === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                                type === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                                type === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") :
                                type === 'rp' ? (settings?.rp || "/images/rp.png") :
                                "/images/e-coin.png"
                            }
                                                                                        width={12}
                                                                                        height={12}
                                                                                        preview={false}
                                                                                    />
                                                                                    <Text>{Number(price).toLocaleString()}</Text>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <AntImage 
                             src={
                                type === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                                type === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                                type === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") :
                                type === 'rp' ? (settings?.rp || "/images/rp.png") :
                                "/images/e-coin.png"
                            }
                                                                                        width={16}
                                                                                        height={16}
                                                                                        preview={false}
                                                                                    />
                                                                                    <Text type="danger" strong className="text-base">{total.toLocaleString()}</Text>
                                                                                </div>
                                                                            </div>

                                                                            {/* Qty Input */}
                                                                            <InputNumber 
                                                                                min={1} 
                                                                                max={99} 
                                                                                value={item.quantity} 
                                                                                onChange={(val) => val && handleQuantityChange(item.cart_item_id, val)}
                                                                                changeOnWheel={false}
                                                                                size="small"
                                                                                className="w-[70px]"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )
                                };
                            })}
                        />
                    </div>

                    <div className="mt-4 flex justify-between md:justify-end items-center px-4 md:px-0">
                         <div className="md:hidden">
                            <Checkbox 
                                checked={isAllSelected}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-red-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-red-500 hover:[&_.ant-checkbox-inner]:!border-red-500 font-bold"
                            >
                                เลือกทั้งหมด
                            </Checkbox>
                        </div>
                        <Popconfirm title="ล้างตะกร้าทั้งหมด?" onConfirm={() => clearCartMutation.mutate()}>
                            <Button danger type="text">ลบรายการทั้งหมด</Button>
                        </Popconfirm>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-4 sticky top-24 h-fit">
                    
                    {/* User Balance Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <Title level={4} className="mb-4">ยอดเงินคงเหลือ</Title>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <Text className="text-gray-500">เหรียญ</Text>
                                <AmountPill amount={user?.coin || 0} />
                            </div>
                            <div className="flex justify-between items-center">
                                <Text className="text-gray-500">ถุงเงิน</Text>
                                <FreeCoinPill amount={user?.freecoin || 0} />
                            </div>
                            <div className="flex justify-between items-center">
                                <Text className="text-gray-500">แสตมป์</Text>
                                <StampPill amount={user?.stamp || 0} />
                            </div>
                            <div className="flex justify-between items-center">
                                <Text className="text-gray-500">RP</Text>
                                <RPPill amount={user?.current_rp || 0} />
                            </div>
                        </div>
                    </div>

                    {/* Order Summary Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <Title level={4} className="mb-4">สรุปคำสั่งซื้อ</Title>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <Text>สินค้าทั้งหมด</Text>
                                <Text>{cartSummary?.total_items || 0} รายการ</Text>
                            </div>
                           
                            <div className="h-[1px] bg-gray-100 my-2"></div>
                            
                            <div className="flex flex-col gap-3">
                                <Text strong className="text-lg mb-1">ยอดชำระทั้งหมด</Text>
                                {cartSummary?.currency_list && cartSummary.currency_list.length > 0 ? (
                                    cartSummary.currency_list.map((curr: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <AntImage 
                                                    src={
                                                        curr.type === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                                                        curr.type === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                                                        curr.type === 'freecoin' ? (settings?.freecoin || "/images/money-bag.png") :
                                                        curr.type === 'rp' ? (settings?.rp || "/images/rp.png") :
                                                        "/images/e-coin.png"
                                                    }
                                                    width={24}
                                                    height={24}
                                                    preview={false}
                                                    alt={curr.name}
                                                />
                                                <Text className="text-gray-600">{curr.name}</Text>
                                            </div>
                                            <Text type="danger" strong className="text-xl">
                                                {curr.amount.toLocaleString()}
                                            </Text>
                                        </div>
                                    ))
                                ) : (
                                    <Text type="secondary" className="text-center  text-sm">เลือกสินค้าเพื่อคำนวณราคา</Text>
                                )}
                            </div>
                        </div>

                        <Link href="/checkout" className="w-full block">
                            <Button 
                                type="primary" 
                                danger 
                                block 
                                size="large" 
                                className="h-12 text-lg font-bold rounded-lg"
                                disabled={!cartSummary?.currency_list || cartSummary.currency_list.length === 0}
                            >
                                ชำระเงิน
                            </Button>
                        </Link>
                        
                        <div className="mt-4 text-center">
                            <Text type="secondary" className="text-xs !text-red-500">
                                * กรุณาตรวจสอบรายการสินค้าก่อนชำระเงิน
                            </Text>
                        </div>
                    </div>
                </div>
            </div>
            

        </div>
    );
}
