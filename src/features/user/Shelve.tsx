"use client";
import * as React from "react";
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { App, Empty, Pagination, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import GifLoader from '@/components/utility/GifLoader';
import CardBook from '@/components/novelCard/CardBook';
import CollectionTab from '@/components/collection/CollectionTab';
import ContinueCardBook from '@/components/novelCard/ContinueCardbook';
import {
  fetchUserShelve,
  fetchUserShelveBuy,
  fetchUserShelveContinue,
  pinBookShelve,
} from '@/services/apiServices';
import { normalizeBookData, normalizeContinueBook } from '@/utils/bookMappers';
import type { BookData } from '@/types/api';

type ShelvePayload = {
  books: BookData[];
  paginate: {
    total?: number;
    limit?: number;
    page?: number;
    totalPages?: number;
  } | null;
};

const freshShelveQueryOptions = {
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: 'always' as const,
  refetchOnReconnect: 'always' as const,
  refetchOnWindowFocus: true,
};

function ShelvePinButton({
  pinned,
  loading,
  onClick,
}: {
  pinned: boolean;
  loading: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={pinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
      className={`absolute right-[-10px] top-[-10px] z-30 flex h-7 w-7 items-center justify-center rounded-full border shadow-lg transition-all duration-200 sm:right-[-10px] sm:top-[-10px] sm:h-8 sm:w-8 ${
        pinned
          ? 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600'
          : 'border-gray-200 bg-white text-gray-400 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-500'
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={pinned ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 17v5" />
        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z" />
      </svg>
    </button>
  );
}

function Shelve() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { notification } = App.useApp();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    if (tabParam && ['1', '2', '3', '4'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [pageShelve, setPageShelve] = useState(1);
  const [pageContinue, setPageContinue] = useState(1);
  const [pageBuy, setPageBuy] = useState(1);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['userShelve'] });
      queryClient.removeQueries({ queryKey: ['userShelveContinue'] });
      queryClient.removeQueries({ queryKey: ['userShelveBuy'] });
    };
  }, [queryClient]);

  const { data: shelveData, isLoading, isError, refetch: refetchShelve } = useQuery({
    queryKey: ['userShelve', pageShelve],
    queryFn: () => fetchUserShelve(20, pageShelve),
    ...freshShelveQueryOptions,
  });

  const books: BookData[] = shelveData?.books ?? [];
  const sortedShelveBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      if (Boolean(a?.is_pin) === Boolean(b?.is_pin)) return 0;
      return a?.is_pin ? -1 : 1;
    });
  }, [books]);
  const totalShelve = shelveData?.paginate?.total ?? 0;

  const userId =
    typeof window !== 'undefined' ? localStorage.getItem('userId') ?? localStorage.getItem('user_id') ?? '10' : '10';

  const {
    data: continueData,
    isLoading: contLoading,
    isError: contError,
    refetch: refetchContinue,
  } = useQuery({
    queryKey: ['userShelveContinue', userId, pageContinue],
    queryFn: () => fetchUserShelveContinue(20, pageContinue),
    enabled: !!userId,
    ...freshShelveQueryOptions,
  });

  const continueBooks: BookData[] = continueData?.books ?? [];
  const totalContinue = continueData?.paginate?.total ?? 0;

  const {
    data: buyData,
    isLoading: buyLoading,
    isError: buyError,
    refetch: refetchBuy,
  } = useQuery({
    queryKey: ['userShelveBuy', userId, pageBuy],
    queryFn: () => fetchUserShelveBuy(20, pageBuy),
    enabled: !!userId,
    ...freshShelveQueryOptions,
  });

  const buyBooks: BookData[] = buyData?.books ?? [];
  const totalBuy = buyData?.paginate?.total ?? 0;

  const pinMutation = useMutation({
    mutationFn: ({ bookId, nextPinned }: { bookId: number; nextPinned: boolean }) =>
      pinBookShelve([bookId], nextPinned ? 'pin' : 'unpin'),
    onMutate: async ({ bookId, nextPinned }) => {
      await queryClient.cancelQueries({ queryKey: ['userShelve'] });
      const previousPages = queryClient.getQueriesData<ShelvePayload>({ queryKey: ['userShelve'] });

      previousPages.forEach(([queryKey, data]) => {
        if (!data?.books) return;

        queryClient.setQueryData<ShelvePayload>(queryKey, {
          ...data,
          books: data.books.map((book) =>
            Number(book.book_id ?? book.bookID ?? book.id) === bookId ? { ...book, is_pin: nextPinned } : book
          ),
        });
      });

      return { previousPages };
    },
    onError: (_error, _variables, context) => {
      context?.previousPages?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      notification.error({
        message: 'ไม่สามารถอัปเดตการปักหมุดได้',
        placement: 'topRight',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userShelve'] });
    },
  });

  const handlePinToggle = (book: BookData) => {
    const rawBookId = book.book_id ?? book.bookID ?? book.id;
    const bookId = Number(rawBookId);
    if (!bookId) return;

    pinMutation.mutate({
      bookId,
      nextPinned: !Boolean(book.is_pin),
    });
  };

  const renderPagination = (current: number, total: number, onChange: (page: number) => void) => {
    if ((total || 0) <= 20) return null;

    return (
      <div className="mt-8 flex justify-center">
        <Pagination
          current={current}
          total={total || 0}
          pageSize={20}
          onChange={(page) => {
            onChange(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          showSizeChanger={false}
          className="custom-pagination-red"
        />
      </div>
    );
  };

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: 'ชั้นหนังสือ',
      children: (
        <div className="py-2">
          {isLoading ? (
            <GifLoader className="h-[400px]" />
          ) : isError ? (
            <div className="py-4 text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
          ) : sortedShelveBooks.length === 0 ? (
            <div className="py-4">
              <Empty description="ยังไม่มีหนังสือ" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {sortedShelveBooks.map((book) => {
                  const mapped = normalizeBookData(book);
                  const bookKey = mapped.book_id ?? mapped.bookID;
                  const isPinned = Boolean(book.is_pin);

                  return (
                    <div key={bookKey} className="mx-auto w-fit">
                      <div className="relative">
                      <ShelvePinButton
                        pinned={isPinned}
                        loading={pinMutation.isPending}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handlePinToggle(book);
                        }}
                      />

                      {isPinned ? (
                        <span className="pointer-events-none absolute left-2 top-2 z-20 flex items-center gap-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[0px] font-semibold text-white shadow-md sm:left-3 sm:top-3 sm:gap-1 sm:px-2 sm:text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                            <path d="M12 17v5" />
                            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z" />
                          </svg>
                          ปักหมุด
                        </span>
                      ) : null}

                        <CardBook book={mapped} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {renderPagination(pageShelve, totalShelve, setPageShelve)}
            </>
          )}
        </div>
      ),
    },
    {
      key: '2',
      label: 'อ่านต่อ',
      children: (
        <div className="py-2">
          {contLoading ? (
            <GifLoader className="h-[400px]" />
          ) : contError ? (
            <div className="py-2 text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
          ) : continueBooks.length === 0 ? (
            <div className="py-4">
              <Empty description="ยังไม่มีหนังสือที่อ่านต่อ" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {continueBooks.map((book) => {
                  const mapped = normalizeContinueBook(book);
                  return <ContinueCardBook key={`${mapped.book_id ?? mapped.bookID}-${mapped.ep_id ?? '0'}`} book={mapped} />;
                })}
              </div>
              {renderPagination(pageContinue, totalContinue, setPageContinue)}
            </>
          )}
        </div>
      ),
    },
    {
      key: '3',
      label: 'ซื้อแล้ว',
      children: (
        <div className="py-2">
          {buyLoading ? (
            <GifLoader className="h-[400px]" />
          ) : buyError ? (
            <div className="py-2 text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
          ) : buyBooks.length === 0 ? (
            <div className="py-4">
              <Empty description="ยังไม่มีหนังสือที่ซื้อแล้ว" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {buyBooks.map((book) => {
                  const mapped = normalizeBookData(book);
                  return <CardBook key={mapped.book_id ?? mapped.bookID} book={mapped} />;
                })}
              </div>
              {renderPagination(pageBuy, totalBuy, setPageBuy)}
            </>
          )}
        </div>
      ),
    },
    {
      key: '4',
      label: 'คอลเลคชัน',
      children: <CollectionTab />,
    },
  ];

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === '1') refetchShelve();
    if (key === '2') refetchContinue();
    if (key === '3') refetchBuy();
  };

  return (
    <div className="min-h-screen bg-white py-6">
      <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
        <h1 className="mb-6 text-center text-3xl font-semibold">ชั้นหนังสือ</h1>

        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} className="custom-tabs-red" />
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
        :global(.custom-pagination-red .ant-pagination-item-active) {
          border-color: #dc2626 !important;
        }
        :global(.custom-pagination-red .ant-pagination-item-active a) {
          color: #dc2626 !important;
        }
        :global(.custom-pagination-red .ant-pagination-item:hover) {
          border-color: #dc2626 !important;
        }
        :global(.custom-pagination-red .ant-pagination-item:hover a) {
          color: #dc2626 !important;
        }
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
          background-color: rgba(227, 28, 61, 0.06) !important;
          color: #E31C3D !important;
          border-color: rgba(227, 28, 61, 0.12) !important;
        }
      `}</style>
    </div>
  );
}

export default Shelve;
