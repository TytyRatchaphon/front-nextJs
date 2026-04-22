'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Empty, Button, App } from 'antd';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserCollections, createCollection, reorderCollections, pinCollections } from '@/services/api/collectionApi';
import type { CollectionItem } from '@/services/api/collectionApi';
import CreateCollectionModal, { CollectionFormData } from './CreateCollectionModal';
import SortableCollectionCard from './SortableCollectionCard';

export default function CollectionTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notification } = App.useApp();
  const [showModal, setShowModal] = useState(false);
  const [localOrder, setLocalOrder] = useState<CollectionItem[] | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // Fetch collections
  const { data, isLoading, isError } = useQuery({
    queryKey: ['userCollections'],
    queryFn: () => fetchUserCollections(),
  });

  const apiCollections: CollectionItem[] = useMemo(() => data ?? [], [data]);

  // Sort: pinned first, then by order_index (only for API data)
  // When localOrder is set (from drag), use that order directly
  const sortedCollections = useMemo(() => {
    if (localOrder) return localOrder;
    return [...apiCollections].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return (a.order_index ?? 0) - (b.order_index ?? 0);
    });
  }, [apiCollections, localOrder]);

  const collectionIds = useMemo(() => sortedCollections.map((c) => String(c.id)), [sortedCollections]);

  // DnD handler
  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderCollections(ids),
    onError: () => {
      notification.error({ message: 'ไม่สามารถเรียงลำดับได้' });
      setLocalOrder(null); // rollback
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedCollections.findIndex((c) => String(c.id) === String(active.id));
    const newIndex = sortedCollections.findIndex((c) => String(c.id) === String(over.id));
    const reordered = arrayMove(sortedCollections, oldIndex, newIndex);
    setLocalOrder(reordered);
  };

  const handleFinishEditing = () => {
    setIsEditing(false);
    if (localOrder) {
      reorderMutation.mutate(localOrder.map((c) => c.id));
    }
  };

  // Create collection mutation
  const createMutation = useMutation({
    mutationFn: (formData: CollectionFormData) =>
      createCollection({
        name: formData.name,
        description: formData.description,
        is_public: formData.isPublished,
        cover_image: formData.coverFile,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCollections'] });
      setShowModal(false);
      setLocalOrder(null);
      notification.success({ message: 'สร้างคอลเลคชั่นสำเร็จ' });
    },
    onError: () => {
      notification.error({ message: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถสร้างคอลเลคชั่นได้' });
    },
  });

  // Pin/unpin mutation
  const pinMutation = useMutation({
    mutationFn: ({ id, is_pinned }: { id: number; is_pinned: boolean }) =>
      pinCollections([id], is_pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCollections'] });
      setLocalOrder(null);
    },
    onError: () => {
      notification.error({ message: 'ไม่สามารถปักหมุดได้' });
    },
  });

  const handlePin = (id: number, pinned: boolean) => {
    // Optimistic update
    const updatedCols = (localOrder ?? apiCollections).map((c) =>
      c.id === id ? { ...c, is_pinned: pinned } : c
    );
    setLocalOrder(updatedCols);
    pinMutation.mutate({ id, is_pinned: pinned });
  };

  const handleCreate = (data: CollectionFormData) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (isError) {
    return <div className="py-4 text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>;
  }

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-500 test-sm">{sortedCollections.length} คอลเลคชั่น</p>
        <div className="flex items-center gap-2">
          {sortedCollections.length > 0 && (
            <Button
              onClick={() => {
                if (isEditing) handleFinishEditing();
                else setIsEditing(true);
              }}
              className={`rounded-full px-4 md:px-5 h-9 text-xs md:text-sm font-medium ${
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
            onClick={() => setShowModal(true)}
            className="!bg-red-600 hover:!bg-red-700 !border-red-600 rounded-full px-4 md:px-5 h-9 font-medium shadow-sm flex items-center gap-1.5"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            เพิ่มคอลเลคชั่น
          </Button>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditing && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 animate-in">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">โหมดแก้ไข</p>
            <p className="text-xs text-red-500">จับไอคอนที่มุมคอลเลคชั่นเพื่อลากจัดเรียงลำดับใหม่</p>
          </div>
          <Button
            size="small"
            onClick={handleFinishEditing}
            className="!bg-red-600 !text-white !border-red-600 hover:!bg-red-700 rounded-full text-xs"
          >
            เสร็จสิ้น
          </Button>
        </div>
      )}

      {/* Grid */}
      {sortedCollections.length === 0 ? (
        <div className="py-12">
          <Empty
            description={
              <div className="flex flex-col items-center gap-3">
                <p className="text-gray-400 text-base">ยังไม่มีคอลเลคชั่น</p>
                <Button
                  type="primary"
                  onClick={() => setShowModal(true)}
                  className="!bg-red-600 hover:!bg-red-700 !border-red-600 rounded-full"
                >
                  สร้างคอลเลคชั่นแรก
                </Button>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={collectionIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedCollections.map((col) => (
                <SortableCollectionCard
                  key={col.id}
                  collection={col}
                  onPin={handlePin}
                  onClick={(id) => router.push(`/shelve/collection/${id}`)}
                  pinLoading={pinMutation.isPending}
                  isEditing={isEditing}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create Modal */}
      <CreateCollectionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreate}
        loading={createMutation.isPending}
      />
    </div>
  );
}
