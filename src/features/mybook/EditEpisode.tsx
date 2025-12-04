'use client';

import React, { useEffect, useState } from "react";
import { Form, Input, Select, Spin, DatePicker, notification, Modal } from "antd";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import axios from "axios"; 
import Cookies from "js-cookie"; 
import { useRouter } from "next/navigation"; 

// Import TextEditor
import TextEditorTiny from "@/components/editor/TextEditorTiny";

dayjs.extend(customParseFormat);

// --- Interfaces ---
interface EditChapterProps {
    groupID: string | number;
    bookID?: string | number;
    epID?: string | number; // สำหรับ Edit ต้องมี epID เสมอ
}

interface ChapterFormValues {
    name: string;
    groupID: string | number;
    epID: string | number;
    coin: string;
    publishDate: dayjs.Dayjs;
    publishTime: string;
    detail: string;
    publish: string;
    order_by: string | number;
    bookID: string | number;
}

// Configs
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3331';
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN || '';

// --- Constants ---
const priceCoin = Array.from({ length: 11 }, (_, i) => ({
    label: i === 0 ? 'อ่านฟรี' : `${i} เหรียญ`,
    value: `${i}`
}));

const EditChapter: React.FC<EditChapterProps> = ({ groupID, bookID, epID }) => {
    const router = useRouter();
    const [api, contextHolder] = notification.useNotification();
    const [formEditChapter] = Form.useForm();
    
    const [groupName, setGroupName] = useState<string>('');
    const [spinLoading, setSpinLoading] = useState<boolean>(false);
    
    // Modal Success
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    // Style Variables
    const bodyTextStyle = 'mb-1 text-md';
    const inputStyle = 'input';

    // --- Helper: สร้าง Headers ---
    const getHeaders = () => {
        const token = Cookies.get('token') || localStorage.getItem('authToken');
        const cleanToken = token ? token.replace(/^['"]+|['"]+$/g, '') : '';
        
        const encodedApiKey = typeof window !== 'undefined' 
            ? btoa(ACCESS_TOKEN) 
            : Buffer.from(ACCESS_TOKEN).toString('base64');

        return {
            'Authorization': cleanToken || '',
            'X-API-Key': encodedApiKey
        };
    };
    
    // --- Fetch Existing Data (ดึงข้อมูลเดิมมาแสดง) ---
    useEffect(() => {
        const fetchData = async () => {
            if (epID) {
                setSpinLoading(true);
                try {
                    // GET ข้อมูลเดิม
                    const response = await axios.get(`${API_URL}/user/mybook/ep/${epID}`, { 
                        headers: getHeaders() 
                    });
                    const resData = response.data;

                    if (resData.code === 200 && resData.data) {
                        const data = resData.data;
                        setGroupName(data.groupName || '');
                        
                        // Set ข้อมูลเดิมลง Form
                        formEditChapter.setFieldsValue({
                            name: data.name,
                            groupID: data.group_id,
                            epID: data.ep_id,
                            bookID: data.book_id,
                            coin: String(data.coin ?? '0'),
                            publishDate: data.publish_datetime ? dayjs(data.publish_datetime) : dayjs(),
                            publishTime: data.publish_datetime ? dayjs(data.publish_datetime).format('HH:mm') : '00:00',
                            detail: data.detail || '',
                            publish: data.publish, // 'publish', 'draft'
                            order_by: data.order_by
                        });
                    }
                } catch (error) {
                    console.error("Error fetching EP:", error);
                    api.error({ message: "ไม่สามารถดึงข้อมูลตอนได้" });
                } finally {
                    setSpinLoading(false);
                }
            }
        };

        fetchData();
    }, [epID, formEditChapter, api]); // dependency เอาเฉพาะที่จำเป็น

    // --- Submit Form (UPDATE Logic) ---
    const onFinish = async (values: ChapterFormValues) => {
        setSpinLoading(true);
        try {
            // จัดการวันที่และเวลา
            const dateStr = values.publishDate ? values.publishDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
            const timeStr = values.publishTime || '00:00';
            const publishDateTime = `${dateStr} ${timeStr}:00`; 

            // เตรียม Payload ตาม Postman
            const payload = {
                ep_id: Number(epID), // **สำคัญ: ต้องส่ง ep_id ไปด้วยสำหรับ Update**
                name: values.name,
                detail: values.detail,
                coin: Number(values.coin || 0),
                order_by: Number(values.order_by || 1),
                publish_datetime: publishDateTime,
                // ถ้า API ต้องการ publish status ด้วย (ปกติควรส่ง)
                publish: values.publish || 'publish', 
            };

            console.log("Payload Sending:", payload);

            // ยิง PUT ไปที่ /user/mybook/ep/update
            const response = await axios.put(`${API_URL}/user/mybook/ep/update`, payload, {
                 headers: getHeaders()
            });
            
            const resData = response.data;

            if (resData.status === 'success' || resData.code === 200) {
                setIsSuccessModalOpen(true);
            } else {
                api.error({ 
                    message: 'บันทึกการแก้ไขไม่สำเร็จ', 
                    description: resData.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' 
                }); 
            }

        } catch (error: any) {
            console.error("❌ Submit Error:", error);
            const serverMsg = error.response?.data?.message || error.message;
            api.error({ 
                message: 'เกิดข้อผิดพลาด', 
                description: `ไม่สามารถบันทึกข้อมูลได้: ${serverMsg}` 
            });
        } finally {
            setSpinLoading(false);
        }
    }
    
    const handleModalOk = () => {
        setIsSuccessModalOpen(false);
        router.refresh(); 
        router.back();
    };

    return (
        <div className="my-5">
            {contextHolder}
            
            {/* Modal แจ้งเตือนสำเร็จ */}
            <Modal
                title={<div className="text-center text-lg font-bold text-green-600">บันทึกสำเร็จ</div>}
                open={isSuccessModalOpen}
                onOk={handleModalOk}
                onCancel={handleModalOk}
                centered
                okText="ตกลง"
                cancelButtonProps={{ style: { display: 'none' } }}
                okButtonProps={{ 
                    danger: true,
                    type: 'primary',
                    className: 'min-w-[100px]'
                }}
            >
                <div className="text-center py-4 text-base">
                    <p>แก้ไขตอนเรียบร้อยแล้ว</p>
                </div>
            </Modal>

            <div className="max-w-[840px] mx-auto px-4">
                <Spin spinning={spinLoading}>
                    <Form
                        name="formEditChapter"
                        autoComplete="off"
                        layout="vertical"
                        form={formEditChapter}
                        className='fontFam'
                        onFinish={onFinish}
                    >
                        <div> 
                            <p className="text-lg mb-3">
                                {/* เปลี่ยนข้อความเป็น แก้ไข */}
                                แก้ไขตอน {groupName ? `ในกลุ่ม "${groupName}"` : ''} (ID: {epID})
                            </p>
                            
                            <div className='grid gap-4'>
                                <div className='grid grid-cols-5 gap-4'>
                                    <div className='col-span-4'>
                                        <div>
                                            <p className={bodyTextStyle}>ชื่อตอน</p>
                                            <Form.Item
                                                name='name'
                                                rules={[{ type: 'string' }, { required: true, message: 'กรุณาระบุชื่อตอน' }]}
                                            >
                                                <Input className={inputStyle} />
                                            </Form.Item>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className={bodyTextStyle}>ลำดับ</p>
                                        <Form.Item
                                            name='order_by'
                                            rules={[{ required: true, message: 'ระบุลำดับ' }]}
                                        >
                                            <Input className={inputStyle} type="number" />
                                        </Form.Item>
                                    </div>
                                </div>

                                <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
                                    <div>
                                        <p className={bodyTextStyle}>ราคาขาย (เหรียญ)</p>
                                        <Form.Item name='coin'>
                                            <Select placeholder="เลือก" options={priceCoin} className="custom-select" />
                                        </Form.Item>
                                    </div>
                                            
                                    <div className="col-span-2">
                                        {/* เว้นว่างตาม Layout เดิม */}
                                    </div>
    
                                    <div className="custom-picker">
                                        <p className={bodyTextStyle}>วันที่เผยแพร่</p> 
                                        <Form.Item name='publishDate'>
                                            <DatePicker showTime className='w-full' style={{width: 315}} inputReadOnly={false} allowClear={false} />
                                        </Form.Item>
                                    </div>
                                </div>
                                
                                <div>
                                    <p className={bodyTextStyle}>เนื้อเรื่อง</p>
                                    <div className="h-[400px]">
                                        <Form.Item name='detail'>
                                            <TextEditorTiny 
                                                // ต้องมั่นใจว่า TextEditor รับ value และ onChange ถูกต้อง
                                                value={formEditChapter.getFieldValue('detail')}
                                                onChange={(content: string) => formEditChapter.setFieldsValue({ detail: content })} 
                                                height={400}
                                            />
                                        </Form.Item>
                                    </div>
                                </div>
                            </div>

                            {/* Hidden Fields */}
                            <Form.Item name='epID' hidden><Input /></Form.Item>
                            <Form.Item name='groupID' hidden><Input /></Form.Item>
                            <Form.Item name='bookID' hidden><Input /></Form.Item>
                            
                            <div className='grid grid-cols-1 p-0 mb-10 mt-8'> 
                                <div className='flex justify-center p-0'>
                                    <button 
                                        className='text-md text-white bg-primary py-1 px-8 h-auto hover:border-secondary hover:bg-secondary hover:text-primary focus:outline-none fontFam md:text-xl rounded' 
                                        type="submit"
                                    >
                                        บันทึกการแก้ไข
                                    </button>
                                </div>
                            </div> 
                        </div>
                    </Form>
                </Spin>
            </div>
        </div>
    )
}

export default EditChapter;