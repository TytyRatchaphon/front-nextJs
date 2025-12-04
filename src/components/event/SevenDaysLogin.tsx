"use client"

import React from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { Modal, Button } from 'antd'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

type LoginStatus = {
  latest_logged_in_day?: number
  current_reward_day?: number
  checked_in_today?: boolean
}

const fetchWeeklyLogin = async (token?: string | null) : Promise<LoginStatus> => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const url = `${base}/user/event/login`
  const headers: Record<string,string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = token

  const res = await axios.get(url, { headers })
  // axios throws for non-2xx, so if we get here assume data present
  return res.data?.data ?? {}
}

function SevenDaysLogin() {
  const { user, token, updateToken } = useAuthStore()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['weekly-login', token], queryFn: () => fetchWeeklyLogin(token), retry: 1, staleTime: 60_000 })
  // `current_reward_day` is 1-based and defaults to 1 when no days are claimed yet.
  // We'll treat it as the "next reward day" index; days with index < currentRewardDay are already checked.
  const currentRewardDay = Number(data?.current_reward_day ?? 1)
  const checkedToday = Boolean(data?.checked_in_today)
  const [modalVisible, setModalVisible] = useState(false)
  const [rewardUnit, setRewardUnit] = useState<number | string | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const checkinUrl = `${base}/user/event/login`

  const handleCheckin = async () => {
    try {
      setConfirmLoading(true)
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = token

      // Capture current coupon before API call
      const currentCoupon = Number(useAuthStore.getState().user?.coupon ?? 0)

      const res = await axios.post(checkinUrl, {}, { headers })
      const unit = res.data?.data?.unit ?? null
      const rewardAmount = Number(unit ?? 0)
      
      // ... (logic คำนวณ latest day เดิม) ...

      setRewardUnit(unit)

      // 1. รับ Token ใหม่ และอัปเดตเข้า Store ก่อน (ถ้ามี)
      const newToken = res.data?.token ?? res.data?.data?.token
      const activeToken = newToken ?? token;

      if (newToken && typeof updateToken === 'function') {
        try { 
            updateToken(newToken) 
            try { axios.defaults.headers.common['Authorization'] = newToken } catch (e) {}
        } catch (e) { console.warn('Failed to update token', e) }
      }

      // 2. Optimistic Update: เอาค่า Coupon ที่คำนวณเอง ทับลงไปใน User ล่าสุดใน Store
      // ทำหลังจาก updateToken เพื่อป้องกัน Token เก่ามาทับค่าที่เราบวกเพิ่ม
      const latestUser = useAuthStore.getState().user
      if (latestUser) {
          const optimisticUser = { 
              ...latestUser, 
              coupon: currentCoupon + rewardAmount 
          }
          console.log('✨ Force Optimistic Update:', currentCoupon, '+', rewardAmount, '=', optimisticUser.coupon)
          useAuthStore.setState({ user: optimisticUser })
          localStorage.setItem('userData', JSON.stringify(optimisticUser))
      }

      // --- [เพิ่มส่วนนี้] : เรียก /user/me เพื่ออัปเดต Coupon ทันที ---
      try {
          const meRes = await axios.get(`${base}/user/me`, {
              headers: { 'Authorization': activeToken }
          });
          const realProfile = meRes.data?.data || meRes.data;
          if(realProfile) {
              console.log('✅ Synced real user profile after checkin');
              useAuthStore.setState({ user: realProfile });
              localStorage.setItem('userData', JSON.stringify(realProfile));
          }
      } catch (e) {
          console.warn('Failed to sync user profile', e);
      }
      // -----------------------------------------------------------

      // refresh weekly-login data
      try { queryClient.invalidateQueries({ queryKey: ['weekly-login'] }) } catch (e) { /* ignore */ }
      
      setModalVisible(true)
    } catch (e) {
      console.error('Checkin failed', e)
      Modal.error({ title: 'เช็คอินล้มเหลว', content: 'เกิดข้อผิดพลาดขณะเช็คอิน' })
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleModalOk = () => {
    setModalVisible(false)
    // ensure latest data
    try { queryClient.invalidateQueries({ queryKey: ['weekly-login'] }) } catch (e) {}
  }
  return (
    <div style={{ maxWidth: '100%', display: 'flex', justifyContent: 'center', padding: 12 }}>
      <div style={{ position: 'relative', width: 1040, maxWidth: '100%' }}>
        {/* Main banner */}
        <Image src="/images/checkin.png" alt="checkin" width={1040} height={352} priority style={{ display: 'block', width: '100%', height: 'auto' }} />

        {/* Overlay: 2 rows x 3 columns of day images */}
        <div style={{
          position: 'absolute',
          left: '4%',
          top: '32%',
          width: 260,
          height: 180,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 16,
          pointerEvents: 'none',
        }}>
          {[...Array(6)].map((_, i) => {
            const day = i + 1
            // Mark checked when the day is strictly less than currentRewardDay
            // or when it's the currentRewardDay and the user has already checked in today.
            const isChecked = (day < currentRewardDay) || (day === currentRewardDay && checkedToday)
            return (
              <div key={i} style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Image src={`/images/day${day}.png`} alt={`day-${day}`} width={80} height={80} style={{ objectFit: 'contain' }} />
                {isChecked && (
                  <div className="check-appear" style={{ position: 'absolute', left: '50%', top: '50%', width: 94, height: 94, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                    <Image src="/images/check.png" alt={`checked-${day}`} fill style={{ objectFit: 'contain' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Day7 image to the right of the grid */}
        <div style={{
          position: 'absolute',
          left: 'calc(4% + 300px)',
          top: '36%',
          width: 140,
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            <Image src="/images/day7.png" alt="day-7" width={140} height={140} style={{ objectFit: 'contain' }} />
            {((currentRewardDay > 7) || (currentRewardDay === 7 && checkedToday)) && (
              <div className="check-appear" style={{ position: 'absolute', left: '50%', top: '50%', width: 154, height: 154, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                <Image src="/images/check.png" alt="checked-7" fill style={{ objectFit: 'contain' }} />
              </div>
            )}
          </div>
        </div>

        {/* Check-in button (green circle) */}
        <div style={{ position: 'absolute', right: '3%', top: '75%', transform: 'translateY(-50%)', pointerEvents: 'auto' }}>
          <Button
            type="primary"
            shape="round"
            size="large"
            disabled={checkedToday}
            style={{
              background: checkedToday ? '#9ca3af' : '#2fb37b',
              borderColor: checkedToday ? '#9ca3af' : '#2fb37b',
              width: 150,
              height: 150,
              borderRadius: '50%',
              padding: 0,
              cursor: checkedToday ? 'default' : 'pointer'
            }}
            loading={confirmLoading}
            onClick={handleCheckin}
          >
            <div style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>{checkedToday ? 'เช็คอินแล้ว' : 'เช็คอิน'}</div>
          </Button>
        </div>
        {/* Reward Modal */}
        <Modal open={modalVisible} onOk={handleModalOk} onCancel={() => setModalVisible(false)} okText="ตกลง" cancelText="ยกเลิก" title="คุณได้รับ">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 8 }}>
            <Image src="/images/coupon.png" alt="coupon" width={40} height={40} style={{ objectFit: 'contain' }} />
            <div style={{ fontSize: 18, fontWeight: 700 }}>จำนวน {rewardUnit ?? '-'} ลูก</div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default SevenDaysLogin