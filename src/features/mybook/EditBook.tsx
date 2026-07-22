"use client";
import Image from 'next/image';
import * as React from "react";
import { useEffect, useState } from "react";
import { Checkbox, Form, Input, Select, Modal, Slider, Spin, Upload, notification, Switch } from "antd";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import type { RcFile } from 'antd/es/upload/interface';
// import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";

// Import Components
import TextEditorTiny from "@/features/editor/components/TextEditorTiny";
import TrailerUploader from "./TrailerUploader";
import UploadCropBook from "@/components/upload/UploadBook";
import UploadCropBookBanner from "@/components/upload/UploadCropBookBanner";
import secureProxyClient from "@/services/secureProxyClient";
import GifLoader from '@/components/utility/GifLoader';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { sanitizeUserGeneratedHtml } from "@/utils/sanitizeHtml";
import {
    extractGifFrameAsFile,
    getGifFrameCount,
    isGifFile,
    isGifFrameSelectionSupported,
} from '@/utils/gifUtils';

// --- Constant Data ---
const novelType = [
    { label: 'นิยายแปล', value: 'tran', color: 'bg-rose-400' },
    // { label: 'นิยายแต่ง', value: 'write', color: 'bg-indigo-400' },
    // { label: 'แฟนฟิค', value: 'fanfic', color: 'bg-teal-400' },
];

// --- Interfaces ---
interface EditBookProps {
    bookId?: string;
}

interface Category {
    id: number | string;
    name: string;
    order_by: number | string;
}

interface BookFormValues {
    name: string;
    des: string;
    title: string;
    tag: string[] | string;
    type: string;
    cat1: number | string;
    cat2: number | string;
    rate: number;
    end: string;
    status: string;
    imgBook?: any;
    bgimg?: any;
    img_gif?: any;
    content_type?: 'novel' | 'novel_pack' | string;
    fast_ticket?: number | string;
    fast_coin?: number | string;
    fast_ticket_daily_increase?: number | string;
    fast_coin_daily_increase?: number | string;
    fast_ep_days?: number | string;
    [key: string]: any;
    
}

interface MyBookPermissionSuggestConfig {
    content_type: 'novel' | 'novel_pack' | string;
    fast_ticket?: number;
    fast_coin?: number;
    fast_ticket_daily_increase?: number;
    fast_coin_daily_increase?: number;
    fast_ep_days?: number;
}

interface MyBookPermissionData {
    set_content_type: boolean;
    set_fast_ticket: boolean;
    set_fast_coin: boolean;
    suggest_configs: MyBookPermissionSuggestConfig[];
}

const isGifArrayBuffer = (arrayBuffer: ArrayBuffer): boolean => {
    if (arrayBuffer.byteLength < 6) return false;
    const header = new Uint8Array(arrayBuffer.slice(0, 6));
    const signature = String.fromCharCode(...header);
    return signature === 'GIF87a' || signature === 'GIF89a';
};

const buildGifFilenameFromUrl = (url: string): string => {
    try {
        const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
        const rawName = parsed.pathname.split('/').pop() || 'book-cover';
        const decoded = decodeURIComponent(rawName).trim();
        if (!decoded) return `book-cover-${Date.now()}.gif`;

        const base = decoded.replace(/\.[a-z0-9]+$/i, '');
        return `${base || 'book-cover'}-source.gif`;
    } catch {
        return `book-cover-${Date.now()}.gif`;
    }
};

const EditBook: React.FC<EditBookProps> = ({ bookId }) => {
    // --- Setup Logic ---
    const params = useParams();
    const router = useRouter();
    // ใช้ ID จาก Props ถ้าไม่มีให้ใช้จาก URL Params
    const finalBookId = bookId || (params?.bookID as string);

    const [api, contextHolder] = notification.useNotification();
    const [formNewBook] = Form.useForm();
    const fastTicketValue = Form.useWatch('fast_ticket', formNewBook);
    const fastCoinValue = Form.useWatch('fast_coin', formNewBook);
    const { TextArea } = Input;

    const [openModal, setOpenModal] = useState<boolean>(false);
    const [spinLoading, setSpinLoading] = useState<boolean>(false);
    const [isBook, setIsBook] = useState<boolean>(false);

    // Preview Images
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imagePreviewBanner, setImagePreviewBanner] = useState<string | null>(null);
    const [gifPreview, setGifPreview] = useState<string | null>(null);
    const [gifSourceFile, setGifSourceFile] = useState<RcFile | null>(null);
    const [gifFramePickerOpen, setGifFramePickerOpen] = useState(false);
    const [gifFramePickerLoading, setGifFramePickerLoading] = useState(false);
    const [gifFrameCount, setGifFrameCount] = useState(1);
    const [gifFrameIndex, setGifFrameIndex] = useState(0);
    const [gifFramePreview, setGifFramePreview] = useState<string | null>(null);
    const [appliedGifFrameIndex, setAppliedGifFrameIndex] = useState(0);
    const ENABLE_GIF_UPLOAD = false;
    const [isFastUnlockEnabled, setIsFastUnlockEnabled] = useState<boolean>(false);

    const [category, setCategory] = useState<Category[]>([]);
    const [category1, setCategory1] = useState<Category[]>([]);
    const [category2, setCategory2] = useState<Category[]>([]);
    const [acceptBookCon, setAcceptBookCon] = useState<boolean>(true); // Default true สำหรับหน้า Edit
    const [initialStatus, setInitialStatus] = useState<string>('');
    const [permissions, setPermissions] = useState<MyBookPermissionData>({
        set_content_type: false,
        set_fast_ticket: false,
        set_fast_coin: false,
        suggest_configs: [],
    });
    const { settings: website, fetchSettings } = useWebsiteSettings();

    // --- Fetch Data (Logic ของ EditBook) ---
    useEffect(() => {
        const fetchData = async () => {
            if (!finalBookId) return;

            setSpinLoading(true);

            try {
                // Fetch 3 API พร้อมกัน
                await fetchSettings();
                const [catRes, bookRes, permissionRes] = await Promise.all([
                    secureProxyClient.get(`/category`),
                    secureProxyClient.get(`/user/mybook/${finalBookId}`),
                    secureProxyClient.get(`/user/mybook-permissions`)
                ]);

                const permissionData: MyBookPermissionData = {
                    set_content_type: Boolean(permissionRes.data?.data?.set_content_type),
                    set_fast_ticket: Boolean(permissionRes.data?.data?.set_fast_ticket),
                    set_fast_coin: Boolean(permissionRes.data?.data?.set_fast_coin),
                    suggest_configs: permissionRes.data?.data?.suggest_configs || [],
                };
                setPermissions(permissionData);

                // 1. จัดการ Category
                const cats = catRes.data?.data || [];
                setCategory(cats);

                if (cats.length > 0) {
                    const newCate = cats.filter((item: Category) => {
                        return ![0, 1, 2, 3, 4].includes(parseInt(item.order_by.toString()));
                    });
                    setCategory2(newCate);
                    setCategory1(cats); // Default cat1
                }

                // 2. จัดการ Book Data (แก้เรื่อง data.data ตามที่คุยกัน)
                const bookData = bookRes.data?.data;

                if (bookData) {
                    // Preview Images
                    if (bookData.img) setImagePreview(bookData.img);
                    if (bookData.bgimg) setImagePreviewBanner(bookData.bgimg);
                    const existingGifPreviewUrl = bookData.img_gif_full || bookData.img_gif;
                    const existingGifSourceUrl = bookData.img_gif_full || null;

                    if (existingGifPreviewUrl) {
                        setGifPreview(existingGifPreviewUrl);
                    }

                    if (existingGifSourceUrl) {
                        const sourceGifFile = await toGifRcFileFromUrl(existingGifSourceUrl);
                        if (sourceGifFile) {
                            const frameCount = await getGifFrameCount(sourceGifFile);
                            setGifSourceFile(sourceGifFile);
                            setGifFrameCount(frameCount);
                            setGifFrameIndex(0);
                            setAppliedGifFrameIndex(0);
                        } else {
                            setGifSourceFile(null);
                            setGifFrameCount(1);
                            setGifFrameIndex(0);
                            setAppliedGifFrameIndex(0);
                        }
                    } else {
                        setGifSourceFile(null);
                        setGifFrameCount(1);
                        setGifFrameIndex(0);
                        setAppliedGifFrameIndex(0);
                    }

                    // Handle Tags (String -> Array)
                    let tagValue = bookData.tag;
                    if (typeof tagValue === 'string') {
                        tagValue = tagValue.replace(/"/g, '').split(',');
                    }

                    setInitialStatus(bookData.status);

                    const hasFastUnlock = (bookData.fast_ticket && bookData.fast_ticket > 0) || (bookData.fast_coin && bookData.fast_coin > 0) || (bookData.fast_ticket_daily_increase && bookData.fast_ticket_daily_increase > 0) || (bookData.fast_coin_daily_increase && bookData.fast_coin_daily_increase > 0);
                    setIsFastUnlockEnabled(Boolean(hasFastUnlock));

                    // Set Form Values
                    formNewBook.setFieldsValue({
                        name: bookData.name,
                        title: bookData.title,
                        des: bookData.des,
                        tag: tagValue,
                        type: bookData.type,
                        cat1: bookData.cat1,
                        cat2: bookData.cat2,
                        rate: bookData.rate,
                        end: bookData.end,
                        status: bookData.status,
                        ...(permissionData.set_content_type ? { content_type: bookData.content_type || 'novel' } : {}),
                        ...(permissionData.set_fast_ticket ? { fast_ticket: bookData.fast_ticket ?? 0 } : {}),
                        ...(permissionData.set_fast_coin ? { fast_coin: bookData.fast_coin ?? 0 } : {}),
                        ...(permissionData.set_fast_ticket || permissionData.set_fast_coin ? {
                            fast_ticket_daily_increase: bookData.fast_ticket_daily_increase ?? 0,
                            fast_coin_daily_increase: bookData.fast_coin_daily_increase ?? 0,
                            fast_ep_days: bookData.fast_ep_days ?? 0,
                        } : {}),
                    });

                    // Filter หมวดหมู่ตาม Type ของหนังสือที่ดึงมา
                    if (bookData.type === 'tran') {
                        const tranCate = cats.filter((item: Category) => [0, 1, 2, 3, 4].includes(parseInt(item.order_by.toString())));
                        setCategory1(tranCate);
                    } else {
                        // กรณีอื่นใช้หมวดหมู่ปกติ (เหมือน category2) หรือทั้งหมด
                        const newCate = cats.filter((item: Category) => {
                            return ![0, 1, 2, 3, 4].includes(parseInt(item.order_by.toString()));
                        });
                        setCategory1(newCate);
                    }
                }

                setIsBook(true);

            } catch (error: any) {
                api.error({
                    message: "โหลดข้อมูลไม่สำเร็จ",
                    description: error.response?.data?.message || "ไม่สามารถดึงข้อมูลหนังสือได้"
                });
            } finally {
                setSpinLoading(false);
            }
        };

        fetchData();
    }, [finalBookId, formNewBook, api]);

    const resetFastUnlockDefaults = () => {
        formNewBook.setFieldsValue({
            fast_ticket: 0,
            fast_coin: 0,
            fast_ticket_daily_increase: 0,
            fast_coin_daily_increase: 0,
            fast_ep_days: 0,
        });
    };

    const applyFastUnlockConfig = (contentType: string, suggestConfigs: MyBookPermissionSuggestConfig[]) => {
        const config = suggestConfigs?.find(c => c.content_type === contentType);
        if (config) {
            formNewBook.setFieldsValue({
                fast_ticket: config.fast_ticket || 0,
                fast_coin: config.fast_coin || 0,
                fast_ticket_daily_increase: config.fast_ticket_daily_increase || 0,
                fast_coin_daily_increase: config.fast_coin_daily_increase || 0,
                fast_ep_days: config.fast_ep_days || 0,
            });
        } else {
            resetFastUnlockDefaults();
        }
    };

    const handleFastUnlockToggle = (checked: boolean) => {
        setIsFastUnlockEnabled(checked);
        if (!checked) {
            resetFastUnlockDefaults();
        } else {
            const currentContentType = formNewBook.getFieldValue('content_type') || 'novel';
            applyFastUnlockConfig(currentContentType, permissions.suggest_configs);
        }
    };

    const handleContentTypeChange = (val: string) => {
        if (isFastUnlockEnabled) {
            applyFastUnlockConfig(val, permissions.suggest_configs);
        } else {
            resetFastUnlockDefaults();
        }
    };

    // --- Event Handlers ---
    const handleSelectType = (type: string) => {
        if (type === 'tran') {
            const newCate = category?.filter((item) => {
                return [0, 1, 2, 3, 4].includes(parseInt(item.order_by.toString()));
            });
            setCategory1(newCate);
        } else {
            setCategory1(category2);
        }
    }

    const handleCheckboxChange = (e: CheckboxChangeEvent) => {
        setAcceptBookCon(e.target.checked);
    };

    // Keep the uploaded GIF as source, but render one selected frame as static cover image.
    const applyCoverFromGifFrame = async (file: RcFile, frameIndex: number) => {
        const coverFromGif = await extractGifFrameAsFile(file, frameIndex, {
            outputType: 'image/jpeg',
            quality: 0.82,
        });

        formNewBook.setFieldsValue({
            img_gif: file,
            img: coverFromGif,
        });

        const coverBlobUrl = URL.createObjectURL(coverFromGif);
        setImagePreview((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return coverBlobUrl;
        });
    };

    const closeGifFramePicker = () => {
        setGifFramePickerOpen(false);
        setGifFramePickerLoading(false);
        setGifFramePreview((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return null;
        });
    };

    // GIF upload flow:
    // 1) validate file type, 2) store original GIF, 3) auto-generate cover from frame 1,
    // 4) open frame picker when multiple frames are available.
    const handleGifBeforeUpload = async (file: RcFile) => {
        if (!isGifFile(file)) {
            api.error({ message: 'กรุณาอัปโหลดไฟล์ GIF เท่านั้น' });
            return Upload.LIST_IGNORE;
        }

        try {
            formNewBook.setFieldsValue({ img_gif: file });

            const gifBlobUrl = URL.createObjectURL(file);
            setGifPreview((prev) => {
                if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                return gifBlobUrl;
            });

            const frameCount = await getGifFrameCount(file);
            setGifSourceFile(file);
            setGifFrameCount(frameCount);
            setGifFrameIndex(0);
            setAppliedGifFrameIndex(0);
            await applyCoverFromGifFrame(file, 0);

            if (frameCount > 1 && isGifFrameSelectionSupported()) {
                setGifFramePickerOpen(true);
                api.success({
                    message: 'อัปโหลด GIF สำเร็จ',
                    description: 'เลือกเฟรมที่ต้องการใช้เป็นภาพปกได้เลย',
                });
            } else {
                api.success({
                    message: 'อัปโหลด GIF สำเร็จ',
                    description: 'ตั้งภาพปกจากเฟรมแรกให้อัตโนมัติแล้ว',
                });
            }
        } catch (error: any) {
            api.error({
                message: 'ไม่สามารถประมวลผล GIF ได้',
                description: error?.message || 'กรุณาลองใหม่อีกครั้ง',
            });
        }

        return false;
    };

    // Manual re-open for choosing another frame after upload/from existing GIF source.
    const handleOpenGifFramePicker = () => {
        if (!gifSourceFile) {
            api.info({
                message: 'ยังเลือกเฟรมจาก GIF เดิมไม่ได้',
                description: 'ไม่พบ img_gif_full หรือไฟล์ GIF ต้นฉบับถูกบล็อกจาก CORS กรุณาอัปโหลด GIF ใหม่เพื่อเลือกเฟรม',
            });
            return;
        }

        if (!isGifFrameSelectionSupported() || gifFrameCount <= 1) {
            api.info({
                message: 'ไม่สามารถเลือกเฟรมได้',
                description: 'ไฟล์นี้มีเฟรมเดียว หรือเบราว์เซอร์นี้ไม่รองรับการเลือกเฟรม GIF',
            });
            return;
        }

        setGifFrameIndex(appliedGifFrameIndex);
        setGifFramePickerOpen(true);
    };

    const handleApplySelectedGifFrame = async () => {
        if (!gifSourceFile) return;

        try {
            setGifFramePickerLoading(true);
            await applyCoverFromGifFrame(gifSourceFile, gifFrameIndex);
            setAppliedGifFrameIndex(gifFrameIndex);
            api.success({
                message: 'ตั้งภาพปกสำเร็จ',
                description: `ใช้เฟรมที่ ${gifFrameIndex + 1} เป็นภาพปกแล้ว`,
            });
            closeGifFramePicker();
        } catch (error: any) {
            api.error({
                message: 'ไม่สามารถตั้งภาพปกจากเฟรมนี้ได้',
                description: error?.message || 'กรุณาลองเลือกเฟรมใหม่',
            });
        } finally {
            setGifFramePickerLoading(false);
        }
    };

    const toGifRcFileFromUrl = async (url: string): Promise<RcFile | null> => {
        if (!url) return null;

        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
            });

            if (!response.ok) return null;

            const buffer = await response.arrayBuffer();
            const contentType = response.headers.get('content-type')?.toLowerCase() || '';
            const isGif = contentType.includes('gif') || isGifArrayBuffer(buffer);
            if (!isGif) return null;

            const gifFile = new File(
                [new Blob([buffer], { type: 'image/gif' })],
                buildGifFilenameFromUrl(url),
                {
                    type: 'image/gif',
                    lastModified: Date.now(),
                },
            );

            return gifFile as RcFile;
        } catch {
            return null;
        }
    };

    useEffect(() => {
        if (!gifFramePickerOpen || !gifSourceFile) return;

        const timer = window.setTimeout(async () => {
            try {
                setGifFramePickerLoading(true);
                const previewFile = await extractGifFrameAsFile(gifSourceFile, gifFrameIndex, {
                    outputType: 'image/jpeg',
                    quality: 0.82,
                });
                const previewUrl = URL.createObjectURL(previewFile);
                setGifFramePreview((prev) => {
                    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                    return previewUrl;
                });
            } catch {
                // preview error is non-blocking
            } finally {
                setGifFramePickerLoading(false);
            }
        }, 180);

        return () => window.clearTimeout(timer);
    }, [gifFramePickerOpen, gifSourceFile, gifFrameIndex]);

    useEffect(() => {
        return () => {
            if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
            if (gifPreview?.startsWith('blob:')) URL.revokeObjectURL(gifPreview);
            if (gifFramePreview?.startsWith('blob:')) URL.revokeObjectURL(gifFramePreview);
        };
    }, [imagePreview, gifPreview, gifFramePreview]);

    // --- Submit Logic (PUT) ---
    const onFinish = async (values: BookFormValues) => {
        if (!acceptBookCon) {
            api.error({ message: 'กรุณายอมรับเงื่อนไขการใช้บริการ' });
            return;
        }

        let finalFastTicket = isFastUnlockEnabled ? (values.fast_ticket || 0) : 0;
        let finalFastCoin = isFastUnlockEnabled ? (values.fast_coin || 0) : 0;
        let finalFastTicketDaily = isFastUnlockEnabled ? (values.fast_ticket_daily_increase || 0) : 0;
        let finalFastCoinDaily = isFastUnlockEnabled ? (values.fast_coin_daily_increase || 0) : 0;
        
        const hasFastUnlockPrice = Number(finalFastTicket) > 0 || Number(finalFastCoin) > 0;
        let finalFastEpDays = hasFastUnlockPrice ? (values.fast_ep_days || 0) : 0;

        const submitValues: BookFormValues = {
            ...values,
            fast_ticket: finalFastTicket,
            fast_coin: finalFastCoin,
            fast_ticket_daily_increase: finalFastTicketDaily,
            fast_coin_daily_increase: finalFastCoinDaily,
            fast_ep_days: finalFastEpDays,
        };

        console.group("🚀 Debug Edit Data");
        const formdata = new FormData();
        formdata.append("accept_conditions", "true");

        for (const key in submitValues) {
            let value = submitValues[key];
            let keyName = key;

            if (key === 'imgBook') keyName = 'img';
            if (key === 'bgimg') keyName = 'bgImg';

            if (value === undefined || value === null || value === '') continue;

            if (Array.isArray(value)) {
                formdata.append(keyName, value.join(','));
                continue;
            }

            if ((keyName === 'img' || keyName === 'bgImg' || keyName === 'img_gif')) {
                if (!(value instanceof File)) {
                    continue;
                }
            }

            const maxFileSize = keyName === 'img_gif' ? 10_000_000 : 2_000_000;
            if (value instanceof File && value.size > maxFileSize) {
                api.error({
                    message: keyName === 'img_gif'
                        ? 'ไฟล์ GIF ต้องมีขนาดไม่เกิน 10 MB'
                        : 'รูปภาพต้องมีขนาดไม่เกิน 2 MB'
                });
                console.groupEnd();
                return;
            }

            formdata.append(keyName, value);
        }
        console.groupEnd();

        setSpinLoading(true);

        try {
            const response = await secureProxyClient.put(`/user/mybook/${finalBookId}`, formdata, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });


            if (response.data.status === 'ok' || response.status === 200 || response.data.code === 200) {
                api.success({ message: 'แก้ไขนิยายสำเร็จ' });
                router.push('/w/mybook');
            } else {
                api.error({ message: 'แก้ไขไม่สำเร็จ', description: response.data.message });
            }

        } catch (error: any) {
            api.error({ message: 'เกิดข้อผิดพลาด', description: error.response?.data?.message || 'Network Error' });
        } finally {
            setSpinLoading(false);
        }
    }

    const showAdvancedConfig = permissions.set_content_type;
    const showFastUnlockConfig = permissions.set_fast_ticket || permissions.set_fast_coin;
    const showFastEpDays = (permissions.set_fast_ticket && Number(fastTicketValue || 0) > 0)
        || (permissions.set_fast_coin && Number(fastCoinValue || 0) > 0);
    const safeBookConditionsHtml = sanitizeUserGeneratedHtml(website?.book_conditions);

    // --- UI Render (เหมือน NewBook เป๊ะๆ) ---
    return (
        <div className="my-10 max-w-5xl mx-auto px-6">
            {contextHolder}
            {spinLoading ? (
                <GifLoader />
            ) : (
                <>
                    <Form
                        name="formEditBook"
                        autoComplete="off"
                        layout="vertical"
                        form={formNewBook}
                        className='fontFam'
                        onFinish={onFinish}
                    >
                        {isBook && (
                            <div>
                                <div className='flex flex-row justify-between mb-4'>
                                    <p className='text-2xl'>แก้ไขงานเขียน</p> {/* เปลี่ยน Title */}
                                </div>

                                <div className='grid md:grid-cols-7 gap-4 lg:gap-20 '>
                                    <div className="md:col-span-2">
                                        <div>
                                            <p className='body-text'>ภาพปกนิยาย <span className='text-[13px] text-gray-400'> (330 x 467) </span> </p>
                                            <Form.Item
                                                name="img"
                                                valuePropName="file"
                                                getValueFromEvent={(e: any) => e}
                                            >
                                                <UploadCropBook src={imagePreview} />
                                            </Form.Item>
                                        </div>
                                        {ENABLE_GIF_UPLOAD && (
                                        <div className="mt-4">
                                            <p className='body-text'>ภาพปกแบบ GIF <span className='text-[13px] text-gray-400'>(ไฟล์ GIF)</span></p>
                                            <Form.Item
                                                name="img_gif"
                                                valuePropName="file"
                                                getValueFromEvent={(e: any) => e?.file?.originFileObj || e?.file || null}
                                            >
                                                <Upload
                                                    accept=".gif,image/gif"
                                                    showUploadList={false}
                                                    maxCount={1}
                                                    beforeUpload={handleGifBeforeUpload}
                                                >
                                                    <div className="w-full rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3 cursor-pointer hover:border-red-400 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-14 w-10 rounded overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                                                                {gifPreview ? (
                                                                    <Image src={gifPreview} alt="GIF preview" fill className="object-cover" unoptimized />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400">GIF</div>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-600 leading-snug">
                                                                อัปโหลด GIF แล้วระบบจะดึงเฟรมแรกไปเป็นภาพปกอัตโนมัติ
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Upload>
                                            </Form.Item>
                                            {gifPreview && (
                                                <button
                                                    type="button"
                                                    onClick={handleOpenGifFramePicker}
                                                    className="mt-2 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                                                >
                                                    เลือกเฟรมใหม่
                                                </button>
                                            )}
                                        </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-5">
                                        <div>
                                            <p className='body-text'>ภาพแบนเนอร์ <span className='text-[13px] text-gray-400'> (1,240 x 567) </span> </p>
                                            <Form.Item
                                                name="bgimg"
                                                valuePropName="file"
                                                getValueFromEvent={(e: any) => e}
                                            >
                                                <UploadCropBookBanner src={imagePreviewBanner} />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className='body-text'>วิดีโอตัวอย่าง (Trailer) <span className='text-[13px] text-gray-400'>(ไฟล์ MP4/MOV)</span></p>
                                    <TrailerUploader 
                                        bookId={Number(finalBookId)}
                                        autoStart={true}
                                        mode="normal"
                                    />
                                </div>

                                <div className='grid gap-4'>
                                    <div className=''>
                                        <div>
                                            <span className='body-text'>ชื่อเรื่อง</span>
                                            <Form.Item
                                                name='name'
                                                rules={[{ type: 'string' }, { required: true, message: 'กรุณาระบุชื่อเรื่อง' }]}
                                            >
                                                <Input className='input' />
                                            </Form.Item>
                                        </div>

                                        <div>
                                            <span className='body-text'>คำโปรย</span>
                                            <Form.Item
                                                name='title'
                                                rules={[{ type: 'string' }, { required: true, message: 'กรุณาระบุข้อมูล' }]}
                                            >
                                                <TextArea className='input' />
                                            </Form.Item>
                                        </div>

                                        <div>
                                            <span className='body-text'>แท็กที่เกี่ยวข้อง</span>
                                            <Form.Item
                                                name='tag'
                                                rules={[{ type: 'array' }, { required: true, message: 'กรุณาระบุข้อมูล' }]}
                                            >
                                                <Select
                                                    mode='tags'
                                                    className="custom-select"
                                                    placeholder="แท็กที่เกี่ยวข้อง"
                                                    options={[
                                                        { label: "นิยายแปล", value: "นิยายแปล" },
                                                        { label: "ปลูกผัก", value: "ปลูกผัก" },
                                                        { label: "พระเอกเก่ง", value: "พระเอกเก่ง" },
                                                        { label: "นางเอกเก่ง", value: "นางเอกเก่ง" },
                                                    ]}
                                                />
                                            </Form.Item>
                                        </div>

                                        <div className='grid grid-cols-3 gap-4'>
                                            <div>
                                                <span className='body-text'>ประเภทนิยาย</span>
                                                <Form.Item name='type'>
                                                    <Select placeholder="Select an option" options={novelType} onChange={handleSelectType} />
                                                </Form.Item>
                                            </div>

                                            <div>
                                                <span className='body-text'>หมวดหมู่หลัก</span>
                                                <Form.Item name='cat1' rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}>
                                                    <Select placeholder="Select an option">
                                                        {category1 && category1.map((item, i) => (
                                                            <Select.Option key={i} value={item.id}>{item.name}</Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </div>

                                            <div>
                                                <span className='body-text'>หมวดหมู่รอง</span>
                                                <Form.Item name='cat2' rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}>
                                                    <Select placeholder="Select an option">
                                                        {category2 && category2.map((item, i) => (
                                                            <Select.Option key={i} value={item.id}>{item.name}</Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </div>

                                            <div>
                                                <span className='body-text'>เรตติ้ง</span>
                                                <Form.Item name='rate'>
                                                    <Select placeholder="Select an option">
                                                        <Select.Option value={1}>NC 18+</Select.Option>
                                                        <Select.Option value={3}>ไม่มี NC</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </div>

                                            <div>
                                                <span className='body-text'>สถานะ</span>
                                                <Form.Item name='end'>
                                                    <Select placeholder="Select an option">
                                                        <Select.Option value='end'>จบแล้ว</Select.Option>
                                                        <Select.Option value='not_end'>ยังไม่จบ</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </div>

                                            <div>
                                                <span className='body-text'>สถานะเผยแพร่</span>
                                                <Form.Item name='status'>
                                                    <Select placeholder="Select an option">
                                                        <Select.Option value='private'>ปิดเรื่อง</Select.Option>
                                                        <Select.Option value='publish' disabled={initialStatus === 'wait'}>เผยแพร่</Select.Option>
                                                        <Select.Option value='wait' disabled>รออนุมัติ</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {showAdvancedConfig && (
                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-1'>
                                        <div>
                                            <span className='body-text'>รูปแบบการอ่าน</span>
                                            <Form.Item name='content_type'>
                                                <Select
                                                    placeholder="Select content type"
                                                    onChange={(val) => handleContentTypeChange(val)}
                                                >
                                                    <Select.Option value='novel'>รายตอน</Select.Option>
                                                    <Select.Option value='novel_pack'>มัดแพ็ค</Select.Option>
                                                </Select>
                                            </Form.Item>
                                        </div>
                                    </div>
                                )}

                                {showFastUnlockConfig && (
                                    <div className='mt-6 rounded-lg border border-rose-100 bg-rose-50/40 p-4'>
                                        <div className='mb-4 flex items-center justify-between'>
                                            <h3 className='text-base font-semibold text-gray-800'>ฟีเจอร์ปลดล็อคล่วงหน้า</h3>
                                            <Switch 
                                                checked={isFastUnlockEnabled} 
                                                onChange={handleFastUnlockToggle} 
                                                checkedChildren="เปิด" 
                                                unCheckedChildren="ปิด"
                                            />
                                        </div>
                                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                            {permissions.set_fast_ticket && (
                                                <div>
                                                    <span className='body-text'>ราคาปลดล็อคตอนล่วงหน้าด้วยตั๋ว</span>
                                                    <Form.Item name='fast_ticket'>
                                                        <Input type='number' min={0} className='input' />
                                                    </Form.Item>
                                                </div>
                                            )}

                                            {permissions.set_fast_coin && (
                                                <div>
                                                    <span className='body-text'>ราคาตอนปลดล็อคตอนล่วงหน้าด้วยเหรียญ</span>
                                                    <Form.Item name='fast_coin'>
                                                        <Input type='number' min={0} className='input' />
                                                    </Form.Item>
                                                </div>
                                            )}

                                            <div>
                                                <span className='body-text'>เปิดอ่านล่วงหน้าได้กี่วัน</span>
                                                <Form.Item name='fast_ep_days'>
                                                    <Input
                                                        type='number'
                                                        min={0}
                                                        className='input'
                                                        disabled={!showFastEpDays}
                                                    />
                                                </Form.Item>
                                            </div>

                                            {permissions.set_fast_ticket && (
                                                <div>
                                                    <span className='body-text'>จำนวนตั๋วที่เพิ่มต่อวัน</span>
                                                    <Form.Item name='fast_ticket_daily_increase'>
                                                        <Input type='number' min={0} className='input' />
                                                    </Form.Item>
                                                </div>
                                            )}

                                            {permissions.set_fast_coin && (
                                                <div>
                                                    <span className='body-text'>จำนวนเหรียญที่เพิ่มต่อวัน</span>
                                                    <Form.Item name='fast_coin_daily_increase'>
                                                        <Input type='number' min={0} className='input' />
                                                    </Form.Item>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className=' gap-4'>
                                    <div>
                                        <span className='body-text'>เรื่องย่อ</span>
                                        <div className="h-[500px]">
                                            <Form.Item name='des'>
                                                <TextEditorTiny
                                                    height={400}
                                                    onChange={(content: string) => formNewBook.setFieldsValue({ des: content })}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center items-center mb-3">
                                    <Checkbox
                                        id="accept_conditions"
                                        checked={acceptBookCon}
                                        onChange={handleCheckboxChange}
                                        className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-red-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-red-500 [&_.ant-checkbox-wrapper:hover_.ant-checkbox-inner]:!border-red-500 [&_.ant-checkbox:hover_.ant-checkbox-inner]:!border-red-500"
                                    >
                                        <label htmlFor="accept_conditions" className="cursor-pointer">ยอมรับ </label>
                                    </Checkbox>
                                    <span onClick={() => setOpenModal(true)} className="text-primary font-bold cursor-pointer">เงื่อนไขการใช้บริการ</span>
                                </div>

                                <div className='grid grid-cols-1 p-0 '>
                                    <div className='flex justify-center p-0'>
                                        <button
                                            className='!text-white bg-red-500 px-12 py-2.5 rounded-full shadow-md hover:shadow-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 font-bold text-lg tracking-wide'
                                            type="submit"
                                        >
                                            บันทึกการแก้ไข
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Form>

                    {ENABLE_GIF_UPLOAD && (
                    <Modal
                        title="เลือกเฟรมจาก GIF"
                        open={gifFramePickerOpen}
                        onCancel={closeGifFramePicker}
                        onOk={handleApplySelectedGifFrame}
                        okText="ใช้เฟรมนี้เป็นภาพปก"
                        cancelText="ยกเลิก"
                        confirmLoading={gifFramePickerLoading}
                    >
                        <div className="space-y-4">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                <div className="mx-auto w-[180px] aspect-[330/467] rounded overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                                    {gifFramePreview ? (
                                        <Image src={gifFramePreview} alt="Selected frame preview" fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="text-xs text-gray-400">กำลังโหลดตัวอย่างเฟรม</div>
                                    )}
                                </div>
                                <p className="mt-2 text-center text-xs text-gray-500">
                                    เฟรมที่เลือก {gifFrameIndex + 1} / {gifFrameCount}
                                </p>
                            </div>

                            <div>
                                <Slider
                                    min={0}
                                    max={Math.max(0, gifFrameCount - 1)}
                                    step={1}
                                    value={gifFrameIndex}
                                    disabled={gifFramePickerLoading || gifFrameCount <= 1}
                                    onChange={(value) => setGifFrameIndex(Array.isArray(value) ? value[0] : value)}
                                />
                                <p className="text-xs text-gray-500">
                                    เลื่อนเลือกเฟรมที่ต้องการ แล้วกดปุ่ม "ใช้เฟรมนี้เป็นภาพปก"
                                </p>
                            </div>

                            {gifFramePickerLoading && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Spin size="small" />
                                    <span>กำลังประมวลผลเฟรม...</span>
                                </div>
                            )}
                        </div>
                    </Modal>
                    )}

                    <Modal title='' footer='' open={openModal} onCancel={() => setOpenModal(false)}>
                        <div>
                            <div dangerouslySetInnerHTML={{ __html: safeBookConditionsHtml }} />
                        </div>
                    </Modal>
                </>
            )}
        </div>
    )
}

export default EditBook;
