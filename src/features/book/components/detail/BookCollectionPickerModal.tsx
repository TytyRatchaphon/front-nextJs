"use client";

import React, { useState, useEffect } from "react";
import { Modal, Checkbox, Button, Input, message, Form, Switch } from "antd";
import NextImage from "next/image";
import { Plus, Check, BookMarked, Lock, Globe2 } from "lucide-react";
import {
  fetchCollectionPicker,
  bulkAddBookToCollections,
  createAndAddCollection,
  CollectionPickerItem
} from "@/services/api/collectionApi";

interface BookCollectionPickerModalProps {
  bookId: number;
  open: boolean;
  onClose: () => void;
}

export default function BookCollectionPickerModal({
  bookId,
  open,
  onClose,
}: BookCollectionPickerModalProps) {
  const [collections, setCollections] = useState<CollectionPickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Selected IDs for bulk add
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Create mode state
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open && bookId) {
      loadCollections();
      setIsCreateMode(false);
      createForm.resetFields();
    }
  }, [open, bookId]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await fetchCollectionPicker(bookId);
      if (data && data.collections) {
        setCollections(data.collections);
        // Pre-select collections that already contain the book
        const preSelected = data.collections
          .filter((c) => c.contains_book)
          .map((c) => c.id);
        setSelectedIds(preSelected);
      }
    } catch (error) {
      message.error("ไม่สามารถดึงข้อมูลคอลเลคชั่นได้");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (colId: number) => {
    setSelectedIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await bulkAddBookToCollections(bookId, selectedIds);
      if (result && result.results) {
        let addedCount = result.summary.added;
        if (addedCount > 0) {
          message.success(`เพิ่มหนังสือลงคอลเลคชั่นสำเร็จ ${addedCount} รายการ`);
        } else {
          message.info("อัปเดตคอลเลคชั่นเรียบร้อยแล้ว");
        }
        onClose();
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการเพิ่มหนังสือลงคอลเลคชั่น");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndAdd = async (values: { name: string; description?: string; is_public: boolean }) => {
    setCreating(true);
    try {
      const result = await createAndAddCollection(bookId, {
        name: values.name,
        description: values.description || "",
        is_public: values.is_public ?? false,
      });
      if (result && result.collection) {
        message.success("สร้างคอลเลคชั่นและเพิ่มหนังสือสำเร็จ!");
        onClose();
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการสร้างคอลเลคชั่น");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={480}
      title={
        <div className="flex items-center gap-2 text-red-600">
          <BookMarked className="w-5 h-5" />
          <span className="font-bold">เพิ่มเข้าคอลเลคชั่น</span>
        </div>
      }
    >
      <div className="py-2">
        {isCreateMode ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-4 text-gray-600 text-sm">
              สร้างคอลเลคชั่นใหม่และเพิ่มหนังสือเล่มนี้เป็นเรื่องแรก
            </div>
            <Form
              form={createForm}
              layout="vertical"
              onFinish={handleCreateAndAdd}
              initialValues={{ is_public: false }}
            >
              <Form.Item
                name="name"
                label="ชื่อคอลเลคชั่น"
                rules={[{ required: true, message: 'กรุณากรอกชื่อคอลเลคชั่น' }]}
              >
                <Input placeholder="เช่น นิยายแฟนตาซีสุดมันส์" maxLength={100} />
              </Form.Item>

              <Form.Item
                name="description"
                label="รายละเอียด (ไม่บังคับ)"
              >
                <Input.TextArea placeholder="รายละเอียดเพิ่มเติม..." rows={3} maxLength={500} />
              </Form.Item>

              <Form.Item
                name="is_public"
                valuePropName="checked"
              >
                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 text-sm">คอลเลคชั่นสาธารณะ</span>
                    <span className="text-xs text-gray-500">ให้ผู้อื่นสามารถดูและกดถูกใจคอลเลคชั่นนี้ได้</span>
                  </div>
                  <Switch />
                </div>
              </Form.Item>

              <div className="flex gap-3 mt-6">
                <Button 
                  className="flex-1" 
                  onClick={() => setIsCreateMode(false)}
                  disabled={creating}
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  loading={creating}
                >
                  สร้างและเพิ่มหนังสือ
                </Button>
              </div>
            </Form>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <button
              onClick={() => setIsCreateMode(true)}
              className="w-full mb-4 flex items-center justify-center gap-2 p-3 border border-dashed border-red-300 rounded-xl text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">สร้างคอลเลคชั่นใหม่</span>
            </button>

            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
              </div>
            ) : collections.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <BookMarked className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1} />
                <p className="text-sm font-medium">ยังไม่มีคอลเลคชั่น</p>
                <p className="text-xs mt-1">กดปุ่มสร้างด้านบนเพื่อเริ่มจัดหมวดหมู่นิยาย</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {collections.map((col) => {
                    const isSelected = selectedIds.includes(col.id);
                    return (
                      <div
                        key={col.id}
                        onClick={() => handleToggleSelect(col.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                          isSelected
                            ? "border-red-500 bg-red-50/50"
                            : "border-gray-100 hover:border-red-200 hover:bg-gray-50"
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="shrink-0">
                          <Checkbox checked={isSelected} className="pointer-events-none" />
                        </div>

                        {/* Collection Cover */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                          {col.cover_image ? (
                            <NextImage src={col.cover_image} alt={col.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
                              <BookMarked className="w-5 h-5 text-white opacity-80" />
                            </div>
                          )}
                        </div>

                        {/* Collection Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{col.name}</h4>
                            {col.is_public ? (
                              <Globe2 className="w-3 h-3 text-gray-400 shrink-0" />
                            ) : (
                              <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span>{col.book_count} เล่ม</span>
                            {col.contains_book && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="text-red-500 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> มีเล่มนี้แล้ว
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6">
                  <Button 
                    type="primary" 
                    className="w-full h-10 bg-red-600 hover:bg-red-700 rounded-xl"
                    onClick={handleSave}
                    loading={saving}
                    disabled={selectedIds.length === 0}
                  >
                    บันทึกการเปลี่ยนแปลง ({selectedIds.length})
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
