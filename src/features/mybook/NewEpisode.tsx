'use client';

import React, { useEffect, useState } from "react";
import { Form, Input, Select, DatePicker, notification, Modal } from "antd"; // ✨ เพิ่ม Modal
import type { Dayjs } from "dayjs";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation"; // ✨ เพิ่ม useRouter
import { fetchGroupEpisodes } from "@/services/apiServices";
import apiClient from '@/services/apiClient';

// Import TextEditor
import TextEditorTiny from "@/components/editor/TextEditorTiny";
import GifLoader from '@/components/utility/GifLoader';

dayjs.extend(customParseFormat);

// --- Interfaces ---
interface NewChapterProps {
    groupID: string | number;
    bookID?: string | number;
    epID?: string | number;
}

interface ChapterFormValues {
    name: string;
    groupID: string | number;
    epID: string | number;
    coin: string;
    publishDate: Dayjs;
    publishTime: string;
    detail: string;
    publish: string;
    order_by: string | number;
    bookID: string | number;
}

// Configs
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN || '';

// --- Constants ---
const priceCoin = Array.from({ length: 11 }, (_, i) => ({
    label: i === 0 ? 'อ่านฟรี' : `${i} เหรียญ`,
    value: `${i}`
}));

const NewChapter: React.FC<NewChapterProps> = ({ groupID, bookID, epID }) => {
    const router = useRouter(); // ✨ เรียกใช้ Router
    const [api, contextHolder] = notification.useNotification();
    const [formEditChapter] = Form.useForm();

    const [groupName, setGroupName] = useState<string>('');
    const [spinLoading, setSpinLoading] = useState<boolean>(false);

    // ✨ State สำหรับควบคุม Modal Success
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>('เพิ่มตอนใหม่เรียบร้อยแล้ว');

    // Style Variables
    const bodyTextStyle = 'mb-1 text-md';
    const inputStyle = 'input';

    // --- Helper: สร้าง Headers ---
    const getHeaders = () => {
        const token = Cookies.get('token');
        const cleanToken = token ? token.replace(/^['"]+|['"]+$/g, '') : '';

        const encodedApiKey = typeof window !== 'undefined'
            ? btoa(ACCESS_TOKEN)
            : Buffer.from(ACCESS_TOKEN).toString('base64');

        return {
            'Authorization': cleanToken || '',
            'X-API-Key': encodedApiKey
        };
    };

    // --- Fetch Group Data ---
    useEffect(() => {
        const fetchData = async () => {
            if (epID) {
                setSpinLoading(true);
                try {
                    const response = await apiClient.get(`/user/mybook/ep/${epID}`, {
                        headers: getHeaders()
                    });
                    const resData = response.data;

                    if (resData.code === 200 && resData.data) {
                        const data = resData.data;
                        setGroupName(data.groupName || '');

                        formEditChapter.setFieldsValue({
                            name: data.name,
                            groupID: data.group_id,
                            epID: data.ep_id,
                            bookID: data.book_id,
                            coin: String(data.coin ?? '0'),
                            publishDate: data.publish_datetime ? dayjs(data.publish_datetime) : dayjs(),
                            publishTime: data.publish_datetime ? dayjs(data.publish_datetime).format('HH:mm') : '00:00',
                            detail: data.detail || '',
                            publish: data.publish,
                            order_by: data.order_by
                        });
                    }
                } catch {
                } finally {
                    setSpinLoading(false);
                }
            } else if (groupID) {
                try {
                    const res = await fetchGroupEpisodes(groupID);
                    const episodes = res.episodes || [];
                    const maxOrder = episodes.reduce((max: number, ep: any) => Math.max(max, Number(ep.order_by || 0)), 0);

                    formEditChapter.setFieldsValue({
                        groupID: groupID,
                        bookID: bookID,
                        epID: '',
                        coin: '0',
                        publishDate: dayjs(),
                        publishTime: '00:00',
                        detail: '',
                        publish: 'publish',
                        order_by: maxOrder + 1
                    });
                } catch {
                    // Fallback
                    formEditChapter.setFieldsValue({
                        groupID: groupID,
                        bookID: bookID,
                        epID: '',
                        coin: '0',
                        publishDate: dayjs(),
                        publishTime: '00:00',
                        detail: '',
                        publish: 'publish', // Default to publish as requested
                        order_by: 1
                    });
                }
            }
        };

        fetchData();
    }, [groupID, bookID, epID, formEditChapter]);

    // --- Submit Form ---
    const onFinish = async (values: ChapterFormValues) => {
        setSpinLoading(true);
        try {
            // Correctly format publishDateTime using date and time from the DatePicker
            const dateStr = values.publishDate ? values.publishDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
            const timeStr = values.publishTime || '00:00';
            const publishDateTime = `${dateStr} ${timeStr}:00`;

            const payload: any = {
                group_id: groupID,
                book_id: bookID,
                name: values.name,
                detail: values.detail,
                coin: Number(values.coin || 0),
                order_by: Number(values.order_by || 1),
                publish_datetime: publishDateTime,
                publish: values.publish || 'publish', // Default to publish as requested
            };

            const response = await apiClient.post(`/user/mybook/ep`, payload, {
                headers: getHeaders()
            });

            const resData = response.data;

            if (resData.status === 'success' || resData.code === 200) {
                // ✨ เปลี่ยนจาก Notification เป็นเปิด Modal
                if (resData.message) {
                    setSuccessMessage(resData.message);
                }
                setIsSuccessModalOpen(true);
            } else {
                api.error({
                    message: 'บันทึกไม่สำเร็จ',
                    description: resData.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์'
                });
            }

        } catch (error: any) {
            const serverMsg = error.response?.data?.message || error.message;
            api.error({
                message: 'เกิดข้อผิดพลาด',
                description: `ไม่สามารถบันทึกข้อมูลได้: ${serverMsg}`
            });
        } finally {
            setSpinLoading(false);
        }
    }

    // ✨ ฟังก์ชันจัดการเมื่อกดปุ่ม "ตกลง" ใน Modal
    const handleModalOk = () => {
        setIsSuccessModalOpen(false);

        // สั่ง refresh ก่อน (สำหรับ App Router) แล้วค่อย back
        router.refresh();
        router.back();

        // หมายเหตุ: ถ้าต้องการ Hard Refresh จริงๆ (โหลดหน้าใหม่ทั้งหมด) ให้ใช้:
        // window.location.href = document.referrer; 
        // แต่ router.back() คือวิธีมาตรฐานของ Next.js ครับ
    };

    return (
        <div className="my-5">
            {contextHolder}


            <Modal
                title={<div className="text-center text-lg font-bold text-green-600">บันทึกสำเร็จ</div>}
                open={isSuccessModalOpen}
                onOk={handleModalOk}
                onCancel={handleModalOk} // กดปิด/กากบาท ก็ให้ทำงานเหมือนกดตกลง
                centered
                okText="ตกลง"
                cancelButtonProps={{ style: { display: 'none' } }} // ซ่อนปุ่ม Cancel
                okButtonProps={{
                    danger: true, // ✨ ทำให้ปุ่มเป็นสีแดง
                    type: 'primary',
                    className: 'min-w-[100px]' // จัดขนาดปุ่มหน่อยให้สวยงาม
                }}
            >
                <div className="text-center py-4 text-base">
                    <p>{successMessage}</p>
                </div>
            </Modal>

            <div className="max-w-[840px] mx-auto px-4">
                {spinLoading ? (
                    <GifLoader />
                ) : (
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
                                {epID ? 'แก้ไขตอน' : 'เพิ่มตอน'} {groupName ? `ในกลุ่ม "${groupName}"` : ''}
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
                                        <div className="flex gap-2">
                                            <Form.Item name='publishDate' className="mb-0">
                                                <DatePicker className='w-full' style={{ width: 180 }} inputReadOnly={false} allowClear={false} format="DD/MM/YYYY" />
                                            </Form.Item>
                                            <Form.Item
                                                name='publishTime'
                                                className="mb-0"
                                                rules={[
                                                    { required: true, message: 'ระบุเวลา' },
                                                    { pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, message: 'รูปแบบเวลาไม่ถูกต้อง (HH:mm)' }
                                                ]}
                                            >
                                                <Input
                                                    style={{ width: 100 }}
                                                    placeholder="HH:mm"
                                                    maxLength={5}
                                                    onChange={(e) => {
                                                        // Auto-format HH:mm
                                                        let value = e.target.value.replace(/\D/g, '');
                                                        if (value.length >= 3) {
                                                            value = value.slice(0, 2) + ':' + value.slice(2, 4);
                                                        }
                                                        formEditChapter.setFieldValue('publishTime', value);
                                                    }}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className={bodyTextStyle}>เนื้อเรื่อง</p>
                                    <div className="h-[400px]">
                                        <Form.Item name='detail'>
                                            <TextEditorTiny
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
                                        className='!text-white bg-red-500 px-12 py-2.5 rounded-full shadow-md hover:shadow-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 font-bold text-lg tracking-wide'
                                        type="submit"
                                    >
                                        บันทึก
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Form>
                )}
            </div>
        </div>
    )
}

export default NewChapter;
