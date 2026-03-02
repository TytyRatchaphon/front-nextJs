'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button, Empty, App } from 'antd';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserCollections, fetchCollectionBooks, deleteCollection, removeBookFromCollection, reorderBooksInCollection, updateBookVisibility, fetchHiddenBooks } from '@/services/api/collectionApi';
import type { CollectionItem, CollectionBook } from '@/services/api/collectionApi';
import SortableBookCard from './SortableBookCard';
import CardBook from '@/components/novelCard/CardBook';
import AddBookToCollectionModal from './AddBookToCollectionModal';
import { Segmented } from 'antd';
import CollectionCommentSection from './CollectionCommentSection';

interface Props {
  collectionId: string;
}

export default function CollectionDetail({ collectionId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notification, modal } = App.useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [localBooks, setLocalBooks] = useState<CollectionBook[] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'visible' | 'hidden'>('visible');

  // DnD sensors — PointerSensor for desktop, TouchSensor for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // Fetch collection metadata from list endpoint
  const { data: allCollections, isLoading: isLoadingMeta } = useQuery({
    queryKey: ['userCollections'],
    queryFn: () => fetchUserCollections(),
  });

  const collection = useMemo(
    () => allCollections?.find((c: CollectionItem) => String(c.id) === String(collectionId)),
    [allCollections, collectionId]
  );

  // Fetch books from detail endpoint
  const { data: apiBooks, isLoading: isLoadingBooks } = useQuery({
    queryKey: ['collectionBooks', collectionId],
    queryFn: () => fetchCollectionBooks(Number(collectionId)),
  });

  // Fetch hidden books
  const { data: hiddenBooksData, isLoading: isLoadingHidden } = useQuery({
    queryKey: ['hiddenCollectionBooks', collectionId],
    queryFn: () => fetchHiddenBooks(Number(collectionId)),
  });

  const isLoading = isLoadingMeta || isLoadingBooks || isLoadingHidden;

  // Use local state for drag reorder, fall back to API data
  const books: CollectionBook[] = useMemo(() => localBooks ?? (apiBooks ?? []), [localBooks, apiBooks]);

  // Sort books by order_index from API, use drag order when localBooks is set
  const sortedBooks = useMemo(() => {
    if (localBooks) return localBooks;
    return [...books].sort((a: CollectionBook, b: CollectionBook) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, [books, localBooks]);

  const bookIds = useMemo(() => sortedBooks.map((b: CollectionBook) => String(b.book_id)), [sortedBooks]);

  const hiddenBooks = useMemo(() => hiddenBooksData ?? [], [hiddenBooksData]);

  // Current books depending on viewMode
  const displayBooks = viewMode === 'hidden' ? hiddenBooks : sortedBooks;

  // --- Reorder books mutation ---
  const reorderBooksMutation = useMutation({
    mutationFn: (bookIds: number[]) => reorderBooksInCollection(Number(collectionId), bookIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionBooks', collectionId] });
    },
    onError: () => {
      notification.error({ message: 'ไม่สามารถเรียงลำดับได้' });
      setLocalBooks(null); // rollback
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedBooks.findIndex((b) => String(b.book_id) === String(active.id));
    const newIndex = sortedBooks.findIndex((b) => String(b.book_id) === String(over.id));
    const reordered = arrayMove(sortedBooks, oldIndex, newIndex);
    setLocalBooks(reordered);
  };

  const handleFinishEditing = () => {
    setIsEditing(false);
    if (localBooks) {
      reorderBooksMutation.mutate(localBooks.map((b) => Number(b.book_id)));
    }
  };

  // --- Remove book mutation ---
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

  // --- Hide book mutation ---
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

  // --- Unhide book mutation ---
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

  const handleUnhideBook = (bookId: number) => {
    unhideBookMutation.mutate(bookId);
  };

  // --- Delete collection mutation ---
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

  // Existing book IDs to filter out from add modal
  const existingBookIds = useMemo(() => new Set<number>(books.map((b: CollectionBook) => b.book_id)), [books]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-white py-6">
        <div className="container mx-auto px-4 text-center" style={{ maxWidth: '1200px' }}>
          <Empty description="ไม่พบคอลเลคชั่น" />
          <Button onClick={() => router.push('/shelve?tab=4')} className="mt-4 mb-4">กลับไปชั้นหนังสือ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6">
      <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
        {/* Back button */}
        <button
          onClick={() => router.push('/shelve?tab=4')}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors mb-4 md:mb-6 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform mb-4">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span className="text-sm font-medium mb-4">กลับไปชั้นหนังสือ</span>
        </button>

        {/* Collection Header */}
        <div className="relative w-full h-[180px] md:h-[260px] rounded-2xl overflow-hidden mb-6 md:mb-8 shadow-lg">
          {collection.cover_image ? (
            <Image src={collection.cover_image} alt={collection.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-400 to-rose-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    collection.is_public ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {collection.is_public ? 'เผยแพร่' : 'ส่วนตัว'}
                  </span>
                  <span className="text-white/70 text-xs">{sortedBooks.length} เล่ม</span>
                </div>
                <h1 className="text-xl md:text-3xl font-bold text-white mb-1">{collection.name}</h1>
                <p className="text-white/70 text-xs md:text-base max-w-xl line-clamp-2">{collection.description}</p>
              </div>
              {/* Delete Collection Button */}
              <button
                onClick={handleDeleteCollection}
                disabled={deleteCollectionMutation.isPending}
                className="bg-white/20 hover:bg-red-600 text-white rounded-full p-2.5 transition-all backdrop-blur-sm hover:scale-110 shrink-0"
                title="ลบคอลเลคชั่น"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Books Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-base md:text-lg font-bold text-gray-900">หนังสือในคอลเลคชั่น</h2>
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
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {displayBooks.length > 0 && viewMode === 'visible' && (
              <Button
                onClick={() => {
                  if (isEditing) handleFinishEditing();
                  else setIsEditing(true);
                }}
                className={`rounded-full px-4 md:px-5 h-8 md:h-9 text-xs md:text-sm font-medium ${
                  isEditing
                    ? '!bg-gray-800 !text-white !border-gray-800 hover:!bg-gray-700'
                    : '!border-gray-300 !text-gray-600 hover:!border-red-400 hover:!text-red-600'
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
                {isEditing ? 'เสร็จสิ้น' : 'แก้ไข'}
              </Button>
            )}
            <Button
              type="primary"
              onClick={() => setShowAddModal(true)}
              className="!bg-red-600 hover:!bg-red-700 !border-red-600 rounded-full px-4 md:px-5 h-8 md:h-9 text-xs md:text-sm font-medium"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              }
            >
              เพิ่มหนังสือ
            </Button>
          </div>
        </div>

        {displayBooks.length === 0 ? (
          <div className="py-12">
            <Empty
              description={
                <div className="flex flex-col items-center gap-3">
                  <p className="text-gray-400 text-base">
                    {viewMode === 'visible' ? 'ยังไม่มีหนังสือในคอลเลคชั่นนี้' : 'ไม่มีหนังสือที่ซ่อนอยู่'}
                  </p>
                  {viewMode === 'visible' && (
                    <Button
                      type="primary"
                      onClick={() => setShowAddModal(true)}
                      className="!bg-red-600 hover:!bg-red-700 !border-red-600 rounded-full"
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
            {/* Edit Mode Banner */}
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 animate-in">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">โหมดแก้ไข</p>
                <p className="text-xs text-red-500">ลากเพื่อจัดลำดับ หรือกด ✕ เพื่อลบหนังสือออก</p>
              </div>
              <Button
                size="small"
                onClick={handleFinishEditing}
                className="!bg-red-600 !text-white !border-red-600 hover:!bg-red-700 rounded-full text-xs"
              >
                เสร็จสิ้น
              </Button>
            </div>

            <div className="border-2 border-dashed border-red-300 rounded-2xl p-4 bg-red-50/30">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={bookIds} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {displayBooks.map((b) => (
              <div key={b.book_id} className="relative group/hiddenbook w-full max-w-[180px] h-[380px] mx-auto">
                <CardBook book={b as any} />
                {viewMode === 'hidden' && (
                  <button
                    onClick={() => handleUnhideBook(b.book_id)}
                    className="absolute top-2 right-2 z-20 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-gray-200 flex items-center gap-1.5 transition-all duration-200 hover:bg-gray-800 hover:text-white hover:border-gray-800 hover:scale-110 hover:shadow-lg text-gray-700 text-xs font-semibold cursor-pointer"
                    title="เลิกซ่อนหนังสือ"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    เลิกซ่อน
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CollectionCommentSection collectionId={collectionId} />

      {/* Add Books Modal */}
      <AddBookToCollectionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        collectionId={Number(collectionId)}
        existingBookIds={existingBookIds}
      />
    </div>
  );
}
