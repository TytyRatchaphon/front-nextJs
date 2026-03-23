'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { App, Button, Empty, Segmented } from 'antd';
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteCollection,
  fetchCollectionBooks,
  fetchHiddenBooks,
  fetchUserCollections,
  removeBookFromCollection,
  reorderBooksInCollection,
  updateBookVisibility,
  updateCollectionDetails,
} from '@/services/api/collectionApi';
import type { CollectionBook, CollectionItem } from '@/services/api/collectionApi';
import SortableBookCard from './SortableBookCard';
import CardBook from '@/components/novelCard/CardBook';
import AddBookToCollectionModal from './AddBookToCollectionModal';
import CreateCollectionModal, { CollectionFormData } from './CreateCollectionModal';
import CollectionCommentSection from './CollectionCommentSection';

interface Props {
  collectionId: string;
}

export default function CollectionDetail({ collectionId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notification, modal } = App.useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditCollectionModal, setShowEditCollectionModal] = useState(false);
  const [localBooks, setLocalBooks] = useState<CollectionBook[] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'visible' | 'hidden'>('visible');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const { data: allCollections, isLoading: isLoadingMeta } = useQuery({
    queryKey: ['userCollections'],
    queryFn: () => fetchUserCollections(),
  });

  const collection = useMemo(
    () => allCollections?.find((c: CollectionItem) => String(c.id) === String(collectionId)),
    [allCollections, collectionId]
  );

  const { data: apiBooks, isLoading: isLoadingBooks } = useQuery({
    queryKey: ['collectionBooks', collectionId],
    queryFn: () => fetchCollectionBooks(Number(collectionId)),
  });

  const { data: hiddenBooksData, isLoading: isLoadingHidden } = useQuery({
    queryKey: ['hiddenCollectionBooks', collectionId],
    queryFn: () => fetchHiddenBooks(Number(collectionId)),
  });

  const isLoading = isLoadingMeta || isLoadingBooks || isLoadingHidden;

  const books: CollectionBook[] = useMemo(() => localBooks ?? (apiBooks ?? []), [localBooks, apiBooks]);

  const sortedBooks = useMemo(() => {
    if (localBooks) return localBooks;
    return [...books].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, [books, localBooks]);

  const bookIds = useMemo(() => sortedBooks.map((b) => String(b.book_id)), [sortedBooks]);
  const hiddenBooks = useMemo(() => hiddenBooksData ?? [], [hiddenBooksData]);
  const visibleCount = sortedBooks.length;
  const hiddenCount = hiddenBooks.length;
  const totalCount = visibleCount + hiddenCount;
  const displayBooks = viewMode === 'hidden' ? hiddenBooks : sortedBooks;
  const existingBookIds = useMemo(() => new Set<number>(books.map((b) => b.book_id)), [books]);

  const reorderBooksMutation = useMutation({
    mutationFn: (bookIds: number[]) => reorderBooksInCollection(Number(collectionId), bookIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionBooks', collectionId] });
    },
    onError: () => {
      notification.error({ message: 'ไม่สามารถเรียงลำดับได้' });
      setLocalBooks(null);
    },
  });

  const removeBookMutation = useMutation({
    mutationFn: (bookId: number) => removeBookFromCollection(Number(collectionId), [bookId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionBooks', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['userCollections'] });
      setLocalBooks(null);
      notification.success({ message: 'ลบหนังสือออกจากคอลเลคชั่นแล้ว' });
    },
    onError: () => {
      notification.error({ message: 'ไม่สามารถลบหนังสือได้' });
    },
  });

  const hideBookMutation = useMutation({
    mutationFn: (bookId: number) => updateBookVisibility(Number(collectionId), [bookId], true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionBooks', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['hiddenCollectionBooks', collectionId] });
      notification.success({ message: 'ซ่อนหนังสือแล้ว' });
    },
    onError: () => {
      notification.error({ message: 'ไม่สามารถซ่อนหนังสือได้' });
    },
  });

  const unhideBookMutation = useMutation({
    mutationFn: (bookId: number) => updateBookVisibility(Number(collectionId), [bookId], false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionBooks', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['hiddenCollectionBooks', collectionId] });
      notification.success({ message: 'เลิกซ่อนหนังสือแล้ว' });
    },
    onError: () => {
      notification.error({ message: 'ไม่สามารถเลิกซ่อนหนังสือได้' });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: () => deleteCollection(Number(collectionId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCollections'] });
      notification.success({ message: 'ลบคอลเลคชั่นแล้ว' });
      router.push('/shelve?tab=4');
    },
    onError: () => {
      notification.error({ message: 'ไม่สามารถลบคอลเลคชั่นได้' });
    },
  });

  const updateCollectionMutation = useMutation({
    mutationFn: (formData: CollectionFormData) =>
      updateCollectionDetails(Number(collectionId), {
        name: formData.name,
        description: formData.description,
        is_public: formData.isPublished,
        cover_image: formData.coverFile,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCollections'] });
      setShowEditCollectionModal(false);
      notification.success({ message: 'แก้ไขคอลเลคชั่นสำเร็จ' });
    },
    onError: (error: any) => {
      notification.error({ message: error?.response?.data?.message || 'ไม่สามารถแก้ไขคอลเลคชั่นได้' });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedBooks.findIndex((b) => String(b.book_id) === String(active.id));
    const newIndex = sortedBooks.findIndex((b) => String(b.book_id) === String(over.id));
    setLocalBooks(arrayMove(sortedBooks, oldIndex, newIndex));
  };

  const handleFinishEditing = () => {
    setIsEditing(false);
    if (localBooks) {
      reorderBooksMutation.mutate(localBooks.map((b) => Number(b.book_id)));
    }
  };

  const handleRemoveBook = (bookId: number, bookName: string) => {
    modal.confirm({
      title: 'ลบหนังสือออกจากคอลเลคชั่น',
      content: `ต้องการลบ "${bookName}" ออกจากคอลเลคชั่นนี้หรือไม่?`,
      okText: 'ลบ',
      cancelText: 'ยกเลิก',
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => removeBookMutation.mutate(bookId),
    });
  };

  const handleHideBook = (bookId: number, bookName: string) => {
    modal.confirm({
      title: 'ซ่อนหนังสือ',
      content: `ต้องการซ่อน "${bookName}" ไม่ให้แสดงในคอลเลคชั่นหรือไม่?`,
      okText: 'ซ่อน',
      cancelText: 'ยกเลิก',
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => hideBookMutation.mutate(bookId),
    });
  };

  const handleDeleteCollection = () => {
    modal.confirm({
      title: 'ลบคอลเลคชั่น',
      content: `ต้องการลบคอลเลคชั่น "${collection?.name}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      okText: 'ลบ',
      cancelText: 'ยกเลิก',
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => deleteCollectionMutation.mutate(),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#fff8f8_0%,#ffffff_28%,#ffffff_100%)] py-10">
        <div className="mx-auto flex max-w-[1280px] items-center justify-center px-4 md:px-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-red-100 bg-white shadow-[0_30px_80px_-48px_rgba(220,38,38,0.5)]">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-red-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#fff8f8_0%,#ffffff_24%,#ffffff_100%)] py-8 md:py-12">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="rounded-[28px] border border-red-100/80 bg-white px-6 py-12 shadow-[0_24px_80px_-48px_rgba(220,38,38,0.45)]">
            <Empty description="ไม่พบคอลเลคชั่น" />
            <Button onClick={() => router.push('/shelve?tab=4')} className="mt-4 mb-1 h-10 rounded-full px-5">
              กลับไปชั้นหนังสือ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7f7_0%,#ffffff_22%,#ffffff_100%)] py-6 md:py-10">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="mb-5 flex items-center justify-between gap-3 md:mb-7">
          <button
            onClick={() => router.push('/shelve?tab=4')}
            className="group inline-flex h-11 items-center gap-2 rounded-full border border-red-100 bg-white/90 px-4 text-sm font-medium text-gray-600 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.7)] transition-all hover:border-red-200 hover:text-red-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>กลับไปชั้นหนังสือ</span>
          </button>

          <Button
            onClick={() => setShowEditCollectionModal(true)}
            className="h-11 rounded-full px-5 text-sm font-medium !border-red-100 !bg-white !text-gray-700 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.7)] hover:!border-red-300 hover:!text-red-600"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            }
          >
            แก้ไขคอลเลคชั่น
          </Button>
        </div>

        <section className="relative mb-8 overflow-hidden rounded-[30px] border border-red-100/80 bg-[linear-gradient(135deg,rgba(255,247,247,0.98),rgba(255,255,255,0.98))] shadow-[0_30px_90px_-60px_rgba(15,23,42,0.75)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.14),transparent_58%)]" />
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 translate-x-12 -translate-y-10 rounded-full bg-[radial-gradient(circle,rgba(185,28,28,0.12),transparent_68%)]" />

          <div className="relative grid gap-6 p-5 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:p-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="relative mx-auto w-full max-w-[260px] md:mx-0">
              <div className="absolute inset-0 translate-y-4 rounded-[28px] bg-red-950/10 blur-2xl" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(145deg,#fca5a5,#dc2626)] shadow-[0_24px_70px_-40px_rgba(127,29,29,0.65)]">
                {collection.cover_image ? (
                  <Image src={collection.cover_image} alt={collection.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-end bg-[linear-gradient(160deg,#ef4444,#7f1d1d)] p-5 text-white/90">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">Collection</p>
                      <p className="text-lg font-semibold leading-tight">{collection.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-between">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold tracking-[0.16em] ${
                    collection.is_public ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
                  }`}>
                    {collection.is_public ? 'PUBLIC' : 'PRIVATE'}
                  </span>
                  <span className="inline-flex h-8 items-center rounded-full border border-red-100 bg-white px-3 text-xs font-medium text-gray-600">
                    {totalCount} เล่มในคอลเลคชั่น
                  </span>
                </div>

                <div className="max-w-3xl">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500/80">My curated shelf</p>
                  <h1 className="text-3xl font-semibold leading-tight text-gray-950 md:text-5xl">{collection.name}</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                    {collection.description?.trim() || 'รวมหนังสือที่คุณอยากจัดเป็นคอลเลคชั่นเดียว ให้กลับมาหาเรื่องที่ชอบได้ง่ายขึ้น'}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-red-100 bg-white/90 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Visible</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-950">{visibleCount}</p>
                  <p className="mt-1 text-xs text-gray-500">รายการที่กำลังแสดงในคอลเลคชั่น</p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-white/90 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Hidden</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-950">{hiddenCount}</p>
                  <p className="mt-1 text-xs text-gray-500">รายการที่ซ่อนไว้ชั่วคราว</p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-white/90 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Status</p>
                  <p className="mt-2 text-lg font-semibold text-gray-950">{collection.is_public ? 'พร้อมแชร์' : 'ใช้งานส่วนตัว'}</p>
                  <p className="mt-1 text-xs text-gray-500">ปรับการเผยแพร่ได้จากเมนูแก้ไข</p>
                </div>
              </div>

              <button
                onClick={handleDeleteCollection}
                disabled={deleteCollectionMutation.isPending}
                className="mt-6 inline-flex h-11 w-fit items-center gap-2 rounded-full border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition-all hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                title="ลบคอลเลคชั่น"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                {deleteCollectionMutation.isPending ? 'กำลังลบ...' : 'ลบคอลเลคชั่น'}
              </button>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[28px] border border-gray-100 bg-white p-5 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.65)] md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-400">Collection library</p>
              <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                <h2 className="text-2xl font-semibold text-gray-950">หนังสือในคอลเลคชั่น</h2>
                <span className="inline-flex h-8 w-fit items-center rounded-full bg-red-50 px-3 text-xs font-medium text-red-700">
                  {viewMode === 'visible' ? `${visibleCount} รายการที่กำลังแสดง` : `${hiddenCount} รายการที่ถูกซ่อน`}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                {viewMode === 'visible'
                  ? 'จัดลำดับ เพิ่ม หรือซ่อนหนังสือเพื่อให้คอลเลคชั่นนี้อ่านง่ายและหาเรื่องสำคัญได้เร็ว'
                  : 'หนังสือที่ซ่อนไว้จะไม่แสดงบนคอลเลคชั่นหลัก แต่คุณนำกลับมาได้เมื่อต้องการ'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <Segmented
                options={[
                  { label: 'แสดงปกติ', value: 'visible' },
                  { label: 'ซ่อนอยู่', value: 'hidden' },
                ]}
                value={viewMode}
                onChange={(val) => {
                  setViewMode(val as 'visible' | 'hidden');
                  if (val === 'hidden') setIsEditing(false);
                }}
                className="text-xs md:text-sm"
              />

              {displayBooks.length > 0 && viewMode === 'visible' && (
                <Button
                  onClick={() => {
                    if (isEditing) handleFinishEditing();
                    else setIsEditing(true);
                  }}
                  className={`h-11 rounded-full px-5 text-sm font-medium ${
                    isEditing
                      ? '!bg-gray-900 !text-white !border-gray-900 hover:!bg-gray-800'
                      : '!border-red-100 !bg-white !text-gray-700 hover:!border-red-300 hover:!text-red-600'
                  }`}
                  icon={
                    isEditing ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    )
                  }
                >
                  {isEditing ? 'บันทึกลำดับ' : 'จัดลำดับ'}
                </Button>
              )}

              <Button
                type="primary"
                onClick={() => setShowAddModal(true)}
                className="h-11 rounded-full px-5 text-sm font-medium !border-red-600 !bg-red-600 hover:!bg-red-700"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                }
              >
                เพิ่มหนังสือ
              </Button>
            </div>
          </div>

          {displayBooks.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-dashed border-red-200 bg-[linear-gradient(180deg,#fffafa_0%,#ffffff_100%)] px-6 py-14">
              <Empty
                description={
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-base font-medium text-gray-700">
                      {viewMode === 'visible' ? 'ยังไม่มีหนังสือในคอลเลคชั่นนี้' : 'ไม่มีหนังสือที่ซ่อนอยู่'}
                    </p>
                    <p className="max-w-md text-sm leading-6 text-gray-500">
                      {viewMode === 'visible'
                        ? 'เริ่มต้นคอลเลคชั่นนี้ด้วยหนังสือที่คุณอยากกลับมาอ่านหรือแนะนำบ่อยที่สุด'
                        : 'หากคุณเคยซ่อนหนังสือไว้ รายการเหล่านั้นจะปรากฏที่นี่'}
                    </p>
                    {viewMode === 'visible' && (
                      <Button
                        type="primary"
                        onClick={() => setShowAddModal(true)}
                        className="mt-2 h-11 rounded-full px-5 !bg-red-600 hover:!bg-red-700"
                      >
                        เพิ่มหนังสือเล่มแรก
                      </Button>
                    )}
                  </div>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : isEditing ? (
            <>
              <div className="mt-8 flex flex-col gap-4 rounded-[24px] border border-red-200 bg-[linear-gradient(135deg,rgba(254,242,242,0.95),rgba(255,255,255,1))] p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-3 w-3 rounded-full bg-red-500 shadow-[0_0_0_6px_rgba(239,68,68,0.12)]" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">โหมดจัดลำดับกำลังเปิดใช้งาน</p>
                    <p className="mt-1 text-sm leading-6 text-red-600/80">ลากหนังสือเพื่อจัดลำดับใหม่ หรือเลือกลบและซ่อนรายการที่ไม่ต้องการ</p>
                  </div>
                </div>
                <Button
                  size="small"
                  onClick={handleFinishEditing}
                  className="h-10 rounded-full px-4 text-sm font-medium !border-red-600 !bg-red-600 !text-white hover:!bg-red-700"
                >
                  บันทึกและออกจากโหมด
                </Button>
              </div>

              <div className="mt-6 rounded-[24px] border border-dashed border-red-200 bg-[#fffdfd] p-4 md:p-5">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={bookIds} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {sortedBooks.map((b) => (
                        <SortableBookCard
                          key={b.book_id}
                          id={String(b.book_id)}
                          book={b}
                          onRemove={() => handleRemoveBook(b.book_id, b.name || b.title || 'หนังสือ')}
                          onHide={() => handleHideBook(b.book_id, b.name || b.title || 'หนังสือ')}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {displayBooks.map((b) => (
                <div key={b.book_id} className="relative mx-auto w-full max-w-[180px]">
                  <CardBook book={b as any} />
                  {viewMode === 'hidden' && (
                    <button
                      onClick={() => unhideBookMutation.mutate(b.book_id)}
                      className="absolute right-2 top-2 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-md backdrop-blur-sm transition-all duration-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white"
                      title="เลิกซ่อนหนังสือ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      เลิกซ่อน
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mx-auto mt-10 max-w-[1280px] px-4 md:px-6">
        <CollectionCommentSection collectionId={collectionId} />
      </div>

      <AddBookToCollectionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        collectionId={Number(collectionId)}
        existingBookIds={existingBookIds}
      />

      <CreateCollectionModal
        open={showEditCollectionModal}
        onClose={() => setShowEditCollectionModal(false)}
        onSave={(data) => updateCollectionMutation.mutate(data)}
        loading={updateCollectionMutation.isPending}
        initialData={{
          name: collection.name,
          description: collection.description,
          isPublished: collection.is_public,
          coverPreview: collection.cover_image || '',
        }}
      />
    </div>
  );
}
