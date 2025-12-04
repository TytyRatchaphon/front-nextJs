import React, { useState } from 'react';
import Link from 'next/link';
import { Input, Select, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import MyCardBook from '@/components/MyBookCard';

const { Option } = Select;

interface MyBookListTabProps {
  myBooks: any[];
  isLoadingMyBooks: boolean;
}

const MyBookListTab: React.FC<MyBookListTabProps> = ({ myBooks, isLoadingMyBooks }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

  return (
    <div className='py-6'>
      {/* Search Bar */}
      <div className='flex gap-4 mb-6'>
        <Input
          placeholder="พิมพ์ชื่อเรื่อง"
          prefix={<SearchOutlined className='text-gray-400' />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className='flex-1'
          size='large'
        />
        <Select
          value={selectedCategory}
          onChange={(value) => setSelectedCategory(value)}
          style={{ width: 200 }}
          size='large'
        >
          <Option value="ทั้งหมด">ทั้งหมด</Option>
          <Option value="โรแมนติก">โรแมนติก</Option>
          <Option value="แฟนตาซี">แฟนตาซี</Option>
          <Option value="ดราม่า">ดราม่า</Option>
        </Select>
        <Link href="/w/nbook">
          <Button 
            type="primary" 
            danger 
            size='large'
            style={{ backgroundColor: '#E31C3D', borderColor: '#E31C3D' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF4D6D';
              e.currentTarget.style.borderColor = '#FF4D6D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#E31C3D';
              e.currentTarget.style.borderColor = '#E31C3D';
            }}
          >
            + สร้างนิยาย
          </Button>
        </Link>
      </div>

      {/* Books Grid */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
        {isLoadingMyBooks ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='h-40 bg-gray-100 rounded animate-pulse' />
          ))
        ) : (Array.isArray(myBooks) && myBooks.length > 0) ? (
          myBooks.map((book: any) => (
            <MyCardBook key={book.book_id ?? book.id ?? book._id} book={book} />
          ))
        ) : (
          <div className='col-span-full text-center text-gray-500 py-8'>ยังไม่มีนิยาย</div>
        )}
      </div>
    </div>
  );
};

export default MyBookListTab;
