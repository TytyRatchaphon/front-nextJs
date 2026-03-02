"use client"
import  { useState } from 'react'
import { Modal, message } from 'antd'
import { createGroup } from '@/services/apiServices'

export default function AddGroupModal({
  open,
  onClose,
  bookId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  bookId?: string | number | null
  onCreated?: () => void
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [msgApi, msgHolder] = message.useMessage()

  const validate = (v: string) => {
    const t = String(v ?? '').trim()
    if (!t) return 'กรุณาใส่ชื่อเล่ม'
    if (t.length < 3) return 'ชื่อต้องมีอย่างน้อย 3 ตัวอักษร'
    return null
  }

  return (
    <Modal open={open} onCancel={onClose} footer={null} title="เพิ่มเล่มนิยาย" centered>
      {msgHolder}
      <div className="py-4">
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          placeholder="กรอกชื่อเล่ม"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(validate(e.target.value))
          }}
        />
        {error ? <div className="text-rose-600 text-sm mt-2">{error}</div> : null}
        <div className="flex justify-center mt-6">
          <button
            onClick={async () => {
              const trimmed = String(name ?? '').trim()
              const err = validate(trimmed)
              setError(err)
              if (err) return msgApi.error(err)
              if (!bookId) return msgApi.error('ไม่พบ bookId')
              try {
                setCreating(true)
                await createGroup(String(bookId), trimmed)
                msgApi.success('สร้างเล่มเรียบร้อย')
                setName('')
                onClose()
                if (onCreated) onCreated();
              } catch (e: any) {
                msgApi.error(e?.response?.data?.message ?? 'ไม่สามารถสร้างเล่มได้')
              } finally {
                setCreating(false)
              }
            }}
            disabled={creating || Boolean(error) || !name.trim()}
            className="bg-rose-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-rose-700 transition-colors"
            style={{ color: '#ffffff' }}
          >
            {creating ? 'กำลังสร้าง...' : 'ตกลง'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
