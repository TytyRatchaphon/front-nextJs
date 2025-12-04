'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

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
        console.warn('Error reading backup token from localStorage', e);
      }

      router.push('/');
    }
  }, [hasMounted, isLoggedIn, token, router]);
  
  // Decode token to check writer_name
  const [isWriter, setIsWriter] = useState(false);
  
  useEffect(() => {
    if (token) {
      try {
        // Decode JWT token (base64)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decodedToken = JSON.parse(jsonPayload);
        console.log('Decoded token:', decodedToken);
        
        // Check if writer_name exists and is not null
        setIsWriter(decodedToken.writer_name !== null && decodedToken.writer_name !== undefined);
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsWriter(false);
      }
    }
  }, [token]);

  const [coinIncome, setCoinIncome] = useState<string | number>('');

  // Set user data when component mounts
  useEffect(() => {
    if (user) {
      if ((user as any).coinIncome !== undefined && (user as any).coinIncome !== null) {
        const raw = (user as any).coinIncome;
        const parsed = Number(raw);
        setCoinIncome(Number.isFinite(parsed) ? parsed : String(raw));
      }
    }
  }, [user]);

  // Prefill coinIncome from decoded token when available
  useEffect(() => {
    if (!token) return;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const decodedToken = JSON.parse(jsonPayload);

      // coinIncome from token (if present) - show in stats
      if (decodedToken.coinIncome !== undefined && decodedToken.coinIncome !== null) {
        // prefer numeric if possible
        const parsed = Number(decodedToken.coinIncome);
        setCoinIncome(Number.isFinite(parsed) ? parsed : String(decodedToken.coinIncome));
      }
    } catch (e) {
      // ignore decode errors
      console.debug('Prefill token decode failed', e);
    }
  }, [token]);

  // Fetch user's books for the "งานเขียน" tab and "สถิติ" dropdown
  const [booksPage, setBooksPage] = useState<number>(1);
  const booksLimit = 30;
  // Keep the raw response so we can read pagination totals
  const { data: myBooksResponse = null, isLoading: isLoadingMyBooks } = useQuery({
    queryKey: ['myBooks', booksPage, booksLimit],
    queryFn: async () => {
      const res = await apiClient.get('/user/mybook/search', { params: { page: booksPage, limit: booksLimit } });
      return res.data;
    },
    enabled: !!token,
  });

  // Derive items array and total count from the API response (handle common shapes)
  const myBooks: any[] = useMemo(() => {
    const d = myBooksResponse;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.data)) return d.data;
    if (d.data && Array.isArray(d.data.items)) return d.data.items;
    if (d.data && Array.isArray(d.data.books)) return d.data.books;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.books)) return d.books;
    return [];
  }, [myBooksResponse]);

  const myBooksTotal: number | null = useMemo(() => {
    const d = myBooksResponse as any;
    if (!d) return null;
    // common locations for total
    return d.total ?? d.count ?? d.data?.total ?? d.data?.total_items ?? d.data?.total_count ?? d.data?.totalBooks ?? null;
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
      children: <MyBookListTab myBooks={myBooks} isLoadingMyBooks={isLoadingMyBooks} />,
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
  ], [myBooks, isLoadingMyBooks, token, coinIncome, setCoinIncome, updateToken, user, isWriter]);

  // Show loading or nothing while checking auth
  if (!isLoggedIn || !token) {
    return null; // or return a loading spinner
  }

  // If not a writer, show registration form
  if (!isWriter) {
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
          coinIncome={coinIncome} 
          myBooksTotal={myBooksTotal} 
          myBooksCount={Array.isArray(myBooks) ? myBooks.length : 0}
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
          fill: #dc2626 !important;
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
          fill: #dc2626 !important;
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