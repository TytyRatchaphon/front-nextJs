"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Tabs, Table, Breadcrumb, Tag } from 'antd';
import { getDailyCoinPassHistory, getDailyCoinPassClaimHistory } from '@/services/api/dailyCoinPassApi';
import type { DailyCoinPassHistoryRow, DailyCoinPassClaimHistoryRow } from '@/types/dailyCoinPass';
import Link from 'next/link';
import { HomeOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { History, Coins, Ticket } from 'lucide-react';
import Image from 'next/image';
const { Title } = Typography;

export default function DailyCoinPassHistoryPage() {
  const [activeTab, setActiveTab] = useState('passes');
  const { isLoggedIn } = useAuthStore();

  const [passData, setPassData] = useState<DailyCoinPassHistoryRow[]>([]);
  const [passLoading, setPassLoading] = useState(false);
  const [passPage, setPassPage] = useState(1);
  const [passTotal, setPassTotal] = useState(0);

  const [claimData, setClaimData] = useState<DailyCoinPassClaimHistoryRow[]>([]);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimPage, setClaimPage] = useState(1);
  const [claimTotal, setClaimTotal] = useState(0);

  const loadPassHistory = useCallback(async (page: number) => {
    if (!isLoggedIn) return;
    setPassLoading(true);
    try {
      const res = await getDailyCoinPassHistory(page, 20);
      setPassData(res.rows);
      setPassTotal(res.total);
      setPassPage(page);
    } catch (err) {
      console.error(err);
    } finally {
      setPassLoading(false);
    }
  }, [isLoggedIn]);

  const loadClaimHistory = useCallback(async (page: number) => {
    if (!isLoggedIn) return;
    setClaimLoading(true);
    try {
      const res = await getDailyCoinPassClaimHistory(page, 20);
      setClaimData(res.rows);
      setClaimTotal(res.total);
      setClaimPage(page);
    } catch (err) {
      console.error(err);
    } finally {
      setClaimLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeTab === 'passes') {
      loadPassHistory(passPage);
    } else {
      loadClaimHistory(claimPage);
    }
  }, [activeTab, isLoggedIn]);

  const getRewardImage = (type?: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'FREECOIN') return '/images/money-bag.png';
    if (t === 'COIN') return '/images/coin.png';
    if (t === 'STAMP') return '/images/stamp.png';
    if (t === 'FAST_TICKET' || t === 'TICKET') return '/images/fast_ticket.png';
    if (t === 'COUPON') return '/images/coupon.png';
    return '/images/gift_box.png';
  };

  const getRewardName = (type?: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'FREECOIN') return 'ถุงเงิน';
    if (t === 'COIN') return 'เหรียญ';
    if (t === 'STAMP') return 'แสตมป์';
    if (t === 'FAST_TICKET' || t === 'TICKET') return 'ตั๋วอ่านล่วงหน้า';
    if (t === 'COUPON') return 'คูปอง';
    return type;
  };

  const passColumns = [
    { 
      title: 'พาส', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text: string, record: any) => (
        <Link href={`/daily-coin-pass/${record.user_pass_id}`} className="font-bold text-pink-600 hover:text-pink-500 flex items-center gap-2">
          <Ticket size={16} /> {text}
        </Link>
      ) 
    },
    { 
      title: 'สถานะ', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'} className="rounded-full px-3">
          {status === 'active' ? 'กำลังใช้งาน' : 'หมดอายุ'}
        </Tag>
      )
    },
    { title: 'วันที่เริ่ม', dataIndex: 'effective_start_date', key: 'start', className: 'text-slate-500' },
    { title: 'วันที่สิ้นสุด', dataIndex: 'effective_end_date', key: 'end', className: 'text-slate-500' },
  ];

  const claimColumns = [
    { title: 'วันที่รับ', dataIndex: 'claim_date', key: 'date', className: 'font-medium' },
    { 
      title: 'ประเภท', 
      dataIndex: 'reward_type', 
      key: 'type',
      render: (type: string) => (
        <span className="flex items-center gap-2 font-medium text-slate-700">
          <Image src={getRewardImage(type)} alt={type} width={24} height={24} className="w-6 h-6 object-contain" />
          <span>{getRewardName(type)}</span>
        </span>
      )
    },
    { 
      title: 'จำนวน', 
      dataIndex: 'unit', 
      key: 'unit',
      render: (unit: any, record: any) => {
        const val = unit ?? record.amount ?? record.value;
        const displayVal = val ? Number(val).toLocaleString() : '?';
        return <strong className="text-lg text-slate-700">+{displayVal}</strong>;
      }
    },
    { 
      title: 'สถานะ', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'claimed' ? 'blue' : 'default'} className="rounded-full px-3">
          {status}
        </Tag>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="bg-white border-b border-slate-100 pt-6 pb-8 mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Breadcrumb 
            className="mb-6 font-medium text-slate-500"
            items={[
              { title: <Link href="/daily-coin-pass" className="hover:text-pink-500 transition-colors"><HomeOutlined /> Dashboard</Link> },
              { title: <span className="text-slate-800">ประวัติ</span> }
            ]}
          />
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-600 shadow-inner">
              <History size={28} />
            </div>
            <div>
              <Title level={2} className="!mb-1 text-slate-800">ประวัติ</Title>
              <p className="text-slate-500 font-medium">ดูประวัติการครอบครองพาสและการรับรางวัลทั้งหมด</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden p-2 sm:p-6">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            size="large"
            tabBarStyle={{ padding: '0 16px', marginBottom: '24px' }}
            items={[
              {
                key: 'passes',
                label: <span className="font-bold text-base px-4">ประวัติพาส</span>,
                children: (
                  <Table 
                    dataSource={passData} 
                    columns={passColumns} 
                    rowKey="user_pass_id"
                    loading={passLoading}
                    pagination={{ current: passPage, total: passTotal, pageSize: 20, onChange: loadPassHistory }}
                    className="border border-slate-100 rounded-2xl overflow-hidden"
                    scroll={{ x: 'max-content' }}
                  />
                )
              },
              {
                key: 'claims',
                label: <span className="font-bold text-base px-4">ประวัติการรับรางวัล</span>,
                children: (
                  <Table 
                    dataSource={claimData} 
                    columns={claimColumns} 
                    rowKey={(r) => `${r.claim_date}-${r.reward_type}-${r.amount}`}
                    loading={claimLoading}
                    pagination={{ current: claimPage, total: claimTotal, pageSize: 20, onChange: loadClaimHistory }}
                    className="border border-slate-100 rounded-2xl overflow-hidden"
                    scroll={{ x: 'max-content' }}
                  />
                )
              }
            ]} 
          />
        </div>
      </div>
    </div>
  );
}
