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

const fetchWeeklyLogin = async (token?: string | null): Promise<LoginStatus> => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const url = `${base}/user/event/login`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = token

  const res = await axios.get(url, { headers })
  // axios throws for non-2xx, so if we get here assume data present
  return res.data?.data ?? {}
}
const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
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
          try { axios.defaults.headers.common['Authorization'] = newToken } catch (e) { }
        } catch (e) { }
      }

      // 2. Optimistic Update: เอาค่า Coupon ที่คำนวณเอง ทับลงไปใน User ล่าสุดใน Store
      // ทำหลังจาก updateToken เพื่อป้องกัน Token เก่ามาทับค่าที่เราบวกเพิ่ม
      const latestUser = useAuthStore.getState().user
      if (latestUser) {
        const optimisticUser = {
          ...latestUser,
          coupon: currentCoupon + rewardAmount
        }
        useAuthStore.setState({ user: optimisticUser })
        localStorage.setItem('userData', JSON.stringify(optimisticUser))
      }

      // --- [เพิ่มส่วนนี้] : เรียก /user/me เพื่ออัปเดต Coupon ทันที ---
      try {
        const meRes = await axios.get(`${base}/user/me`, {
          headers: { 'Authorization': activeToken }
        });
        const realProfile = meRes.data?.data || meRes.data;
        if (realProfile) {
          useAuthStore.setState({ user: realProfile });
          localStorage.setItem('userData', JSON.stringify(realProfile));
        }
      } catch (e) {
      }
      // -----------------------------------------------------------

      // refresh weekly-login data
      try { queryClient.invalidateQueries({ queryKey: ['weekly-login'] }) } catch (e) { /* ignore */ }

      setModalVisible(true)
    } catch (e) {
      Modal.error({ title: 'เช็คอินล้มเหลว', content: 'เกิดข้อผิดพลาดขณะเช็คอิน' })
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleModalOk = () => {
    setModalVisible(false)
    // ensure latest data
    try { queryClient.invalidateQueries({ queryKey: ['weekly-login'] }) } catch (e) { }
  }
  return (
    <div className="w-full flex justify-center px-4 py-6">
      <div className="w-full max-w-[1040px] flex flex-col gap-6 md:gap-8">

        {/* Header / Title */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between text-white gap-6">
          <div className="text-center md:text-left z-10">
            <h2 className="font-bold text-2xl md:text-3xl mb-2 drop-shadow-md">เช็คอินประจำวัน</h2>
            <p className="text-red-100 text-sm md:text-lg opacity-90">รับของรางวัลสุดพิเศษฟรีทุกวัน เพียงแค่เข้าใช้งาน!</p>
          </div>

          {/* Check-in Button */}
          <div className="z-10 w-full md:w-auto">
            <Button
              type="default"
              size="large"
              loading={confirmLoading}
              onClick={handleCheckin}
              disabled={checkedToday}
              className={`w-full md:w-48 h-12 md:h-14 rounded-full font-bold text-lg hover:!text-red-600 hover:!border-red-600 transition-all duration-300 transform ${checkedToday
                ? 'bg-white/20 text-white cursor-not-allowed'
                : 'bg-white text-red-600 hover:bg-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1'
                }`}
            >
              {checkedToday ? '✔  เรียบร้อย' : 'กดเช็คอิน'}
            </Button>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        </div>

        {/* Days Grid: 7 Cols on Desktop, 3 Cols on Mobile */}
        <div className="grid grid-cols-3 md:grid-cols-7 gap-3 md:gap-4">
          {[...Array(7)].map((_, i) => {
            const day = i + 1;
            const isRewardDay = day === 7;
            const isChecked = day < currentRewardDay || (day === currentRewardDay && checkedToday);
            const isToday = day === currentRewardDay && !checkedToday;

            // Image Sizing
            const imgSize = isRewardDay ? 60 : 48;

            return (
              <div
                key={day}
                className={`
                        group relative flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl border-2 transition-all duration-300
                        ${isRewardDay ? 'col-span-3 md:col-span-1 aspect-auto md:aspect-[4/5]' : 'aspect-[4/5]'}
                        ${isChecked
                    ? 'bg-green-50 border-green-200'
                    : isToday
                      ? 'bg-white border-red-500 shadow-lg scale-105 z-10 ring-4 ring-red-50'
                      : 'bg-white border-gray-100 hover:border-red-200 hover:shadow-md'
                  }
                      `}
              >
                <div className={`font-bold text-sm mb-2 ${isChecked ? 'text-green-600' : isToday ? 'text-red-600' : 'text-gray-400'}`}>
                  DAY {day}
                </div>

                <div className={`relative transition-transform duration-300 ${isToday ? 'scale-110' : 'group-hover:scale-110'}`} style={{ width: imgSize, height: imgSize }}>
                  <Image src={`/images/day${day}.png`} alt={`day-${day}`} fill className="object-contain" />
                </div>

                {/* Status Indicator Overlay */}
                {isChecked && (
                  <div className="absolute inset-0 bg-green-500/10 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-white rounded-full p-1.5 shadow-md">
                      <Image src="/images/check.png" alt="checked" width={24} height={24} />
                    </div>
                  </div>
                )}

                {/* Reward Label for Day 7 */}
                {isRewardDay && (
                  <div className="mt-2 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                    BIG REWARD
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Modal Logic (Keep as is) */}
        <Modal open={modalVisible} onOk={handleModalOk} onCancel={() => setModalVisible(false)} centered footer={null} width={320} className="checkin-modal">
          <div className="flex flex-col items-center justify-center p-6 gap-4 text-center">
            <div className="w-24 h-24 relative animate-bounce">
              <Image src="/images/coupon.png" loader={imageLoader} alt="coupon" fill className="object-contain" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 m-0">ยินดีด้วย!</h3>
              <p className="text-gray-500 mt-2">คุณได้รับกาชาปอง</p>
            </div>
            <div className="text-4xl font-black text-red-500 my-2">
              {rewardUnit ?? 1} <span className="text-lg text-gray-400 font-medium">ลูก</span>
            </div>
            <Button type="primary" size="large" onClick={handleModalOk} className="w-full !bg-red-600 hover:!bg-red-700 h-10 rounded-full font-bold">
              ตกลง
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default SevenDaysLogin