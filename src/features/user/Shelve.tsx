'use client';

import React, { useState } from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import CardBook from '@/components/CardBook';

function Shelve() {
  const [activeTab, setActiveTab] = useState('1');

  // Mock data สำหรับหนังสือ
  const mockBooks = [
    {
      book_id: 1,
      bookID: '1',
      type: 'novel',
      img: '',
      name: 'รักนี้ไม่มีวันจบ',
      title: 'รักนี้ไม่มีวันจบ',
      tag: 'โรแมนติก',
      view: 125000,
      heart: 1200,
      flower: 850,
      end: 'end' as const,
    },
    {
      book_id: 2,
      bookID: '2',
      type: 'novel',
      img: '',
      name: 'เงาแห่งความฝัน',
      title: 'เงาแห่งความฝัน',
      tag: 'แฟนตาซี',
      view: 98000,
      heart: 950,
      flower: 620,
      end: 'end' as const,
    },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: 'ชั้นหนังสือ',
      children: (
        <div className='py-6'>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
            {mockBooks.map((book) => (
              <CardBook key={book.book_id} book={book} />
            ))}
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: 'อ่านต่อ',
      children: (
        <div className='py-6 text-center text-gray-500'>
          ยังไม่มีหนังสือที่อ่านต่อ
        </div>
      ),
    },
    {
      key: '3',
      label: 'ซื้อแล้ว',
      children: (
        <div className='py-6 text-center text-gray-500'>
          ยังไม่มีหนังสือที่ซื้อแล้ว
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
        {/* Page Title */}
        <h1 className='text-3xl font-semibold mb-8 text-center'>ชั้นหนังสือ</h1>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className='custom-tabs-red'
        />
      </div>

      {/* Custom Tab Styling */}
      <style jsx global>{`
        .custom-tabs-red .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #E31C3D;
        }
        .custom-tabs-red .ant-tabs-ink-bar {
          background: #E31C3D;
        }
        .custom-tabs-red .ant-tabs-tab:hover .ant-tabs-tab-btn {
          color: #E31C3D;
        }
      `}</style>
    </div>
  );
}

export default Shelve;