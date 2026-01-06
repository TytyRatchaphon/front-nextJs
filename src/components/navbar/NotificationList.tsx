import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRecentNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/apiServices';
import { Empty, Avatar, List, Tooltip, Button } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';

dayjs.extend(relativeTime);
dayjs.locale('th');
import GifLoader from '@/components/utility/GifLoader';


const NotificationList: React.FC = () => {
  const queryClient = useQueryClient();
  const [exitingIds, setExitingIds] = React.useState<Set<number>>(new Set());
  
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['recentNotifications'],
    queryFn: fetchRecentNotifications,
    refetchInterval: 30000, 
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
       // Wait a bit for animation to likely finish before refetching implies removal
       setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
       }, 300);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
    }
  });

  const handleNotificationClick = async (item: any) => {
    if (item.readed === 'N') {
        // Trigger exit animation
        setExitingIds(prev => new Set(prev).add(item.id));
        
        // Mark as read
        markReadMutation.mutate(item.id);
    }
    
    if (item.NotiType.url) {
        window.location.href = item.NotiType.url;
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllReadMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[350px] h-[300px] flex justify-center items-center">
        <GifLoader width={100} height={100} />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #d1d5db;
        }
      `}</style>
      <div className="w-[80vw] max-w-[350px] sm:w-[480px] sm:max-w-none flex flex-col bg-white rounded-xl overflow-hidden font-bai-jamjuree shadow-xl border border-gray-100">
         <div 
            className="px-4 py-4 md:px-8 md:py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10"
         >
            <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg md:text-xl m-0 text-gray-900 tracking-tight">การแจ้งเตือน</h3>
                {notifications && notifications.filter(n => n.readed === 'N').length > 0 && (
                    <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-red-500 rounded-full shadow-sm ring-2 ring-white">
                        {notifications.filter(n => n.readed === 'N').length}
                    </span>
                )}
            </div>
            {notifications && notifications.some(n => n.readed === 'N') && (
                <Tooltip title="อ่านทั้งหมด">
                    <Button 
                        type="text" 
                        size="small"
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 font-medium flex items-center gap-1.5 px-3 rounded-full transition-all"
                        onClick={handleMarkAllRead}
                        loading={markAllReadMutation.isPending}
                        icon={<CheckOutlined />}
                    >
                        อ่านทั้งหมด
                    </Button>
                </Tooltip>
            )}
         </div>
         
         {!notifications || notifications.length === 0 ? (
            <div className="w-full h-[350px] flex flex-col justify-center items-center gap-4 text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                    <BellOutlined className="text-2xl opacity-20" />
                </div>
                <p className="m-0 font-medium">ไม่มีการแจ้งเตือน</p>
            </div>
         ) : (
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar bg-gray-50/30">
                {notifications.map((item) => (
                    <div 
                        key={item.id}
                        className={`group px-4 py-4 md:px-8 md:py-5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 relative overflow-hidden transition-all duration-500 ease-in-out
                            ${item.readed === 'N' ? 'bg-white' : 'opacity-80'}
                            ${exitingIds.has(item.id) ? 'max-h-0 opacity-0 py-0 border-none' : 'max-h-[200px] opacity-100'}
                        `}
                        onClick={() => handleNotificationClick(item)}
                    >
                         {item.readed === 'N' && (
                            <div className="absolute left-0 top-0 bottom-0 w-0 bg-red-500 rounded-r-full transition-all duration-300 group-hover:w-1.5 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        )}
                        <div className="flex items-start gap-4">
                            {/* Avatar Area */}
                            <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
                                {item.NotiType.image ? (
                                    <>
                                        <Avatar src={item.NotiType.image} size={64} shape="square" className="rounded-xl shadow-sm object-cover border border-gray-100" />
                                        {item.NotiType.type === 'comment_ep_id' && (
                                            <div className="absolute -bottom-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-[64px] h-[64px] bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center text-red-500 shadow-sm border border-red-100 shrink-0">
                                        <BellOutlined style={{ fontSize: '24px' }} />
                                    </div>
                                )}
                            </div>
                            
                            {/* Content Area */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-1 mb-1">
                                    <div className="flex justify-between items-start gap-3 w-full">
                                        <span className={`text-[16px] leading-tight ${item.readed === 'N' ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                            {item.NotiType.title}
                                        </span>
                                        <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap mt-0.5">
                                            {dayjs(item.create_at).fromNow()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[14px] text-gray-600 line-clamp-2 leading-relaxed font-normal">
                                        {item.NotiType.subtitle}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         )}
         
         <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center backdrop-blur-sm">
            <button className="text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors py-1 px-4 rounded-full hover:bg-white/80">
                ดูการแจ้งเตือนทั้งหมด
            </button>
         </div>
    </div>
    </>
  );
};

export default NotificationList;
