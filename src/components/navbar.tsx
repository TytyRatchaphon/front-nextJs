"use client";

import { Popover, Empty, notification } from 'antd';
import LoginButtonHeader from './LoginButtonHeader';
import React, { useEffect } from 'react'; 
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { usePathname } from 'next/navigation'; 
import Link from 'next/link';

function Navbar() {
  const { user, isLoggedIn, hasMounted, logout, setMounted, token } = useAuthStore();
  const pathname = usePathname();
  const [userFullname, setUserFullname] = React.useState<string>('');
  const [userCoins, setUserCoins] = React.useState({ goldCoins: 0 });
  const [userFreeCoins, setUserFreeCoins] = React.useState({ freeCoins: 0 });
  const [userProfileImage, setUserProfileImage] = React.useState<string | null>(null);

  const avatarSrc = userProfileImage ?? user?.profileImage ?? null;

  useEffect(() => {
    setMounted();
  }, [setMounted]);

  // Decode token เพื่อดึง fullname
  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        console.log('📛 Navbar - Decoded token:', decoded);
  console.log('📛 Navbar - Fullname from token:', decoded.fullname);
  console.log('📛 Navbar - Coins from token:', decoded.coins ?? decoded.coin);
  console.log('📛 Navbar - Freecoins from token:', decoded.freecoins ?? decoded.freecoin);
  console.log('📛 Navbar - State before update:', { userCoins, userFreeCoins, userProfileImage });
  setUserFullname(decoded.fullname || 'User');
  // token keys may vary: coin / coins, freecoin / freecoins
  setUserCoins({ goldCoins: parseFloat(String(decoded.coin ?? decoded.coins ?? 0)) || 0 });
  setUserFreeCoins({ freeCoins: parseFloat(String(decoded.freecoin ?? decoded.freecoins ?? 0)) || 0 });
  // token may include an `img` or `image` field for profile image
  const profileFromToken = decoded.img ?? decoded.image ?? decoded.profileImage ?? null;
  setUserProfileImage(profileFromToken);
  console.log('📛 Navbar - State after update:', { userCoins, userFreeCoins, userProfileImage });
      } catch (error) {
        console.error('❌ Navbar - Error decoding token:', error);
        setUserFullname(user?.fullname || 'User');
      }
    } else {
      setUserFullname(user?.fullname || 'User');
    }
  }, [token, user]);

  // Helper function to check if link is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Helper function to get link classes
  const getLinkClasses = (path: string) => {
    if (isActive(path)) {
      return "text-[15px] lg:text-[17px] leading-6 font-primary font-medium text-red-600 relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-[2px] after:bg-red-600 after:rounded-full after:w-full after:content-['']";
    }
    return "text-[15px] lg:text-[17px] leading-6 font-primary font-medium text-gray-800 hover:text-red-600 transition-colors";
  };

  // User menu content for Popover
  const userMenuContent = (
    <>
    {/* User Profile Header Section */}
    <div className="p-2 rounded-lg" style={{ width: '320px', backgroundColor: '#FFE8F0' }}>
      {/* User Info Card - 304 × 65 */}
      <div className="bg-white rounded-full mb-2 shadow-sm" style={{ width: '304px', height: '65px' }}>
        <div className="flex items-center justify-between h-full px-4">
          {/* User Avatar and Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden relative">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt="User Avatar"
                  fill
                  sizes="48px"
                  className="object-cover rounded-full"
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <ellipse cx="14" cy="7" rx="2.5" ry="1.8" fill="#FF0037"/>
                  <path d="M14 5.5C14 5.5 11.5 6.8 11.5 10C11.5 13.2 14 14.5 14 14.5C14 14.5 16.5 13.2 16.5 10C16.5 6.8 14 5.5 14 5.5Z" fill="#FF0037"/>
                  <path d="M14 14.5C14 14.5 11.5 15.8 11.5 19.5V20.5H16.5V19.5C16.5 15.8 14 14.5 14 14.5Z" fill="#1A1A1A"/>
                  <line x1="12.8" y1="9" x2="14" y2="11.2" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="14" y1="11.2" x2="15.2" y2="9" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round"/>
                  <ellipse cx="12.8" cy="6.8" rx="0.6" ry="0.6" fill="#1A1A1A"/>
                  <ellipse cx="15.2" cy="6.8" rx="0.6" ry="0.6" fill="#1A1A1A"/>
                  <path d="M12.5 7.5C12.5 7.5 13 8 14 8C15 8 15.5 7.5 15.5 7.5" stroke="#FF0037" strokeWidth="0.7" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <span className="font-primary text-gray-900 text-base">{userFullname || 'User00001'}</span>
          </div>
          
          {/* Three dots menu */}
          <button className="text-gray-800 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="4" viewBox="0 0 16 4" fill="none">
              <circle cx="2" cy="2" r="2" fill="currentColor"/>
              <circle cx="8" cy="2" r="2" fill="currentColor"/>
              <circle cx="14" cy="2" r="2" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Coins Section */}
        <div className="flex items-center justify-between px-2">
          {/* Red Coin Card - 78 × 34 */}
          <div className="flex items-center gap-1.5 bg-white rounded-full shadow-sm" style={{ width: '78px', height: '34px', padding: '0 8px' }}>
              <Image src="/images/money-bag.png" alt="Free coin" width={24} height={24} />
            <span className="font-primary text-gray-900 text-sm">{userFreeCoins.freeCoins}</span>
          </div>
          
          {/* Gold Coin Card with Plus Button - Combined in white background */}
          <div className="flex items-center gap-1.5 bg-white rounded-full shadow-sm" style={{ width: '108px', height: '32px', padding: '0 4px 0 10px' }}>
              <Image src="/images/e-coin.png" alt="Gold Coin" width={24} height={24}/>
              <span className="font-primary text-gray-900 text-sm">{userCoins.goldCoins}</span>
              <button className="rounded-full flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0" style={{ width: '25px', height: '25px', backgroundColor: '#7CB342' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 0.5V9.5M0.5 5H9.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
          </div>
        </div>
      </div>


    <Link href="/sprofile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-400 transition-all duration-200 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="22" viewBox="0 0 21 22" fill="none">
          <path d="M10.21 7.91011C9.61666 7.91011 9.03664 8.08606 8.54329 8.4157C8.04994 8.74535 7.66543 9.21388 7.43836 9.76206C7.2113 10.3102 7.15189 10.9134 7.26765 11.4954C7.3834 12.0773 7.66912 12.6119 8.08868 13.0314C8.50824 13.451 9.04279 13.7367 9.62473 13.8525C10.2067 13.9682 10.8099 13.9088 11.3581 13.6818C11.9062 13.4547 12.3748 13.0702 12.7044 12.5768C13.0341 12.0835 13.21 11.5035 13.21 10.9101C13.21 10.1145 12.8939 9.3514 12.3313 8.78879C11.7687 8.22618 11.0057 7.91011 10.21 7.91011ZM10.21 11.9101C10.0122 11.9101 9.81888 11.8515 9.65443 11.7416C9.48998 11.6317 9.36181 11.4755 9.28612 11.2928C9.21044 11.1101 9.19063 10.909 9.22922 10.715C9.2678 10.521 9.36304 10.3429 9.5029 10.203C9.64275 10.0632 9.82093 9.96791 10.0149 9.92933C10.2089 9.89074 10.41 9.91055 10.5927 9.98623C10.7754 10.0619 10.9316 10.1901 11.0415 10.3545C11.1514 10.519 11.21 10.7123 11.21 10.9101C11.21 11.1753 11.1046 11.4297 10.9171 11.6172C10.7296 11.8048 10.4752 11.9101 10.21 11.9101ZM19.02 11.7201C18.8569 11.5352 18.7679 11.2966 18.77 11.0501V10.7701C18.7679 10.5236 18.8569 10.285 19.02 10.1001L19.66 9.38011C20.1505 8.82951 20.4211 8.11753 20.42 7.38011C20.4152 6.8544 20.2776 6.33843 20.02 5.88011L19.46 4.88011C19.1965 4.42377 18.8175 4.04488 18.3611 3.78156C17.9047 3.51823 17.3869 3.37977 16.86 3.38011C16.6585 3.38024 16.4575 3.40034 16.26 3.44011L15.32 3.63011H15.11C14.9385 3.62745 14.7703 3.58282 14.62 3.50011L14.37 3.35011C14.1766 3.2557 14.0187 3.10139 13.92 2.91011L13.61 2.00011C13.4026 1.41334 13.0177 0.905616 12.5089 0.547273C12.0001 0.188931 11.3924 -0.00228654 10.77 0.000112666H9.65C9.03244 -0.00523831 8.42828 0.180134 7.92 0.530922C7.41171 0.881711 7.02408 1.38082 6.81 1.96011L6.5 2.91011C6.4224 3.14236 6.26228 3.33806 6.05 3.46011L5.81 3.61011C5.65561 3.69147 5.48447 3.73597 5.31 3.74011H5.11L4.21 3.49011C4.01248 3.45034 3.81149 3.43024 3.61 3.43011C3.07659 3.41888 2.54983 3.5501 2.08402 3.81025C1.61821 4.0704 1.23021 4.45006 0.960003 4.91011L0.400003 5.91011C0.086141 6.45602 -0.0479853 7.08685 0.0166267 7.71323C0.0812388 8.3396 0.341313 8.92977 0.760003 9.40011L1.4 10.1201C1.56307 10.305 1.6521 10.5436 1.65 10.7901V11.0701C1.6521 11.3166 1.56307 11.5552 1.4 11.7401L0.760003 12.4601C0.269474 13.0107 -0.00107861 13.7227 3.23192e-06 14.4601C0.00482782 14.9858 0.14242 15.5018 0.400003 15.9601L0.960003 16.9601C1.22347 17.4165 1.60249 17.7953 2.05891 18.0587C2.51534 18.322 3.03307 18.4604 3.56 18.4601C3.76149 18.46 3.96248 18.4399 4.16 18.4001L5.1 18.2101H5.3C5.4715 18.2128 5.63974 18.2574 5.79 18.3401L6.04 18.4901C6.25228 18.6122 6.4124 18.8079 6.49 19.0401L6.81 19.9101C7.01745 20.4969 7.40226 21.0046 7.9111 21.363C8.41995 21.7213 9.02765 21.9125 9.65 21.9101H10.77C11.3924 21.9125 12.0001 21.7213 12.5089 21.363C13.0177 21.0046 13.4026 20.4969 13.61 19.9101L13.92 19.0001C13.9976 18.7679 14.1577 18.5722 14.37 18.4501L14.61 18.3001C14.7644 18.2188 14.9355 18.1743 15.11 18.1701H15.31L16.26 18.3601C16.4575 18.3999 16.6585 18.42 16.86 18.4201C17.3869 18.4205 17.9047 18.282 18.3611 18.0187C18.8175 17.7553 19.1965 17.3765 19.46 16.9201L20.02 15.9201C20.2776 15.4618 20.4152 14.9458 20.42 14.4201C20.4211 13.6827 20.1505 12.9707 19.66 12.4201L19.02 11.7201ZM17.53 13.0401L18.17 13.7601C18.3331 13.945 18.4221 14.1836 18.42 14.4301C18.4182 14.6062 18.3699 14.7787 18.28 14.9301L17.72 15.9301C17.6327 16.0813 17.5075 16.2069 17.3566 16.2946C17.2057 16.3824 17.0345 16.4291 16.86 16.4301H16.66L15.72 16.2401C14.9988 16.0906 14.2477 16.2116 13.61 16.5801L13.37 16.7201C12.7332 17.0863 12.2528 17.6734 12.02 18.3701L11.72 19.2901C11.6529 19.4887 11.5251 19.6612 11.3546 19.7833C11.1842 19.9053 10.9796 19.9707 10.77 19.9701H9.65C9.44036 19.9707 9.23585 19.9053 9.06537 19.7833C8.8949 19.6612 8.76709 19.4887 8.7 19.2901L8.4 18.3701C8.1672 17.6734 7.68684 17.0863 7.05 16.7201L6.8 16.5801C6.3467 16.3192 5.83305 16.1813 5.31 16.1801C5.1052 16.1802 4.9009 16.2003 4.7 16.2401L3.76 16.4301H3.56C3.38379 16.4308 3.21053 16.3849 3.05775 16.2971C2.90497 16.2093 2.77811 16.0827 2.69 15.9301L2.14 14.9301C2.05013 14.7787 2.00183 14.6062 2 14.4301C1.98672 14.1887 2.06132 13.9507 2.21 13.7601L2.85 13.0401C3.34053 12.4895 3.61109 11.7775 3.61 11.0401V10.7601C3.61109 10.0227 3.34053 9.31072 2.85 8.76011L2.21 8.06011C2.04693 7.87523 1.9579 7.63663 1.96 7.39011C1.97728 7.21719 2.03931 7.05175 2.14 6.91011L2.7 5.91011C2.78726 5.75898 2.91255 5.6333 3.06342 5.54559C3.21429 5.45787 3.38549 5.41117 3.56 5.41011H3.76L4.7 5.60011C4.90084 5.64035 5.10518 5.66045 5.31 5.66011C5.83305 5.65895 6.3467 5.52106 6.8 5.26011L7.05 5.12011C7.67937 4.76373 8.15879 4.19197 8.4 3.51011L8.7 2.59011C8.76709 2.39149 8.8949 2.21898 9.06537 2.09695C9.23585 1.97493 9.44036 1.90957 9.65 1.91011H10.77C10.9796 1.90957 11.1842 1.97493 11.3546 2.09695C11.5251 2.21898 11.6529 2.39149 11.72 2.59011L12.02 3.51011C12.2528 4.20685 12.7332 4.79395 13.37 5.16011L13.62 5.30011C14.0733 5.56106 14.587 5.69895 15.11 5.70011C15.3148 5.70045 15.5192 5.68035 15.72 5.64011L16.66 5.45011H16.86C17.0362 5.44941 17.2095 5.49529 17.3623 5.58309C17.515 5.67089 17.6419 5.79751 17.73 5.95011L18.28 6.95011C18.3699 7.10155 18.4182 7.27403 18.42 7.45011C18.4221 7.69663 18.3331 7.93523 18.17 8.12011L17.53 8.84011C17.0395 9.39072 16.7689 10.1027 16.77 10.8401V11.1201C16.7689 11.8575 17.0395 12.5695 17.53 13.1201" fill="#B01F1F"/>
        </svg>
        <span className="font-primary">ตั้งค่าบัญชี</span>
      </Link>
      <Link href="/sprofile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-400 transition-all duration-200 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="19" viewBox="0 0 16 19" fill="none">
          <path d="M15.7443 13.05C15.3743 12.35 14.9143 11.67 14.5643 10.99C14.2226 10.3798 14.0275 9.69855 13.9943 9V7.21C13.9962 5.69616 13.4571 4.23147 12.4743 3.08C11.5854 2.02513 10.3533 1.31704 8.99434 1.08V1C8.99434 0.734784 8.88899 0.48043 8.70145 0.292893C8.51391 0.105357 8.25956 0 7.99434 0C7.72913 0 7.47477 0.105357 7.28724 0.292893C7.0997 0.48043 6.99434 0.734784 6.99434 1V1.09C5.59728 1.32615 4.32887 2.04908 3.41373 3.13077C2.49859 4.21247 1.99578 5.58312 1.99434 7V9C1.96274 9.70197 1.76755 10.3868 1.42434 11C1.07434 11.68 0.614344 12.36 0.244344 13.06C0.0411028 13.4325 -0.038402 13.86 0.0173252 14.2806C0.0730524 14.7013 0.261123 15.0933 0.554343 15.4C0.741928 15.5914 0.966062 15.7431 1.21343 15.8462C1.4608 15.9493 1.72636 16.0016 1.99434 16H4.99434C4.99434 16.7956 5.31041 17.5587 5.87302 18.1213C6.43563 18.6839 7.19869 19 7.99434 19C8.78999 19 9.55306 18.6839 10.1157 18.1213C10.6783 17.5587 10.9943 16.7956 10.9943 16H13.9943C14.263 16.0003 14.529 15.9464 14.7764 15.8416C15.0238 15.7368 15.2476 15.5832 15.4343 15.39C15.7276 15.0833 15.9156 14.6913 15.9714 14.2706C16.0271 13.85 15.9476 13.4225 15.7443 13.05ZM7.99434 17C7.72913 17 7.47477 16.8946 7.28724 16.7071C7.0997 16.5196 6.99434 16.2652 6.99434 16H8.99434C8.99434 16.2652 8.88899 16.5196 8.70145 16.7071C8.51391 16.8946 8.25956 17 7.99434 17ZM1.99434 14C2.29434 13.44 2.77434 12.73 3.19434 11.9C3.69018 11.0117 3.96459 10.0169 3.99434 9V7C3.99434 5.93913 4.41577 4.92172 5.16592 4.17157C5.91606 3.42143 6.93348 3 7.99434 3H8.39434C8.89718 3.04772 9.38567 3.19418 9.83182 3.43098C10.278 3.66779 10.673 3.99028 10.9943 4.38C11.6506 5.17612 12.0047 6.17833 11.9943 7.21V9C12.0226 10.0127 12.2935 11.0038 12.7843 11.89C13.2043 12.72 13.6843 13.43 13.9843 13.99H1.99434V14Z" fill="#B01F1F"/>
        </svg>
        <span className="font-primary">การแจ้งเตือน</span>
      </Link>
    <div className='flex justify-center items-center mb-2 mt-4 px-4'>
    </div>
    <div className='flex justify-center my-2'>
      <div className='h-[1px] bg-gray-300 w-[250px]'></div>
    </div>
    <div className="w-[274px]">
      <Link href="/sprofile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M480 448h-12a4 4 0 0 1-4-4V273.51a4 4 0 0 0-5.24-3.86 104.92 104.92 0 0 1-28.32 4.78c-1.18 0-2.3.05-3.4.05a108.22 108.22 0 0 1-52.85-13.64 8.23 8.23 0 0 0-8 0 108.18 108.18 0 0 1-52.84 13.64 106.11 106.11 0 0 1-52.46-13.79 8.21 8.21 0 0 0-8.09 0 108.14 108.14 0 0 1-53.16 13.8 106.19 106.19 0 0 1-52.77-14 8.25 8.25 0 0 0-8.16 0 106.19 106.19 0 0 1-52.77 14c-1.09 0-2.19 0-3.37-.05h-.06a104.91 104.91 0 0 1-29.28-5.09 4 4 0 0 0-5.23 3.8V444a4 4 0 0 1-4 4H32.5c-8.64 0-16.1 6.64-16.48 15.28A16 16 0 0 0 32 480h447.5c8.64 0 16.1-6.64 16.48-15.28A16 16 0 0 0 480 448zm-256-68a4 4 0 0 1-4 4h-88a4 4 0 0 1-4-4v-64a12 12 0 0 1 12-12h72a12 12 0 0 1 12 12zm156 68h-72a4 4 0 0 1-4-4V316a12 12 0 0 1 12-12h56a12 12 0 0 1 12 12v128a4 4 0 0 1-4 4zm112.57-277.72-42.92-98.49C438.41 47.62 412.74 32 384.25 32H127.7c-28.49 0-54.16 15.62-65.4 39.79l-42.92 98.49c-9 19.41 2.89 39.34 2.9 39.35l.28.45c.49.78 1.36 2 1.89 2.78.05.06.09.13.14.20l5 6.05a7.45 7.45 0 0 0 .6.65l5 4.83.42.36a69.65 69.65 0 0 0 9.39 6.78v.05a74 74 0 0 0 36 10.67h2.47a76.08 76.08 0 0 0 51.89-20.31l.33-.31a7.94 7.94 0 0 1 10.89 0l.33.31a77.3 77.3 0 0 0 104.46 0 8 8 0 0 1 10.87 0 77.31 77.31 0 0 0 104.21.23 7.88 7.88 0 0 1 10.71 0 76.81 76.81 0 0 0 52.31 20.08h2.49a71.35 71.35 0 0 0 35-10.7c.95-.57 1.86-1.17 2.78-1.77A71.33 71.33 0 0 0 488 212.17l1.74-2.63q.26-.4.48-.84c1.66-3.38 10.56-20.76 2.35-38.42z"></path></svg>
        <span className="font-primary">ร้านค้า</span>
      </Link>
      <Link href="/sprofile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"></path></svg>
        <span className="font-primary">ประวัติ</span>
      </Link>
      <Link href="/" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 18 20" fill="none">
          <path d="M15 0H3C2.20435 0 1.44129 0.316071 0.87868 0.87868C0.316071 1.44129 0 2.20435 0 3V17C0 17.7956 0.316071 18.5587 0.87868 19.1213C1.44129 19.6839 2.20435 20 3 20H15C15.7956 20 16.5587 19.6839 17.1213 19.1213C17.6839 18.5587 18 17.7956 18 17V3C18 2.20435 17.6839 1.44129 17.1213 0.87868C16.5587 0.316071 15.7956 0 15 0ZM15 18H3C2.73478 18 2.48043 17.8946 2.29289 17.7071C2.10536 17.5196 2 17.2652 2 17V14H4C4.26522 14 4.51957 13.8946 4.70711 13.7071C4.89464 13.5196 5 13.2652 5 13C5 12.7348 4.89464 12.4804 4.70711 12.2929C4.51957 12.1054 4.26522 12 4 12H2V8H4C4.26522 8 4.51957 7.89464 4.70711 7.70711C4.89464 7.51957 5 7.26522 5 7C5 6.73478 4.89464 6.48043 4.70711 6.29289C4.51957 6.10536 4.26522 6 4 6H2V3C2 2.73478 2.10536 2.48043 2.29289 2.29289C2.48043 2.10536 2.73478 2 3 2H15C15.2652 2 15.5196 2.10536 15.7071 2.29289C15.8946 2.48043 16 2.73478 16 3V6H9C8.73478 6 8.48043 6.10536 8.29289 6.29289C8.10536 6.48043 8 6.73478 8 7C8 7.26522 8.10536 7.51957 8.29289 7.70711C8.48043 7.89464 8.73478 8 9 8H16V12H9C8.73478 12 8.48043 12.1054 8.29289 12.2929C8.10536 12.4804 8 12.7348 8 13C8 13.2652 8.10536 13.5196 8.29289 13.7071C8.48043 13.8946 8.73478 14 9 14H16V17C16 17.2652 15.8946 17.5196 15.7071 17.7071C15.5196 17.8946 15.2652 18 15 18Z" fill="#B01F1F"/>
        </svg>
        <span className="font-primary">ชั้นหนังสือ</span>
      </Link>
      <Link href="/w/mybook" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 18 20" fill="none">
          <path d="M13 10C13 10.2652 12.8946 10.5196 12.7071 10.7071C12.5196 10.8946 12.2652 11 12 11H6C5.73478 11 5.48043 10.8946 5.29289 10.7071C5.10536 10.5196 5 10.2652 5 10C5 9.73478 5.10536 9.48043 5.29289 9.29289C5.48043 9.10536 5.73478 9 6 9H12C12.2652 9 12.5196 9.10536 12.7071 9.29289C12.8946 9.48043 13 9.73478 13 10ZM9 13H6C5.73478 13 5.48043 13.1054 5.29289 13.2929C5.10536 13.4804 5 13.7348 5 14C5 14.2652 5.10536 14.5196 5.29289 14.7071C5.48043 14.8946 5.73478 15 6 15H9C9.26522 15 9.51957 14.8946 9.70711 14.7071C9.89464 14.5196 10 14.2652 10 14C10 13.7348 9.89464 13.4804 9.70711 13.2929C9.51957 13.1054 9.26522 13 9 13ZM18 3V17C18 17.7956 17.6839 18.5587 17.1213 19.1213C16.5587 19.6839 15.7956 20 15 20H3C2.20435 20 1.44129 19.6839 0.87868 19.1213C0.316071 18.5587 0 17.7956 0 17V3C0 2.20435 0.316071 1.44129 0.87868 0.87868C1.44129 0.316071 2.20435 0 3 0H15C15.7956 0 16.5587 0.316071 17.1213 0.87868C17.6839 1.44129 18 2.20435 18 3ZM11 4C11.2652 4 11.5196 3.89464 11.7071 3.70711C11.8946 3.51957 12 3.26522 12 3V2H6V3C6 3.26522 6.10536 3.51957 6.29289 3.70711C6.48043 3.89464 6.73478 4 7 4H11ZM16 3C16 2.73478 15.8946 2.48043 15.7071 2.29289C15.5196 2.10536 15.2652 2 15 2H14V3C14 3.79565 13.6839 4.55871 13.1213 5.12132C12.5587 5.68393 11.7956 6 11 6H7C6.20435 6 5.44129 5.68393 4.87868 5.12132C4.31607 4.55871 4 3.79565 4 3V2H3C2.73478 2 2.48043 2.10536 2.29289 2.29289C2.10536 2.48043 2 2.73478 2 3V17C2 17.2652 2.10536 17.5196 2.29289 17.7071C2.48043 17.8946 2.73478 18 3 18H15C15.2652 18 15.5196 17.8946 15.7071 17.7071C15.8946 17.5196 16 17.2652 16 17V3Z" fill="#B01F1F"/>
        </svg>
        <span className="font-primary">นิยายของฉัน</span>
      </Link>
            <Link href="/sprofile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 18 20" fill="none">
          <path d="M15 0H3C2.20435 0 1.44129 0.316071 0.87868 0.87868C0.316071 1.44129 0 2.20435 0 3V17C0 17.7956 0.316071 18.5587 0.87868 19.1213C1.44129 19.6839 2.20435 20 3 20H15C15.7956 20 16.5587 19.6839 17.1213 19.1213C17.6839 18.5587 18 17.7956 18 17V3C18 2.20435 17.6839 1.44129 17.1213 0.87868C16.5587 0.316071 15.7956 0 15 0ZM15 18H3C2.73478 18 2.48043 17.8946 2.29289 17.7071C2.10536 17.5196 2 17.2652 2 17V14H4C4.26522 14 4.51957 13.8946 4.70711 13.7071C4.89464 13.5196 5 13.2652 5 13C5 12.7348 4.89464 12.4804 4.70711 12.2929C4.51957 12.1054 4.26522 12 4 12H2V8H4C4.26522 8 4.51957 7.89464 4.70711 7.70711C4.89464 7.51957 5 7.26522 5 7C5 6.73478 4.89464 6.48043 4.70711 6.29289C4.51957 6.10536 4.26522 6 4 6H2V3C2 2.73478 2.10536 2.48043 2.29289 2.29289C2.48043 2.10536 2.73478 2 3 2H15C15.2652 2 15.5196 2.10536 15.7071 2.29289C15.8946 2.48043 16 2.73478 16 3V6H9C8.73478 6 8.48043 6.10536 8.29289 6.29289C8.10536 6.48043 8 6.73478 8 7C8 7.26522 8.10536 7.51957 8.29289 7.70711C8.48043 7.89464 8.73478 8 9 8H16V12H9C8.73478 12 8.48043 12.1054 8.29289 12.2929C8.10536 12.4804 8 12.7348 8 13C8 13.2652 8.10536 13.5196 8.29289 13.7071C8.48043 13.8946 8.73478 14 9 14H16V17C16 17.2652 15.8946 17.5196 15.7071 17.7071C15.5196 17.8946 15.2652 18 15 18Z" fill="#B01F1F"/>
        </svg>
        <span className="font-primary">กิจกรรม</span>
      </Link>
      <Link href="/redeem" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 18 20" fill="none">
          <path d="M13 10C13 10.2652 12.8946 10.5196 12.7071 10.7071C12.5196 10.8946 12.2652 11 12 11H6C5.73478 11 5.48043 10.8946 5.29289 10.7071C5.10536 10.5196 5 10.2652 5 10C5 9.73478 5.10536 9.48043 5.29289 9.29289C5.48043 9.10536 5.73478 9 6 9H12C12.2652 9 12.5196 9.10536 12.7071 9.29289C12.8946 9.48043 13 9.73478 13 10ZM9 13H6C5.73478 13 5.48043 13.1054 5.29289 13.2929C5.10536 13.4804 5 13.7348 5 14C5 14.2652 5.10536 14.5196 5.29289 14.7071C5.48043 14.8946 5.73478 15 6 15H9C9.26522 15 9.51957 14.8946 9.70711 14.7071C9.89464 14.5196 10 14.2652 10 14C10 13.7348 9.89464 13.4804 9.70711 13.2929C9.51957 13.1054 9.26522 13 9 13ZM18 3V17C18 17.7956 17.6839 18.5587 17.1213 19.1213C16.5587 19.6839 15.7956 20 15 20H3C2.20435 20 1.44129 19.6839 0.87868 19.1213C0.316071 18.5587 0 17.7956 0 17V3C0 2.20435 0.316071 1.44129 0.87868 0.87868C1.44129 0.316071 2.20435 0 3 0H15C15.7956 0 16.5587 0.316071 17.1213 0.87868C17.6839 1.44129 18 2.20435 18 3ZM11 4C11.2652 4 11.5196 3.89464 11.7071 3.70711C11.8946 3.51957 12 3.26522 12 3V2H6V3C6 3.26522 6.10536 3.51957 6.29289 3.70711C6.48043 3.89464 6.73478 4 7 4H11ZM16 3C16 2.73478 15.8946 2.48043 15.7071 2.29289C15.5196 2.10536 15.2652 2 15 2H14V3C14 3.79565 13.6839 4.55871 13.1213 5.12132C12.5587 5.68393 11.7956 6 11 6H7C6.20435 6 5.44129 5.68393 4.87868 5.12132C4.31607 4.55871 4 3.79565 4 3V2H3C2.73478 2 2.48043 2.10536 2.29289 2.29289C2.10536 2.48043 2 2.73478 2 3V17C2 17.2652 2.10536 17.5196 2.29289 17.7071C2.48043 17.8946 2.73478 18 3 18H15C15.2652 18 15.5196 17.8946 15.7071 17.7071C15.8946 17.5196 16 17.2652 16 17V3Z" fill="#B01F1F"/>
        </svg>
        <span className="font-primary">รหัสแลกรับ</span>
      </Link>
      <Link href="/sprofile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all duration-200 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
          <path d="M17.9975 9.76V8C17.9975 5.87827 17.1547 3.84344 15.6544 2.34315C14.1541 0.842855 12.1193 0 9.99752 0C7.87579 0 5.84096 0.842855 4.34067 2.34315C2.84038 3.84344 1.99752 5.87827 1.99752 8V9.76C1.19554 10.2966 0.587295 11.0768 0.262528 11.9855C-0.0622392 12.8941 -0.086323 13.8831 0.19383 14.8065C0.473983 15.7299 1.04353 16.5387 1.81844 17.1138C2.59335 17.6888 3.53257 17.9995 4.49752 18H4.99752C5.26274 18 5.51709 17.8946 5.70463 17.7071C5.89217 17.5196 5.99752 17.2652 5.99752 17V10C5.99752 9.73478 5.89217 9.48043 5.70463 9.29289C5.51709 9.10536 5.26274 9 4.99752 9H4.49752C4.33001 9.00674 4.16305 9.02344 3.99752 9.05V8C3.99752 6.4087 4.62966 4.88258 5.75488 3.75736C6.8801 2.63214 8.40622 2 9.99752 2C11.5888 2 13.1149 2.63214 14.2402 3.75736C15.3654 4.88258 15.9975 6.4087 15.9975 8V9.05C15.832 9.02344 15.665 9.00674 15.4975 9H14.9975C14.7323 9 14.478 9.10536 14.2904 9.29289C14.1029 9.48043 13.9975 9.73478 13.9975 10V17C13.9975 17.2652 14.1029 17.5196 14.2904 17.7071C14.478 17.8946 14.7323 18 14.9975 18H15.4975C16.4625 17.9995 17.4017 17.6888 18.1766 17.1138C18.9515 16.5387 19.5211 15.7299 19.8012 14.8065C20.0814 13.8831 20.0573 12.8941 19.7325 11.9855C19.4078 11.0768 18.7995 10.2966 17.9975 9.76ZM1.99752 13.5C1.9974 12.9237 2.19641 12.365 2.56087 11.9185C2.92532 11.4721 3.43284 11.1653 3.99752 11.05V16C3.42433 15.8831 2.91028 15.5689 2.54484 15.1121C2.17941 14.6553 1.98573 14.0849 1.99752 13.5ZM15.9975 16V11.1C16.5627 11.2148 17.0708 11.5214 17.4357 11.9679C17.8007 12.4144 18 12.9733 18 13.55C18 14.1267 17.8007 14.6856 17.4357 15.1321C17.0708 15.5786 16.5627 15.8852 15.9975 16Z" fill="#B01F1F"/>
        </svg>
        <span className="font-primary">ติดต่อเรา</span>
      </Link>
      <div className="h-[1px] bg-gray-200 my-2"></div>
      <button
        onClick={() => {
          logout();
          notification.success({
            message: 'ออกจากระบบสำเร็จ',
            description: 'คุณได้ออกจากระบบเรียบร้อยแล้ว',
            placement: 'topRight',
          });
        }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-all duration-200 rounded-lg text-left"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.90039 7.55999C9.21039 3.95999 11.0604 2.48999 15.1104 2.48999H15.2404C19.7104 2.48999 21.5004 4.27999 21.5004 8.74999V15.27C21.5004 19.74 19.7104 21.53 15.2404 21.53H15.1104C11.0904 21.53 9.24039 20.08 8.91039 16.54" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 12H3.62" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.85 8.65002L2.5 12L5.85 15.35" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-primary text-red-600">ออกจากระบบ</span>
      </button>
    </div>
    </>
  );

  // Prevent hydration mismatch
  if (!hasMounted) {
    return null;
  }

  // const notificationContent = (
  //   <div style={{ width: 300 }}> {/* กำหนดความกว้างให้ Popover */}
  //     <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
  //       <Link href="/notifications" style={{ fontSize: '12px' }}>
  //         <span className='text-black font-primary font-medium'>
  //           ดูทั้งหมด
  //         </span>
  //       </Link>
  //     </div>
  //     {/* TODO: ในอนาคตคุณอาจจะ Fetch ข้อมูล Notification มาแสดงที่นี่
  //       ถ้ามีข้อมูล ก็แสดง List ของ Notification
  //       ถ้าไม่มี ก็แสดง Empty 
  //     */}
  //     <Empty description={<span className="font-primary font-medium text-black" style={{ fontSize: '14px' }}>No data</span>} />
  //   </div>
  // );

  return (
    <div
      className="select-none inset-x-0 top-0 z-[1000] flex justify-center items-center h-[80px] header bg-white text-gray-700 sticky shadow-sm"
      id="Navbar"
      style={{
        width: "100%",
        backgroundImage: "url('https://img.enjoybook.co/img/')",
        backgroundSize: "auto",
        backgroundPosition: "center bottom",
        backgroundRepeat: "repeat-x",
        bottom: "0px",
        alignItems: "flex-end"
      }}
    >
      <div className="flex flex-row items-center justify-between p-3 md:px-5 lg:px-0 gap-3 max-w-[1200px] w-full h-[80px]">
        {/* Logo */}
        <div className="flex flex-row items-center justify-center">
          <Link className="w-10 lg:w-12 md:ms-[10px]" href="/">
            <Image className="w-full h-auto" src="https://img.enjoybook.co/img/logo2025omxesk8HIC0602112905.png" alt="Logo" width={1500} height={1500} style={{ color: "transparent" }} />
          </Link>
        </div>
        {/* Center Menu */}
        <div className="hidden lg:flex flex-1 justify-center items-center gap-x-10">
          <Link href="/" className={getLinkClasses('/')}>หน้าหลัก</Link>
          <Link href="/allnovel" className={getLinkClasses('/allnovel')}>นิยาย</Link>
          <Link href="/writer" className={getLinkClasses('/writer')}>นักเขียน</Link>
          <Link href="/news" className={getLinkClasses('/news')}>ข่าวสาร/กิจกรรม</Link>
        </div>
        {/* Right Side: SVG icons and LoginButton */}
          <div className="flex flex-row gap-x-4 items-center">
          <Link href="/search" className="mr-2 lg:mr-0">
            <span className="text-black hover:text-red-600 transition-colors duration-300 cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300"/>
                <path d="M18.9304 20.6898C19.4604 22.2898 20.6704 22.4498 21.6004 21.0498C22.4504 19.7698 21.8904 18.7198 20.3504 18.7198C19.2104 18.7098 18.5704 19.5998 18.9304 20.6898Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300"/>
              </svg>
            </span>
          </Link>
          { isLoggedIn && user ? (
          <Link href="/search" className="mr-2 lg:mr-0">
            <span className="text-black hover:text-red-600 transition-colors duration-300 cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.0196 2.91C8.7096 2.91 6.0196 5.6 6.0196 8.91V11.8C6.0196 12.41 5.7596 13.34 5.4496 13.86L4.2996 15.77C3.5896 16.95 4.0796 18.26 5.3796 18.7C9.6896 20.14 14.3396 20.14 18.6496 18.7C19.8596 18.3 20.3896 16.87 19.7296 15.77L18.5796 13.86C18.2796 13.34 18.0196 12.41 18.0196 11.8V8.91C18.0196 5.61 15.3196 2.91 12.0196 2.91Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" className="transition-colors duration-300"/>
                <path d="M13.8699 3.2C13.5599 3.11 13.2399 3.04 12.9099 3C11.9499 2.88 11.0299 2.95 10.1699 3.2C10.4599 2.46 11.1799 1.94 12.0199 1.94C12.8599 1.94 13.5799 2.46 13.8699 3.2Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300"/>
                <path d="M15.0195 19.06C15.0195 20.71 13.6695 22.06 12.0195 22.06C11.1995 22.06 10.4395 21.72 9.89953 21.18C9.35953 20.64 9.01953 19.88 9.01953 19.06" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" className="transition-colors duration-300"/>
              </svg>
            </span>
          </Link>
          ) : null }
          <div className="text-nowrap text-[15px] lg:text-[17px] leading-6 flex justify-end items-center cursor-pointer navbar-button">
            {isLoggedIn && user ? (
              <Popover 
                content={userMenuContent} 
                placement="bottomRight" 
                trigger="click"
                // overlayInnerStyle={{ padding: '8px' }}
              >
                <div className="flex items-center gap-2 px-4 py-2 border-2 border-gray-800 rounded-full hover:border-red-600 transition-colors duration-300 h-[48px] cursor-pointer">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="font-primary font-medium text-gray-800">
                    {user.fullname || 'User'}
                  </span>
                </div>
              </Popover>
            ) : (
              <LoginButtonHeader/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar