import Link from 'next/link';
const BannerButtons = () => {
  return (
    <div className="w-full -mt-1 mb-1">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {/* Discount */}
        {/* Top Charts */}
        <Link href="/cat/all?type=tran&categoryId=all&tab=bestseller&limit=10&page=1" className="group flex items-center justify-center gap-3 bg-white border border-gray-100 shadow-sm hover:shadow-sm rounded-xl py-2 px-4 transition-all duration-300 hover:-translate-y-1">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19.0603 18.67L16.9203 14.4L14.7803 18.67" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.1699 17.9099H18.6899" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.9198 22.0001C14.1198 22.0001 11.8398 19.73 11.8398 16.92C11.8398 14.12 14.1098 11.8401 16.9198 11.8401C19.7198 11.8401 21.9998 14.11 21.9998 16.92C21.9998 19.73 19.7298 22.0001 16.9198 22.0001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.02 2H8.94C11.01 2 12.01 3.00002 11.96 5.02002V8.94C12.01 11.01 11.01 12.01 8.94 11.96H5.02C3 12 2 11 2 8.92999V5.01001C2 3.00001 3 2 5.02 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.01019 5.84985H4.9502" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.9707 5.16992V5.84991" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.99043 5.83997C7.99043 7.58997 6.62043 9.00995 4.94043 9.00995" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.01015 9.01001C8.28015 9.01001 7.62016 8.62 7.16016 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 15C2 18.87 5.13 22 9 22L7.95 20.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 9C22 5.13 18.87 2 15 2L16.05 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-700 group-hover:text-purple-600 transition-colors text-sm lg:text-lg">นิยายแปล</span>
        </Link>

        <Link href="/cat/all?type=write&categoryId=all&tab=bestseller&limit=10&page=1" className="group flex items-center justify-center gap-3 bg-white border border-gray-100 shadow-sm hover:shadow-sm rounded-xl py-2 px-4 transition-all duration-300 hover:-translate-y-1">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <g clipPath="url(#clip0_41_3681)">
                <path d="M10.9697 2H8.96973C3.96973 2 1.96973 4 1.96973 9V15C1.96973 20 3.96973 22 8.96973 22H14.9697C19.9697 22 21.9697 20 21.9697 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21.8804 3.56001C20.6504 6.63001 17.5604 10.81 14.9804 12.88L13.4004 14.14C13.2004 14.29 13.0004 14.41 12.7704 14.5C12.7704 14.35 12.7604 14.2 12.7404 14.04C12.6504 13.37 12.3504 12.74 11.8104 12.21C11.2604 11.66 10.6004 11.35 9.92043 11.26C9.76043 11.25 9.60043 11.24 9.44043 11.25C9.53043 11 9.66043 10.77 9.83043 10.58L11.0904 9.00001C13.1604 6.42001 17.3504 3.31001 20.4104 2.08001C20.8804 1.90001 21.3404 2.04001 21.6304 2.33001C21.9304 2.63001 22.0704 3.09001 21.8804 3.56001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12.7801 14.49C12.7801 15.37 12.4401 16.21 11.8101 16.85C11.3201 17.34 10.6601 17.68 9.87009 17.78L7.90009 17.99C6.83009 18.11 5.91009 17.2 6.03009 16.11L6.24009 14.14C6.43009 12.39 7.89009 11.27 9.45009 11.24C9.61009 11.23 9.77009 11.24 9.93009 11.25C10.6101 11.34 11.2701 11.65 11.8201 12.2C12.3601 12.74 12.6601 13.36 12.7501 14.03C12.7701 14.19 12.7801 14.35 12.7801 14.49Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.8203 11.98C15.8203 9.89 14.1303 8.19 12.0303 8.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_41_3681">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </div>
          <span className="font-bold text-gray-700 group-hover:text-red-600 transition-colors text-sm lg:text-lg">นิยายแต่ง</span>
        </Link>

        {/* Campaign */}
        <Link href="/campaign" className="group flex items-center justify-center gap-3 bg-white border border-gray-100 shadow-sm hover:shadow-sm rounded-xl py-2 px-4 transition-all duration-300 hover:-translate-y-1">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M6.73 19.7C7.55 18.82 8.8 18.89 9.52 19.85L10.53 21.2C11.34 22.27 12.65 22.27 13.46 21.2L14.47 19.85C15.19 18.89 16.44 18.82 17.26 19.7C19.04 21.6 20.49 20.97 20.49 18.31V7.04C20.5 3.01 19.56 2 15.78 2H8.22C4.44 2 3.5 3.01 3.5 7.04V18.3C3.5 20.97 4.96 21.59 6.73 19.7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 13L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.9945 13H15.0035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.99451 7.5H9.00349" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-700 group-hover:text-amber-600 transition-colors text-sm lg:text-lg">ส่วนลด</span>
        </Link>

        {/* Event */}
        <Link href="/events" className="group flex items-center justify-center gap-3 bg-white border border-gray-100 shadow-sm hover:shadow-sm rounded-xl py-2 px-4 transition-all duration-300 hover:-translate-y-1">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.5 9.08997H20.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.6947 13.7H15.7037" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.6947 16.7H15.7037" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.9955 13.7H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.9955 16.7H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.29431 13.7H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.29431 16.7H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-700 group-hover:text-green-600 transition-colors text-sm lg:text-lg">กิจกรรม</span>
        </Link>

      </div>
    </div>
  );
};

export default BannerButtons;
