"use client"

import React from 'react'
import Image from 'next/image'
import { Progress, Button, App } from 'antd'
import { GiftOutlined } from '@ant-design/icons'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

type Props = {
  used?: number
  remaining?: number
  leftLabel?: string
  rightLabel?: string
  leftAmount?: string
  rightAmount?: string
  avatar?: string
  width?: number | string
  progressHeight?: number
}

export default function UserUseCoin({
  used = 0,
  remaining = 45,
  leftLabel = 'ใช้ไปแล้ว',
  rightLabel = 'ใช้ อีก {remaining} คอยน์เพื่อรับสแตมป์',
  leftAmount = '0 coin',
  rightAmount = '45 coin',
  avatar = '/images/warning_cat.png',
  width = 1040,
  progressHeight = 22,
}: Props) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  // 1. Fetch Functions (ใช้ getState เพื่อดึง Token สดๆ)
  const fetchEventSummary = async (overrideToken?: string) => {
    const currentToken = overrideToken || useAuthStore.getState().token
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
    const url = `${base}/user/event`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (currentToken) headers['Authorization'] = currentToken
    const res = await axios.get(url, { headers })
    return res.data?.data ?? {}
  }

  const claimRewardApi = async () => {
    const currentToken = useAuthStore.getState().token
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
    const url = `${base}/user/event/get-stamp`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (currentToken) headers['Authorization'] = currentToken
    const res = await axios.post(url, {}, { headers })
    return res.data
  }

  // 2. Query Data
  const { data } = useQuery({
    queryKey: ['user-event-summary', useAuthStore.getState().token],
    queryFn: () => fetchEventSummary(),
    staleTime: 30_000,
    retry: 1
  })

  const apiCoin = data?.coin_used_data
  const rewardToClaim = apiCoin?.reward_to_claim ?? false
  const totalUnclaimed = Number(apiCoin?.total_unclaimed_reward_unit ?? 0)

  // 3. Mutation
  const { mutate: handleClaim, isPending: isClaiming } = useMutation({
    mutationFn: claimRewardApi,
    onSuccess: (responseData) => {
      message.success('รับรางวัลสำเร็จ!')

      // --- STEP A: Update Token (เหมือนเดิม) ---
      const newToken = responseData?.token || responseData?.data?.token
      if (newToken) {
        useAuthStore.setState({ token: newToken })
      }

      // --- STEP B: ✨ Optimistic User Update (หัวใจสำคัญ) ✨ ---
      // ดึง User ปัจจุบันออกมา
      const currentUser = useAuthStore.getState().user;

      if (currentUser) {
        // คำนวณยอดที่จะเพิ่ม (ถ้า API บอกมี 3 อันก็บวก 3, ถ้าไม่มีข้อมูลกันเหนียวบวก 1)
        const amountToAdd = totalUnclaimed > 0 ? totalUnclaimed : 1;

        // คำนวณยอดใหม่
        const newStampCount = (Number(currentUser.stamp) || 0) + amountToAdd;


        // สร้าง User Object ใหม่
        const optimisticUser = {
          ...currentUser,
          stamp: newStampCount
        };

        // 🚀 ยัดใส่ Store ทันที! (Header จะเปลี่ยนเลขเดี๋ยวนี้เลย)
        useAuthStore.setState({ user: optimisticUser });

        // (Optional) Update LocalStorage ด้วย
        localStorage.setItem('userData', JSON.stringify(optimisticUser));
      }

      // --- STEP C: ซ่อนปุ่มทันที (Optimistic Cache Update) ---
      queryClient.setQueryData(['user-event-summary', useAuthStore.getState().token], (oldData: any) => {
        if (!oldData) return oldData;
        const newData = JSON.parse(JSON.stringify(oldData));
        if (newData.coin_used_data) {
          newData.coin_used_data.reward_to_claim = false;
          newData.coin_used_data.total_unclaimed_reward_unit = 0;
        }
        return newData;
      });

      // --- STEP D: Sync ข้อมูลจริง (กันพลาด) ---
      setTimeout(async () => {
        const currentToken = newToken || useAuthStore.getState().token;
        const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

        // 1. Refetch หน้า Event (เผื่อมีเงื่อนไขอื่นเปลี่ยน)
        queryClient.invalidateQueries({ queryKey: ['user-event-summary'] })

        // 2. Fetch User Profile ล่าสุดจาก Server (เพื่อความชัวร์ 100%)
        try {
          const meRes = await axios.get(`${base}/user/me`, {
            headers: { 'Authorization': currentToken }
          });
          const realProfile = meRes.data?.data || meRes.data;
          if (realProfile) {
            useAuthStore.setState({ user: realProfile });
            localStorage.setItem('userData', JSON.stringify(realProfile));
          }
        } catch (e) {
        }
      }, 1000)
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'เกิดข้อผิดพลาดในการรับรางวัล')
    }
  })

  // derive values อื่นๆ (เหมือนเดิม)
  const apiUsed = Number(apiCoin?.user_used_coins ?? used)
  const apiGoal = Number(apiCoin?.goal ?? (used + remaining))

  const apiPercentRaw = Number(apiCoin?.current_reward_percentage ?? NaN)
  const percent = Number.isFinite(apiPercentRaw)
    ? Math.max(0, Math.min(100, Math.round(apiPercentRaw)))
    : Math.max(0, Math.min(100, Math.round((apiUsed / Math.max(1, apiGoal)) * 100)))

  const showClaimButton = rewardToClaim || totalUnclaimed > 0
  const apiRemaining = Math.max(0, apiGoal - apiUsed)

  const displayUsed = apiUsed
  const displayRemaining = apiRemaining
  const displayLeftAmount = `${displayUsed} coin`
  const displayRightAmount = `${apiGoal} coin`

  if (!apiCoin) return null;

  return (
    <div className={`w-full ${typeof width === 'number' ? `max-w-[${width}px]` : `max-w-[${width}]`} mx-auto px-4 md:px-0`}>
      <div style={{ borderRadius: 12, overflow: 'hidden' }}>

        {/* Header Section */}
        <div style={{ background: 'linear-gradient(90deg,#b71c26,#8b0c14)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image src={avatar} alt="avatar" width={44} height={44} className="object-cover" />
          </div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>ยอดใช้คอยน์สะสม</div>
        </div>

        {/* Body Section */}
        <div style={{ background: 'white', padding: '18px 20px', border: '1px solid rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{leftLabel} {displayUsed}</div>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{`ใช้อีก ${displayRemaining} คอยน์เพื่อรับสแตมป์`}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 20, color: '#111827', fontWeight: 600 }}>{displayLeftAmount}</div>
            <div style={{ fontSize: 18, color: '#111827', fontWeight: 600 }}>{displayRightAmount}</div>
          </div>

          <div style={{ marginTop: 12, position: 'relative' }}>
            <Progress
              percent={percent}
              percentPosition={{ type: 'inner', align: 'center' }}
              strokeColor="#d40b1d"
              trailColor="#f3f4f6"
              strokeLinecap="round"
              size={{ height: progressHeight ?? 12 }}
            />
          </div>

          {/* ----- ส่วนปุ่มรับรางวัล ----- */}
          {showClaimButton && (
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', animation: 'fadeIn 0.5s ease-in-out' }}>
              <Button
                type="primary"
                size="large"
                icon={<GiftOutlined />}
                loading={isClaiming}
                onClick={() => handleClaim()}
                style={{
                  height: 48,
                  borderRadius: 24,
                  paddingLeft: 32,
                  paddingRight: 32,
                  fontSize: 16,
                  fontWeight: 600,
                  background: 'linear-gradient(90deg, #FF4D4F 0%, #D32029 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(211, 32, 41, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
                className="hover:scale-105 transition-transform duration-300"
              >
                {totalUnclaimed > 0
                  ? `กดรับรางวัล (x${totalUnclaimed})`
                  : 'กดรับรางวัล'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}