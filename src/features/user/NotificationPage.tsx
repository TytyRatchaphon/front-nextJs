"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/apiServices';
import { Empty, Avatar, List, Tooltip, Button, Tag, Pagination } from 'antd';
import { BellOutlined, CheckOutlined, BookOutlined, MessageOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';
import GifLoader from '@/components/utility/GifLoader';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

dayjs.extend(relativeTime);
dayjs.locale('th');

interface NotificationType {
    noti_type_id: number;
    category: string;
    type: 'book_new' | 'book_update' | 'system' | 'comment_book_id' | 'comment_ep_id' | 'comment_sub_book_id' | 'comment_sub_ep_id';
    book_id?: number;
    ep_id?: number;
    comment_id?: number;
    title: string;
    subtitle: string;
    message?: string;
    image?: string;
    url?: string;
    status: string;
    scheduled_at?: string;
    create_at: string;
}

interface NotificationItem {
    id: number;
    user_id: number;
    noti_type_id: number;
    readed: 'Y' | 'N';
    create_at: string;
    update_at: string;
    NotiType: NotificationType;
}

import { useAuthStore } from '@/stores/authStore';

const NotificationPage: React.FC = () => {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [page, setPage] = useState(1);

    React.useEffect(() => {
        if (!token) {
            router.push('/');
        }
    }, [token, router]);

    // We fetch with pagination now
    const { data, isLoading } = useQuery({
        queryKey: ['allNotifications', page],
        queryFn: () => fetchAllNotifications(page, 20),
        refetchInterval: 30000,
    });

    const notifications = data?.notifications || [];
    const pagination = data?.pagination;

    const markReadMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            // In full page, we define if we want to remove or just mark as read. 
            // Typically in full history we just mark as read.
            queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
            queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
            queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
        }
    });

    const handleNotificationClick = async (item: NotificationItem) => {
        if (item.readed === 'N') {
            markReadMutation.mutate(item.id);
        }

        if (item.NotiType.url) {
            window.location.href = item.NotiType.url;
        } else {
            const { type, book_id, ep_id } = item.NotiType;
            if (type === 'book_new' || type === 'book_update' || type === 'comment_book_id') {
                if (book_id) router.push(`/book/${book_id}`);
            } else if (type === 'comment_ep_id' || type === 'comment_sub_ep_id') {
                if (book_id && ep_id) router.push(`/read/${book_id}/${ep_id}`);
            }
        }
    };

    const handleMarkAllRead = () => {
        markAllReadMutation.mutate();
    };

    const getIconByType = (type: string) => {
        switch (type) {
            case 'book_new': return <BookOutlined />;
            case 'book_update': return <BookOutlined />;
            case 'system': return <InfoCircleOutlined />;
            case 'comment_book_id':
            case 'comment_ep_id':
            case 'comment_sub_book_id':
            case 'comment_sub_ep_id': return <MessageOutlined />;
            default: return <BellOutlined />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'book_new': return { text: 'เรื่องใหม่', color: 'green' };
            case 'book_update': return { text: 'ตอนใหม่', color: 'blue' };
            case 'system': return { text: 'ระบบ', color: 'red' };
            case 'comment_book_id':
            case 'comment_ep_id':
            case 'comment_sub_book_id':
            case 'comment_sub_ep_id': return { text: 'ความคิดเห็น', color: 'orange' };
            default: return { text: 'แจ้งเตือน', color: 'default' };
        }
    };

    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const toggleExpand = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="w-full h-[500px] flex justify-center items-center">
                <GifLoader width={150} height={150} />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 m-0">การแจ้งเตือนทั้งหมด</h1>
                    <p className="text-gray-500 text-sm mt-1">จัดการและดูประวัติการแจ้งเตือนของคุณ</p>
                </div>
                {notifications && notifications.some((n: any) => n.readed === 'N') && (
                    <Button
                        className="rounded-full hover:bg-red-50 hover:text-red-500 border-gray-200"
                        onClick={handleMarkAllRead}
                        loading={markAllReadMutation.isPending}
                        icon={<CheckOutlined />}
                    >
                        อ่านทั้งหมด
                    </Button>
                )}
            </div>

            {/* List */}
            {!notifications || notifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-3xl opacity-30">
                        <BellOutlined />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600">ไม่มีการแจ้งเตือน</h3>
                    <p className="text-sm">คุณยังไม่มีการแจ้งเตือนใดๆ ในขณะนี้</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {notifications.map((item: any) => { // Using any for mapping to be safe with DB variations
                        const typeInfo = getTypeLabel(item.NotiType.type);
                        const isSystem = item.NotiType.type === 'system';
                        const isExpanded = expandedIds.has(item.id);

                        return (
                            <div
                                key={item.id}
                                className={`group relative px-5 py-5 bg-white rounded-xl cursor-pointer border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200
                                ${item.readed === 'N' ? 'bg-white ring-1 ring-red-50' : 'bg-gray-50/50 grayscale-[10%] hover:grayscale-0'}
                            `}
                                onClick={() => handleNotificationClick(item)}
                            >
                                {/* Unread Indicator */}
                                {item.readed === 'N' && (
                                    <div className="absolute left-0 top-6 bottom-6 w-1 bg-[#E31C3D] rounded-r-full" />
                                )}

                                <div className="flex gap-5">
                                    {/* Image / Icon */}
                                    <div className="shrink-0 pt-1">
                                        {item.NotiType.image ? (
                                            <div className="relative">
                                                <div className="relative w-16 h-16 flex-shrink-0">
                                                    <Image
                                                        src={item.NotiType.image!}
                                                        alt="Notification"
                                                        fill
                                                        className="rounded-xl shadow-sm border border-gray-200 object-cover bg-white"
                                                        unoptimized
                                                    />
                                                </div>
                                                {/* Type Icon Badge */}
                                                <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-sm ring-2 ring-white
                                                ${['book_new', 'book_update'].includes(item.NotiType.type) ? 'bg-blue-500' :
                                                        item.NotiType.type === 'system' ? 'bg-red-500' : 'bg-orange-500'}
                                            `}>
                                                    {getIconByType(item.NotiType.type)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-sm border border-gray-100
                                             ${['book_new', 'book_update'].includes(item.NotiType.type) ? 'bg-blue-50 text-blue-500' :
                                                    item.NotiType.type === 'system' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}
                                        `}>
                                                {getIconByType(item.NotiType.type)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                        {/* Top Row: Type Label & Time */}
                                        <div className="flex justify-between items-center sm:w-auto">
                                            <div className="flex items-center gap-2">
                                                <Tag color={item.readed === 'N' ? typeInfo.color : 'default'} className="m-0 border-none font-semibold">
                                                    {typeInfo.text}
                                                </Tag>
                                                {item.readed === 'N' && <Tag color="red" className="m-0 border-none text-[10px]">ใหม่</Tag>}
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {dayjs(item.create_at).format('D MMM YYYY, HH:mm')}
                                            </span>
                                        </div>

                                        {/* Titles */}
                                        <div>
                                            <h4 className={`text-base leading-snug mb-1 ${item.readed === 'N' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {item.NotiType.title}
                                            </h4>

                                            {/* Expandable Subtitle/Details for System Type */}
                                            <div className="relative">
                                                <p className={`text-sm text-gray-500 m-0 ${isSystem && isExpanded ? '' : 'line-clamp-2'} transition-all duration-300`}>
                                                    {item.NotiType.subtitle}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Connection Message (Bottom) */}
                                        {item.NotiType.message && (
                                            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <UserOutlined />
                                                    <span className="font-semibold">ข้อความจากระบบ</span>
                                                </div>
                                                <span className={`${isSystem && isExpanded ? '' : 'line-clamp-2'} leading-relaxed whitespace-pre-line`}>
                                                    {item.NotiType.message}
                                                </span>
                                                {/* Show More Button for System Type */}
                                                {isSystem && (
                                                    <div
                                                        className={`mt-1 flex items-center gap-1 text-sm font-semibold text-red-400 hover:text-[#E31C3D] w-fit p-1 -ml-1 rounded transition-colors cursor-pointer select-none`}
                                                        onClick={(e) => toggleExpand(e, item.id)}
                                                    >
                                                        {isExpanded ? 'ย่อลง' : 'ดูเพิ่มเติม'}
                                                        <svg
                                                            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Pagination if needed */}
            {notifications.length > 0 && (
                <div className="flex justify-center mt-8">
                    <Pagination
                        current={page}
                        onChange={(p) => setPage(p)}
                        total={pagination?.total || 100}
                        pageSize={20}
                        showSizeChanger={false}
                    />
                </div>
            )}
        </div>
    );
};

export default NotificationPage;
