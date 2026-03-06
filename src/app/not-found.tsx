import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 font-primary text-center">
            <div className="bg-red-50 text-red-500 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
                <svg 
                    className="w-12 h-12" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2}
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                </svg>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                404
            </h1>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                ไม่พบหน้าที่คุณค้นหา
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                หน้าเว็บที่คุณกำลังพยายามเข้าถึงอาจถูกลบ เปลี่ยนชื่อ หรือไม่มีอยู่จริง กรุณาตรวจสอบ URL อีกครั้ง หรือกลับไปยังหน้าหลัก
            </p>
            
            <Link 
                href="/" 
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
                กลับสู่หน้าหลัก
            </Link>
        </div>
    );
}
