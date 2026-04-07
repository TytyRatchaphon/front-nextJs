'use client'

import React, { useEffect, useState } from "react";
import { Checkbox, Form, Input, Select, Modal, Slider, Spin, Upload, notification } from "antd"; // เพิ่ม notification
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import type { RcFile } from 'antd/es/upload/interface';
import axios from "axios";

// Import Components ที่คุณมีอยู่แล้ว
import TextEditorTiny from "@/components/editor/TextEditorTiny";
import UploadCropBook from "@/components/upload/UploadBook";
import UploadCropBookBanner from "@/components/upload/UploadCropBookBanner";
import GifLoader from '@/components/utility/GifLoader';

// --- 1. Constant Data ---
const novelType = [
    { label: 'นิยายแปล', value: 'tran', color: 'bg-rose-400' },
    { label: 'นิยายแต่ง', value: 'write', color: 'bg-indigo-400' },
    { label: 'แฟนฟิค', value: 'fanfic', color: 'bg-teal-400' },
];

// --- 2. Interfaces ---
interface Category {
    id: number | string;
    name: string;
    order_by: number | string;
}

interface BookFormValues {
    name: string;
    des: string;
    title: string;
    tag: string[];
    type: string;
    cat1: number | string;
    cat2: number | string;
    rate: number;
    end: string;
    status: string;
    imgBook?: any;
    bgimg?: any;
    img_gif?: any;
    [key: string]: any;
}

interface MyBookPermissionSuggestConfig {
    content_type: 'novel' | 'novel_pack' | string;
    fast_ticket?: number;
    fast_coin?: number;
}

interface MyBookPermissionData {
    set_content_type: boolean;
    set_fast_ticket: boolean;
    set_fast_coin: boolean;
    suggest_configs: MyBookPermissionSuggestConfig[];
}

import { useRouter } from "next/navigation";
import secureProxyClient from "@/services/secureProxyClient";
import { useWebsiteStore } from '@/stores/websiteStore';
import { sanitizeUserGeneratedHtml } from "@/utils/sanitizeHtml";
import {
    extractGifFrameAsFile,
    getGifFrameCount,
    isGifFile,
    isGifFrameSelectionSupported,
} from '@/utils/gifUtils';

// ... [Imports]

const NewBook: React.FC = () => {
    // --- ใช้ notification แทน AlertError/AlertSuccess ---
    const [api, contextHolder] = notification.useNotification();
    const router = useRouter();

    const [formNewBook] = Form.useForm();
    const { TextArea } = Input;

    const [openModal, setOpenModal] = useState<boolean>(false);
    const [spinLoading, setSpinLoading] = useState<boolean>(false);
    const [isBook, setIsBook] = useState<boolean>(false);
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
    const ENABLE_GIF_UPLOAD = true;

    // State สำหรับเก็บข้อมูลที่เคยอยู่ใน Context
    const [category, setCategory] = useState<Category[]>([]);
    const [category1, setCategory1] = useState<Category[]>([]);
    const [category2, setCategory2] = useState<Category[]>([]);
    const [acceptBookCon, setAcceptBookCon] = useState<boolean>(false);
    const [permissions, setPermissions] = useState<MyBookPermissionData>({
        set_content_type: false,
        set_fast_ticket: false,
        set_fast_coin: false,
        suggest_configs: [],
    });
    const { settings: website, fetchSettings } = useWebsiteStore();

    // Configs
    const IMAGE_BOOK_URL = process.env.NEXT_PUBLIC_IMAGE_BOOK_URL as string;

    const applySuggestConfig = (contentType: string, permissionData?: MyBookPermissionData) => {
        const source = permissionData || permissions;
        const matched = source.suggest_configs?.find((item) => item.content_type === contentType);
        if (!matched) return;

        const nextValues: Record<string, any> = {};
        if (source.set_fast_ticket && typeof matched.fast_ticket === 'number') {
            nextValues.fast_ticket = matched.fast_ticket;
        }
        if (source.set_fast_coin && typeof matched.fast_coin === 'number') {
            nextValues.fast_coin = matched.fast_coin;
        }

        if (Object.keys(nextValues).length > 0) {
            formNewBook.setFieldsValue(nextValues);
        }
    };

    // --- Fetch Initial Data (แทนการใช้ Context) ---
    useEffect(() => {
        const fetchData = async () => {
            setSpinLoading(true);

            // ---------------------------------------------------------
            // 🔍 จุดที่ 1: เช็คค่า Env และ Token ก่อนยิง (สำคัญมาก!)
            // ---------------------------------------------------------



            // จำลองการสร้าง Header แบบเดียวกับที่จะใช้ยิง
            // ---------------------------------------------------------


            try {
                // สร้าง Config จริง

                // ยิง API
                await fetchSettings();
                const [catRes, permissionRes] = await Promise.all([
                    secureProxyClient.get(`/category`),
                    secureProxyClient.get(`/user/mybook-permissions`),
                ]);

                // ถ้าผ่านจะมาทำงานตรงนี้

                const cats = catRes.data?.data || [];
                const permissionData: MyBookPermissionData = permissionRes?.data?.data || {
                    set_content_type: false,
                    set_fast_ticket: false,
                    set_fast_coin: false,
                    suggest_configs: [],
                };
                setCategory(cats);
                setPermissions(permissionData);

                if (cats.length > 0) {
                    const newCate = cats.filter((item: Category) => {
                        return ![0, 1, 2, 3, 4].includes(parseInt(item.order_by.toString()));
                    });
                    setCategory2(newCate);
                    setCategory1(cats);
                }

                setIsBook(true);
                setImagePreviewBanner(IMAGE_BOOK_URL);


                const defaultContentType = permissionData.set_content_type
                    ? permissionData.suggest_configs?.[0]?.content_type || 'novel'
                    : undefined;

                formNewBook.setFieldsValue({
                    status: 'publish',
                    rate: 3,
                    end: 'not_end',
                    type: 'tran',
                    des: '',
                    imgBook: '',
                    bgimg: '',
                    img_gif: '',
                    ...(defaultContentType ? { content_type: defaultContentType } : {}),
                });

                if (defaultContentType) {
                    applySuggestConfig(defaultContentType, permissionData);
                }

            } catch (error: any) {
                // ---------------------------------------------------------
                // 🔍 จุดที่ 2: แกะกล่อง Error ดูไส้ใน (เมื่อเกิด 401)
                // ---------------------------------------------------------

                if (axios.isAxiosError(error)) {
                    // *จุดสำคัญ ดูว่า Server ด่าว่าอะไร
                } else {
                }
                // ---------------------------------------------------------

                api.error({
                    message: "โหลดข้อมูลไม่สำเร็จ",
                    description: axios.isAxiosError(error)
                        ? `Code: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`
                        : "Unknown Error"
                });
            } finally {
                setSpinLoading(false);
            }
        };

        fetchData();
    }, [formNewBook, IMAGE_BOOK_URL, api]);

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

    // Manual re-open for choosing another frame after upload.
    const handleOpenGifFramePicker = () => {
        if (!gifSourceFile) {
            api.info({
                message: 'ยังไม่มีไฟล์ GIF',
                description: 'กรุณาอัปโหลด GIF ก่อนเลือกเฟรม',
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


    // --- Logic การยิง API ---
    // --- Logic การยิง API + LOG ---
    const onFinish = async (values: BookFormValues) => {
        if (!acceptBookCon) {
            api.error({ message: 'กรุณายอมรับเงื่อนไขการใช้บริการ' });
            return;
        }

        const formdata = new FormData();

        formdata.append("accept_conditions", "true");

        for (const key in values) {
            let value = values[key];
            let keyName = key;

            // แปลงชื่อ key
            if (key === 'imgBook') keyName = 'img';

            // 1. เช็คค่าว่าง: ถ้าไม่มีข้อมูล หรือเป็นค่าว่าง ให้ข้ามไปเลย (รวมถึงรูปที่ไม่อัปโหลดด้วย)
            if (value === undefined || value === null || value === '') {
                continue;
            }

            // 2. กรณี Array (เช่น tag)
            if (Array.isArray(value)) {
                value = value.join(',');
            }

            // 3. เช็คว่าเป็นรูปภาพหรือไม่
            if ((keyName === 'img' || keyName === 'bgimg')) {
                // ถ้ามีค่า แต่ไม่ใช่ File (เช่นเป็น URL string จากการดึงข้อมูลเก่ามา Edit)
                // เราจะไม่ส่งไป Backend (ถือว่าใช้รูปเดิม)
                if (!(value instanceof File)) {
                    continue;
                }
            }

            // ถ้าหลุดมาถึงตรงนี้ แสดงว่าเป็นข้อมูลที่พร้อมส่ง (Text หรือ New File)
            formdata.append(keyName, value);

            // Log
            if (value instanceof File) {
            } else {
            }

            // Validate ขนาดไฟล์
            const maxFileSize = keyName === 'img_gif' ? 10_000_000 : 2_000_000;
            if (value instanceof File && value.size > maxFileSize) {
                api.error({
                    message: keyName === 'img_gif'
                        ? 'ไฟล์ GIF ต้องมีขนาดไม่เกิน 10 MB'
                        : 'รูปภาพต้องขนาดไม่เกิน 2 MB'
                });
                return;
            }
        }

        setSpinLoading(true);

        try {
            const response = await secureProxyClient.post(`/user/mybook`, formdata, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            });


            if (response.data.status === 'ok' || response.status === 200) {
                api.success({ message: 'เพิ่มนิยายสำเร็จ' });
                // Redirect ไปหน้าอื่น หรือ Reset Form ตรงนี้
                router.push('/w/mybook');
            } else {
                api.error({ message: 'ทำรายการไม่สำเร็จ', description: response.data.message || 'เกิดข้อผิดพลาด' });
            }

        } catch (error: any) {
            if (error.response) {
                const serverMsg = error.response.data?.message || error.response.data?.error || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
                api.error({ message: 'เกิดข้อผิดพลาด', description: serverMsg });
            } else {
                api.error({ message: 'เกิดข้อผิดพลาด', description: 'Network Error' });
            }
        } finally {
            setSpinLoading(false);
        }
    }

    const safeBookConditionsHtml = sanitizeUserGeneratedHtml(website?.book_conditions);

    return (
        <div className="my-10">
            {contextHolder} {/* แสดง Notification Holder */}
            {spinLoading ? (
                <GifLoader />
            ) : (
                <Form
                    name="formNewBook"
                    autoComplete="off"
                    layout="vertical"
                    form={formNewBook}
                    className='fontFam'
                    onFinish={onFinish}
                >
                    {isBook && (
                        <div>
                            <div className='flex flex-row justify-between mb-4'>
                                <p className='text-2xl'>เพิ่มงานเขียน</p>
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
                                                                <img src={gifPreview} alt="GIF preview" className="h-full w-full object-cover" />
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
                                                    {category1 && category1.map((item, i) => (
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
                                                    <Select.Option value='publish'>เผยแพร่</Select.Option>
                                                </Select>
                                            </Form.Item>
                                        </div>
                                    </div>

                                    {(permissions.set_content_type || permissions.set_fast_ticket || permissions.set_fast_coin) && (
                                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-1'>
                                            {permissions.set_content_type && (
                                                <div>
                                                    <span className='body-text'>รูปแบบการอ่าน</span>
                                                    <Form.Item name='content_type'>
                                                        <Select
                                                            placeholder="Select content type"
                                                            onChange={(value: string) => applySuggestConfig(value)}
                                                        >
                                                            <Select.Option value='novel'>รายตอน</Select.Option>
                                                            <Select.Option value='novel_pack'>มัดแพ็ค</Select.Option>
                                                        </Select>
                                                    </Form.Item>
                                                </div>
                                            )}

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
                                                    <span className='body-text'>ราคาปลดล็อคตอนล่วงหน้าด้วยเหรียญ</span>
                                                    <Form.Item name='fast_coin'>
                                                        <Input type='number' min={0} className='input' />
                                                    </Form.Item>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className=' gap-4'>
                                <div>
                                    <span className='body-text'>เรื่องย่อ</span>
                                    <div className="h-[500px]">
                                        <Form.Item name='des'>
                                            <TextEditorTiny height={400} onChange={(content: string) => formNewBook.setFieldsValue({ des: content })} />
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
                                        บันทึก
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </Form>
            )}

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
                                <img src={gifFramePreview} alt="Selected frame preview" className="h-full w-full object-cover" />
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
        </div>
    )
}

export default NewBook;
