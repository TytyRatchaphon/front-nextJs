'use client'

import React, { useEffect, useState } from "react";
import { Checkbox, Form, Input, Select, Spin, Modal, notification } from "antd"; // เพิ่ม notification
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import axios from "axios"; 
import Cookies from "js-cookie"; 

// Import Components ที่คุณมีอยู่แล้ว
import TextEditorTiny from "@/components/editor/TextEditorTiny";
import UploadCropBook from "@/components/upload/UploadBook";
import UploadCropBookBanner from "@/components/upload/UploadCropBookBanner";

// --- 1. Constant Data ---
const novelType = [
  { label : 'นิยายแปล', value : 'tran', color : 'bg-rose-400' },
  { label : 'นิยายแต่ง', value : 'write', color : 'bg-indigo-400' },
  { label : 'แฟนฟิค', value : 'fanfic', color : 'bg-teal-400' },
];

// --- 2. Interfaces ---
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
  tag: string[];
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

const NewBook: React.FC = () => {
    // --- ใช้ notification แทน AlertError/AlertSuccess ---
    const [api, contextHolder] = notification.useNotification();

    const [formNewBook] = Form.useForm();
    const { TextArea } = Input;

    const [openModal, setOpenModal] = useState<boolean>(false);
    const [spinLoading, setSpinLoading] = useState<boolean>(false);
    const [isBook, setIsBook] = useState<boolean>(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imagePreviewBanner, setImagePreviewBanner] = useState<string | null>(null);
    
    // State สำหรับเก็บข้อมูลที่เคยอยู่ใน Context
    const [category, setCategory] = useState<Category[]>([]);
    const [website, setWebsite] = useState<WebsiteData | null>(null);

    const [category1, setCategory1] = useState<Category[]>([]);
    const [category2, setCategory2] = useState<Category[]>([]);
    const [acceptBookCon, setAcceptBookCon] = useState<boolean>(false);

    // Configs
    const IMAGE_BANNER_URL = process.env.NEXT_PUBLIC_IMAGE_BANNER_URL as string;
    const IMAGE_BOOK_URL = process.env.NEXT_PUBLIC_IMAGE_BOOK_URL as string;
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
    const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN || '';

    // --- Fetch Initial Data (แทนการใช้ Context) ---
    useEffect(() => {
        const fetchData = async () => {
            setSpinLoading(true);

            // ---------------------------------------------------------
            // 🔍 จุดที่ 1: เช็คค่า Env และ Token ก่อนยิง (สำคัญมาก!)
            // ---------------------------------------------------------
            console.group("🕵️‍♂️ Debug 1: ตรวจสอบค่าก่อนยิง API");
            
            const rawToken = Cookies.get('token') || localStorage.getItem('authToken');
            const rawAccessToken = ACCESS_TOKEN; // มาจาก process.env ด้านบน
            
            console.log("1. URL ที่จะยิง:", `${API_URL}/category`);
            console.log("2. Cookie Token:", rawToken ? `✅ มีค่า (${rawToken.substring(0, 10)}...)` : "❌ เป็นค่าว่าง (undefined/null)");
            console.log("3. Access Token (Env):", rawAccessToken ? "✅ มีค่า" : "❌ เป็นค่าว่าง (undefined/null)");
            
            // จำลองการสร้าง Header แบบเดียวกับที่จะใช้ยิง
            const encodedApiKey = typeof window !== 'undefined' 
                ? btoa(rawAccessToken) 
                : Buffer.from(rawAccessToken).toString('base64');
            
            const debugHeaders = {
                'Authorization': rawToken || '',
                'X-API-Key': encodedApiKey
            };
            console.log("4. Headers ที่จะส่งไป:", debugHeaders);
            console.groupEnd();
            // ---------------------------------------------------------


            try {
                // สร้าง Config จริง
                const config = {
                    headers: debugHeaders // ใช้ตัวเดียวกับที่ Log ด้านบน
                };

                // ยิง API
                const [catRes, webRes] = await Promise.all([
                    axios.get(`${API_URL}/category`, config), 
                    axios.get(`${API_URL}/get_website`, config)   
                ]);

                // ถ้าผ่านจะมาทำงานตรงนี้
                console.log("✅ Fetch Success:", catRes.data);

                const cats = catRes.data?.data || []; 
                const webData = webRes.data?.data || {};

                setCategory(cats);
                setWebsite(webData);
                
                if (cats.length > 0) {
                    const newCate = cats.filter((item: Category) => {
                        return ![0, 1, 2, 3, 4].includes(parseInt(item.order_by.toString()));
                    });
                    setCategory2(newCate);
                    setCategory1(cats);
                }

                setIsBook(true);
                setImagePreviewBanner(IMAGE_BOOK_URL);

                
                formNewBook.setFieldsValue({
                    status: 'publish',
                    rate: 3,
                    end: 'not_end',
                    type: 'tran',
                    des: '',
                    imgBook: '',
                    bgimg: '',
                });

            } catch (error: any) {
                // ---------------------------------------------------------
                // 🔍 จุดที่ 2: แกะกล่อง Error ดูไส้ใน (เมื่อเกิด 401)
                // ---------------------------------------------------------
                console.group("🔴 Debug 2: วิเคราะห์ Error 401");
                
                if (axios.isAxiosError(error)) {
                    console.log("❌ URL ที่เกิดเรื่อง:", error.config?.url);
                    console.log("❌ Headers ที่ส่งไปจริง:", error.config?.headers);
                    console.log("❌ Status Code:", error.response?.status);
                    console.log("❌ ข้อความจาก Server:", error.response?.data); // *จุดสำคัญ ดูว่า Server ด่าว่าอะไร
                } else {
                    console.error("❌ Error อื่นๆ:", error);
                }
                console.groupEnd();
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
    }, [formNewBook, IMAGE_BOOK_URL, API_URL, api, ACCESS_TOKEN]);

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


    // --- Logic การยิง API ---
    // --- Logic การยิง API + LOG ---
    const onFinish = async (values: BookFormValues) => {
        if (!acceptBookCon) {
            api.error({ message: 'กรุณายอมรับเงื่อนไขการใช้บริการ' });
            return;
        }

        console.group("🚀 Debug Form Data (ก่อนส่ง)");
        const formdata = new FormData();

        formdata.append("accept_conditions", "true"); 

        for (const key in values) {
            let value = values[key];
            let keyName = key;

            // แปลงชื่อ key
            if (key === 'imgBook') keyName = 'img'; 
            
            // 1. เช็คค่าว่าง: ถ้าไม่มีข้อมูล หรือเป็นค่าว่าง ให้ข้ามไปเลย (รวมถึงรูปที่ไม่อัปโหลดด้วย)
            if (value === undefined || value === null || value === '') {
                console.log(`⚠️ Skipping empty field: ${keyName}`);
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
                     console.log(`⚠️ Skipping non-file image (Existing URL): ${keyName}`);
                     continue; 
                }
            }

            // ถ้าหลุดมาถึงตรงนี้ แสดงว่าเป็นข้อมูลที่พร้อมส่ง (Text หรือ New File)
            formdata.append(keyName, value);

            // Log
            if (value instanceof File) {
                console.log(`📁 ${keyName}:`, value.name, `(${value.size} bytes)`);
            } else {
                console.log(`📝 ${keyName}:`, value);
            }

            // Validate ขนาดไฟล์
            if (value instanceof File && value.size > 2000000) {
                 api.error({ message: 'รูปภาพต้องขนาดไม่เกิน 2 MB' });
                 console.groupEnd();
                 return;
            }
        }
        console.groupEnd();

        setSpinLoading(true);

        try {
            const token = Cookies.get('token') || localStorage.getItem('authToken');
            const cleanToken = token ? token.replace(/^['"]+|['"]+$/g, '') : '';
            const encodedApiKey = typeof window !== 'undefined' 
                ? btoa(ACCESS_TOKEN) 
                : Buffer.from(ACCESS_TOKEN).toString('base64');

            const response = await axios.post(`${API_URL}/user/mybook`, formdata, {
                headers: {
                    'Authorization': cleanToken || '',
                    'X-API-Key': encodedApiKey
                }
            });
            
            console.log("✅ Server Response:", response.data);

            if (response.data.status === 'ok' || response.status === 200) {
                api.success({ message: 'เพิ่มนิยายสำเร็จ' });
                // Redirect ไปหน้าอื่น หรือ Reset Form ตรงนี้
            } else {
                api.error({ message: 'ทำรายการไม่สำเร็จ', description: response.data.message || 'เกิดข้อผิดพลาด' });
            }

        } catch (error: any) {
            console.error("❌ Submit Error:", error);
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

    return (
        <div className="my-10">
            {contextHolder} {/* แสดง Notification Holder */}
            <Spin spinning={spinLoading}>
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
                                            <TextEditorTiny height={400} onChange={(content: string) => formNewBook.setFieldsValue({ des: content })} />
                                        </Form.Item>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center items-center mb-3">
                                <Checkbox id="accept_conditions" checked={acceptBookCon} onChange={handleCheckboxChange}>
                                    <label htmlFor="accept_conditions">ยอมรับ </label>
                                </Checkbox>
                                <span onClick={() => setOpenModal(true)} className="text-primary font-bold cursor-pointer">เงื่อนไขการใช้บริการ</span>
                            </div>

                            <div className='grid grid-cols-1 p-0 '>
                                <div className='flex justify-center p-0'>
                                    <button className='text-md text-white bg-primary py-1 hover:border-secondary hover:bg-secondary hover:text-primary focus:outline-none fontFam md:text-xl' type="submit">บันทึก</button>
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

            </Spin>
        </div>
    )
}

export default NewBook;