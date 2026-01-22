'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { fetchUserMyBookInfo, fetchUserMyBooks, fetchWriterCheck } from '@/services/apiServices';

import MyBookHeader from '../../components/myBook/MyBookHeader';
import MyBookListTab from '../../components/myBook/MyBookListTab';
import MyBookStatsTab from '../../components/myBook/MyBookStatsTab';
import MyBookSalesTab from '../../components/myBook/MyBookSalesTab';
import MyBookWithdrawTab from '../../components/myBook/MyBookWithdrawTab';
import MyBookWriterInfoTab from '../../components/myBook/MyBookWriterInfoTab';

function MyBook() {
  const router = useRouter();
  const { user, token, isLoggedIn, updateToken, hasMounted } = useAuthStore();

  // Check if user is logged in — wait until persisted store has hydrated
  useEffect(() => {
    if (!hasMounted) return; // wait for hydration

    if (!isLoggedIn || !token) {
      // Try to recover from localStorage backup first (in case hydration missed)
      try {
        const backupToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        if (backupToken) {
          // Apply backup token to auth store and avoid redirect
          useAuthStore.getState().updateToken(backupToken);
          return;
        }
      } catch (e) {
      }

      router.push('/');
    }
  }, [hasMounted, isLoggedIn, token, router]);

  // Writer Check API
  const { data: writerCheckData, isLoading: isWriterCheckLoading } = useQuery({
    queryKey: ['writerCheck', token],
    queryFn: fetchWriterCheck,
    enabled: !!token,
  });

  // Calculate isWriter based on API status
  // User logic:
  // - is_writer === true -> Show Dashboard
  // - is_writer === false -> Show Form
  const isWriter = useMemo(() => {
    if (!writerCheckData) return false;
    return !!writerCheckData.is_writer;
  }, [writerCheckData]);

  // Should we show the form?
  // Show form if:
  // 1. Loaded
  // 2. is_writer is false
  const shouldShowWriterForm = useMemo(() => {
    if (isWriterCheckLoading) return false;
    if (!writerCheckData) return true; // Default to form if no data
    return !writerCheckData.is_writer;
  }, [writerCheckData, isWriterCheckLoading]);


  const [coinIncome, setCoinIncome] = useState<string | number>('');
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [userTotalFollowers, setUserTotalFollowers] = useState<number | null>(null);

  // Set user data when component mounts
  useEffect(() => {
    if (user) {
      if ((user as any).coinIncome !== undefined && (user as any).coinIncome !== null) {
        const raw = (user as any).coinIncome;
        const parsed = Number(raw);
        setCoinIncome(Number.isFinite(parsed) ? parsed : String(raw));
      }
      if ((user as any).totalFollowers !== undefined) {
        setUserTotalFollowers((user as any).totalFollowers);
      }
    }
  }, [user]);

  // Prefill coinIncome from decoded token when available
  useEffect(() => {
    if (!token) return;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const decodedToken = JSON.parse(jsonPayload);

      // coinIncome from token (if present) - show in stats
      if (decodedToken.coinIncome !== undefined && decodedToken.coinIncome !== null) {
        // prefer numeric if possible
        const parsed = Number(decodedToken.coinIncome);
        setCoinIncome(Number.isFinite(parsed) ? parsed : String(decodedToken.coinIncome));
      }

      // Extract profile image from token
      if (decodedToken.profile_image || decodedToken.img || decodedToken.profileImage) {
        setUserProfileImage(decodedToken.profile_image || decodedToken.img || decodedToken.profileImage);
      }

      // Extract total followers from token
      if (decodedToken.totalFollowers !== undefined && decodedToken.totalFollowers !== null) {
        setUserTotalFollowers(Number(decodedToken.totalFollowers));
      }
    } catch (e) {
      // ignore decode errors
    }
  }, [token]);

  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>(''); // Default: All (empty string)
  const [filterSortBy, setFilterSortBy] = useState<string>('date_at');
  const [filterOrder, setFilterOrder] = useState<string>('desc');
  const [filterEnd, setFilterEnd] = useState<string>('');
  const [filterQ, setFilterQ] = useState<string>('');

  // Fetch user's books for the "งานเขียน" tab and "สถิติ" dropdown
  const [booksPage, setBooksPage] = useState<number>(1);
  const booksLimit = 10;
  // Keep the raw response so we can read pagination totals
  const { data: myBooksResponse = null, isLoading: isLoadingMyBooks, refetch: refetchMyBooks } = useQuery({
    queryKey: ['myBooks', booksPage, booksLimit, filterStatus, filterSortBy, filterOrder, filterEnd, filterQ],
    queryFn: () => fetchUserMyBooks({
      page: booksPage,
      limit: booksLimit,
      status: filterStatus,
      sortBy: filterSortBy,
      order: filterOrder,
      end: filterEnd,
      q: filterQ
    }),
    enabled: !!token,
  });

  // Derive items array and total count from the API response (handle common shapes)
  const myBooks: any[] = useMemo(() => {
    const d = myBooksResponse;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (d.data && Array.isArray(d.data.items)) return d.data.items; // New API shape
    if (Array.isArray(d.data)) return d.data;
    if (d.data && Array.isArray(d.data.books)) return d.data.books;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.books)) return d.books;
    return [];
  }, [myBooksResponse]);

  const myBooksTotal: number | null = useMemo(() => {
    const d = myBooksResponse as any;
    if (!d) return null;
    return d.data?.total ?? d.total ?? d.count ?? d.data?.total_items ?? d.data?.total_count ?? d.data?.totalBooks ?? null;
  }, [myBooksResponse]);

  const tabItems: TabsProps['items'] = useMemo(() => [
    {
      key: '1',
      label: (
        <div className='flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          งานเขียน
        </div>
      ),
      children: <MyBookListTab
        myBooks={myBooks}
        isLoadingMyBooks={isLoadingMyBooks}
        page={booksPage}
        setPage={setBooksPage}
        total={myBooksTotal || 0}
        limit={booksLimit}
        // Filters
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterSortBy={filterSortBy}
        setFilterSortBy={setFilterSortBy}
        filterOrder={filterOrder}
        setFilterOrder={setFilterOrder}
        filterEnd={filterEnd}
        setFilterEnd={setFilterEnd}
        // Search
        filterQ={filterQ}
        setFilterQ={setFilterQ}
      />,
    },
    {
      key: '2',
      label: (
        <div className='flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          สถิติ
        </div>
      ),
      children: <MyBookStatsTab myBooks={myBooks} token={token} />,
    },
    {
      key: '3',
      label: (
        <div className='flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          รายงานขาย
        </div>
      ),
      children: <MyBookSalesTab token={token} />,
    },
    {
      key: '4',
      label: (
        <div className='flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          การถอนเงิน
        </div>
      ),
      children: <MyBookWithdrawTab token={token} coinIncome={coinIncome} setCoinIncome={setCoinIncome} updateToken={updateToken} />,
    },
    {
      key: '5',
      label: (
        <div className='flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          ข้อมูลลงทะเบียน
        </div>
      ),
      children: <MyBookWriterInfoTab user={user} token={token} isWriter={isWriter} updateToken={updateToken} />,
    },
  ], [myBooks, isLoadingMyBooks, token, coinIncome, setCoinIncome, updateToken, user, isWriter, booksPage, myBooksTotal, filterStatus, filterSortBy, filterOrder, filterEnd, filterQ]);

  const { data: writerInfoData } = useQuery({
    queryKey: ['writerInfo'],
    queryFn: fetchUserMyBookInfo,
    enabled: !!token && isWriter,
  });

  // Show loading or nothing while checking auth
  if (!isLoggedIn || !token) {
    return null; // or return a loading spinner
  }

  // If not a writer (status === null), show registration form
  if (shouldShowWriterForm) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
          <MyBookWriterInfoTab user={user} token={token} isWriter={isWriter} updateToken={updateToken} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
        {/* User Profile Header */}
        <MyBookHeader
          user={user}
          coinIncome={(writerInfoData as any)?.data?.withdrawable_amount ?? coinIncome}
          myBooksTotal={(writerInfoData as any)?.data?.total_books ?? myBooksTotal}
          myBooksCount={Array.isArray(myBooks) ? myBooks.length : 0}
          tokenProfileImage={userProfileImage}
          tokenTotalFollowers={(writerInfoData as any)?.data?.total_followers ?? userTotalFollowers}
        />

        {/* Tabs */}
        <Tabs
          defaultActiveKey="1"
          items={tabItems}
          className='font-primary custom-tabs-red'
        />

        <style jsx>{`
        :global(.ant-tabs-tab:hover) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover svg path) {
          stroke: #dc2626 !important;
          fill: none !important;
        }
        :global(.ant-tabs-tab:hover svg line) {
          stroke: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover svg circle) {
          stroke: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover svg rect) {
          stroke: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active svg path) {
          stroke: #dc2626 !important;
          fill: none !important;
        }
        :global(.ant-tabs-tab-active svg line) {
          stroke: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active svg circle) {
          stroke: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active svg rect) {
          stroke: #dc2626 !important;
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
    </div>
  );
}

export default MyBook;