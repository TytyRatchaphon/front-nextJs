import * as React from "react";
import { Image } from 'antd';

interface MyBookHeaderProps {
  user: any;
  coinIncome: string | number;
  myBooksTotal: number | null;
  myBooksCount: number;
  tokenProfileImage?: string | null;
  tokenTotalFollowers?: number | null;
}

const MyBookHeader: React.FC<MyBookHeaderProps> = ({ user, coinIncome, myBooksTotal, myBooksCount, tokenProfileImage, tokenTotalFollowers }) => {
  const rawProfileImage = tokenProfileImage || user?.img || user?.profileImage;
  const profileImageSrc = rawProfileImage 
    ? (rawProfileImage.startsWith('http') || rawProfileImage.startsWith('/')
        ? rawProfileImage 
        : `https://img.enjoybook.co/img/profile/${rawProfileImage}`)
    : null;
  const rawTotalFollowers = tokenTotalFollowers || user?.totalFollowers;
  const totalFollowers = rawTotalFollowers ? rawTotalFollowers.toLocaleString('en-US') : '0';
  return (
    <div className='bg-white rounded-2xl mb-6 overflow-hidden min-h-[120px] py-6'>
      <div className='flex flex-col xl:flex-row items-center justify-between h-full px-6 gap-6 xl:gap-0'>
        {/* Profile Section */}
        <div className='flex items-center gap-6 w-full xl:w-auto justify-start'>
          {/* Profile Image */}
          <div className='flex-shrink-0'>
            <div className='w-20 h-20 rounded-full overflow-hidden bg-gray-100'>
              {profileImageSrc ? (
                <Image 
                  src={profileImageSrc} 
                  alt="Profile" 
                  width="100%"
                  height="100%"
                  style={{ objectFit: 'cover' }}
                  className='w-full h-full'
                  referrerPolicy="no-referrer"
                  fallback="/images/default-avatar.png"
                  preview={{
                     mask: <div className="text-xs">ดูรูป</div>
                  }}
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-orange-100'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="16" r="8" fill="#FF6B9D"/>
                    <path d="M24 26C16 26 10 30 10 36V40H38V36C38 30 32 26 24 26Z" fill="#FF6B9D"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          {/* User Info */}
          <div className='flex flex-col gap-0.5'>
            <h2 className='text-lg font-bold font-primary text-black break-all'>{user?.fullname || 'user#00001'}</h2>
            <p className='text-sm font-primary text-gray-500 break-all'>{user?.email || 'user@gmail.com'}</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 w-full xl:w-auto'>
          {/* ยอดที่ถอนได้ */}
          <div className='flex items-center gap-0 bg-white shadow-sm overflow-hidden w-full h-[89px] rounded-xl border border-gray-100'>
            <div className='bg-gray-100 flex items-center justify-center w-[105px] h-full flex-shrink-0'>
              <svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 65 65" fill="none">
                <path d="M29.1186 45.6636V51.1616C29.1186 55.8199 24.7852 59.5844 19.4498 59.5844C14.1144 59.5844 9.75391 55.8199 9.75391 51.1616V45.6636C9.75391 50.3219 14.0873 53.6261 19.4498 53.6261C24.7852 53.6261 29.1186 50.2948 29.1186 45.6636Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M29.1142 38.2146C29.1142 39.5688 28.7351 40.8146 28.0851 41.8979C26.4872 44.525 23.21 46.1771 19.4184 46.1771C15.6267 46.1771 12.3496 44.4979 10.7517 41.8979C10.1017 40.8146 9.72266 39.5688 9.72266 38.2146C9.72266 35.8854 10.8059 33.8 12.5393 32.2834C14.2997 30.7396 16.71 29.8188 19.3913 29.8188C22.0725 29.8188 24.483 30.7667 26.2434 32.2834C28.0309 33.7729 29.1142 35.8854 29.1142 38.2146Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M29.1186 38.2144V45.6623C29.1186 50.3206 24.7852 53.6248 19.4498 53.6248C14.1144 53.6248 9.75391 50.2935 9.75391 45.6623V38.2144C9.75391 33.556 14.0873 29.7915 19.4498 29.7915C22.131 29.7915 24.5415 30.7393 26.3019 32.256C28.0353 33.7727 29.1186 35.8852 29.1186 38.2144Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M59.5828 29.7101V35.2895C59.5828 36.7791 58.3911 37.9977 56.8744 38.0519H51.566C48.641 38.0519 45.9599 35.9123 45.7161 32.9873C45.5536 31.281 46.2036 29.6831 47.3411 28.5727C48.3431 27.5435 49.7244 26.9478 51.2411 26.9478H56.8744C58.3911 27.0019 59.5828 28.2206 59.5828 29.7101Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.41602 28.4373V23.0207C5.41602 15.654 9.85769 10.5082 16.7639 9.6415C17.4681 9.53316 18.1993 9.479 18.9577 9.479H43.3327C44.0368 9.479 44.7139 9.50605 45.3639 9.61439C52.3514 10.4269 56.8743 15.5998 56.8743 23.0207V26.9478H51.241C49.7243 26.9478 48.343 27.5436 47.341 28.5727C46.2035 29.6831 45.5535 31.2811 45.716 32.9873C45.9598 35.9123 48.641 38.0519 51.566 38.0519H56.8743V41.979C56.8743 50.104 51.4577 55.5207 43.3327 55.5207H36.5618" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className='flex flex-col px-4'>
              <span className='text-sm font-primary text-gray-600'>ยอดที่ถอนได้</span>
                <span className='text-xs font-primary text-gray-600'>
                  {(() => {
                    const n = Number(coinIncome);
                    if (Number.isFinite(n)) {
                      return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' บาท';
                    }
                    // fallback: show raw string or 0.00
                    const s = coinIncome !== '' ? String(coinIncome) : '0';
                    // try to parse again
                    const p = Number(s);
                    if (Number.isFinite(p)) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' บาท';
                    return s + ' บาท';
                  })()}
                </span>
            </div>
          </div>

          
          {/* นิยายทั้งหมด */}
          <div className='flex items-center gap-0 bg-white shadow-sm overflow-hidden w-full h-[89px] rounded-xl border border-gray-100'>
            <div className='bg-gray-100 flex items-center justify-center w-[105px] h-full flex-shrink-0'>
              <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24.3743 59.5832H40.6243C54.166 59.5832 59.5827 54.1665 59.5827 40.6248V24.3748C59.5827 10.8332 54.166 5.4165 40.6243 5.4165H24.3743C10.8327 5.4165 5.41602 10.8332 5.41602 24.3748V40.6248C5.41602 54.1665 10.8327 59.5832 24.3743 59.5832Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M49.7791 41.3563V20.5292C49.7791 18.4438 48.0999 16.9271 46.0415 17.0896H45.9333C42.3041 17.3875 36.8062 19.2563 33.7187 21.1792L33.4208 21.3688C32.9333 21.6668 32.0936 21.6668 31.579 21.3688L31.1457 21.098C28.0853 19.1751 22.5874 17.3604 18.9582 17.0625C16.8999 16.9 15.2207 18.4438 15.2207 20.5022V41.3563C15.2207 43.0084 16.5748 44.5792 18.2269 44.7688L18.7144 44.85C22.4519 45.3375 28.2479 47.2605 31.552 49.075L31.6332 49.1022C32.0936 49.373 32.8519 49.373 33.2852 49.1022C36.5894 47.2605 42.4123 45.3646 46.1769 44.85L46.7457 44.7688C48.4249 44.5792 49.7791 43.0354 49.7791 41.3563Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M32.5 21.9375V47.8292" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className='flex flex-col px-4'>
              <span className='text-sm font-primary text-gray-600'>นิยายทั้งหมด</span>
              <span className='text-xs font-primary text-gray-600'>
                {myBooksTotal != null ? Number(myBooksTotal).toLocaleString('en-US') : myBooksCount}
              </span>
            </div>
          </div>
          
          {/* ผู้ติดตาม */}
          <div className='flex items-center gap-0 bg-white shadow-sm overflow-hidden w-full h-[89px] rounded-xl border border-gray-100'>
            <div className='bg-gray-100 flex items-center justify-center w-[105px] h-full flex-shrink-0'>
              <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24.8079 29.4394C24.5371 29.4123 24.2121 29.4123 23.9142 29.4394C17.4684 29.2228 12.3496 23.9415 12.3496 17.4415C12.3496 10.8061 17.7121 5.4165 24.3746 5.4165C31.01 5.4165 36.3996 10.8061 36.3996 17.4415C36.3725 23.9415 31.2538 29.2228 24.8079 29.4394Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M44.4439 10.8335C49.698 10.8335 53.923 15.0856 53.923 20.3127C53.923 25.4314 49.8605 29.6022 44.796 29.7918C44.5793 29.7647 44.3355 29.7647 44.0918 29.7918" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.2672 39.4335C4.71302 43.821 4.71302 50.971 11.2672 55.3314C18.7151 60.3147 30.9297 60.3147 38.3776 55.3314C44.9318 50.9439 44.9318 43.7939 38.3776 39.4335C30.9568 34.4772 18.7422 34.4772 11.2672 39.4335Z" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M49.6699 54.1665C51.6199 53.7603 53.4616 52.9748 54.9783 51.8103C59.2033 48.6415 59.2033 43.4144 54.9783 40.2457C53.4887 39.1082 51.6741 38.3498 49.7512 37.9165" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className='flex flex-col px-4'>
              <span className='text-sm font-primary text-gray-600'>ผู้ติดตาม</span>
              <span className='text-xs font-primary text-gray-600'>{totalFollowers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookHeader;
