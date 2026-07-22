"use client";

import React, { useEffect, useState } from 'react';
import { vipApi } from '@/services/api/vipApi';
import type { VipHistoryLog } from '@/types/vip';
import { History, ArrowRight } from 'lucide-react';
import { Button, Tag } from 'antd';

export default function VipHistoryPage() {
  const [logs, setLogs] = useState<VipHistoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await vipApi.getHistory();
        setLogs(res.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'PURCHASE': return <Tag color="blue">ซื้อ VIP</Tag>;
      case 'UPGRADE': return <Tag color="gold">อัปเกรดระดับ</Tag>;
      case 'STACK': return <Tag color="cyan">ต่ออายุ</Tag>;
      case 'EXPIRED': return <Tag color="red">หมดอายุ</Tag>;
      case 'CLAIM_REWARD': return <Tag color="green">รับของรางวัล</Tag>;
      default: return <Tag>{type}</Tag>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
            <History />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">ประวัติ VIP</h1>
            <p className="text-slate-500">การซื้อ อัปเกรด และรับของรางวัล</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-400">กำลังโหลดข้อมูล...</div>
          ) : logs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.log_id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      {getActionLabel(log.action_type)}
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(log.created_at).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 mt-2">
                      {/* Placeholder for details rendering based on actual data structure */}
                      {log.details?.target_tier && (
                        <div className="flex items-center gap-1 font-bold">
                          {log.details.source_tier || 'Free'} <ArrowRight size={14} className="text-slate-400" /> <span className="text-slate-800">{log.details.target_tier}</span>
                        </div>
                      )}
                      {log.details?.reward_name && (
                        <div>ได้รับ: <strong className="text-pink-500">{log.details.reward_name}</strong></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400">
              <History size={40} className="mx-auto mb-4 opacity-20" />
              ไม่มีประวัติ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
