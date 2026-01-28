import Link from 'next/link';
import React from 'react';

const BannerButtons = () => {
  return (
    <div className="w-full mt-6 lg:mt-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        
        {/* Discount */}
        <Link href="/campaign-discount" className="group flex items-center justify-center gap-3 bg-white border border-gray-100 shadow-sm hover:shadow-sm rounded-xl py-2 px-4 transition-all duration-300 hover:-translate-y-1">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M6.73 19.7C7.55 18.82 8.8 18.89 9.52 19.85L10.53 21.2C11.34 22.27 12.65 22.27 13.46 21.2L14.47 19.85C15.19 18.89 16.44 18.82 17.26 19.7C19.04 21.6 20.49 20.97 20.49 18.31V7.04C20.5 3.01 19.56 2 15.78 2H8.22C4.44 2 3.5 3.01 3.5 7.04V18.3C3.5 20.97 4.96 21.59 6.73 19.7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 13L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.9945 13H15.0035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.99451 7.5H9.00349" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-700 group-hover:text-red-600 transition-colors text-sm lg:text-lg">ส่วนลด</span>
        </Link>

        {/* Campaign */}
        <Link href="/campaign" className="group flex items-center justify-center gap-3 bg-white border border-gray-100 shadow-sm hover:shadow-sm rounded-xl py-2 px-4 transition-all duration-300 hover:-translate-y-1">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          </div>
          <span className="font-bold text-gray-700 group-hover:text-amber-600 transition-colors text-sm lg:text-lg">กิจกรรม</span>
        </Link>

        {/* Top Charts */}
        <Link href="/ranking" className="group flex items-center justify-center gap-3 bg-white border border-gray-100 shadow-sm hover:shadow-sm rounded-xl py-2 px-4 transition-all duration-300 hover:-translate-y-1">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M2 2V19C2 20.66 3.34 22 5 22H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 17L9.59 11.64C10.35 10.76 11.7 10.7 12.52 11.53L13.47 12.48C14.29 13.3 15.64 13.25 16.4 12.37L21 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-700 group-hover:text-blue-600 transition-colors text-sm lg:text-lg">นิยายติดอันดับ</span>
        </Link>

        {/* Bookshelf */}
        <Link href="/shelve" className="group flex items-center justify-center gap-3 bg-white border border-gray-100 shadow-sm hover:shadow-sm rounded-xl py-2 px-4 transition-all duration-300 hover:-translate-y-1">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M21.6602 10.44L20.6802 14.62C19.8402 18.23 18.1802 19.69 15.0602 19.39C14.5602 19.35 14.0202 19.26 13.4402 19.12L11.7602 18.72C7.59018 17.73 6.30018 15.67 7.28018 11.49L8.26018 7.30001C8.46018 6.45001 8.70018 5.71001 9.00018 5.10001C10.1702 2.68001 12.1602 2.03001 15.5002 2.82001L17.1702 3.21001C21.3602 4.19001 22.6402 6.26001 21.6602 10.44Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.0603 19.39C14.4403 19.81 13.6603 20.16 12.7103 20.47L11.1303 20.99C7.16034 22.27 5.07034 21.2 3.78034 17.23L2.50034 13.28C1.22034 9.30998 2.28034 7.20998 6.25034 5.92998L7.83034 5.40998C8.24034 5.27998 8.63034 5.16998 9.00034 5.09998C8.70034 5.70998 8.46034 6.44998 8.26034 7.29998L7.28034 11.49C6.30034 15.67 7.59034 17.73 11.7603 18.72L13.4403 19.12C14.0203 19.26 14.5603 19.35 15.0603 19.39Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12.6396 8.53003L17.4896 9.76003" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.6602 12.4L14.5602 13.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-700 group-hover:text-green-600 transition-colors text-sm lg:text-lg">ชั้นหนังสือ</span>
        </Link>

      </div>
    </div>
  );
};

export default BannerButtons;
