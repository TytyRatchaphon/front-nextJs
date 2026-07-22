"use client";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCartItems, updateCartItem, removeCartItem, clearCart } from '@/services/cartService';
import { CartItem, SelectableOption } from '@/types/cart';
import { Table, Checkbox, Button, InputNumber, Image as AntImage, Typography, Popconfirm, App, Empty, Collapse, Modal } from 'antd';
import { DeleteOutlined, ShopOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import GifLoader from '@/components/utility/GifLoader';
import AmountPill from '@/components/utility/AmountPill';
import FreeCoinPill from '@/components/utility/FreeCoinPill';
import StampPill from '@/components/utility/StampPill';
import RPPill from '@/components/utility/RPPill';
import CurrencyIcon from '@/components/common/CurrencyIcon';
import { resolveStoreImageSrc } from '@/utils/imageUtils';
import { queryKeys } from '@/constants/query';


const { Title, Text } = Typography;
const DEFAULT_STORE_IMAGE = '/images/ejb.png';

const isMissingImageSrc = (src: string | null | undefined) => {
    if (typeof src !== 'string') return true;
    const trimmed = src.trim();
    return !trimmed || trimmed === 'null' || trimmed === 'undefined';
};

export default function CartDetail() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore() as any;
  const { settings } = useWebsiteSettings();
    const { notification } = App.useApp();
    const { data: cartStores, isLoading } = useQuery({
        queryKey: queryKeys.cart.items(),
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
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary() });
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.checkoutItems() });
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.checkoutAddress() });
        },
        onError: (error: any) => {
            notification.error({
                message: 'จำกัดการซื้อ',
                description: error?.response?.data?.message || 'ไม่สามารถอัปเดตสินค้าได้',
                placement: 'topRight',
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: removeCartItem,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary() });
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.checkoutItems() });
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.checkoutAddress() });
             notification.success({
                message: 'สำเร็จ',
                description: 'ลบรายการสินค้าสำเร็จ',
                placement: 'topRight',
             });
        },
        onError: (error: any) => {
            notification.error({
                message: 'เกิดข้อผิดพลาด',
                description: error?.response?.data?.message || 'ไม่สามารถลบรายการสินค้าได้',
                placement: 'topRight',
            });
        },
    });

    const clearCartMutation = useMutation({
        mutationFn: clearCart,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary() });
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.checkoutItems() });
             queryClient.invalidateQueries({ queryKey: queryKeys.cart.checkoutAddress() });
             notification.success({
                message: 'สำเร็จ',
                description: 'ลบรายการสินค้าทั้งหมดสำเร็จ',
                placement: 'topRight',
             });
        },
        onError: (error: any) => {
            notification.error({
                message: 'เกิดข้อผิดพลาด',
                description: error?.response?.data?.message || 'ไม่สามารถล้างตะกร้าสินค้าได้',
                placement: 'topRight',
            });
        },
    });

    // Helper to flatten items for calculation
    const allItems = React.useMemo(() => {
        if (!cartStores) return [];
        return cartStores.flatMap(store => store.items || []);
    }, [cartStores]);
    const [selectionModalItemId, setSelectionModalItemId] = React.useState<number | null>(null);
    const [draftSelectedOptionIds, setDraftSelectedOptionIds] = React.useState<Array<number | string>>([]);
    const selectionModalItem = React.useMemo(
        () => allItems.find((item) => item.cart_item_id === selectionModalItemId) || null,
        [allItems, selectionModalItemId],
    );

    const getSelectedStorePackListIds = React.useCallback((item: CartItem): Array<number | string> => {
        const options = item.store_pack?.selectable_options;
        if (!Array.isArray(options)) return [];

        return options
            .filter((option) => option.selected)
            .map((option) => option.store_pack_list_id);
    }, []);

    React.useEffect(() => {
        setDraftSelectedOptionIds(selectionModalItem ? getSelectedStorePackListIds(selectionModalItem) : []);
    }, [getSelectedStorePackListIds, selectionModalItem]);

    const getSelectionLimit = React.useCallback((item: CartItem): number => {
        const rawLimit = item.store_pack?.selection_limit;
        return typeof rawLimit === 'number' && rawLimit > 0 ? rawLimit : 1;
    }, []);

    const handleDraftSelectableOptionChange = React.useCallback((item: CartItem, option: SelectableOption, checked: boolean) => {
        if (option.can_select === false) return;

        const selectionLimit = getSelectionLimit(item);
        const optionId = option.store_pack_list_id;

        setDraftSelectedOptionIds((currentSelectedIds) => {
            if (selectionLimit <= 1) {
                return checked ? [optionId] : [];
            }

            if (checked) {
                if (currentSelectedIds.includes(optionId)) return currentSelectedIds;
                if (currentSelectedIds.length >= selectionLimit) {
                    notification.warning({
                        message: 'เลือกเกินจำนวนที่กำหนด',
                        description: `แพ็กนี้เลือกได้สูงสุด ${selectionLimit} รายการ`,
                        placement: 'topRight',
                    });
                    return currentSelectedIds;
                }
                return [...currentSelectedIds, optionId];
            }

            return currentSelectedIds.filter((id) => id !== optionId);
        });
    }, [getSelectionLimit, notification]);

    const buildSelectionPayload = React.useCallback((item: CartItem, selected: boolean) => {
        const selectedStorePackListIds = getSelectedStorePackListIds(item);
        if (selectedStorePackListIds.length === 0) {
            return { cart_item_id: item.cart_item_id, selected };
        }

        return {
            cart_item_id: item.cart_item_id,
            selected,
            selected_store_pack_list_ids: selectedStorePackListIds,
        };
    }, [getSelectedStorePackListIds]);

    // Handle Quantity Change
    const handleQuantityChange = (id: number, quantity: number) => {
        if (quantity < 1) return;
        updateMutation.mutate({ cart_item_id: id, quantity });
    };

    // Handle Item Selection
    const handleSelectionChange = (item: CartItem, checked: boolean) => {
        updateMutation.mutate(buildSelectionPayload(item, checked));
    };

    const handleSelectableOptionChange = (item: CartItem, option: SelectableOption, checked: boolean) => {
        if (option.can_select === false) return;

        const currentSelectedIds = getSelectedStorePackListIds(item);
        const selectionLimit = getSelectionLimit(item);
        const optionId = option.store_pack_list_id;
        let nextSelectedIds: Array<number | string> = currentSelectedIds;

        if (selectionLimit <= 1) {
            nextSelectedIds = checked ? [optionId] : [];
        } else if (checked) {
            if (!currentSelectedIds.includes(optionId) && currentSelectedIds.length >= selectionLimit) {
                notification.warning({
                    message: 'เลือกเกินจำนวนที่กำหนด',
                    description: `แพ็กนี้เลือกได้สูงสุด ${selectionLimit} รายการ`,
                    placement: 'topRight',
                });
                return;
            }

            nextSelectedIds = currentSelectedIds.includes(optionId)
                ? currentSelectedIds
                : [...currentSelectedIds, optionId];
        } else {
            nextSelectedIds = currentSelectedIds.filter((id) => id !== optionId);
        }

        updateMutation.mutate({
            cart_item_id: item.cart_item_id,
            selected_store_pack_list_ids: nextSelectedIds,
        });
    };

    const handleConfirmSelectionModal = () => {
        if (!selectionModalItem) return;

        updateMutation.mutate(
            {
                cart_item_id: selectionModalItem.cart_item_id,
                selected_store_pack_list_ids: draftSelectedOptionIds,
            },
            {
                onSuccess: () => setSelectionModalItemId(null),
            },
        );
    };

    // Handle Store Selection
    const handleSelectStore = (storeId: number, checked: boolean) => {
        const store = cartStores?.find(s => s.store_id === storeId);
        if (!store || !store.items) return;

        const promises = store.items.map(item => 
            updateCartItem(buildSelectionPayload(item, checked))
        );

        Promise.all(promises).then(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary() });
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.checkoutItems() });
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.checkoutAddress() });
        });
    };

    // Handle Select All
    const handleSelectAll = (checked: boolean) => {
        if (!allItems.length) return;
        const promises = allItems.map(item => 
            updateCartItem(buildSelectionPayload(item, checked))
        );
        
        Promise.all(promises).then(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary() });
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.checkoutItems() });
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.checkoutAddress() });
        });
    };

    const getSelectedOptionCover = React.useCallback((item: CartItem) => {
        const selectedOption = item.store_pack?.selectable_options?.find((option) => option.selected && option.item_img);
        return item.store_pack?.img || selectedOption?.item_img || item.book_cover || null;
    }, []);

    const renderCoverImage = React.useCallback((
        src: string | null | undefined,
        alt: string | undefined,
        className: string,
        badge?: string,
    ) => {
        const isDefaultCover = isMissingImageSrc(src);
        const displayCoverSrc = isDefaultCover
            ? DEFAULT_STORE_IMAGE
            : resolveStoreImageSrc(src, DEFAULT_STORE_IMAGE);

        return (
            <div className={`${className} relative flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm ${isDefaultCover ? 'bg-white p-2' : 'bg-gray-50'}`}>
                <AntImage
                    src={displayCoverSrc}
                    fallback={DEFAULT_STORE_IMAGE}
                    alt={alt || 'สินค้า'}
                    width="100%"
                    height="100%"
                    className={`!h-full !w-full ${isDefaultCover ? 'object-contain' : 'object-cover'}`}
                    style={{ width: '100%', height: '100%', objectFit: isDefaultCover ? 'contain' : 'cover' }}
                    preview={false}
                />
                {badge && !isDefaultCover && (
                    <div className="absolute inset-x-1 bottom-1 rounded-md bg-black/55 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white backdrop-blur-sm">
                        {badge}
                    </div>
                )}
            </div>
        );
    }, []);

    const renderSelectableOptions = (record: CartItem) => {
        const options = record.store_pack?.selectable_options;
        if (!record.store_pack?.is_selection || !Array.isArray(options) || options.length === 0) {
            return null;
        }

        const selectionLimit = getSelectionLimit(record);

        return (
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
                    <Text type="secondary" className="text-[11px]">
                        เลือกได้สูงสุด {selectionLimit} รายการ
                    </Text>
                    <span>เลือกแล้ว {draftSelectedOptionIds.length}/{selectionLimit}</span>
                </div>
                <div className="mt-2 grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {options.map((option) => {
                        const disabled = option.can_select === false || updateMutation.isPending;
                        const checked = draftSelectedOptionIds.includes(option.store_pack_list_id);
                        return (
                            <label
                                key={option.store_pack_list_id}
                                className={`flex min-w-0 items-start gap-3 rounded-xl border px-3 py-2.5 text-xs transition ${checked ? 'border-red-200 bg-red-50/80 shadow-sm' : 'border-gray-200 bg-white hover:border-red-100'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
                            >
                                <Checkbox
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={(event) => handleDraftSelectableOptionChange(record, option, event.target.checked)}
                                    className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-red-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-red-500 hover:[&_.ant-checkbox-inner]:!border-red-500"
                                />
                                {renderCoverImage(option.item_img, option.item_name, 'h-16 w-12')}
                                <span className="min-w-0 line-clamp-3 pt-1 leading-snug text-gray-800">{option.item_name}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderSelectedOptionsPreview = (record: CartItem) => {
        const options = record.store_pack?.selectable_options;
        if (!record.store_pack?.is_selection || !Array.isArray(options) || options.length === 0) {
            return null;
        }

        const selectionLimit = getSelectionLimit(record);
        const selectedOptions = options.filter((option) => option.selected);

        return (
            <div className="mt-3 rounded-xl border border-red-100 bg-red-50/40 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-600">เลือกแล้ว {selectedOptions.length}/{selectionLimit} รายการ</span>
                    <Button
                        size="small"
                        type="default"
                        onClick={() => setSelectionModalItemId(record.cart_item_id)}
                        className="rounded-full border-red-200 px-3 text-xs font-medium text-red-600 hover:!border-red-400 hover:!text-red-600"
                    >
                        เลือกรายการสินค้าใหม่
                    </Button>
                </div>
                {selectedOptions.length > 0 ? (
                    <div className="flex max-w-[420px] flex-col gap-2">
                        {selectedOptions.slice(0, 3).map((option) => (
                            <div key={option.store_pack_list_id} className="flex min-w-0 items-center gap-2 rounded-lg bg-white/85 p-2 ring-1 ring-red-100">
                                {renderCoverImage(option.item_img, option.item_name, 'h-12 w-9')}
                                <span className="min-w-0 flex-1 line-clamp-2 text-xs leading-snug text-gray-800">{option.item_name}</span>
                            </div>
                        ))}
                        {selectedOptions.length > 3 && (
                            <span className="text-xs text-gray-500">และอีก {selectedOptions.length - 3} รายการ</span>
                        )}
                    </div>
                ) : (
                    <Text type="secondary" className="text-xs">ยังไม่ได้เลือกรายการสินค้า</Text>
                )}
            </div>
        );
    };

    const columns = [
        {
            dataIndex: 'is_selected',
            key: 'is_selected',
            width: '5%',
            render: (checked: boolean, record: CartItem) => (
                <Checkbox 
                    checked={checked} 
                    onChange={(e) => handleSelectionChange(record, e.target.checked)}
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
                <div className="flex gap-4 items-start">
                    {renderCoverImage(
                        getSelectedOptionCover(record),
                        text,
                        'w-[86px] h-[116px]',
                        record.store_pack?.is_selection ? 'เลือกแล้ว' : undefined,
                    )}
                    <div className="flex min-w-0 flex-col">
                        <Text strong className="line-clamp-2">{text}</Text>
                        {renderSelectedOptionsPreview(record)}
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
                        <CurrencyIcon type={type} settings={settings} size={16} />
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
                         <CurrencyIcon type={type} settings={settings} size={16} />
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
                                                                        onChange={(e) => handleSelectionChange(item, e.target.checked)}
                                                                        className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-red-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-red-500 hover:[&_.ant-checkbox-inner]:!border-red-500"
                                                                    />
                                                                </div>
                                                                
                                                                {/* Image */}
                                                                {renderCoverImage(
                                                                    getSelectedOptionCover(item),
                                                                    item.book_name,
                                                                    'w-[74px] h-[104px] min-[380px]:w-[82px] min-[380px]:h-[116px]',
                                                                    item.store_pack?.is_selection ? 'เลือกแล้ว' : undefined,
                                                                )}

                                                                {/* Info */}
                                                                <div className="min-w-0 flex-1 flex flex-col justify-between">
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
                                                                                    <CurrencyIcon type={type} settings={settings} size={12} />
                                                                                    <Text>{Number(price).toLocaleString()}</Text>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <CurrencyIcon type={type} settings={settings} size={16} />
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
                                                            {renderSelectedOptionsPreview(item)}
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
                                                <CurrencyIcon type={curr.type} settings={settings} size={24} alt={curr.name} />
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

            <Modal
                title={selectionModalItem?.book_name || 'เลือกรายการสินค้า'}
                open={!!selectionModalItem}
                onCancel={() => setSelectionModalItemId(null)}
                footer={null}
                width={720}
                destroyOnHidden
            >
                {selectionModalItem && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 rounded-2xl bg-red-50/60 p-3">
                            {renderCoverImage(getSelectedOptionCover(selectionModalItem), selectionModalItem.book_name, 'h-20 w-16')}
                            <div className="min-w-0 flex-1">
                                <Text strong className="line-clamp-2 text-base">{selectionModalItem.book_name}</Text>
                                <Text type="secondary" className="mt-1 block text-xs">เลือกเรื่องที่ต้องการรับในแพ็กนี้</Text>
                            </div>
                        </div>
                        {renderSelectableOptions(selectionModalItem)}
                        <div className="flex items-center gap-3 pt-1">
                            <Button
                                block
                                size="large"
                                onClick={() => setSelectionModalItemId(null)}
                                className="rounded-xl font-bold"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                block
                                size="large"
                                type="primary"
                                danger
                                loading={updateMutation.isPending}
                                onClick={handleConfirmSelectionModal}
                                className="rounded-xl font-bold"
                            >
                                ยืนยันการเลือก
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            

        </div>
    );
}
