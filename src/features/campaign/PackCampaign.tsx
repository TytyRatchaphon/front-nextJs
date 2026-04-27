"use client";
import { useState } from 'react';
import Image from 'next/image';
import { PackCampaignDetail, BookPromotionOption } from '@/types/api';
import { fetchBookPromotionOptions, buyGroupPromotion } from '@/services/apiServices';
import { useAuthStore } from '@/stores/authStore';
import '@/services/apiClient';
import PackCardBookHorizontal from '@/components/novelCard/PackCardBookHorizontal';
import PackCardBook from '@/components/novelCard/PackCardBook';
import { Modal, Button, Spin, ConfigProvider, notification } from 'antd';
import { CloseOutlined, CheckCircleFilled, CloseCircleFilled, ArrowLeftOutlined } from '@ant-design/icons';
import th_TH from 'antd/locale/th_TH';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { useUIStore } from '@/stores/uiStore';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { buildCoinEnjoyTopupUrl, navigateSafely } from '@/utils/navigationUtils';

interface PackCampaignProps {
    data: PackCampaignDetail | null;
}


function PackCampaign({ data }: PackCampaignProps) {
  const { settings } = useWebsiteSettings();
    const { updateToken, token, isLoggedIn } = useAuthStore();
    const openLoginModal = useUIStore((s) => s.openLoginModal);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [promotionOptions, setPromotionOptions] = useState<BookPromotionOption[]>([]);
    const [selectedBookName, setSelectedBookName] = useState('');

    // Confirm Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<BookPromotionOption | null>(null);

    // Mock Buy Flow
    const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'success' | 'failed'>('idle');

    if (!data) {
        return <div className="text-center py-20 text-gray-500">ไม่พบข้อมูลแคมเปญ</div>;
    }

    const handleBookClick = async (bookId: number, bookName: string) => {
        setLoadingOptions(true);
        setSelectedBookName(bookName);
        setIsModalOpen(true);
        try {
            const options = await fetchBookPromotionOptions(bookId);
            setPromotionOptions(options);
        } catch {
            notification.error({
                message: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดข้อมูลโปรโมชั่นได้',
                icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
                placement: 'topRight',
            });
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleBuyClick = (option: BookPromotionOption) => {
        if (!isLoggedIn) {
            setIsModalOpen(false);
            openLoginModal();
            return;
        }
        setSelectedOption(option);
        setIsModalOpen(false);
        setIsConfirmModalOpen(true);
        setPurchaseStatus('idle');
    };

    const confirmPurchase = async () => {
        if (!selectedOption) return;
        try {
            const payload = {
                dfb_id: selectedOption.promotion_data.dfb_id,
                payWith: selectedOption.promotion_data.currency || 'coin'
            };

            const res = await buyGroupPromotion(payload);

            if (res?.code === 200) {
                setPurchaseStatus('success');

                // Handle token update
                // Handle token update
                if (res?.data?.token) {
                    updateToken(res.data.token);
                }

                notification.success({
                    message: 'ซื้อสำเร็จ!',
                    description: 'ซื้อสำเร็จแล้ว',
                    icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                    placement: 'topRight',
                });
            } else {
                const errMsg = res?.message || 'ไม่สามารถทำการซื้อได้';
                notification.error({
                    message: 'ซื้อไม่สำเร็จ',
                    description: errMsg,
                    icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
                    placement: 'topRight',
                });
                setPurchaseStatus('failed');
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาดขณะซื้อ';
            notification.error({
                message: 'เกิดข้อผิดพลาด',
                description: msg,
                icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
                placement: 'topRight',
            });
            setPurchaseStatus('failed');
        }
    };

    return (
        <ConfigProvider locale={th_TH}>
            <div className="min-h-screen bg-gray-50 pb-20">
                {/* Banner Section */}
                <div className="w-full max-w-[1240px] mx-auto relative px-0 md:pt-6">
                    {data.banner_img ? (
                        <Image
                            src={data.banner_img}
                            alt={data.name}
                            width={1180}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto block rounded-none md:rounded-xl shadow-sm"
                            priority
                            
                        />
                    ) : (
                        <div className="w-full aspect-[4/1] bg-gray-200 flex items-center justify-center text-gray-400 rounded-none md:rounded-xl">
                            No Banner
                        </div>
                    )}
                </div>

                <div className="container mx-auto px-4 max-w-7xl relative z-10 mt-6">
                    {/* Books Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6 justify-items-center">
                        {data.books.map((book) => (
                            <PackCardBook
                                key={book.book_id}
                                book={book}
                                onClick={() => handleBookClick(book.book_id!, book.name!)}
                            />
                        ))}
                    </div>
                    {data.books.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                            <div className="text-gray-400 text-lg">ยังไม่มีรายการหนังสือในแคมเปญนี้</div>
                        </div>
                    )}
                </div>

                {/* Promotion Options Modal */}
                <Modal
                    title={null}
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    footer={null}
                    width={600}
                    style={{ maxWidth: '95vw' }}
                    centered
                    zIndex={5000}
                    closeIcon={<CloseOutlined className="text-gray-500 text-xl" />}
                    destroyOnHidden
                    className="pack-modal"
                >
                    <div className="mb-6 pt-2">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">เหมาทั้งเรื่อง</h2>
                        <div className="text-gray-600 font-medium text-base">{selectedBookName}</div>
                    </div>

                    {loadingOptions ? (
                        <div className="flex justify-center py-10"><Spin size="large" /></div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {promotionOptions.map((option, index) => {
                                // Transform Option to Book-like object
                                const cardBookProp: any = {
                                    ...option,
                                    book_id: option.book_id,
                                    name: option.name,
                                    img: option.img,
                                    view: option.view,
                                    chapter: option.chapter,
                                    tag: option.tag,
                                    discount: option.discount,
                                    title: option.title,
                                    // Ensure writer is passed if available in option, or user needs to ensure API provides it
                                };


                                return (
                                    <PackCardBookHorizontal
                                        key={index}
                                        book={cardBookProp}
                                        className="border border-gray-100 shadow-sm hover:shadow-md"
                                        onClick={() => { }}
                                        action={
                                            (option.user?.user_owned_count === option.global?.global_paid_chapter_count) ? (
                                                <div className="flex items-center justify-end w-full h-9">
                                                    <div className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full text-sm border border-green-200">
                                                        <CheckCircleFilled />
                                                        <span>เป็นเจ้าของแล้ว</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap items-center justify-between w-full gap-2">
                                                    <div className="flex items-baseline gap-2">
                                                        <div className="flex items-center text-[#E60000] font-bold text-lg">
                                                            <div className="w-5 h-5 rounded-full bg-[#FFD700] flex items-center justify-center mr-1 text-[10px] text-white shadow-sm border border-yellow-400">C</div>
                                                            {option.user?.user_price?.toLocaleString() ?? 0}
                                                        </div>
                                                        <div className="text-gray-400 text-xs">
                                                            <span className="line-through">{option.user?.user_full_price?.toLocaleString() ?? 0}</span>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type="primary"
                                                        danger
                                                        className="bg-[#E60000] hover:bg-red-700 border-none rounded-lg h-9 px-4 font-medium shadow-sm transition-transform hover:scale-105 ml-auto sm:ml-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleBuyClick(option);
                                                        }}
                                                    >
                                                        ซื้อเลย
                                                    </Button>
                                                </div>
                                            )
                                        }
                                    />
                                );
                            })}
                            {promotionOptions.length === 0 && (
                                <div className="text-center py-10 text-gray-400">ยังไม่มีโปรโมชั่นสำหรับเรื่องนี้</div>
                            )}
                        </div>
                    )}
                </Modal>

                {/* Confirm / Success Modal */}
                <Modal
                    open={isConfirmModalOpen}
                    onCancel={() => {
                        setIsConfirmModalOpen(false);
                        setPurchaseStatus('idle');
                    }}
                    footer={null}
                    centered
                    zIndex={5000}
                    width={600}
                    style={{ maxWidth: '95vw' }}
                    closable={true}
                >
                    {purchaseStatus === 'idle' && selectedOption && (
                        <div className="pt-2 relative">
                            <ArrowLeftOutlined
                                className="absolute left-0 top-1 text-xl text-gray-500 cursor-pointer hover:text-gray-800 transition-colors"
                                onClick={() => {
                                    setIsConfirmModalOpen(false);
                                    setIsModalOpen(true);
                                }}
                            />
                            <h3 className="text-xl font-bold mb-6 text-center">ยืนยันการซื้อ</h3>

                            <PackCardBookHorizontal
                                book={{
                                    ...selectedOption,
                                    book_id: selectedOption.book_id,
                                    name: selectedOption.name,
                                    img: selectedOption.img,
                                    view: selectedOption.view,
                                    chapter: selectedOption.chapter,
                                    tag: selectedOption.tag,
                                    discount: selectedOption.discount,
                                    title: selectedOption.title,
                                }}
                                className="border border-gray-100 shadow-sm mb-6"
                                onClick={() => { }}
                                action={
                                    <div className="flex items-center gap-2 text-[#00C853] text-sm font-medium mt-2">
                                        <CheckCircleFilled />
                                        <span>มีตอนอยู่แล้ว {selectedOption.user.user_owned_count?.toLocaleString()} ตอน จากทั้งหมด {selectedOption.global?.global_paid_chapter_count?.toLocaleString()} ตอน</span>
                                    </div>
                                }
                            />

                            <div className="bg-gray-50 p-4 rounded-lg mb-6 flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">ราคาทั้งหมด</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[#FFD700] font-bold text-lg flex items-center gap-2"><Image src={settings?.coin || '/images/e-coin.png'} width={20} height={20} alt="coin" unoptimized /> {selectedOption.user.user_price.toLocaleString()}</span>
                                    <span className="text-gray-400 text-xs line-through">{selectedOption.user.user_full_price.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg mb-6 text-xs text-gray-500">
                                <span>เหรียญปัจจุบันของคุณ</span>
                                <span className="font-bold text-gray-700 flex items-center gap-2"><Image src={settings?.coin || '/images/e-coin.png'} width={20} height={20} alt="coin" unoptimized /> {selectedOption.user.user_coin.toLocaleString()}</span>
                            </div>

                            <div className="flex gap-3">
                                <Button size="large" block className="rounded-lg h-10 hover:!text-red-500 hover:!border-red-500 transition-colors" onClick={() => setIsConfirmModalOpen(false)}>ยกเลิก</Button>
                                <Button size="large" block type="primary" danger className="rounded-lg h-10 bg-[#E60000]" onClick={confirmPurchase}>ยืนยันการชำระเงิน</Button>
                            </div>
                        </div>
                    )}

                    {purchaseStatus === 'success' && selectedOption && (
                        <div className="text-center pt-4 pb-2">
                            <CheckCircleFilled className="text-5xl text-[#00C853] mb-4" />
                            <h3 className="text-xl font-bold mb-2">ชำระเงินสำเร็จ</h3>
                            <p className="text-gray-600 mb-6">คุณได้รับตอนทั้งหมด <span className="text-red-500 font-bold">&quot;{selectedOption.user.user_chapter_received.toLocaleString()} ตอน&quot;</span> เรียบร้อยแล้ว</p>

                            <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3 text-left mb-6">
                                <div className="relative w-12 h-16 flex-shrink-0">
                                    <Image src={selectedOption.img} alt="" fill className="object-cover rounded" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold line-clamp-1">{selectedOption.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500 md:w-4 md:h-4">
                                            <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        {selectedOption.chapter} ตอน</div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button type="primary" danger size="large" block className="bg-[#E60000] h-10" onClick={() => navigateSafely(`/book/${selectedOption.book_id}`)}>อ่านต่อเลย</Button>
                                <Button size="large" block className="h-10 hover:!text-red-500 hover:!border-red-500 transition-colors" onClick={() => { setIsConfirmModalOpen(false); setPurchaseStatus('idle'); }}>เลือกซื้อต่อ</Button>
                            </div>
                        </div>
                    )}

                    {purchaseStatus === 'failed' && selectedOption && (
                        <div className="text-center pt-4 pb-2">
                            <CloseCircleFilled className="text-5xl text-red-500 mb-4" />
                            <h3 className="text-xl font-bold mb-2">ชำระเงินไม่สำเร็จ</h3>
                            <p className="text-gray-600 mb-6">เหรียญไม่เพียงพอ <span className="text-[#FFD700] font-bold flex items-center gap-2 justify-center">ขาดอีก <Image src={settings?.coin || '/images/e-coin.png'} width={20} height={20} alt="coin" unoptimized /> {(selectedOption.user.user_price - selectedOption.user.user_coin).toLocaleString()}</span></p>

                            <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3 text-left mb-6">
                                <div className="relative w-12 h-16 flex-shrink-0">
                                    <Image src={selectedOption.img} alt="" fill className="object-cover rounded" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold line-clamp-1">{selectedOption.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500 md:w-4 md:h-4">
                                            <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        {selectedOption.chapter} ตอน</div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    type="primary"
                                    danger
                                    size="large"
                                    block
                                    className="bg-[#E60000] h-10"
                                    onClick={() => {
                                        const topupUrl = buildCoinEnjoyTopupUrl(token);
                                        navigateSafely(topupUrl, { allowExternal: true });
                                    }}
                                >
                                    เติมเหรียญ
                                </Button>
                                <Button size="large" block className="h-10 hover:!text-red-500 hover:!border-red-500 transition-colors" onClick={() => { setIsConfirmModalOpen(false); setPurchaseStatus('idle'); }}>เลือกซื้อต่อ</Button>
                            </div>
                        </div>
                    )}
                </Modal>

                <style jsx global>{`
                    .clip-path-ribbon {
                       clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
                    }
                `}</style>
            </div>
        </ConfigProvider>
    );
}

export default PackCampaign;
