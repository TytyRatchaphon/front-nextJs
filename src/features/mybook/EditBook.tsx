'use client'

import React, { useEffect, useState } from "react";
import { Checkbox, Form, Input, Select, Modal, notification } from "antd";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
// import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";

// Import Components
import TextEditorTiny from "@/components/editor/TextEditorTiny";
import UploadCropBook from "@/components/upload/UploadBook";
import UploadCropBookBanner from "@/components/upload/UploadCropBookBanner";
import apiClient from "@/services/apiClient";
import GifLoader from '@/components/utility/GifLoader';

// --- Constant Data ---
const novelType = [
    { label: 'นิยายแปล', value: 'tran', color: 'bg-rose-400' },
    { label: 'นิยายแต่ง', value: 'write', color: 'bg-indigo-400' },
    { label: 'แฟนฟิค', value: 'fanfic', color: 'bg-teal-400' },
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

interface WebsiteData {
    book_conditions: string;
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
    [key: string]: any;
}

const EditBook: React.FC<EditBookProps> = ({ bookId }) => {
    // --- Setup Logic ---
    const params = useParams();
    // const router = useRouter();
    // ใช้ ID จาก Props ถ้าไม่มีให้ใช้จาก URL Params
    const finalBookId = bookId || (params?.bookID as string);

    const [api, contextHolder] = notification.useNotification();
    const [formNewBook] = Form.useForm();
    const { TextArea } = Input;

    const [openModal, setOpenModal] = useState<boolean>(false);
    const [spinLoading, setSpinLoading] = useState<boolean>(false);
    const [isBook, setIsBook] = useState<boolean>(false);

    // Preview Images
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imagePreviewBanner, setImagePreviewBanner] = useState<string | null>(null);

    const [category, setCategory] = useState<Category[]>([]);
    const [website, setWebsite] = useState<WebsiteData | null>(null);

    const [category1, setCategory1] = useState<Category[]>([]);
    const [category2, setCategory2] = useState<Category[]>([]);
    const [acceptBookCon, setAcceptBookCon] = useState<boolean>(true); // Default true สำหรับหน้า Edit

    // Configs
    const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN || '';

    // --- Fetch Data (Logic ของ EditBook) ---
    useEffect(() => {
        const fetchData = async () => {
            if (!finalBookId) return;

            setSpinLoading(true);

            const encodedApiKey = typeof window !== 'undefined'
                ? btoa(ACCESS_TOKEN)
                : Buffer.from(ACCESS_TOKEN).toString('base64');

            const config = {
                headers: {
                    'X-API-Key': encodedApiKey
                }
            };

            try {
                // Fetch 3 API พร้อมกัน
                const [catRes, webRes, bookRes] = await Promise.all([
                    apiClient.get(`/category`, config),
                    apiClient.get(`/get_website`, config),
                    apiClient.get(`/user/mybook/${finalBookId}`, config)
                ]);

                // 1. จัดการ Category
                const cats = catRes.data?.data || [];
                const webData = webRes.data?.data || {};
                setCategory(cats);
                setWebsite(webData);

                if (cats.length > 0) {
                    const newCate = cats.filter((item: Category) => {
                        return ![0, 1, 2, 3, 4].includes(parseInt(item.order_by.toString()));
                    });
                    setCategory2(newCate);
                    setCategory1(cats); // Default cat1
                }

                // 2. จัดการ Book Data (แก้เรื่อง data.data ตามที่คุยกัน)
                const bookData = bookRes.data?.data; 
                console.log("Book Data Fetched:", bookData);

                if (bookData) {
                    // Preview Images
                    if (bookData.img) setImagePreview(bookData.img);
                    if (bookData.bgimg) setImagePreviewBanner(bookData.bgimg);

                    // Handle Tags (String -> Array)
                    let tagValue = bookData.tag;
                    if (typeof tagValue === 'string') {
                        tagValue = tagValue.replace(/"/g, '').split(',');
                    }

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
                console.error("Error fetching data:", error);
                api.error({
                    message: "โหลดข้อมูลไม่สำเร็จ",
                    description: error.response?.data?.message || "ไม่สามารถดึงข้อมูลหนังสือได้"
                });
            } finally {
                setSpinLoading(false);
            }
        };

        fetchData();
    }, [finalBookId, formNewBook, api, ACCESS_TOKEN]);

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

    // --- Submit Logic (PUT) ---
    const onFinish = async (values: BookFormValues) => {
        if (!acceptBookCon) {
            api.error({ message: 'กรุณายอมรับเงื่อนไขการใช้บริการ' });
            return;
        }

        console.group("🚀 Debug Edit Data");
        const formdata = new FormData();
        formdata.append("accept_conditions", "true");

        for (const key in values) {
            const value = values[key];
            let keyName = key;

            if (key === 'imgBook') keyName = 'img';
            if (key === 'bgimg') keyName = 'bgImg';

            if (value === undefined || value === null) continue;

            if (Array.isArray(value)) {
                // const quotedTags = value.map(t => `"${t}"`).join(',');
                formdata.append(keyName, value.join(',')); 
                continue;
            }

            if ((keyName === 'img' || keyName === 'bgImg')) {
                if (!(value instanceof File)) {
                    console.log(`⚠️ Skipping existing image URL: ${keyName}`);
                    continue;
                }
            }

            formdata.append(keyName, value);
        }
        console.groupEnd();

        setSpinLoading(true);

        try {
            const encodedApiKey = typeof window !== 'undefined'
                ? btoa(ACCESS_TOKEN)
                : Buffer.from(ACCESS_TOKEN).toString('base64');

            const response = await apiClient.put(`/user/mybook/${finalBookId}`, formdata, {
                headers: {
                    'X-API-Key': encodedApiKey,
                    // Content-Type for FormData is usually handled automatically by axios/browser, 
                    // but apiClient sets 'application/json' by default. 
                    // We should let axios set the boundary for FormData.
                    'Content-Type': 'multipart/form-data' 
                }
            });

            console.log("✅ Update Response:", response.data);

            if (response.data.status === 'ok' || response.status === 200 || response.data.code === 200) {
                api.success({ message: 'แก้ไขนิยายสำเร็จ' });
            } else {
                api.error({ message: 'แก้ไขไม่สำเร็จ', description: response.data.message });
            }

        } catch (error: any) {
            console.error("❌ Update Error:", error);
            api.error({ message: 'เกิดข้อผิดพลาด', description: error.response?.data?.message || 'Network Error' });
        } finally {
            setSpinLoading(false);
        }
    }

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
                                                    <Select.Option value='publish'>เผยแพร่</Select.Option>
                                                </Select>
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>
                            </div>

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

                <Modal title='' footer='' open={openModal} onCancel={() => setOpenModal(false)}>
                    <div>
                        <div dangerouslySetInnerHTML={{ __html: website?.book_conditions || '' }} />
                    </div>
                </Modal>
                </>
            )}
        </div>
    )
}

export default EditBook;