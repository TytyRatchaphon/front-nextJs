"use client";
import * as React from "react";
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, App } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Award, Target, BookOpen, Coins, Flame, Gift, X } from 'lucide-react';
import { fetchAchievements, fetchAchievementDetail, claimAchievement } from '@/services/api/achievementApi';
import { useAuthStore } from '@/stores/authStore';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

const conditionLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  login_streak: { label: 'ล็อกอินต่อเนื่อง', icon: <Flame size={16} />, color: '#F59E0B' },
  read_chapter: { label: 'อ่านตอน', icon: <BookOpen size={16} />, color: '#3B82F6' },
  spend_coin: { label: 'ใช้เหรียญ', icon: <Coins size={16} />, color: '#10B981' },
};

const getConditionInfo = (type: string) => {
  return conditionLabels[type] || { label: type, icon: <Target size={16} />, color: '#6B7280' };
};

export default function AchievementPageClient() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const queryClient = useQueryClient();
  const { notification } = App.useApp();
  const { updateToken } = useAuthStore();
    const { settings } = useWebsiteSettings();

  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: fetchAchievements,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['achievementDetail', selectedId],
    queryFn: () => fetchAchievementDetail(selectedId!),
    enabled: !!selectedId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const summary = data?.summary;
  const list = data?.list || [];

  const handleCardClick = (achievementId: number) => {
    setSelectedId(achievementId);
    setIsDetailOpen(true);
  };

  const handleClaim = async (achievementId: number) => {
    setClaiming(true);
    try {
      const res = await claimAchievement(achievementId);

      // Update token if API returns a new one
      let newToken = res?.token ?? res?.data?.token;
      if (typeof newToken === 'object' && newToken?.token) {
        newToken = newToken.token;
      }
      if (newToken && typeof newToken === 'string' && typeof updateToken === 'function') {
        updateToken(newToken);
      }

      notification.success({
        message: res?.message || 'รับรางวัลสำเร็จ!',
        placement: 'topRight',
      });
      // Refetch both list and detail
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['achievementDetail', achievementId] });
    } catch (err: any) {
      notification.error({
        message: err?.response?.data?.message || 'ไม่สามารถรับรางวัลได้',
        placement: 'topRight',
      });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] py-8 font-primary font-medium">
      <div className="max-w-[1440px] w-full mx-auto px-4 lg:px-[156px]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/mprofile" className="text-gray-500 hover:text-[#E33527] transition-colors">ข้อมูลของฉัน</Link>
          <span className="text-gray-400">/</span>
          <span className="text-[#E33527] font-semibold">ความสำเร็จ</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black border-l-4 border-[#E33527] pl-3 m-0">ความสำเร็จ</h1>
        </div>

        {/* Summary Section */}
        {summary && (
          <div className="bg-white rounded-[32px] p-8 mb-10 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-[#E33527]">
                  <Trophy size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">ความสำเร็จของฉัน</h2>
                  <p className="text-gray-500 text-sm font-normal">ทำภารกิจสะสมเพื่อรับรางวัลพิเศษและสิทธิประโยชน์</p>
                </div>
              </div>
              
              <div className="flex items-center gap-12">
                <div className="text-center">
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{summary.total_achievements}</p>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">ทั้งหมด</p>
                </div>
                <div className="w-px h-10 bg-gray-100" />
                <div className="text-center">
                  <p className="text-3xl font-black text-[#E33527] tracking-tight">{summary.completed_count}</p>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">สำเร็จแล้ว</p>
                </div>
                <div className="w-px h-10 bg-gray-100" />
                <div className="text-center">
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{summary.progress_percentage}%</p>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">ความคืบหน้า</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">ภาพรวมความสำเร็จ</span>
                <span className="text-xs font-bold text-gray-900">{summary.progress_percentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${summary.progress_percentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="w-32 h-5 bg-gray-200 rounded mb-2" />
                    <div className="w-20 h-3 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && list.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">ยังไม่มีความสำเร็จ</h3>
            <p className="text-gray-500">ความสำเร็จจะปรากฏที่นี่เมื่อมีภารกิจให้ทำ</p>
          </div>
        )}

        {/* Achievement Grid */}
        {!isLoading && list.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((item: any) => {
              const info = getConditionInfo(item.condition_type);
              const progress = item.target_value > 0 
                ? Math.min(Math.round((item.current_value / item.target_value) * 100), 100) 
                : 0;

              return (
                <div
                  key={item.achievement_id}
                  onClick={() => handleCardClick(item.achievement_id)}
                  className={`bg-white rounded-[24px] p-6 border transition-all duration-300 cursor-pointer group hover:bg-gray-50/50 ${
                    item.is_completed 
                      ? 'border-green-100 hover:border-green-200' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${info.color}10`, color: info.color }}
                    >
                      {info.icon ? React.cloneElement(info.icon as React.ReactElement<any>, { className: 'w-6 h-6' }) : <Target size={24} />}
                    </div>
                    {item.is_completed && (
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider ${
                        item.is_claimed 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {item.is_claimed ? 'รับแล้ว' : 'สำเร็จ'}
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-[#E33527] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-normal">{info.label}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] uppercase font-bold text-gray-300 tracking-widest">ความก้าวหน้า</span>
                      <span className="text-xs font-bold text-gray-900">
                        {item.current_value} / {item.target_value}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: item.is_completed ? '#10B981' : info.color 
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={isDetailOpen}
        onCancel={() => { setIsDetailOpen(false); setSelectedId(null); }}
        footer={null}
        centered
        width={480}
        zIndex={5000}
        closeIcon={<X size={20} />}
        styles={{ body: { padding: 0 } }}
      >
        {detailLoading && (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E33527]" />
          </div>
        )}

        {!detailLoading && detail && (() => {
          const info = getConditionInfo(detail.condition_type);
          const progress = detail.target_value > 0 
            ? Math.min(Math.round((detail.current_value / detail.target_value) * 100), 100) 
            : 0;
          return (
            <div className="font-primary">
              {/* Refined Header */}
              <div className="p-10 pt-12 text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-gray-50/50 to-transparent pointer-events-none" />
                
                <div className="w-24 h-24 mx-auto mb-6 rounded-[28px] bg-red-50 flex items-center justify-center text-[#E33527] shadow-sm relative z-10">
                  {detail.icon_url ? (
                    <Image src={detail.icon_url} alt={detail.title} width={56} height={56} className="object-contain" unoptimized />
                  ) : (
                    <Trophy size={48} strokeWidth={1.5} />
                  )}
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 mb-2 relative z-10">{detail.title}</h2>
                {detail.description && (
                  <p className="text-gray-500 text-sm font-normal max-w-[280px] mx-auto relative z-10">{detail.description}</p>
                )}
              </div>

              {/* Body */}
              <div className="px-10 pb-10">
                {/* Status Indicator */}
                <div className="flex items-center justify-between mb-8 p-4 bg-gray-50/80 rounded-[20px] border border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm" style={{ color: info.color }}>
                      {info.icon ? React.cloneElement(info.icon as React.ReactElement<any>, { size: 16 }) : <Target size={16} />}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest leading-none mb-0.5">ประเภท</p>
                      <p className="text-sm text-gray-900 font-bold leading-none">{info.label}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                    detail.is_completed 
                      ? detail.is_claimed 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-green-100 text-green-600'
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    {detail.is_completed ? (detail.is_claimed ? 'CLAIMED' : 'COMPLETED') : 'IN PROGRESS'}
                  </span>
                </div>

                {/* Refined Progress section */}
                <div className="mb-10">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[10px] uppercase font-bold text-gray-300 tracking-widest">ความก้าวหน้า</span>
                    <span className="text-sm font-black text-gray-900">
                      {detail.current_value} <span className="text-gray-300 mx-1">/</span> {detail.target_value}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: detail.is_completed ? '#10B981' : info.color 
                      }}
                    />
                  </div>
                </div>

                {/* Rewards */}
                {detail.rewards && detail.rewards.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-4 flex items-center gap-2">
                       ของรางวัล
                    </h3>
                    <div className="space-y-3">
                      {detail.rewards.map((reward: any) => (
                        <div 
                          key={reward.id} 
                          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center p-2">
                              {reward.reward_type === 'coin' ? (
                                <Image src={settings?.coin || '/images/e-coin.png'} alt="เหรียญ" width={24} height={24} unoptimized className="object-contain" />
                              ) : reward.reward_type === 'freecoin' ? (
                                <Image src={settings?.freecoin || '/images/money-bag.png'} alt="ถุงเงิน" width={24} height={24} unoptimized className="object-contain" />
                              ) : (
                                <Gift size={20} className="text-amber-500" strokeWidth={1.5} />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">
                                {reward.reward_type === 'coin' ? 'เหรียญทอง' : reward.reward_type === 'freecoin' ? 'เหรียญฟรี' : reward.reward_type}
                              </p>
                              <p className="text-[10px] text-gray-400">เข้าบัญชีทันทีเมื่อกดรับ</p>
                            </div>
                          </div>
                          <span className="text-xl font-black text-amber-500">
                            +{reward.reward_amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Claim Button */}
                {detail.is_completed && !detail.is_claimed && (
                  <button
                    onClick={() => handleClaim(detail.achievement_id)}
                    disabled={claiming}
                    className="w-full bg-gray-900 !text-white h-14 rounded-2xl font-bold text-base hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
                  >
                    {claiming ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                    ) : (
                      <>
                        <Gift size={20} strokeWidth={1.5} />
                        รับรางวัล
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
