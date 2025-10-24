import React from 'react'

function SearchBar() {
  return (
    <div>
        <div className='bg-secondary py-10 px-4'>
            <div className='w-full flex flex-col justify-center items-center'>
                <div className='flex flex-col px-3 lg:max-w-[1000px] w-full lg:w-full max-w-full relative '>
                    <p className='mb-5 text-xl'>คำค้นหา</p>
                    <div className='flex flex-wrap relative'>
                        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="text-gray-500 text-sm search-icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"></path></svg>
                        </div>
                    <input type="text" className='input block w-full rounded-md border-0 py-1.5 pl-11 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white' />
                    <div className='absolute inset-y-0 right-0 flex items-center px-4 pl-3 bg-primary text-white rounded-r-md cursor-pointer'>
                        <div className='absolute inset-y-0 right-0 flex items-center px-4 pl-3 bg-primary text-white rounded-r-md cursor-pointer'>
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="text-white text-sm search-icon mr-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"></path></svg>
                            ค้นหา
                        </div>
                    </div>  
                    </div>
                    <div className='my-4 grid grid-cols-2 md:grid-cols-4 gap-8 mb-9'>
                        <div>
                            <p className='mb-4 text-xl'>
                                หมวดหมู่
                            </p>
                            <select className="select"><option value="">ทั้งหมด</option><option value="23">นิยายแปลจีน</option><option value="24">นิยายแปลเกาหลี</option><option value="25">นิยายแปลญี่ปุ่น</option><option value="26">นิยายแปลอังกฤษ</option><option value="27">นิยายแปลอื่นๆ</option><option value="2">โรแมนติก</option><option value="8">แฟนตาซี</option><option value="7">ย้อนเวลา</option><option value="5">กีฬา</option><option value="20">Boylove โรมานซ์</option><option value="18">ระบบ</option><option value="19">รักโรมานซ์</option><option value="21">Girl love โรมานซ์</option><option value="22">เรื่องสั้น</option><option value="16">ย้อนยุค / วินเทจ / โบราณ</option><option value="6">ผจญภัย</option><option value="14">Boyslove(BL)</option><option value="4">สืบสวนสอบสวน</option><option value="3">รักวัยรุ่น</option><option value="17">เกมออนไลน์</option><option value="13">กำลังภายใน</option><option value="15">GirlsLove(GL)</option></select>
                        </div>
                        <div>
                            <p className='mb-4 text-xl'>
                                ประเภท
                            </p>
                            <select className="select mt-2"><option value="">ทั้งหมด</option><option value="tran">นิยายแปล</option><option value="write">นิยายแต่ง</option><option value="fanfic">แฟนฟิค</option></select>
                        </div>
                        <div>
                            <p className='mb-4 text-xl'>
                                สถานะเรื่อง
                            </p>
                            <select className="select"><option value="">ทั้งหมด</option><option value="end">จบแล้ว</option><option value="not_end">ยังไม่จบ</option></select>

                        </div>
                        <div>
                            <p className='mb-4 text-xl'>
                                เรียงตาม
                            </p>
                            <select className="select"><option value="Popular">เข้าชมสูงสุด</option><option value="Update">อัพเดตล่าสุด</option><option value="date_at">เรื่องใหม่ล่าสุด</option></select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default SearchBar