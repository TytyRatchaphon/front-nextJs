'use client';

import React, { useEffect, useState } from "react";
import { Form, Input, Select, DatePicker, notification, Modal } from "antd";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

// Import TextEditor
import TextEditorTiny from "@/components/editor/TextEditorTiny";
import GifLoader from '@/components/utility/GifLoader';
import { fetchGroupEpisodes } from "@/services/apiServices";
import apiClient from '@/services/apiClient';

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
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN || '';

// --- Constants ---
const priceCoin = Array.from({ length: 11 }, (_, i) => ({
    label: i === 0 ? 'อ่านฟรี' : `${i} เหรียญ`,
    value: `${i}`
}));

const EditChapter: React.FC<EditChapterProps> = ({ epID }) => {
    const router = useRouter();
    const [api, contextHolder] = notification.useNotification();
    const [formEditChapter] = Form.useForm();

    const [groupName, setGroupName] = useState<string>('');
    const [spinLoading, setSpinLoading] = useState<boolean>(false);
    const [nextEpId, setNextEpId] = useState<string | number | null>(null);
    const [prevEpId, setPrevEpId] = useState<string | number | null>(null);

    // Modal Success
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>('แก้ไขตอนเรียบร้อยแล้ว');

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
                            publish: data.publish, // 'publish', 'draft'
                            order_by: data.order_by
                        });

                        // Fetch group episodes to find next episode
                        // Fetch group episodes to find next episode
                        if (data.group_id) {
                            try {
                                const groupResp: any = await fetchGroupEpisodes(String(data.group_id));
                                let episodes = groupResp?.episodes ?? groupResp?.list ?? [];
                                if (Array.isArray(episodes)) {
                                    // Filter out deleted episodes
                                    episodes = episodes.filter((e: any) => {
                                        const s = (e.publish ?? e.status ?? '').toString().toLowerCase();
                                        return s !== 'private' && s !== 'PRIVATE';
                                    });

                                    // Sort by order_by (ASC)
                                    episodes = episodes.sort((a: any, b: any) => (Number(a.order_by) || 0) - (Number(b.order_by) || 0));

                                    // Find current index
                                    const currentIndex = episodes.findIndex((e: any) =>
                                        String(e.ep_id ?? e.id ?? e.eid) === String(epID)
                                    );

                                    // Next Episode
                                    if (currentIndex !== -1 && currentIndex + 1 < episodes.length) {
                                        const nextEp = episodes[currentIndex + 1];
                                        const nextId = nextEp.ep_id ?? nextEp.id ?? nextEp.eid;
                                        setNextEpId(nextId);
                                    } else {
                                        setNextEpId(null);
                                    }

                                    // Previous Episode
                                    if (currentIndex > 0) {
                                        const prevEp = episodes[currentIndex - 1];
                                        const prevId = prevEp.ep_id ?? prevEp.id ?? prevEp.eid;
                                        setPrevEpId(prevId);
                                    } else {
                                        setPrevEpId(null);
                                    }
                                }
                            } catch (err) {
                                console.error("Failed to fetch group episodes for next button", err);
                            }
                        }
                    }
                } catch {
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
            // Correctly format publishDateTime using date and time from the DatePicker
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


            // ยิง PUT ไปที่ /user/mybook/ep/update
            const response = await apiClient.put(`/user/mybook/ep/update`, payload, {
                headers: getHeaders()
            });

            const resData = response.data;

            if (resData.status === 'success' || resData.code === 200) {
                if (resData.message) {
                    setSuccessMessage(resData.message);
                }
                setIsSuccessModalOpen(true);
            } else {
                api.error({
                    message: 'บันทึกการแก้ไขไม่สำเร็จ',
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

    const handleModalOk = () => {
        setIsSuccessModalOpen(false);
        router.refresh();
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
                                                onChange={() => { }}
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
                                    <div className='flex justify-center items-center gap-4 py-4'>
                                        {prevEpId && (
                                            <button
                                                type="button"
                                                className='group flex items-center gap-2 text-base text-gray-600 bg-white border border-gray-200 py-2.5 px-6 rounded-full hover:border-rose-500 hover:text-rose-600 hover:shadow-md transition-all duration-300'
                                                onClick={() => {
                                                    router.push(`/w/echapter/${prevEpId}`);
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
                                                    <path d="m15 18-6-6 6-6" />
                                                </svg>
                                                <span>ตอนก่อนหน้า</span>
                                            </button>
                                        )}

                                        <button
                                            className='flex items-center gap-2 text-lg !text-white bg-rose-600 py-2.5 px-8 rounded-full hover:bg-rose-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-medium'
                                            type="submit"
                                        >
                                            <span>บันทึกการแก้ไข</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                                <polyline points="17 21 17 13 7 13 7 21" />
                                                <polyline points="7 3 7 8 15 8" />
                                            </svg>
                                        </button>

                                        {nextEpId && (
                                            <button
                                                type="button"
                                                className='group flex items-center gap-2 text-base text-gray-600 bg-white border border-gray-200 py-2.5 px-6 rounded-full hover:border-rose-500 hover:text-rose-600 hover:shadow-md transition-all duration-300'
                                                onClick={() => {
                                                    router.push(`/w/echapter/${nextEpId}`);
                                                }}
                                            >
                                                <span>ตอนถัดไป</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                                                    <path d="m9 18 6-6-6-6" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Form>
                )}
            </div>
        </div>
    )
}

export default EditChapter;