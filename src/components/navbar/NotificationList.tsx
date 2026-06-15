import * as React from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllNotifications, markNotificationAsRead, markAllNotificationsAsRead, NotificationTab } from '@/services/apiServices';
import { Tooltip, Button, Tabs } from 'antd';
import { BellOutlined, CheckOutlined, BookOutlined, MessageOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';

dayjs.extend(relativeTime);
dayjs.locale('th');
import GifLoader from '@/components/utility/GifLoader';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { navigateSafely } from '@/utils/navigationUtils';
import { formatNavbarNotificationBadgeCount } from './hooks/useNavbarNotifications';
import { queryKeys } from '@/constants/query';
import { resolveImageSrc } from '@/utils/imageUtils';

const NOTIFICATION_PREVIEW_LIMIT = 10;

// Define Interface based on User's DB Schema
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

const NotificationList: React.FC<{ onClose?: () => void; mode?: 'popover' | 'drawer' }> = ({
    onClose,
    mode = 'popover',
}) => {
    const queryClient = useQueryClient();
    const router = useRouter(); // Initialize router
    React.useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = React.useState<NotificationTab>('all');
    const panelClassName = mode === 'drawer'
        ? 'reader-notification-panel flex h-full w-full min-w-0 flex-col bg-white font-bai-jamjuree'
        : 'reader-notification-panel w-[85vw] max-w-[380px] min-w-[320px] sm:w-[420px] md:w-[480px] flex flex-col bg-white rounded-xl overflow-hidden font-bai-jamjuree shadow-2xl border border-gray-100 ring-1 ring-black/5';

    const { data: notificationResponse, isLoading } = useQuery({
        queryKey: ['navbarNotifications'],
        queryFn: () => fetchAllNotifications(1, NOTIFICATION_PREVIEW_LIMIT, 'all'),
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });
    const notifications = notificationResponse?.notifications ?? [];
    const unreadCount = notifications.filter((n: any) => n.readed === 'N').length;
    const filteredNotifications = React.useMemo(() => {
        if (activeTab === 'all') return notifications;
        return notifications.filter((item: any) => {
            const type = item?.NotiType?.type;
            if (activeTab === 'comment') {
                return ['comment_book_id', 'comment_ep_id', 'comment_sub_book_id', 'comment_sub_ep_id'].includes(type);
            }
            if (activeTab === 'system') return type === 'system';
            if (activeTab === 'book') return ['book_new', 'book_update'].includes(type);
            return true;
        });
    }, [activeTab, notifications]);

    const markReadMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            // Wait a bit for animation to likely finish before refetching implies removal
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: queryKeys.notifications.navbar() });
            }, 300);
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: (tab: NotificationTab) => markAllNotificationsAsRead(tab),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.navbar() });
        }
    });

    const handleNotificationClick = async (item: NotificationItem) => {
        if (item.readed === 'N') {
            // Trigger exit animation if visual removal is desired, or just mark read interaction
            // setExitingIds(prev => new Set(prev).add(item.id)); // Optional: Use if we want it to disappear
            markReadMutation.mutate(item.id);
        }

        // Navigation Logic
        if (item.NotiType.url) {
            const didNavigate = navigateSafely(item.NotiType.url);
            if (didNavigate) {
                return;
            }
        }

        // Fallback navigation based on type if URL is missing or unsafe
        const { type, book_id, ep_id } = item.NotiType;

        if (type === 'system') {
            router.push('/user/notification');
        } else if (type === 'book_new' || type === 'book_update' || type === 'comment_book_id') {
            if (book_id) router.push(`/book/${book_id}`);
        } else if (type === 'comment_ep_id' || type === 'comment_sub_ep_id') {
            if (book_id && ep_id) router.push(`/read/${book_id}/${ep_id}`);
        }
    };

    const handleMarkAllRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        markAllReadMutation.mutate(activeTab);
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
            case 'book_update': return { text: 'นิยาย', color: 'blue' };
            case 'system': return { text: 'ระบบ', color: 'red' };
            case 'comment_book_id':
            case 'comment_ep_id':
            case 'comment_sub_book_id':
            case 'comment_sub_ep_id': return { text: 'ความคิดเห็น', color: 'orange' };
            default: return { text: 'แจ้งเตือน', color: 'default' };
        }
    };

    const getTypeToneKey = (type: string) => {
        if (['book_new', 'book_update'].includes(type)) return 'book';
        if (type === 'system') return 'system';
        return 'comment';
    };

    const getTypeTagClassName = (toneKey: string, readed: NotificationItem['readed']) => {
        if (readed !== 'N') return 'bg-gray-100 text-gray-500';
        if (toneKey === 'book') return 'bg-blue-50 text-blue-600';
        if (toneKey === 'system') return 'bg-red-50 text-red-600';
        return 'bg-orange-50 text-orange-600';
    };

    if (isLoading) {
        return (
            <div className={panelClassName}>
                <div className="reader-notification-header px-5 py-4 border-b border-gray-100 bg-white">
                    <div className="h-7 w-32 rounded-md bg-gray-100 animate-pulse" />
                </div>
                <div className="reader-notification-tabs px-3 pt-2 bg-white border-b border-gray-100">
                    <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
                </div>
                <div className="reader-notification-empty h-[300px] flex justify-center items-center bg-white">
                    <GifLoader width={100} height={100} />
                </div>
                <div className="reader-notification-footer p-3 bg-gray-50 border-t border-gray-200">
                    <div className="h-4 w-28 mx-auto rounded bg-gray-100 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #d1d5db; }
        `}</style>
            <div className={panelClassName}>
                {/* Header */}
                <div className="reader-notification-header px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-gray-800 m-0">การแจ้งเตือน</h3>
                        {unreadCount > 0 && (
                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-[#E31C3D] rounded-full">
                                {formatNavbarNotificationBadgeCount(unreadCount)}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Tooltip title="อ่านทั้งหมด">
                            <Button
                                type="text"
                                size="small"
                                className="text-gray-500 hover:text-[#E31C3D] hover:bg-red-50 text-xs font-medium"
                                onClick={handleMarkAllRead}
                                loading={markAllReadMutation.isPending}
                                icon={<CheckOutlined />}
                            >
                                อ่านทั้งหมด
                            </Button>
                        </Tooltip>
                    )}
                </div>

                <div className="reader-notification-tabs px-3 pt-2 bg-white border-b border-gray-100">
                    <Tabs
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key as NotificationTab)}
                        size="small"
                        items={[
                            { key: 'all', label: 'ทั้งหมด' },
                            { key: 'comment', label: 'ความคิดเห็น' },
                            { key: 'system', label: 'ระบบ' },
                            { key: 'book', label: 'นิยาย' },
                        ]}
                    />
                </div>

                {/* List */}
                {!filteredNotifications || filteredNotifications.length === 0 ? (
                    <div className="reader-notification-empty w-full h-[300px] flex flex-col justify-center items-center gap-3 text-gray-400">
                        <div className="reader-notification-empty-icon w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                            <BellOutlined className="text-xl opacity-30" />
                        </div>
                        <p className="m-0 text-sm">ไม่มีการแจ้งเตือนใหม่</p>
                    </div>
                ) : (
                    <div className="reader-notification-list max-h-[70vh] sm:max-h-[500px] overflow-y-auto custom-scrollbar bg-slate-50">
                        {filteredNotifications.map((item: any) => {
                            const typeInfo = getTypeLabel(item.NotiType.type);
                            const toneKey = getTypeToneKey(item.NotiType.type);
                            const tagTone = item.readed === 'N' ? toneKey : 'default';

                            return (
                                <div
                                    key={item.id}
                                    className={`reader-notification-item group relative px-4 py-4 hover:bg-white cursor-pointer border-b border-gray-100 last:border-0 transition-all duration-200
                                ${item.readed === 'N' ? 'bg-white' : 'bg-slate-50/50 grayscale-[20%] hover:grayscale-0'}
                            `}
                                    onClick={() => handleNotificationClick(item)}
                                >
                                    {/* Unread Indicator Line */}
                                    {item.readed === 'N' && (
                                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#E31C3D] rounded-r-md" />
                                    )}

                                    <div className="flex gap-4">
                                        {/* Image / Icon */}
                                        <div className="shrink-0 pt-1">
                                            {item.NotiType.image ? (
                                                <div className="relative">
                                                    <div className="relative w-14 h-14 flex-shrink-0">
                                                        <Image
                                                            src={resolveImageSrc(item.NotiType.image)}
                                                            alt="Notification"
                                                            fill
                                                            className="rounded-lg shadow-sm border border-gray-200 object-cover bg-white"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    {/* Type Icon Badge */}
                                                    <div className={`reader-notification-type-badge reader-notification-type-badge-${toneKey} absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm ring-2 ring-white
                                                ${['book_new', 'book_update'].includes(item.NotiType.type) ? 'bg-blue-500' :
                                                            item.NotiType.type === 'system' ? 'bg-red-500' : 'bg-orange-500'}
                                            `}>
                                                        {getIconByType(item.NotiType.type)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`reader-notification-type-card reader-notification-type-card-${toneKey} w-14 h-14 rounded-lg flex items-center justify-center text-2xl shadow-sm border border-gray-100
                                             ${['book_new', 'book_update'].includes(item.NotiType.type) ? 'bg-blue-50 text-blue-500' :
                                                        item.NotiType.type === 'system' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}
                                        `}>
                                                    {getIconByType(item.NotiType.type)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                                            {/* Top Row: Type Label & Time */}
                                            <div className="flex justify-between items-center">
                                                <span className={`reader-notification-type-tag reader-notification-type-tag-${tagTone} inline-flex h-5 items-center rounded px-1.5 text-[10px] font-semibold leading-5 ${getTypeTagClassName(toneKey, item.readed)}`}>
                                                    {typeInfo.text}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    {dayjs(item.create_at).fromNow()}
                                                </span>
                                            </div>

                                            {/* Titles */}
                                            <div>
                                                <div className="flex items-start gap-2">
                                                    {item.readed === 'N' ? (
                                                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#E31C3D]" />
                                                    ) : null}
                                                    <h4 className={`text-sm leading-snug mb-0.5 ${item.readed === 'N' ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                                                        {item.NotiType.title}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-gray-500 m-0 line-clamp-2">
                                                    {item.NotiType.subtitle}
                                                </p>
                                            </div>

                                            {/* Connection Message (Bottom) */}
                                            {item.NotiType.message && (
                                                <div className="mt-1 pt-2 border-t border-gray-100/50 flex items-center gap-1.5 text-xs text-gray-400">
                                                    <UserOutlined className="text-[10px]" />
                                                    <span className="line-clamp-2">{item.NotiType.message}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
                }

                <div className="reader-notification-footer p-3 bg-gray-50 border-t border-gray-200 text-center">
                    <Link href="/user/notification" onClick={() => onClose?.()} className="text-xs font-semibold !text-red-600 hover:text-[#E31C3D] transition-colors">
                        ดูการแจ้งเตือนทั้งหมด
                    </Link>
                </div>
            </div>
        </>
    );
};

export default NotificationList;
