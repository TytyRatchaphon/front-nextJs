"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, Progress, App } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Award, Target, BookOpen, Coins, Flame, Gift, ChevronRight, X } from 'lucide-react';
import { fetchAchievements, fetchAchievementDetail, claimAchievement } from '@/services/api/achievementApi';
import { useAuthStore } from '@/stores/authStore';
import { useWebsiteStore } from '@/stores/websiteStore';

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
  const { settings } = useWebsiteStore();

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

        {/* Summary Card */}
        {summary && (
          <div className="bg-gradient-to-r from-[#E33527] to-[#FF6B5A] rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Trophy size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">ความสำเร็จของฉัน</h2>
                <p className="text-white/80 text-sm">ทำภารกิจสะสมเพื่อรับรางวัลพิเศษ</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{summary.total_achievements}</p>
                <p className="text-xs text-white/80">ทั้งหมด</p>
              </div>
              <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{summary.completed_count}</p>
                <p className="text-xs text-white/80">สำเร็จแล้ว</p>
              </div>
              <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{summary.progress_percentage}%</p>
                <p className="text-xs text-white/80">ความคืบหน้า</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                percent={summary.progress_percentage} 
                strokeColor="#fff" 
                trailColor="rgba(255,255,255,0.2)" 
                showInfo={false} 
                size={{ height: 8 }}
              />
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
                  className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden ${
                    item.is_completed 
                      ? 'border-green-200 hover:border-green-300' 
                      : 'border-gray-100 hover:border-red-200'
                  }`}
                >
                  {/* Completed Badge */}
                  {item.is_completed && (
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        item.is_claimed 
                          ? 'bg-gray-100 text-gray-500' 
                          : 'bg-green-100 text-green-600 animate-pulse'
                      }`}>
                        {item.is_claimed ? 'รับแล้ว' : 'รับรางวัลได้!'}
                      </span>
                    </div>
                  )}

                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm flex-shrink-0"
                      style={{ backgroundColor: `${info.color}15`, color: info.color }}
                    >
                      {info.icon ? React.cloneElement(info.icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' }) : <Target size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate group-hover:text-[#E33527] transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-xs text-gray-500">{info.label}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-gray-500">ความคืบหน้า</span>
                      <span className="text-xs font-bold" style={{ color: info.color }}>
                        {item.current_value} / {item.target_value}
                      </span>
                    </div>
                    <Progress 
                      percent={progress} 
                      strokeColor={item.is_completed ? '#10B981' : info.color} 
                      trailColor="#F3F4F6" 
                      showInfo={false} 
                      size={{ height: 6 }}
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end mt-3">
                    <span className="text-xs text-gray-400 group-hover:text-[#E33527] flex items-center gap-0.5 transition-colors">
                      ดูรายละเอียด <ChevronRight size={12} />
                    </span>
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
              {/* Header */}
              <div className="bg-gradient-to-br from-[#E33527] to-[#FF6B5A] p-6 text-white text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm overflow-hidden">
                  {detail.icon_url ? (
                    <Image src={detail.icon_url} alt={detail.title} width={48} height={48} className="object-contain" unoptimized />
                  ) : (
                    <Trophy size={36} className="text-white" />
                  )}
                </div>
                <h2 className="text-xl font-bold">{detail.title}</h2>
                {detail.description && (
                  <p className="text-white/80 text-sm mt-1">{detail.description}</p>
                )}
              </div>
              {/* Body */}
              <div className="p-6">
                {/* Status */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span style={{ color: info.color }}>{info.icon}</span>
                    <span className="text-sm text-gray-700 font-medium">{info.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    detail.is_completed 
                      ? detail.is_claimed 
                        ? 'bg-gray-100 text-gray-500' 
                        : 'bg-green-100 text-green-600'
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    {detail.is_completed ? (detail.is_claimed ? 'รับรางวัลแล้ว' : 'ทำสำเร็จ!') : 'กำลังดำเนินการ'}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">ความคืบหน้า</span>
                    <span className="text-sm font-bold" style={{ color: info.color }}>
                      {detail.current_value} / {detail.target_value}
                    </span>
                  </div>
                  <Progress 
                    percent={progress} 
                    strokeColor={detail.is_completed ? '#10B981' : info.color}
                    trailColor="#F3F4F6"
                    showInfo={false}
                    size={{ height: 10 }}
                  />
                  <p className="text-right text-xs text-gray-400 mt-1">{progress}%</p>
                </div>

                {/* Rewards */}
                {detail.rewards && detail.rewards.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Gift size={16} className="text-[#E33527]" />
                      รางวัล
                    </h3>
                    <div className="space-y-2">
                      {detail.rewards.map((reward: any) => (
                        <div 
                          key={reward.id} 
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center overflow-hidden">
                              {reward.reward_type === 'coin' ? (
                                <Image src={settings?.coin || '/images/e-coin.png'} alt="เหรียญ" width={24} height={24} unoptimized className="object-contain" />
                              ) : reward.reward_type === 'freecoin' ? (
                                <Image src={settings?.freecoin || '/images/money-bag.png'} alt="ถุงเงิน" width={24} height={24} unoptimized className="object-contain" />
                              ) : (
                                <Coins size={16} className="text-amber-600" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {reward.reward_type === 'coin' ? 'เหรียญ' : reward.reward_type === 'freecoin' ? 'ถุงเงิน' : reward.reward_type}
                            </span>
                          </div>
                          <span className="text-lg font-bold text-amber-600">
                            +{reward.reward_amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Claim Button */}
        {!detailLoading && detail && detail.is_completed && !detail.is_claimed && (
          <div className="px-6 pb-6">
            <button
              onClick={() => handleClaim(detail.achievement_id)}
              disabled={claiming}
              className="w-full bg-gradient-to-r from-[#E33527] to-[#FF6B5A] !text-white py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {claiming ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
              ) : (
                <>
                  <Gift size={18} />
                  รับรางวัล
                </>
              )}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
