"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { PlaySquareOutlined, RightOutlined, SettingOutlined } from '@ant-design/icons';
import { usePublicBookPlaylists } from '../../hooks/useBookVideo';
import { BookVideoPlaylist } from '@/types/bookVideo';
import BookVideoPlaylistViewerModal from '@/features/video/components/public/BookVideoPlaylistViewerModal';

interface BookVideoPlaylistSectionProps {
  bookId: number | string;
  isOwner?: boolean;
}

export default function BookVideoPlaylistSection({ bookId, isOwner = false }: BookVideoPlaylistSectionProps) {
  const { data, isLoading } = usePublicBookPlaylists(bookId);
  const [selectedPlaylist, setSelectedPlaylist] = useState<BookVideoPlaylist | null>(null);

  const playlists = data?.items || [];

  if (isLoading || playlists.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 my-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <PlaySquareOutlined className="text-red-500" /> Playlist วิดีโอไฮไลต์ ({playlists.length})
        </h3>
        {isOwner && (
          <Link
            href={`/w/edit/${bookId}`}
            className="text-xs font-semibold text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <SettingOutlined /> จัดการวิดีโอ (สำหรับนักเขียน)
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => setSelectedPlaylist(pl)}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-gray-50 transition-all hover:border-red-300 hover:shadow-md"
          >
            <div className="aspect-square w-full overflow-hidden bg-gray-200 relative">
              {pl.coverUrl ? (
                <img
                  src={pl.coverUrl}
                  alt={pl.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-400 to-pink-500 text-white">
                  <PlaySquareOutlined className="text-4xl opacity-80" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
                <span className="text-xs font-semibold drop-shadow-sm">{pl.videoCount} วิดีโอ</span>
                <RightOutlined className="text-xs opacity-80 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
            <div className="p-2.5">
              <div className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-red-500 transition-colors">
                {pl.name}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPlaylist && (
        <BookVideoPlaylistViewerModal
          bookId={bookId}
          playlist={selectedPlaylist}
          open={Boolean(selectedPlaylist)}
          onClose={() => setSelectedPlaylist(null)}
        />
      )}
    </div>
  );
}
