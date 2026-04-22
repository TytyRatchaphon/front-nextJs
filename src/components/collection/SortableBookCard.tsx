"use client";
import * as React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardBook from '@/components/novelCard/CardBook';

interface Props {
  id: string;
  book: any;
  onRemove?: () => void;
  onHide?: () => void;
}

export default function SortableBookCard({ id, book, onRemove, onHide }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -top-3 -left-3 z-30 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-gray-100 hover:border-gray-300 hover:scale-110 hover:shadow-lg text-gray-500 hover:text-gray-900"
        title="ลากเพื่อเรียงลำดับ"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="5" r="1"></circle>
          <circle cx="9" cy="12" r="1"></circle>
          <circle cx="9" cy="19" r="1"></circle>
          <circle cx="15" cy="5" r="1"></circle>
          <circle cx="15" cy="12" r="1"></circle>
          <circle cx="15" cy="19" r="1"></circle>
        </svg>
      </div>

      {/* Hide Button */}
      {onHide && (
        <button
          onClick={(e) => { e.stopPropagation(); onHide(); }}
          className="absolute -bottom-3 -left-3 z-30 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center transition-all duration-200 hover:bg-gray-800 hover:border-gray-800 hover:text-white hover:scale-110 hover:shadow-lg text-gray-500"
          title="ซ่อนหนังสือ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </button>
      )}

      {/* Remove Button */}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-3 -right-3 z-30 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center transition-all duration-200 hover:bg-red-500 hover:border-red-500 hover:text-white hover:scale-110 hover:shadow-lg text-red-500"
          title="ลบออกจากคอลเลคชั่น"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}

      <CardBook book={book} />
    </div>
  );
}
