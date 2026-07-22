import * as React from "react";
import Link from 'next/link';
import { Input, Select, Button, Pagination } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import MyBookCardNew from '@/components/novelCard/MyBookCardNew';
import "@/components/navbar/NovelMenu";

const { Option } = Select;

interface MyBookListTabProps {
  myBooks: any[];
  isLoadingMyBooks: boolean;
  page: number;
  setPage: (page: number) => void;
  total: number;
  limit: number;
  // Filters
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterSortBy: string;
  setFilterSortBy: (val: string) => void;
  filterOrder: string;
  setFilterOrder: (val: string) => void;
  filterEnd: string;
  setFilterEnd: (val: string) => void;
  // Search
  filterQ: string;
  setFilterQ: (val: string) => void;
}

const MyBookListTab: React.FC<MyBookListTabProps> = ({
  myBooks, isLoadingMyBooks, page, setPage, total, limit,
  filterStatus, setFilterStatus,
  filterSortBy, setFilterSortBy,
  filterOrder, setFilterOrder,
  filterEnd, setFilterEnd,
  filterQ, setFilterQ
}) => {

  return (
    <div className='py-6'>
      {/* Search Bar & Filters */}
      <div className='flex flex-col gap-4 mb-6'>
        {/* Top Row: Search */}
        <div className='flex gap-4' style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Input
            placeholder="พิมพ์ชื่อเรื่อง..."
            prefix={<SearchOutlined className='text-gray-400' />}
            value={filterQ}
            onChange={(e) => {
              setFilterQ(e.target.value);
              setPage(1);
            }}
            className='flex-1 min-w-[200px]'
            size='large'
            allowClear
          />
          <Link href="/w/nbook">
            <Button
              type="primary"
              danger
              size='large'
              style={{ backgroundColor: '#E31C3D', borderColor: '#E31C3D' }}
            >
              + สร้างนิยาย
            </Button>
          </Link>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
          <span className="text-gray-500 font-medium text-sm">ตัวกรอง:</span>

          {/* Status */}
          <Select
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            style={{ width: 140 }}
            placeholder="สถานะ"
            allowClear
          >
            <Option value="">สถานะทั้งหมด</Option>
            <Option value="publish">เผยแพร่แล้ว</Option>
            <Option value="private">ปิดเรื่อง</Option>
            <Option value="wait">รอตรวจสอบ</Option>
            <Option value="delete">ลบแล้ว</Option>
          </Select>

          {/* End Status */}
          <Select
            value={filterEnd}
            onChange={(val) => {
              setFilterEnd(val);
              setPage(1);
            }}
            style={{ width: 130 }}
            placeholder="สถานะจบ"
            allowClear
          >
            <Option value="">ทั้งหมด</Option>
            <Option value="end">จบแล้ว</Option>
            <Option value="not_end">ยังไม่จบ</Option>
          </Select>
          <span className="text-gray-500 font-medium ml-10 text-sm">เรียงตาม:</span>
          {/* Sort By */}
          <Select
            value={filterSortBy}
            onChange={(val) => {
              setFilterSortBy(val);
              setPage(1);
            }}
            style={{ width: 130 }}
            placeholder="เรียงตาม"
          >
            <Option value="date_at">วันที่ลง</Option>
            <Option value="view">ยอดวิว</Option>
            <Option value="income">รายได้</Option>
          </Select>

          {/* Order */}
          <Select
            value={filterOrder}
            onChange={(val) => {
              setFilterOrder(val);
              setPage(1);
            }}
            style={{ width: 110 }}
            placeholder="ลำดับ"
          >
            <Option value="desc">ใหม่ → เก่า</Option>
            <Option value="asc">เก่า → ใหม่</Option>
          </Select>

          <Button
            onClick={() => {
              setFilterStatus('');
              setFilterEnd('');
              setFilterSortBy('date_at');
              setFilterOrder('desc');
              setFilterQ('');
              setPage(1);
            }}
            type="text"
            className="text-gray-500 hover:text-red-500 text-xs underline"
          >
            ล้างค่า
          </Button>
        </div>
      </div>

      {/* Books Grid */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8'>
        {isLoadingMyBooks ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='h-40 bg-gray-100 rounded animate-pulse' />
          ))
        ) : (
          (() => {
            // No client-side filtering needed anymore
            const filtered = Array.isArray(myBooks) ? myBooks : [];

            return filtered.length > 0 ? (
              filtered.map((book: any) => (
                <MyBookCardNew key={book.book_id ?? book.id ?? book._id} book={book} />
              ))
            ) : (
              <div className='col-span-full text-center text-gray-500 py-8'>
                <div className="flex flex-col items-center justify-center opacity-60">
                  <svg className="w-16 h-16 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  <span>ไม่พบนิยายตามเงื่อนไข</span>
                </div>
              </div>
            )
          })()
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex justify-center">
          <Pagination
            current={page}
            total={total}
            pageSize={limit}
            onChange={(p) => setPage(p)}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

export default MyBookListTab;
