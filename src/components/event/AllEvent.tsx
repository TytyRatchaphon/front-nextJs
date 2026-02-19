"use client"
import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { Modal, Button, notification } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import apiClient from '@/services/apiClient'
import { useWebsiteStore } from '@/stores/websiteStore'

function AllEvent() {
  const { user, token, updateToken } = useAuthStore()
  const [api, contextHolder] = notification.useNotification()
  const [modalOpen, setModalOpen] = useState(false)
  const [stage, setStage] = useState<number>(1)
  const [gachaImage, setGachaImage] = useState<string>('/images/gachaStatic.gif')
  const [gachaResult, setGachaResult] = useState<any>(null)

  // Stamp modal state (simple implementation)
  const [stampModalOpen, setStampModalOpen] = useState(false)
  const [stampAmount, setStampAmount] = useState<number>(1)
  const [stampType, setStampType] = useState<'flower' | 'heart' | null>('flower')
  const [stampLoading, setStampLoading] = useState(false)
  const STAMP_COST = 200

  const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
    return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
  }

  const handleConfirmStampExchange = async () => {
    if (!stampType) return

    // ============================================================
    // 🛑 1. Validation: เช็คว่ามี ดอกไม้/หัวใจ พอแลกไหม?
    // ============================================================
    const totalCost = stampAmount * STAMP_COST
    let currentBalance = 0
    let currencyLabel = ''

    if (user) {
      if (stampType === 'flower') {
        currentBalance = Number(user.flower ?? 0)
        currencyLabel = 'ดอกไม้'
      } else {
        currentBalance = Number(user.heart ?? 0)
        currencyLabel = 'หัวใจ'
      }
    }

    if (currentBalance < totalCost) {
      // แจ้งเตือนเมื่อแต้มไม่พอ (Icon กากบาทสีแดง)
      api.error({
        message: 'แต้มไม่เพียงพอ',
        description: `คุณมี ${currentBalance} ${currencyLabel} แต่ต้องใช้ ${totalCost} ${currencyLabel}`,
        placement: 'topRight',
        duration: 3,
      })
      return // จบฟังก์ชันทันที ไม่ยิง API
    }
    // ============================================================

    setStampLoading(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL
      const url = `${base}/user/event/stamp-exchange`
      const body = { amount: String(stampAmount), type: stampType }

      // 2. ยิง API แลกสแตมป์
      const res = await apiClient.post(url, body)

      // 3. จัดการ Token
      const rawTokenCandidate = extractTokenFromResponse(res) ?? res.data?.token ?? res.data?.data?.token ?? res.headers?.authorization ?? res.headers?.Authorization
      const newToken = normalizeToken(rawTokenCandidate)

      if (newToken && typeof updateToken === 'function') {
        try {
          updateToken(newToken)
          try { /* apiClient uses localStorage */ } catch (e) { /* ignore */ }
        } catch (e) { }
      }

      // ============================================================
      // ✨ 4. Optimistic Update (ตัดสแตมป์ + เพิ่มของทันที) ✨
      // ============================================================
      if (user) {
        // 4.1 สร้าง User Object ใหม่
        const updatedUser = { ...user }

        // 4.2 เพิ่มสแตมป์
        updatedUser.stamp = Number(user.stamp ?? 0) + stampAmount

        // 4.3 หักลบ ดอกไม้ หรือ หัวใจ
        if (stampType === 'flower') {
          updatedUser.flower = Math.max(0, currentBalance - totalCost)
        } else if (stampType === 'heart') {
          updatedUser.heart = Math.max(0, currentBalance - totalCost)
        }

        // 4.4 ยัดใส่ Store
        useAuthStore.setState({ user: updatedUser })
        localStorage.setItem('userData', JSON.stringify(updatedUser))
      }
      // ============================================================

      // 5. Delayed Sync
      const authForFetch = newToken ?? token
      if (authForFetch) {
        setTimeout(async () => {
          try {
            const meRes = await apiClient.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/me`)
            const profile = meRes.data?.data ?? meRes.data
            if (profile) {
              useAuthStore.setState({ user: profile, token: authForFetch, isLoggedIn: true })
              localStorage.setItem('userData', JSON.stringify(profile))
            }
          } catch (e) {
          }
        }, 1000)
      }

      // แจ้งเตือนความสำเร็จ (Icon ติ๊กถูกสีเขียว)
      api.success({
        message: 'แลกสำเร็จ!',
        description: `คุณได้รับสแตมป์ ${stampAmount} ดวง เรียบร้อยแล้ว`,
        placement: 'topRight',
        duration: 3,
      })

      setStampModalOpen(false)
      setStampAmount(1)
      setStampType('flower')
    } catch (e) {
      // แจ้งเตือนกรณี API Error
      notification.error({
        message: 'ผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
        placement: 'topRight'
      })
    } finally {
      setStampLoading(false)
    }
  }

  const timerRef = useRef<number | null>(null)



  const couponCount = Number(user?.coupon ?? (user as any)?.coupons ?? 0)



  // Helper: try to find a JWT-like token anywhere in a response object
  const extractTokenFromResponse = (res: any): string | undefined => {
    try {
      if (!res) return undefined
      // common locations
      if (typeof res === 'string' && res.split('.').length === 3) return res
      if (res.data && typeof res.data === 'string' && res.data.split('.').length === 3) return res.data
      if (res.data?.token && typeof res.data.token === 'string') return res.data.token
      if (res.data?.data?.token && typeof res.data.data.token === 'string') return res.data.data.token

      // headers (some backends send token in headers)
      if (res.headers) {
        const h = res.headers
        if (typeof h.authorization === 'string' && h.authorization.split('.').length === 3) return h.authorization
        if (typeof h.Authorization === 'string' && h.Authorization.split('.').length === 3) return h.Authorization
        if (typeof h['x-access-token'] === 'string' && h['x-access-token'].split('.').length === 3) return h['x-access-token']
        if (typeof h['x-auth-token'] === 'string' && h['x-auth-token'].split('.').length === 3) return h['x-auth-token']
      }

      // recursive search for any JWT-looking string
      const seen = new Set<any>()
      const stack = [res]
      while (stack.length) {
        const node = stack.pop()
        if (!node || typeof node !== 'object') continue
        if (seen.has(node)) continue
        seen.add(node)
        for (const k of Object.keys(node)) {
          const v = (node as any)[k]
          if (typeof v === 'string' && v.split('.').length === 3) return v
          if (typeof v === 'object') stack.push(v)
        }
      }
    } catch (e) {
      // ignore
    }
    return undefined
  }

  const normalizeToken = (t?: string | null): string | undefined => {
    if (!t) return undefined
    let s = String(t).trim()
    if (s.toLowerCase().startsWith('bearer ')) s = s.split(' ')[1]
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1)
    }
    return s || undefined
  }

  const openGachaModal = () => {
    setStage(1)
    setModalOpen(true)
  }

  const handleStage1Action = async () => {
    if (couponCount <= 0) return

    // เริ่มอนิเมชัน
    setStage(2)
    setGachaImage(`/images/gacha.gif?t=${Date.now()}`)
    setGachaResult(null)

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL 
      const url = `${base}/user/event/gacha`
      // 1. ยิง API
      const res = await apiClient.post(url, {})
      const data = res.data?.data ?? res.data
      setGachaResult(data)

      // 2. เตรียมข้อมูลสำหรับ Optimistic Update (คูปองลดลง)
      let nextCouponCount = couponCount;
      if (user) {
        const current = Number(user.coupon ?? (user as any).coupons ?? 0)
        nextCouponCount = Math.max(0, current - 1)
      }

      // 3. จัดการ Token (ถ้ามี)
      const gachaRaw = extractTokenFromResponse(res) ?? res.data?.token ?? res.data?.data?.token ?? res.headers?.authorization ?? res.headers?.Authorization
      const gachaToken = normalizeToken(gachaRaw)

      if (gachaToken && typeof updateToken === 'function') {
        try {
          updateToken(gachaToken)
          try { /* apiClient uses localStorage */ } catch (e) { /* ignore */ }
        } catch (e) { }
      }

      // ============================================================
      // ✨ 4. CRITICAL FIX: อัปเดตทั้ง "คูปองที่ลด" และ "ของรางวัลที่เพิ่ม" ✨
      // ============================================================
      if (user) {
        // 4.1 เตรียม User Object ใหม่ที่มีคูปองลดแล้ว
        const updatedUser = {
          ...user,
          coupon: nextCouponCount,
          coupons: nextCouponCount
        }

        // 4.2 ตรวจสอบของรางวัลที่ได้ แล้วบวกเพิ่มเข้าไปทันที
        if (data) {
          const type = (data.type ?? data.reward_type ?? '').toString().toLowerCase();
          const unit = Number(data.unit ?? data.amount ?? 0);

          if (type.includes('flower')) {
            updatedUser.flower = Number(updatedUser.flower ?? 0) + unit;
          } else if (type.includes('heart')) {
            updatedUser.heart = Number(updatedUser.heart ?? 0) + unit;
          } else if (type.includes('freecoin') || type.includes('money')) {
            updatedUser.freecoin = Number(updatedUser.freecoin ?? 0) + unit;
          } else if (type.includes('coin') && !type.includes('free')) {
            updatedUser.coin = Number(updatedUser.coin ?? 0) + unit;
          } else if (type.includes('stamp')) {
            updatedUser.stamp = Number(updatedUser.stamp ?? 0) + unit;
          }
        }

        // 4.3 ยัดใส่ Store ทันที
        useAuthStore.setState({ user: updatedUser })
        // (Optional) บันทึกลง LocalStorage เผื่อ refresh หน้า
        localStorage.setItem('userData', JSON.stringify(updatedUser))
      }
      // ============================================================

      // 5. รอ 1 วินาที แล้วดึงข้อมูลจริงจาก Server มา Sync (เพื่อความชัวร์)
      const activeToken = gachaToken ?? token

      if (activeToken) {
        setTimeout(async () => {
          try {
            const meRes = await apiClient.get(`${base}/user/me`)
            const profile = meRes.data?.data ?? meRes.data

            if (profile) {
              useAuthStore.setState({ user: profile, token: activeToken, isLoggedIn: true })
              localStorage.setItem('userData', JSON.stringify(profile))
            }
          } catch (e) {
          }
        }, 1000)
      }

    } catch (e) {
      notification.error({ message: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถเชื่อมต่อกาชาปองได้' })
      setStage(1)
      setGachaImage('/images/gachaStatic.gif')
      return
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    timerRef.current = window.setTimeout(() => {
      setStage(3)
      timerRef.current = null
    }, 3000)
  }

  const handleSkip = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setStage(3)
  }

  const { settings } = useWebsiteStore();

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: 12 }}>
      {contextHolder}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
        <button
          type="button"
          aria-label="จิ๊กซอว์"
          className="flex-1 w-full min-w-0 h-auto aspect-[376/116] p-0 border-none bg-transparent rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Image src="/images/jigsaw.png" alt="จิ๊กซอว์" width={376} height={116} unoptimized  style={{ objectFit: 'cover', display: 'block', width: '100%', height: '100%' }} />
        </button>

        <button
          type="button"
          aria-label="แลกสแตมป์"
          onClick={() => setStampModalOpen(true)}
          className="flex-1 w-full min-w-0 h-auto aspect-[376/116] p-0 border-none bg-transparent rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Image src="/images/stamp-ex.png" alt="แลกสแตมป์" width={376} height={116} unoptimized  style={{ objectFit: 'cover', display: 'block', width: '100%', height: '100%' }} />
        </button>

        {/* <button
          type="button"
          aria-label="สุ่มกาชาปอง"
          onClick={openGachaModal}
          className="flex-1 w-full min-w-0 h-auto aspect-[376/116] p-0 border-none bg-transparent rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Image src="/images/gachapon.png" alt="สุ่มกาชาปอง" width={376} unoptimized unoptimized height={116} style={{ objectFit: 'cover', display: 'block', width: '100%', height: '100%' }} />
        </button> */}
      </div>

      {/* <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null } }}
        footer={null}
        centered
        width={300}
        styles={{ body: { padding: 12, minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
      >
        {stage === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
            <div style={{ flex: '0 0 auto' }}>
              <Image src="/images/gachaStatic.gif" alt="gacha" width={220} height={220} style={{ objectFit: 'contain' }} unoptimized unoptimized />
            </div>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
              <Button
                type="primary"
                disabled={couponCount <= 0}
                onClick={handleStage1Action}
                className={`${couponCount <= 0 ? '!bg-gray-400 !border-gray-400' : '!bg-red-600 hover:!bg-red-700 !border-red-600 hover:!border-red-700'}`}
                style={{
                  height: 44,
                  borderRadius: 8,
                  padding: '0 20px'
                }}
              >
                <span>{couponCount <= 0 ? 'สิทธิ์รับรางวัลหมดแล้ว' : 'สุ่มเลย!'}</span>
              </Button>
            </div>
          </div>
        )}

        {stage === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
            <div style={{ flex: '0 0 auto' }}>
              <Image src={gachaImage} alt="gacha-play" width={220} height={220} style={{ objectFit: 'contain' }} unoptimized unoptimized />
            </div>
            <div style={{ display: 'flex', gap: 12, flex: '0 0 auto' }}>
              <Button onClick={handleSkip} className="!bg-red-600 hover:!bg-red-700 !border-red-600 hover:!border-red-700" style={{ color: '#fff', height: 44, borderRadius: 8, padding: '0 20px' }}>ข้าม</Button>
            </div>
          </div>
        )}

        {stage === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>ผลรางวัลของคุณ</div>
              {gachaResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    const typeRaw = (gachaResult.type ?? gachaResult.reward_type ?? '').toString().toLowerCase()
                    const unit = gachaResult.unit ?? gachaResult.amount ?? 1
                    let img = settings?.coupon || '/images/coupon.png'
                    let label = typeRaw || 'รางวัล'
                    if (typeRaw.includes('exp')) { img = settings?.exp || '/images/exp.png'; label = 'EXP' }
                    else if (typeRaw.includes('flower')) { img = settings?.flower || '/images/flower.png'; label = 'ดอกไม้' }
                    else if (typeRaw.includes('heart')) { img = settings?.heart || '/images/heartbig.png'; label = 'หัวใจ' }
                    else if (typeRaw.includes('freecoin') || typeRaw.includes('free_coin') || typeRaw.includes('money')) { img = settings?.freecoin || '/images/freecoin.png'; label = 'Freecoin' }

                    return (
                      <>
                        <Image src={img} alt={label} width={96} height={96} style={{ objectFit: 'contain' }} unoptimized unoptimized />
                        <div>{`คุณได้รับ ${unit} ${label}`}</div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div>ไม่มีผลรางวัล</div>
              )}
              <div style={{ marginTop: 12 }}>
                <Button
                  onClick={() => { setModalOpen(false); setStage(1); setGachaImage('/images/gachaStatic.gif'); setGachaResult(null) }}
                  className="!bg-red-600 hover:!bg-red-700 h-[44px] rounded-lg font-normal !text-white hover:!border-red-700 hover:border px-5"
                >
                  ตกลง
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal> */}

      <Modal
        open={stampModalOpen}
        onCancel={() => { setStampModalOpen(false); setStampAmount(1); setStampType('flower'); setStampLoading(false) }}
        footer={null}
        centered
        width={300}
        styles={{ body: { padding: 12, minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
      >
        <div style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>

          {/* --- แก้ไขส่วนหัว: ชื่อ และ รูปภาพขนาดใหญ่ด้านล่าง --- */}
          <div style={{ fontWeight: 700, fontSize: 16 }}>แลกสแตมป์</div>

          <div style={{ marginBottom: 4 }}>
            <Image
              src={settings?.stamp || '/images/userstamp.png'}
              alt="stamp-large"
              width={100}
              height={100}
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          </div>
          {/* -------------------------------------------------- */}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              aria-label="decrease"
              onClick={() => setStampAmount((a: number) => Math.max(1, a - 1))}
              style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #e5e7eb', background: 'white' }}
            >-</button>
            <div style={{ minWidth: 48, textAlign: 'center' }}>{stampAmount}</div>
            <button
              aria-label="increase"
              onClick={() => setStampAmount((a: number) => a + 1)}
              style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #e5e7eb', background: 'white' }}
            >+</button>
          </div>

          <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
            <div
              onClick={() => setStampType('flower')}
              style={{
                flex: 1,
                borderRadius: 8,
                padding: '8px 12px',
                border: stampType === 'flower' ? '2px solid #dc2626' : '1px solid #e5e7eb',
                cursor: 'pointer',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxSizing: 'border-box',
                height: 44
              }}
            >
              <Image src={settings?.flower || '/images/flower.png'} alt="flower" width={24} height={24} style={{ objectFit: 'contain' }} unoptimized />
              <div style={{ fontWeight: 500 }}>{stampAmount * STAMP_COST}</div>
            </div>

            <div
              onClick={() => setStampType('heart')}
              style={{
                flex: 1,
                borderRadius: 8,
                padding: '8px 12px',
                border: stampType === 'heart' ? '2px solid #dc2626' : '1px solid #e5e7eb',
                cursor: 'pointer',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxSizing: 'border-box',
                height: 44
              }}
            >
              <Image src={settings?.heart || '/images/heartbig.png'} alt="heart" width={24} height={24} style={{ objectFit: 'contain' }} unoptimized />
              <div style={{ fontWeight: 500 }}>{stampAmount * STAMP_COST}</div>
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Button
              type="primary"
              loading={stampLoading}
              disabled={stampLoading || !stampType}
              onClick={handleConfirmStampExchange}
              style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff', height: 44, borderRadius: 8 }}
            >
              ยืนยันการแลก
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AllEvent