'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import type { CollectionItem } from '@/services/api/collectionApi';

interface Props {
  collection: CollectionItem;
  onPin: (id: number, pinned: boolean) => void;
  onClick: (id: number) => void;
  pinLoading?: boolean;
  isEditing?: boolean;
}

export default function SortableCollectionCard({ collection: col, onPin, onClick, pinLoading, isEditing }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(col.id) });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/col">
      {/* Drag Handle - Only show when editing */}
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-2 -left-2 z-30 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-red-50 hover:border-red-300"
          title="ลากเพื่อเรียงลำดับ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </div>
      )}

      {/* Pin Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onPin(col.id, !col.is_pinned); }}
        disabled={pinLoading}
        className={`absolute -top-2 -right-2 z-30 w-8 h-8 rounded-full shadow-lg border flex items-center justify-center transition-all duration-200 ${
          col.is_pinned
            ? 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600'
            : 'bg-white border-gray-200 text-gray-400 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-500'
        }`}
        title={col.is_pinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={col.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 17v5" />
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z" />
        </svg>
      </button>

      {/* Card */}
      <div
        onClick={() => onClick(col.id)}
        className="cursor-pointer bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      >
        {/* Cover Image */}
        <div className="relative w-full h-[160px] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {col.cover_image ? (
            <Image
              src={col.cover_image}
              alt={col.name}
              fill
              className="object-cover group-hover/col:scale-105 transition-transform duration-500"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {col.is_pinned && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-md flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                  <path d="M12 17v5" />
                  <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z" />
                </svg>
                ปักหมุด
              </span>
            )}
          </div>
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold shadow-md ${
            col.is_public ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-white'
          }`}>
            {col.is_public ? 'เผยแพร่' : 'ส่วนตัว'}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-base font-bold text-gray-900 hover:text-red-600 transition-colors mb-1 truncate">
            {col.name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2 mb-3 min-h-[40px]">
            {col.description || 'ไม่มีรายละเอียด'}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>{col.book_count} เล่ม</span>
            </div>
            <span>{new Date(col.created_at).toLocaleDateString('th-TH')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
