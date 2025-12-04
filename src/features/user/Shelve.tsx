'use client';

import React, { useState } from 'react';
import { Tabs, Spin, Empty } from 'antd';
import type { TabsProps } from 'antd';
import CardBook from '@/components/novel/CardBook';
import ContinueCardBook from '@/components/ContinueCardbook';
import { useQuery } from '@tanstack/react-query';
import { fetchUserShelve, fetchUserShelveContinue, fetchUserShelveBuy } from '@/services/apiServices';

function Shelve() {
  const [activeTab, setActiveTab] = useState('1');

  const { data: shelveData, isLoading, isError } = useQuery({
    queryKey: ['userShelve'],
    queryFn: async () => {
      return await fetchUserShelve();
    },
  });

  const books: any[] = Array.isArray(shelveData) ? shelveData : [];

  // determine user id to call continue API; try localStorage, fall back to '10'
  const userId = (typeof window !== 'undefined') ? (localStorage.getItem('userId') ?? localStorage.getItem('user_id') ?? '10') : '10'

  const { data: continueData, isLoading: contLoading, isError: contError } = useQuery({
    queryKey: ['userShelveContinue', userId],
    queryFn: async () => {
      return await fetchUserShelveContinue(userId)
    },
    enabled: !!userId,
  })

  const continueBooks: any[] = Array.isArray(continueData) ? continueData : [];

  const { data: buyData, isLoading: buyLoading, isError: buyError } = useQuery({
    queryKey: ['userShelveBuy', userId],
    queryFn: async () => {
      return await fetchUserShelveBuy(userId)
    },
    enabled: !!userId,
  })

  const buyBooks: any[] = Array.isArray(buyData) ? buyData : [];

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: 'ชั้นหนังสือ',
      children: (
        <div className='py-6'>
          {isLoading ? (
            <div className='flex justify-center py-8'>
              <Spin />
            </div>
          ) : isError ? (
            <div className='py-6 text-center text-red-500'>เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
          ) : books.length === 0 ? (
            <div className='py-8'>
              <Empty description="ยังไม่มีหนังสือ" />
            </div>
          ) : (
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
              {books.map((b: any) => {
                const mapped = {
                  book_id: b.book_id ?? b.bookID ?? b.id,
                  bookID: b.bookID ?? b.book_id,
                  img: b.img ?? b.imgtn ?? b.imgtn_url,
                  name: b.name ?? b.title,
                  title: b.title ?? b.name,
                  author: b.writer_name ?? b.user_name ?? b.author,
                  view: Number(b.view ?? 0),
                  chapter: Number(b.chapter ?? 0),
                  shelveCount: Number(b.shelveCount ?? b.shelf_count ?? 0),
                  end: b.end,
                };
                return <CardBook key={mapped.book_id ?? mapped.bookID} book={mapped} />;
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: '2',
      label: 'อ่านต่อ',
      children: (
        <div className='py-6'>
          {contLoading ? (
            <div className='flex justify-center py-8'>
              <Spin />
            </div>
          ) : contError ? (
            <div className='py-6 text-center text-red-500'>เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
          ) : continueBooks.length === 0 ? (
            <div className='py-8'>
              <Empty description="ยังไม่มีหนังสือที่อ่านต่อ" />
            </div>
          ) : (
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
              {continueBooks.map((b: any) => {
                const mapped = {
                  book_id: b.book_id ?? b.bookID ?? b.id ?? 0,
                  bookID: b.bookID ?? b.book_id ?? '',
                  img: b.img ?? b.imgtn ?? b.imgtn_url ?? '',
                  name: b.name ?? b.title ?? '',
                  title: b.title ?? b.name ?? '',
                  author: b.writer_name ?? b.user_name ?? b.author ?? '',
                  view: Number(b.view ?? 0),
                  chapter: Number(b.chapter ?? 0),
                  shelveCount: Number(b.shelveCount ?? b.shelf_count ?? 0),
                  end: b.end ?? b.status ?? '',
                  // episode fields for ContinueCardBook
                  ep_id: b.last_read_ep_id ?? b.ep_id ?? b.epID ?? b.epId ?? b.epid ?? b.epIDStr ?? b.epIDStr ?? b.ep_id,
                  epName: b.epName ?? b.ep_name ?? b.epname ?? b.last_read_ep_name ?? '',
                  last_read_at: b.last_read_at,
                  isBestSeller: b.isBestSeller,
                  isNew: b.isNew,
                  isNewEp: b.isNewEp,
                  discount: b.discount,
                  img_full: b.img_full,
                  status: b.status,
                }
                return <ContinueCardBook key={`${mapped.book_id ?? mapped.bookID}-${mapped.ep_id ?? '0'}`} book={mapped} />;
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: '3',
      label: 'ซื้อแล้ว',
      children: (
        <div className='py-6'>
          {buyLoading ? (
            <div className='flex justify-center py-8'>
              <Spin />
            </div>
          ) : buyError ? (
            <div className='py-6 text-center text-red-500'>เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
          ) : buyBooks.length === 0 ? (
            <div className='py-8'>
              <Empty description="ยังไม่มีหนังสือที่ซื้อแล้ว" />
            </div>
          ) : (
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
              {buyBooks.map((b: any) => {
                const mapped = {
                  book_id: b.book_id ?? b.bookID ?? b.id ?? 0,
                  bookID: b.bookID ?? b.book_id ?? '',
                  img: b.img ?? b.imgtn ?? b.imgtn_url ?? '',
                  name: b.name ?? b.title ?? '',
                  title: b.title ?? b.name ?? '',
                  author: b.writer_name ?? b.user_name ?? b.author ?? '',
                  view: Number(b.view ?? 0),
                  chapter: Number(b.chapter ?? b.chapters ?? 0),
                  shelveCount: Number(b.shelveCount ?? b.shelf_count ?? 0),
                  end: b.end ?? b.status ?? '',
                }
                return <CardBook key={mapped.book_id ?? mapped.bookID} book={mapped} />;
              })}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
        <h1 className='text-3xl font-semibold mb-8 text-center'>ชั้นหนังสือ</h1>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className='custom-tabs-red'
        />
      </div>

      <style jsx global>{`
       :global(.ant-tabs-tab:hover) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover svg path) {
          fill: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active svg path) {
          fill: #dc2626 !important;
        }
        :global(.ant-tabs-ink-bar) {
          background: #dc2626 !important;
        }
        /* Withdraw modal button styles */
        :global(.withdraw-modal .ant-modal-footer .ant-btn) {
          transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease !important;
        }
        :global(.withdraw-modal .ant-modal-footer .ant-btn-primary) {
          background-color: #E31C3D !important;
          border-color: #E31C3D !important;
          color: #ffffff !important;
        }
        :global(.withdraw-modal .ant-modal-footer .ant-btn-primary:hover) {
          background-color: #C41230 !important;
          border-color: #C41230 !important;
          color: #ffffff !important;
        }
        :global(.withdraw-modal .ant-modal-footer .ant-btn:not(.ant-btn-primary)) {
          background-color: transparent !important;
          color: inherit !important;
          border-color: transparent !important;
        }
        :global(.withdraw-modal .ant-modal-footer .ant-btn:not(.ant-btn-primary):hover) {
          background-color: rgba(227,28,61,0.06) !important;
          color: #E31C3D !important;
          border-color: rgba(227,28,61,0.12) !important;
        }
      `}</style>
    </div>
  );
}

export default Shelve;