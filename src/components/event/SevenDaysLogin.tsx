"use client"

import React from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import apiClient from '@/services/apiClient'
import { useQuery } from '@tanstack/react-query'
import { Modal, Button, Popover, App } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWebsiteStore } from '@/stores/websiteStore'
import { imageLoader } from '@/utils/imageUtils';

type LoginStatus = {
  latest_logged_in_day?: number
  current_reward_day?: number
  checked_in_today?: boolean
}


const fetchWeeklyLogin = async (token?: string | null): Promise<LoginStatus> => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const url = `${base}/user/event/login`
  // const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  // if (token) headers['Authorization'] = token
  // apiClient uses localStorage token automatically

  const res = await apiClient.get(url)
  // axios throws for non-2xx, so if we get here assume data present
  return res.data?.data ?? {}
}


export interface SevenDaysLoginProps {
  onClose?: () => void;
}

function SevenDaysLogin({ onClose }: SevenDaysLoginProps) {
  const { user, token, updateToken } = useAuthStore()
  const queryClient = useQueryClient()
  const { modal } = App.useApp()
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
      // Capture current coupon before API call
      const currentCoupon = Number(useAuthStore.getState().user?.coupon ?? 0)

      const res = await apiClient.post(checkinUrl, {})
      const unit = res.data?.data?.unit ?? null
      const rewardAmount = Number(unit ?? 0)

      // ... (logic คำนวณ latest day เดิม) ...

      setRewardUnit(unit)

      // 1. รับ Token ใหม่ และอัปเดตเข้า Store ก่อน (ถ้ามี)
      // Check multiple paths for token: data.token, data.data.token (string), or data.data.token.token (object wrapper from screenshot)
      let newToken = res.data?.token ?? res.data?.data?.token
      if (typeof newToken === 'object' && newToken?.token) {
          newToken = newToken.token
      }
      
      const activeToken = newToken ?? token;

      if (newToken && typeof newToken === 'string' && typeof updateToken === 'function') {
        try {
          updateToken(newToken)
          try { /* apiClient uses localStorage */ } catch (e) { }
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



      // refresh weekly-login data
      try { queryClient.invalidateQueries({ queryKey: ['weekly-login'] }) } catch (e) { /* ignore */ }

      setModalVisible(true)
    } catch (e: any) {
      console.error('Checkin Error:', e)
      const errorMsg = e.response?.data?.message || 'เกิดข้อผิดพลาดขณะเช็คอิน'
      modal.error({ title: 'เช็คอินล้มเหลว', content: errorMsg })
    } finally {
      setConfirmLoading(false)
    }
  }

  const { settings } = useWebsiteStore()

  const handleModalOk = () => {
    setModalVisible(false)
    // ensure latest data
    try { queryClient.invalidateQueries({ queryKey: ['weekly-login'] }) } catch (e) { }

    // If parent provided onClose, call it to close the DailyCheckinModal too
    if (onClose) {
        onClose();
    }
  }
  return (
    <div className="w-full flex justify-center px-4 py-8">
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-sm p-4 md:p-8 flex flex-col items-center relative">
        {/* Close Button (if onClose provided) */}
        {onClose && (
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200 z-10"
                aria-label="Close"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        )}
        
        {/* Title */}
        <div className="mb-8 text-center relative flex flex-col items-center">
           <div className="flex items-center gap-2 mb-1">
             <h2 className="text-2xl md:text-3xl font-bold text-gray-800 m-0">เช็คอินรายวัน</h2>
             <Popover
                content={
                  <div className="max-w-xs md:max-w-sm text-sm p-2 space-y-1">
                    <p>• จำกัดการรับสแตมป์ 1 ดวง ต่อการล็อกอิน 1 ครั้ง / วัน / บัญชี</p>
                    <p>• ไม่สามารถรับสแตมป์ย้อนหลังได้</p>
                    <p>• แจกสแตมป์ถึงวันที่ 31 มีนาคม 2569</p>
                    <p>• สแตมป์ใช้แลกรางวัลได้ถึงวันที่ 30 เมษายน 2569</p>
                    <p>• สแตมป์จะถูกลบออกจากระบในวันที่ 1 พฤษภาคม 2569</p>
                    <p>• สแตมป์และรางวัลไม่สามารถโอนหรือแลกเป็นเงินสด</p>
                    <p>• รางวัลบางรายการมีจำนวนจำกัด</p>
                    <p>• เงื่อนไขเป็นไปตามที่บริษัทฯ กำหนด</p>
                  </div>
                }
                trigger="click"
                placement="bottom"
              >
                <button className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                  <InfoCircleOutlined className="text-lg md:text-xl" />
                </button>
              </Popover>
           </div>
           <h3>ของรางวัลจะเข้าบัญชีของคุณโดยอัตโนมัติเมื่อกดเช็คอิน</h3>
           <span className='text-gray-500 mt-2'>รีเซ็ตทุกวัน เวลา 00:00</span>
        </div>

        {/* Days Row */}
        <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 md:gap-4 w-full mb-8">
           {[...Array(7)].map((_, i) => {
             const day = i + 1
             const isRewardDay = day === 7
             const isChecked = day < currentRewardDay || (day === currentRewardDay && checkedToday)
             const isToday = day === currentRewardDay && !checkedToday;
             
             // Define styles based on state
             let containerClass = "bg-gray-100/80"
             let textClass = "text-gray-300"
             let borderClass = "border-transparent"

             if (isToday) {
                containerClass = "bg-gray-100/80 cursor-pointer hover:bg-red-50 transition-colors"
                textClass = "text-red-500 font-bold"
             } else if (isChecked) {
                containerClass = "bg-gray-100 opacity-70"
             }

             // Highlight current day frame (only if not checked in yet)
             if (day === currentRewardDay && !checkedToday) {
                 borderClass = "ring-2 ring-red-500 shadow-lg shadow-red-200"
             }

             return (
               <div 
                  key={day}
                  onClick={isToday ? handleCheckin : undefined}
                  className={`
                    flex flex-col items-center justify-between 
                    w-[30%] md:w-[110px] h-[120px] md:h-[160px] 
                    rounded-2xl p-2 relative select-none
                    transition-all duration-300
                    ${containerClass}
                    ${borderClass}
                  `}
               >
                  {/* Reward Badge */}
                  <div className={`
                    absolute top-0 left-0 right-0 h-8 
                    flex items-center justify-center 
                    text-base font-bold rounded-t-2xl
                    bg-red-500 text-white
                  `}>
                    +1
                  </div>

                  {/* Icon */}
                  <div className="flex-1 flex items-center justify-center mt-6">
                     <div className="relative w-12 h-12 md:w-14 md:h-14">
                        {settings?.stamp && (
                          <Image 
                            src={settings.stamp} 
                            alt="reward" 
                            fill 
                            className="object-contain"
                            unoptimized
                          />
                        )}
                        {/* Overlay Checkmark if checked */}
                        {isChecked && (
                            <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                                <div className="bg-green-500 text-white rounded-full p-1 shadow-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                            </div>
                        )}
                     </div>
                  </div>

                  {/* Day Label */}
                  <div className={`mb-2 text-sm md:text-base ${textClass}`}>
                    {isToday ? 'วันนี้' : `วันที่ ${day}`}
                  </div>
               </div>
             )
           })}
        </div>

        {/* Status Text */}
        <div className="text-center mt-4">
           {checkedToday ? (
              <button 
                disabled
                className="bg-gray-100 text-gray-400 text-lg font-bold py-3 px-12 rounded-full cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                เช็คอินแล้ว
              </button>
           ) : (
              <button 
                onClick={handleCheckin}
                disabled={confirmLoading}
                className={`
                  bg-red-500 
                  hover:from-red-600 hover:to-red-700
                  !text-white text-lg font-bold 
                  py-3 px-12 rounded-full 
                  transform transition-all duration-200
                  hover:scale-105 active:scale-95
                  flex items-center justify-center gap-2 mx-auto
                  ${confirmLoading ? 'opacity-70 cursor-wait' : ''}
                `}
              >
                {confirmLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 !text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังบันทึก...
                  </>
                ) : (
                  'กดเช็คอินเพื่อรับรางวัล'
                )}
              </button>
           )}
        </div>
        
        {/* Modal Logic (Keep as is) */}
        <Modal open={modalVisible} onOk={handleModalOk} onCancel={() => setModalVisible(false)} centered footer={null} width={320} className="checkin-modal">
          <div className="flex flex-col items-center justify-center p-6 gap-4 text-center">
            <div className="w-24 h-24 relative">
              <Image src={settings?.stamp || '/images/stamp.png'} unoptimized alt="stamp" fill className="object-contain" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 m-0">ยินดีด้วย!</h3>
              <p className="text-gray-500 mt-2">คุณได้รับสแตมป์</p>
            </div>
            <div className="text-4xl font-black text-red-500 my-2">
              {rewardUnit ?? 1} <span className="text-lg text-gray-400 font-medium">ดวง</span>
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