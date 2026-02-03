"use client";

import NovelMenu from './NovelMenu';
import { Popover, App, Empty } from 'antd';
import LoginButtonHeader from './LoginButtonHeader';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect } from 'react';
import Image from 'next/image';
import NotificationList from './NotificationList';
import { useSocket } from '@/providers/SocketProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRecentNotifications, fetchPromotingGroups, fetchActiveTypes, fetchActiveCategories } from '@/services/apiServices';
import { useAuthStore } from '@/stores/authStore';
import { useWebsiteStore } from '@/stores/websiteStore';
import { useLineLogin } from '@/hooks/useLineLogin';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import NavIcon from '@/assets/images/icon.png';
import AmountPill from '@/components/utility/AmountPill';
import FreeCoinPill from '@/components/utility/FreeCoinPill';
import SmartAppBanner from '@/components/utility/SmartAppBanner';




function Navbar() {
  const { user, isLoggedIn, hasMounted, logout, setMounted, token } = useAuthStore();
  const { initLIFF } = useLineLogin();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMobileNovelOpen, setIsMobileNovelOpen] = React.useState(false);
  const [openMobileCategoryId, setOpenMobileCategoryId] = React.useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const { settings } = useWebsiteStore();

  // Notification Logic
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { notification: api } = App.useApp();
  const { data: notifications } = useQuery({
    queryKey: ['recentNotifications'],
    queryFn: fetchRecentNotifications,
    refetchInterval: 30000,
    enabled: !!isLoggedIn && !!user, // Only fetch if logged in
  });
  
  const { data: promotingGroups } = useQuery({
    queryKey: ['promotingGroups'],
    queryFn: fetchPromotingGroups,
    staleTime: 5 * 60 * 1000,
  });

  const { data: activeTypes = [] } = useQuery({
    queryKey: ['activeTypes'],
    queryFn: fetchActiveTypes,
    staleTime: 5 * 60 * 1000,
  });

  const { data: mobileCategories = [] } = useQuery({
    queryKey: ['mobileCategories', openMobileCategoryId],
    queryFn: () => fetchActiveCategories(openMobileCategoryId!),
    enabled: !!openMobileCategoryId,
    staleTime: 5 * 60 * 1000,
  });

  const unreadCount = notifications ? notifications.filter(n => n.readed === 'N').length : 0;

  useEffect(() => {
    if (!socket || !isLoggedIn) return;

    // Function to join the user-specific notification room
    const joinRoom = () => {
      if (socket.connected) {
        socket.emit('join:notifications');
      }
    };

    // Join room immediately if already connected
    if (isConnected) {
      joinRoom();
    }

    const handleNewNotification = (data: any) => {
      // Force refresh notification query
      queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });

      api.info({
        message: data.title || 'การแจ้งเตือนใหม่',
        description: data.message || 'คุณมีการแจ้งเตือนใหม่',
        placement: 'topRight',
        duration: 4,
        key: `noti-${Date.now()}`,
        style: { cursor: 'pointer' },
        onClick: () => {
          // Optional: Navigate to notification list or specific URL
        }
      });
    };

    const handleReadNotification = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
    };

    const handleReadAllNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
    };

    // Re-join room on reconnection
    socket.on('connect', joinRoom);

    // Listeners
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleReadNotification);
    socket.on('notification:read-all', handleReadAllNotification);

    // Periodic check to ensure we are in the room (in case of server restart/silent drop)
    const roomCheckInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('join:notifications');
      }
    }, 45000);

    return () => {
      clearInterval(roomCheckInterval);
      socket.off('connect', joinRoom);
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read', handleReadNotification);
      socket.off('notification:read-all', handleReadAllNotification);
    };
  }, [socket, isLoggedIn, isConnected, queryClient, api]);

  const avatarSrc = user?.img ?? user?.profileImage ?? null;
  const userFrameImage = user?.frame?.img ?? null;
  const userFullname = user?.fullname || 'User';

  useEffect(() => {
    setMounted();
  }, [setMounted]);

  // Initialize LIFF (without auto login)
  useEffect(() => {
    initLIFF();
  }, []);

  // Removed redundant manual token decoding - useAuthStore handles this and provides 'user' object


  const isActive = (path: string) => pathname === path;

  const getPageTitle = () => {
    if (pathname === '/') return 'หน้าหลัก';
    if (pathname.startsWith('/cat')) return 'นิยาย';
    if (pathname.startsWith('/writer')) return 'นักเขียน';
    if (pathname.startsWith('/ranking')) return 'จัดอันดับ';
    if (pathname.startsWith('/article')) return 'บทความ';
    // if (pathname.startsWith('/campaign')) return 'แคมเปญ';
    return 'หน้าหลัก';
  };

  const getLinkClasses = (path: string) => {
    if (isActive(path)) {
      return "text-[15px] lg:text-[17px] leading-6 font-primary font-medium text-red-600 relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-[2px] after:bg-red-600 after:rounded-full after:w-full after:content-['']";
    }
    return "text-[15px] lg:text-[17px] leading-6 font-primary font-medium text-gray-800 hover:text-red-600 transition-colors";
  };

  const userMenuContent = (
    <>
      <div className="p-2 rounded-lg" style={{ width: '320px', backgroundColor: '#FFE8F0' }} >
        <div className="bg-white rounded-full mb-2 shadow-sm" style={{ width: '304px', height: '65px' }}>
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden relative">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc || '/images/default-avatar.png'}
                    alt="User"
                    fill
                    sizes="48px"
                    className="object-cover rounded-full"
                    unoptimized
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-avatar.png'; }}
                  />
                ) : (
                  <Image
                    src="/images/default-avatar.png"
                    alt="User Avatar"
                    fill
                    sizes="48px"
                    className="object-cover rounded-full"
                    unoptimized
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-avatar.png'; }}
                  />
                )}
                {userFrameImage && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                    <Image src={userFrameImage} alt="Frame" fill className="object-contain" unoptimized />
                  </div>
                )}
              </div>
              <span className="font-primary text-gray-900 text-base">{userFullname || 'User00001'}</span>
            </div>

            <button className="text-gray-800 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="4" viewBox="0 0 16 4" fill="none">
                <circle cx="2" cy="2" r="2" fill="currentColor" />
                <circle cx="8" cy="2" r="2" fill="currentColor" />
                <circle cx="14" cy="2" r="2" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        {/* Coins Section */}
        <div className="flex items-center justify-between px-2">
          {/* Free Coin Pill */}
          <FreeCoinPill amount={Number(user?.freecoin || 0)} />

          {/* Gold Coin Card with Plus Button - Combined in white background */}
          {/* Gold Coin Card with Plus Button - Custom Component */}
          <AmountPill
            amount={Number(user?.coin || 0)}
          />
        </div>
      </div>


      <Link href="/sprofile" onClick={() => setIsUserMenuOpen(false)} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="22" viewBox="0 0 21 22" fill="none">
          <path d="M10.21 7.91011C9.61666 7.91011 9.03664 8.08606 8.54329 8.4157C8.04994 8.74535 7.66543 9.21388 7.43836 9.76206C7.2113 10.3102 7.15189 10.9134 7.26765 11.4954C7.3834 12.0773 7.66912 12.6119 8.08868 13.0314C8.50824 13.451 9.04279 13.7367 9.62473 13.8525C10.2067 13.9682 10.8099 13.9088 11.3581 13.6818C11.9062 13.4547 12.3748 13.0702 12.7044 12.5768C13.0341 12.0835 13.21 11.5035 13.21 10.9101C13.21 10.1145 12.8939 9.3514 12.3313 8.78879C11.7687 8.22618 11.0057 7.91011 10.21 7.91011ZM10.21 11.9101C10.0122 11.9101 9.81888 11.8515 9.65443 11.7416C9.48998 11.6317 9.36181 11.4755 9.28612 11.2928C9.21044 11.1101 9.19063 10.909 9.22922 10.715C9.2678 10.521 9.36304 10.3429 9.5029 10.203C9.64275 10.0632 9.82093 9.96791 10.0149 9.92933C10.2089 9.89074 10.41 9.91055 10.5927 9.98623C10.7754 10.0619 10.9316 10.1901 11.0415 10.3545C11.1514 10.519 11.21 10.7123 11.21 10.9101C11.21 11.1753 11.1046 11.4297 10.9171 11.6172C10.7296 11.8048 10.4752 11.9101 10.21 11.9101ZM19.02 11.7201C18.8569 11.5352 18.7679 11.2966 18.77 11.0501V10.7701C18.7679 10.5236 18.8569 10.285 19.02 10.1001L19.66 9.38011C20.1505 8.82951 20.4211 8.11753 20.42 7.38011C20.4152 6.8544 20.2776 6.33843 20.02 5.88011L19.46 4.88011C19.1965 4.42377 18.8175 4.04488 18.3611 3.78156C17.9047 3.51823 17.3869 3.37977 16.86 3.38011C16.6585 3.38024 16.4575 3.40034 16.26 3.44011L15.32 3.63011H15.11C14.9385 3.62745 14.7703 3.58282 14.62 3.50011L14.37 3.35011C14.1766 3.2557 14.0187 3.10139 13.92 2.91011L13.61 2.00011C13.4026 1.41334 13.0177 0.905616 12.5089 0.547273C12.0001 0.188931 11.3924 -0.00228654 10.77 0.000112666H9.65C9.03244 -0.00523831 8.42828 0.180134 7.92 0.530922C7.41171 0.881711 7.02408 1.38082 6.81 1.96011L6.5 2.91011C6.4224 3.14236 6.26228 3.33806 6.05 3.46011L5.81 3.61011C5.65561 3.69147 5.48447 3.73597 5.31 3.74011H5.11L4.21 3.49011C4.01248 3.45034 3.81149 3.43024 3.61 3.43011C3.07659 3.41888 2.54983 3.5501 2.08402 3.81025C1.61821 4.0704 1.23021 4.45006 0.960003 4.91011L0.400003 5.91011C0.086141 6.45602 -0.0479853 7.08685 0.0166267 7.71323C0.0812388 8.3396 0.341313 8.92977 0.760003 9.40011L1.4 10.1201C1.56307 10.305 1.6521 10.5436 1.65 10.7901V11.0701C1.6521 11.3166 1.56307 11.5552 1.4 11.7401L0.760003 12.4601C0.269474 13.0107 -0.00107861 13.7227 3.23192e-06 14.4601C0.00482782 14.9858 0.14242 15.5018 0.400003 15.9601L0.960003 16.9601C1.22347 17.4165 1.60249 17.7953 2.05891 18.0587C2.51534 18.322 3.03307 18.4604 3.56 18.4601C3.76149 18.46 3.96248 18.4399 4.16 18.4001L5.1 18.2101H5.3C5.4715 18.2128 5.63974 18.2574 5.79 18.3401L6.04 18.4901C6.25228 18.6122 6.4124 18.8079 6.49 19.0401L6.81 19.9101C7.01745 20.4969 7.40226 21.0046 7.9111 21.363C8.41995 21.7213 9.02765 21.9125 9.65 21.9101H10.77C11.3924 21.9125 12.0001 21.7213 12.5089 21.363C13.0177 21.0046 13.4026 20.4969 13.61 19.9101L13.92 19.0001C13.9976 18.7679 14.1577 18.5722 14.37 18.4501L14.61 18.3001C14.7644 18.2188 14.9355 18.1743 15.11 18.1701H15.31L16.26 18.3601C16.4575 18.3999 16.6585 18.42 16.86 18.4201C17.3869 18.4205 17.9047 18.282 18.3611 18.0187C18.8175 17.7553 19.1965 17.3765 19.46 16.9201L20.02 15.9201C20.2776 15.4618 20.4152 14.9458 20.42 14.4201C20.4211 13.6827 20.1505 12.9707 19.66 12.4201L19.02 11.7201ZM17.53 13.0401L18.17 13.7601C18.3331 13.945 18.4221 14.1836 18.42 14.4301C18.4182 14.6062 18.3699 14.7787 18.28 14.9301L17.72 15.9301C17.6327 16.0813 17.5075 16.2069 17.3566 16.2946C17.2057 16.3824 17.0345 16.4291 16.86 16.4301H16.66L15.72 16.2401C14.9988 16.0906 14.2477 16.2116 13.61 16.5801L13.37 16.7201C12.7332 17.0863 12.2528 17.6734 12.02 18.3701L11.72 19.2901C11.6529 19.4887 11.5251 19.6612 11.3546 19.7833C11.1842 19.9053 10.9796 19.9707 10.77 19.9701H9.65C9.44036 19.9707 9.23585 19.9053 9.06537 19.7833C8.8949 19.6612 8.76709 19.4887 8.7 19.2901L8.4 18.3701C8.1672 17.6734 7.68684 17.0863 7.05 16.7201L6.8 16.5801C6.3467 16.3192 5.83305 16.1813 5.31 16.1801C5.1052 16.1802 4.9009 16.2003 4.7 16.2401L3.76 16.4301H3.56C3.38379 16.4308 3.21053 16.3849 3.05775 16.2971C2.90497 16.2093 2.77811 16.0827 2.69 15.9301L2.14 14.9301C2.05013 14.7787 2.00183 14.6062 2 14.4301C1.98672 14.1887 2.06132 13.9507 2.21 13.7601L2.85 13.0401C3.34053 12.4895 3.61109 11.7775 3.61 11.0401V10.7601C3.61109 10.0227 3.34053 9.31072 2.85 8.76011L2.21 8.06011C2.04693 7.87523 1.9579 7.63663 1.96 7.39011C1.97728 7.21719 2.03931 7.05175 2.14 6.91011L2.7 5.91011C2.78726 5.75898 2.91255 5.6333 3.06342 5.54559C3.21429 5.45787 3.38549 5.41117 3.56 5.41011H3.76L4.7 5.60011C4.90084 5.64035 5.10518 5.66045 5.31 5.66011C5.83305 5.65895 6.3467 5.52106 6.8 5.26011L7.05 5.12011C7.67937 4.76373 8.15879 4.19197 8.4 3.51011L8.7 2.59011C8.76709 2.39149 8.8949 2.21898 9.06537 2.09695C9.23585 1.97493 9.44036 1.90957 9.65 1.91011H10.77C10.9796 1.90957 11.1842 1.97493 11.3546 2.09695C11.5251 2.21898 11.6529 2.39149 11.72 2.59011L12.02 3.51011C12.2528 4.20685 12.7332 4.79395 13.37 5.16011L13.62 5.30011C14.0733 5.56106 14.587 5.69895 15.11 5.70011C15.3148 5.70045 15.5192 5.68035 15.72 5.64011L16.66 5.45011H16.86C17.0362 5.44941 17.2095 5.49529 17.3623 5.58309C17.515 5.67089 17.6419 5.79751 17.73 5.95011L18.28 6.95011C18.3699 7.10155 18.4182 7.27403 18.42 7.45011C18.4221 7.69663 18.3331 7.93523 18.17 8.12011L17.53 8.84011C17.0395 9.39072 16.7689 10.1027 16.77 10.8401V11.1201C16.7689 11.8575 17.0395 12.5695 17.53 13.1201" fill="#B01F1F" />
        </svg>
        <span className="font-primary text-black group-hover:text-red-600 transition-colors">ตั้งค่าบัญชี</span>
      </Link>
      {/* <Link href="/sprofile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg !text-black hover:!text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="19" viewBox="0 0 16 19" fill="none">
          <path d="M15.7443 13.05C15.3743 12.35 14.9143 11.67 14.5643 10.99C14.2226 10.3798 14.0275 9.69855 13.9943 9V7.21C13.9962 5.69616 13.4571 4.23147 12.4743 3.08C11.5854 2.02513 10.3533 1.31704 8.99434 1.08V1C8.99434 0.734784 8.88899 0.48043 8.70145 0.292893C8.51391 0.105357 8.25956 0 7.99434 0C7.72913 0 7.47477 0.105357 7.28724 0.292893C7.0997 0.48043 6.99434 0.734784 6.99434 1V1.09C5.59728 1.32615 4.32887 2.04908 3.41373 3.13077C2.49859 4.21247 1.99578 5.58312 1.99434 7V9C1.96274 9.70197 1.76755 10.3868 1.42434 11C1.07434 11.68 0.614344 12.36 0.244344 13.06C0.0411028 13.4325 -0.038402 13.86 0.0173252 14.2806C0.0730524 14.7013 0.261123 15.0933 0.554343 15.4C0.741928 15.5914 0.966062 15.7431 1.21343 15.8462C1.4608 15.9493 1.72636 16.0016 1.99434 16H4.99434C4.99434 16.7956 5.31041 17.5587 5.87302 18.1213C6.43563 18.6839 7.19869 19 7.99434 19C8.78999 19 9.55306 18.6839 10.1157 18.1213C10.6783 17.5587 10.9943 16.7956 10.9943 16H13.9943C14.263 16.0003 14.529 15.9464 14.7764 15.8416C15.0238 15.7368 15.2476 15.5832 15.4343 15.39C15.7276 15.0833 15.9156 14.6913 15.9714 14.2706C16.0271 13.85 15.9476 13.4225 15.7443 13.05ZM7.99434 17C7.72913 17 7.47477 16.8946 7.28724 16.7071C7.0997 16.5196 6.99434 16.2652 6.99434 16H8.99434C8.99434 16.2652 8.88899 16.5196 8.70145 16.7071C8.51391 16.8946 8.25956 17 7.99434 17ZM1.99434 14C2.29434 13.44 2.77434 12.73 3.19434 11.9C3.69018 11.0117 3.96459 10.0169 3.99434 9V7C3.99434 5.93913 4.41577 4.92172 5.16592 4.17157C5.91606 3.42143 6.93348 3 7.99434 3H8.39434C8.89718 3.04772 9.38567 3.19418 9.83182 3.43098C10.278 3.66779 10.673 3.99028 10.9943 4.38C11.6506 5.17612 12.0047 6.17833 11.9943 7.21V9C12.0226 10.0127 12.2935 11.0038 12.7843 11.89C13.2043 12.72 13.6843 13.43 13.9843 13.99H1.99434V14Z" fill="#B01F1F" />
        </svg>
        <span className="font-primary">การแจ้งเตือน</span>
      </Link> */}
      <div className='flex justify-center my-2'>
        <div className='h-[1px] bg-gray-300 w-[250px]'></div>
      </div>
      <div className="w-[274px]">
        <Link href="/store" onClick={() => setIsUserMenuOpen(false)} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3.00977 11.22V15.71C3.00977 20.2 4.80977 22 9.29977 22H14.6898C19.1798 22 20.9798 20.2 20.9798 15.71V11.22" fill="white" />
            <path d="M3.00977 11.22V15.71C3.00977 20.2 4.80977 22 9.29977 22H14.6898C19.1798 22 20.9798 20.2 20.9798 15.71V11.22" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.0005 12C13.8305 12 15.1805 10.51 15.0005 8.68L14.3405 2H9.67048L9.00048 8.68C8.82048 10.51 10.1705 12 12.0005 12Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.3098 12C20.3298 12 21.8098 10.36 21.6098 8.35L21.3298 5.6C20.9698 3 19.9698 2 17.3498 2H14.2998L14.9998 9.01C15.1698 10.66 16.6598 12 18.3098 12Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.64037 12C7.29037 12 8.78037 10.66 8.94037 9.01L9.16037 6.8L9.64037 2H6.59037C3.97037 2 2.97037 3 2.61037 5.6L2.34037 8.35C2.14037 10.36 3.62037 12 5.64037 12Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 17C10.33 17 9.5 17.83 9.5 19.5V22H14.5V19.5C14.5 17.83 13.67 17 12 17Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-primary text-black group-hover:text-red-600 transition-colors">ร้านค้า</span>
        </Link>
        <Link href="/wallet/history" onClick={() => setIsUserMenuOpen(false)} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="#B01F1F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.7099 15.18L12.6099 13.33C12.0699 13.01 11.6299 12.24 11.6299 11.61V7.51001" stroke="#B01F1F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-primary text-black group-hover:text-red-600 transition-colors">ประวัติ</span>
        </Link>
        <Link href="/shelve" onClick={() => setIsUserMenuOpen(false)} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="19" viewBox="0 0 24 19" fill="none">
            <path d="M23.1429 9.77693e-07H17.0143C15.6991 9.77693e-07 14.4134 0.377679 13.3071 1.09018L12 1.92857L10.6929 1.09018C9.58771 0.377816 8.30056 -0.000702109 6.98571 9.77693e-07H0.857143C0.383036 9.77693e-07 0 0.383037 0 0.857144V16.0714C0 16.5455 0.383036 16.9286 0.857143 16.9286H6.98571C8.30089 16.9286 9.58661 17.3063 10.6929 18.0188L11.8821 18.7848C11.917 18.8063 11.9571 18.8196 11.9973 18.8196C12.0375 18.8196 12.0777 18.8089 12.1125 18.7848L13.3018 18.0188C14.4107 17.3063 15.6991 16.9286 17.0143 16.9286H23.1429C23.617 16.9286 24 16.5455 24 16.0714V0.857144C24 0.383037 23.617 9.77693e-07 23.1429 9.77693e-07ZM6.98571 15H1.92857V1.92857H6.98571C7.93393 1.92857 8.85536 2.19911 9.65089 2.71072L10.958 3.54911L11.1429 3.66964V16.0446C9.86786 15.3589 8.44286 15 6.98571 15ZM22.0714 15H17.0143C15.5571 15 14.1321 15.3589 12.8571 16.0446V3.66964L13.042 3.54911L14.3491 2.71072C15.1446 2.19911 16.0661 1.92857 17.0143 1.92857H22.0714V15ZM8.91696 5.35714H3.94018C3.83571 5.35714 3.75 5.44821 3.75 5.55804V6.76339C3.75 6.87321 3.83571 6.96429 3.94018 6.96429H8.91429C9.01875 6.96429 9.10446 6.87321 9.10446 6.76339V5.55804C9.10714 5.44821 9.02143 5.35714 8.91696 5.35714ZM14.8929 5.55804V6.76339C14.8929 6.87321 14.9786 6.96429 15.083 6.96429H20.0571C20.1616 6.96429 20.2473 6.87321 20.2473 6.76339V5.55804C20.2473 5.44821 20.1616 5.35714 20.0571 5.35714H15.083C14.9786 5.35714 14.8929 5.44821 14.8929 5.55804ZM8.91696 9.10714H3.94018C3.83571 9.10714 3.75 9.19821 3.75 9.30804V10.5134C3.75 10.6232 3.83571 10.7143 3.94018 10.7143H8.91429C9.01875 10.7143 9.10446 10.6232 9.10446 10.5134V9.30804C9.10714 9.19821 9.02143 9.10714 8.91696 9.10714ZM20.0598 9.10714H15.083C14.9786 9.10714 14.8929 9.19821 14.8929 9.30804V10.5134C14.8929 10.6232 14.9786 10.7143 15.083 10.7143H20.0571C20.1616 10.7143 20.2473 10.6232 20.2473 10.5134V9.30804C20.25 9.19821 20.1643 9.10714 20.0598 9.10714Z" fill="#B01F1F" />
          </svg>
          <span className="font-primary text-black group-hover:text-red-600 transition-colors">ชั้นหนังสือ</span>
        </Link>
        <Link href="/w/mybook" onClick={() => setIsUserMenuOpen(false)} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3.5 18V7C3.5 3 4.5 2 8.5 2H15.5C19.5 2 20.5 3 20.5 7V17C20.5 17.14 20.5 17.28 20.49 17.42" fill="white" />
            <path d="M3.5 18V7C3.5 3 4.5 2 8.5 2H15.5C19.5 2 20.5 3 20.5 7V17C20.5 17.14 20.5 17.28 20.49 17.42" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.35 15H20.5V18.5C20.5 20.43 18.93 22 17 22H7C5.07 22 3.5 20.43 3.5 18.5V17.85C3.5 16.28 4.78 15 6.35 15Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 7H16" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 10.5H13" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-primary text-black group-hover:text-red-600 transition-colors">นิยายของฉัน</span>
        </Link>
        <Link href="/event" onClick={() => setIsUserMenuOpen(false)} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4.25977 11.0199V15.9899C4.25977 17.8099 4.25977 17.8099 5.97977 18.9699L10.7098 21.6999C11.4198 22.1099 12.5798 22.1099 13.2898 21.6999L18.0198 18.9699C19.7398 17.8099 19.7398 17.8099 19.7398 15.9899V11.0199C19.7398 9.19994 19.7398 9.19994 18.0198 8.03994L13.2898 5.30994C12.5798 4.89994 11.4198 4.89994 10.7098 5.30994L5.97977 8.03994C4.25977 9.19994 4.25977 9.19994 4.25977 11.0199Z" fill="white" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17.5 7.63V5C17.5 3 16.5 2 14.5 2H9.5C7.5 2 6.5 3 6.5 5V7.56" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.6298 10.99L13.1998 11.88C13.2898 12.02 13.4898 12.16 13.6398 12.2L14.6598 12.46C15.2898 12.62 15.4598 13.16 15.0498 13.66L14.3798 14.47C14.2798 14.6 14.1998 14.83 14.2098 14.99L14.2698 16.04C14.3098 16.69 13.8498 17.02 13.2498 16.78L12.2698 16.39C12.1198 16.33 11.8698 16.33 11.7198 16.39L10.7398 16.78C10.1398 17.02 9.67978 16.68 9.71978 16.04L9.77978 14.99C9.78978 14.83 9.70978 14.59 9.60978 14.47L8.93978 13.66C8.52978 13.16 8.69978 12.62 9.32978 12.46L10.3498 12.2C10.5098 12.16 10.7098 12.01 10.7898 11.88L11.3598 10.99C11.7198 10.45 12.2798 10.45 12.6298 10.99Z" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-primary text-black group-hover:text-red-600 transition-colors">กิจกรรม</span>
        </Link>
        <Link href="/redeem" onClick={() => setIsUserMenuOpen(false)} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19.5 12.5C19.5 11.12 20.62 10 22 10V9C22 5 21 4 17 4H7C3 4 2 5 2 9V9.5C3.38 9.5 4.5 10.62 4.5 12C4.5 13.38 3.38 14.5 2 14.5V15C2 19 3 20 7 20H17C21 20 22 19 22 15C20.62 15 19.5 13.88 19.5 12.5Z" fill="white" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 14.75L15 8.75" stroke="#B01F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.9945 14.75H15.0035" stroke="#B01F1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.99451 9.25H9.00349" stroke="#B01F1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-primary text-black group-hover:text-red-600 transition-colors">กรอกโค๊ด</span>
        </Link>
        {/* <Link href="/" onClick={() => setIsUserMenuOpen(false)} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
          </svg>
          <span className="font-primary text-black group-hover:text-red-600 transition-colors">ติดต่อเรา</span>
        </Link> */}
        <div className="h-[1px] bg-gray-200 my-2"></div>
        <button
          onClick={() => {
            logout();
            setIsUserMenuOpen(false);
            api.success({
              message: 'ออกจากระบบสำเร็จ',
              description: 'คุณได้ออกจากระบบเรียบร้อยแล้ว',
              placement: 'topRight',
            });
          }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-all duration-200 rounded-lg text-left"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.90039 7.55999C9.21039 3.95999 11.0604 2.48999 15.1104 2.48999H15.2404C19.7104 2.48999 21.5004 4.27999 21.5004 8.74999V15.27C21.5004 19.74 19.7104 21.53 15.2404 21.53H15.1104C11.0904 21.53 9.24039 20.08 8.91039 16.54" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 12H3.62" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.85 8.65002L2.5 12L5.85 15.35" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-primary w-full text-red-600">ออกจากระบบ</span>
        </button>
      </div>
    </>
  );

  // Prevent hydration mismatch
  if (!hasMounted) {
    return null;
  }

  return (
    <>
      <SmartAppBanner />
      <div id="GlobalNavbarWrapper" className="sticky top-0 z-[1200] w-full flex flex-col">
        <div
        className="select-none flex justify-center items-center h-[60px] lg:h-[80px] header bg-white text-gray-700 shadow-sm w-full"
        id="Navbar"
        style={{
          backgroundImage: "url('https://img.enjoybook.co/img/')",
          backgroundSize: "auto",
          backgroundPosition: "center bottom",
          backgroundRepeat: "repeat-x",
          alignItems: "center"
        }}
      >
        <div className="flex flex-row items-center justify-between px-4 md:px-5 lg:px-0 gap-3 max-w-[1200px] w-full h-full">
          {/* Logo */}
          <div className="flex flex-row items-center justify-center">
            <Link className="w-10 lg:w-12 md:ms-[10px]" href="/">
              <Image className="w-full h-auto" src={settings?.logo || '/images/default-avatar.png'} unoptimized alt="Logo" width={48} height={48} style={{ color: "transparent" }} />
            </Link>
          </div>
          {/* Center Menu */}
          <div className="hidden lg:flex flex-1 justify-center items-center gap-x-10">
            <Link href="/" className={getLinkClasses('/')}>หน้าหลัก</Link>

            {/* Novel Menu Wrapper */}
            <div
              className="relative flex items-center h-full group"
              onMouseEnter={() => { }}
              onMouseLeave={() => { }}
            >
              <div className={`${getLinkClasses('/allnovel')} flex items-center gap-1 cursor-default`}>
                นิยาย
                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
              </div>
              {/* Mega Menu Dropdown */}
              <div id="NovelMegaMenu" className="absolute top-[calc(100%-10px)] left-0 pt-[20px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out z-50">
                <NovelMenu />
              </div>
            </div>

            <Link href="/ranking" className={getLinkClasses('/ranking')}>จัดอันดับ</Link>
            <Link href="/article" className={getLinkClasses('/article')}>บทความ</Link>
            {/* <Link href="/campaign" className={getLinkClasses('/campaign')}>แคมเปญ</Link> */}

            {promotingGroups?.map((group) => (
              <Link key={group.id} href={`/promotion/${group.id}`} className={getLinkClasses(`/promotion/${group.id}`)}>
                {group.name}
              </Link>
            ))}
            {/* <Link href="/reel" className={getLinkClasses('/reel')}>Reel</Link> */}
          </div>
          {/* Right Side: SVG icons and LoginButton */}
          <div className="flex flex-row gap-x-4 items-center">
            <Link href="/search" className="mr-2 lg:mr-0">
              <span className="text-black hover:text-red-600 transition-colors duration-300 cursor-pointer">
                {<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 22L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>}
              </span>
            </Link>
            {isLoggedIn && user ? (
              <Popover
                content={<NotificationList />}
                trigger="click"
                placement="bottom"
                arrow={false}
                styles={{ body: { padding: 0 } }}
                zIndex={2000}
              >
                <span className="mr-2 lg:mr-0 text-black hover:text-red-600 transition-colors duration-300 cursor-pointer relative">
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12.02 2.91016C8.70997 2.91016 6.01997 5.60016 6.01997 8.91016V11.8002C6.01997 12.4102 5.75997 13.3402 5.44997 13.8602L4.29997 15.7702C3.58997 16.9502 4.07997 18.2602 5.37997 18.7002C9.68997 20.1402 14.34 20.1402 18.65 18.7002C19.86 18.3002 20.39 16.8702 19.73 15.7702L18.58 13.8602C18.28 13.3402 18.02 12.4102 18.02 11.8002V8.91016C18.02 5.61016 15.32 2.91016 12.02 2.91016Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" />
                      <path d="M13.87 3.19994C13.56 3.10994 13.24 3.03994 12.91 2.99994C11.95 2.87994 11.03 2.94994 10.17 3.19994C10.46 2.45994 11.18 1.93994 12.02 1.93994C12.86 1.93994 13.58 2.45994 13.87 3.19994Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15.02 19.0601C15.02 20.7101 13.67 22.0601 12.02 22.0601C11.2 22.0601 10.44 21.7201 9.90002 21.1801C9.36002 20.6401 9.02002 19.8801 9.02002 19.0601" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </span>
              </Popover>
            ) : null}
            <div className="text-nowrap text-[15px] lg:text-[17px] leading-6 flex justify-end items-center cursor-pointer">
              {isLoggedIn && user ? (
                <Popover
                  content={userMenuContent}
                  placement="bottomRight"
                  trigger="click"
                  open={isUserMenuOpen}
                  onOpenChange={setIsUserMenuOpen}
                  zIndex={2000}
                // overlayInnerStyle={{ padding: '8px' }}
                >
                  <div id="UserProfileDropdown" className="flex items-center gap-2 px-2 lg:px-4 py-2 border-2 border-transparent hover:bg-gray-200 transition-colors duration-300 lg:border-gray-800 rounded-full h-[48px] outline-none">
                    {/* Mobile: SVG Icon */}
                    <div className="block">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[24px] h-[24px]">
                        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20.5901 22C20.5901 18.13 16.7402 15 12.0002 15C7.26015 15 3.41016 18.13 3.41016 22" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    {/* Desktop: Name */}
                    <span className="hidden lg:block font-primary font-medium text-gray-800">
                      {user.fullname || 'User'}
                    </span>
                  </div>
                </Popover>
              ) : (
                <LoginButtonHeader />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#DC0020] h-[40px] w-full flex items-center justify-between px-4 lg:hidden text-white shadow-md relative">
        <Link href="/" className="font-bold text-lg select-none !text-white !underline-offset-none">หน้าหลัก</Link>
        <button
          className="text-white focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          className={`absolute top-[40px] left-0 w-full bg-white shadow-lg flex flex-col text-gray-800 z-[1001] border-t border-gray-200 transition-all duration-300 ease-in-out overflow-y-auto ${isMobileMenuOpen ? 'max-h-[calc(100vh-100px)] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <Link href="/" className="px-4 py-3 hover:bg-red-50 border-b border-gray-100 font-primary" onClick={() => setIsMobileMenuOpen(false)}>หน้าหลัก</Link>




// ... inside rendering ...

          {/* Novel Mobile Menu Wrapper */}
          <div className="border-b border-gray-100">
            <div
              className="px-4 py-3 hover:bg-red-50 font-primary flex justify-between items-center cursor-pointer text-gray-800"
              onClick={() => setIsMobileNovelOpen(!isMobileNovelOpen)}
            >
              <span>นิยาย</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${isMobileNovelOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {/* Sub-menu */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 ${isMobileNovelOpen ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {activeTypes?.map((type) => (
                <div key={type.type} className="border-b border-gray-100 last:border-b-0">
                  <div
                    className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100/50 flex justify-between items-center cursor-pointer hover:bg-gray-200/50 transition-colors"
                    onClick={() => setOpenMobileCategoryId(openMobileCategoryId === type.type ? null : type.type)}
                  >
                    <span>{type.label}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-200 text-gray-500 ${openMobileCategoryId === type.type ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>

                  <div className={`grid grid-cols-2 gap-2 px-6 overflow-hidden transition-all duration-300 ease-in-out ${openMobileCategoryId === type.type ? 'max-h-[1000px] py-2 pb-4 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
                    {openMobileCategoryId === type.type && mobileCategories?.length > 0 ? (
                      mobileCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/cat/list?type=${type.type}&categoryId=${cat.id}&tab=new&limit=10&page=1`}
                          className="text-[13px] text-gray-600 hover:text-red-600 truncate py-1"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      ))
                    ) : (
                       openMobileCategoryId === type.type && (
                         <div className="col-span-2 text-center text-gray-400 py-2 text-xs">
                           กำลังโหลด...
                         </div>
                       )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/ranking" className="px-4 py-3 hover:bg-red-50 border-b border-gray-100 font-primary" onClick={() => setIsMobileMenuOpen(false)}>จัดอันดับ</Link>
          <Link href="/article" className="px-4 py-3 hover:bg-red-50 border-b border-gray-100 font-primary" onClick={() => setIsMobileMenuOpen(false)}>บทความ</Link>
          {/* <Link href="/campaign" className="px-4 py-3 hover:bg-red-50 border-b border-gray-100 font-primary" onClick={() => setIsMobileMenuOpen(false)}>แคมเปญ</Link> */}

          {promotingGroups?.map((group) => (
            <Link key={group.id} href={`/promotion/${group.id}`} className="px-4 py-3 hover:bg-red-50 border-b border-gray-100 font-primary" onClick={() => setIsMobileMenuOpen(false)}>
              {group.name}
            </Link>
          ))}
          {/* <Link href="/reel" className="px-4 py-3 hover:bg-red-50 border-b border-gray-100 font-primary" onClick={() => setIsMobileMenuOpen(false)}>Reel</Link> */}
        </div>
      </div>
      </div>
    </>
  );
}

export default Navbar;