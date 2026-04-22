"use client"
import { useState } from 'react'
import { App, Modal, Select, InputNumber } from 'antd'
import { updateEpisodesPrice } from '../../services/apiServices'

export default function BulkPriceModal({
  open,
  onClose,
  epIds,
  onUpdated,
}: {
  open: boolean
  onClose: () => void
  epIds: string[]
  onUpdated?: () => void
}) {
  const [price, setPrice] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { notification } = App.useApp()
  const msgApi = {
    success: (content: unknown) => notification.success({ message: String(content ?? '') }),
    error: (content: unknown) => notification.error({ message: String(content ?? '') }),
    warning: (content: unknown) => notification.warning({ message: String(content ?? '') }),
    info: (content: unknown) => notification.info({ message: String(content ?? '') }),
  }

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered>
      <div className="py-4 text-center">
        <h3 className="text-lg text-amber-500 font-semibold mb-4">แก้ไขราคาทั้งหมดที่เลือก</h3>
        <div className="mx-auto w-48">
          <Select
            value={price ?? undefined}
            onChange={(val) => setPrice(val === undefined ? null : Number(val))}
            options={[{ value: 0, label: 'อ่านฟรี (0 เหรียญ)' }, ...Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1} เหรียญ` }))]}
            style={{ width: '100%' }}
            placeholder="เลือก..."
          />
          <div className="my-2 text-center text-gray-400 text-sm">หรือกำหนดเอง</div>
          <InputNumber
            min={0}
            value={price}
            onChange={(val) => setPrice(val)}
            placeholder="ระบุราคาเอง"
            style={{ width: '100%' }}
          />
        </div>
        <div className="flex justify-center mt-6">
          <button
            onClick={async () => {
              if (!epIds || epIds.length === 0) return msgApi.info('ไม่มีตอนที่เลือก')
              if (price === null) return msgApi.error('โปรดเลือกราคา')
              try {
                setSubmitting(true)
                await updateEpisodesPrice(epIds, price)
                msgApi.success('แก้ไขราคาสำเร็จ')
                onClose()
                if (onUpdated) onUpdated();
              } catch (e: any) {
                msgApi.error(e?.response?.data?.message ?? 'ไม่สามารถแก้ไขราคาได้')
              } finally {
                setSubmitting(false)
              }
            }}
            disabled={submitting || price === null || epIds.length === 0}
            className="bg-rose-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-rose-700 transition-colors"
            style={{ color: '#ffffff' }}
          >
            {submitting ? 'กำลังอัปเดต...' : 'แก้ไขราคา'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
