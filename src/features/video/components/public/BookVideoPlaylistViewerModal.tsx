"use client";

import React, { useState, useEffect, useRef } from 'react';
import { App, Modal, Input, Button, Drawer, Spin } from 'antd';
import {
  CloseOutlined,
  HeartOutlined,
  HeartFilled,
  MessageOutlined,
  WarningOutlined,
  PlaySquareOutlined,
  SendOutlined,
} from '@ant-design/icons';
import Hls from 'hls.js';
import {
  usePublicPlaylistVideos,
  usePublicVideoPlayback,
  useVideoComments,
} from '../../hooks/useBookVideo';
import {
  recordVideoView,
  toggleVideoLike,
  createVideoComment,
  reportVideo,
} from '@/services/api/bookVideoApi';
import { BookVideoPlaylist } from '@/types/bookVideo';

interface BookVideoPlaylistViewerModalProps {
  bookId: number | string;
  playlist: BookVideoPlaylist;
  open: boolean;
  onClose: () => void;
}

export default function BookVideoPlaylistViewerModal({
  bookId,
  playlist,
  open,
  onClose,
}: BookVideoPlaylistViewerModalProps) {
  const { notification } = App.useApp();
  const { data: playlistDetail, isLoading: isLoadingVideos } = usePublicPlaylistVideos(bookId, playlist.id);
  const videos = playlistDetail?.videos?.items || [];
  const activeRefId = playlistDetail?.videos?.activeRefId;

  const [currentVideoId, setCurrentVideoId] = useState<number | null>(null);
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportDetail, setReportDetail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [likeState, setLikeState] = useState<{ liked: boolean; count: number }>({ liked: false, count: 0 });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Set active video on initial load
  useEffect(() => {
    if (activeRefId) {
      setCurrentVideoId(activeRefId);
    } else if (videos.length > 0) {
      setCurrentVideoId(videos[0].id);
    }
  }, [activeRefId, videos]);

  const currentVideo = videos.find((v) => v.id === currentVideoId) || videos[0];

  // Fetch Playback HLS/DASH URL for current video
  const { data: playbackInfo, refetch: refetchPlayback } = usePublicVideoPlayback(currentVideo?.id || null);
  const { data: commentsData, refetch: refetchComments } = useVideoComments(currentVideo?.id || null);

  // Sync initial likes
  useEffect(() => {
    if (currentVideo) {
      setLikeState({
        liked: Boolean(currentVideo.isLiked),
        count: currentVideo.likeCount || 0,
      });
    }
  }, [currentVideo]);

  // Record View
  useEffect(() => {
    if (currentVideo?.id) {
      recordVideoView(currentVideo.id).catch(() => {});
    }
  }, [currentVideo?.id]);

  // Setup HLS Video Player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackInfo?.hlsUrl) return;

    const hlsUrl = playbackInfo.hlsUrl;

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
      });
      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.response?.code === 401 || data.response?.code === 403) {
            refetchPlayback();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [playbackInfo?.hlsUrl, refetchPlayback]);

  // Handle Like Toggle
  const handleLike = async () => {
    if (!currentVideo) return;
    try {
      const res = await toggleVideoLike(currentVideo.id);
      setLikeState({ liked: res.liked, count: res.likeCount });
    } catch {
      notification.error({ message: 'กรุณาเข้าสู่ระบบเพื่อกดไลก์', placement: 'topLeft' });
    }
  };

  // Handle Send Comment
  const handleSendComment = async () => {
    if (!currentVideo || !commentText.trim()) return;
    try {
      await createVideoComment(currentVideo.id, commentText.trim());
      setCommentText('');
      refetchComments();
      notification.success({ message: 'ส่งความคิดเห็นเรียบร้อย', placement: 'topLeft' });
    } catch {
      notification.error({ message: 'เกิดข้อผิดพลาดในการส่งความคิดเห็น', placement: 'topLeft' });
    }
  };

  // Handle Send Report
  const handleSendReport = async () => {
    if (!currentVideo) return;
    try {
      await reportVideo(currentVideo.id, 1, reportDetail);
      setReportModalOpen(false);
      setReportDetail('');
      notification.success({ message: 'ส่งรายงานปัญหาเรียบร้อย ขอบคุณครับ', placement: 'topLeft' });
    } catch {
      notification.error({ message: 'ไม่สามารถส่งรายงานได้', placement: 'topLeft' });
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width="920px"
      zIndex={2000}
      closeIcon={null}
      styles={{
        content: {
          padding: 0,
          backgroundColor: '#09090b',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        },
        body: {
          padding: 0,
          backgroundColor: '#09090b',
        },
      }}
    >
      <div className="relative bg-[#09090b] text-white flex flex-col md:flex-row h-[82vh] max-h-[720px] min-h-[500px]">
        {/* Top Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
        >
          <CloseOutlined className="text-sm" />
        </button>

        {/* Left Side: Main Video Player Container */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          {/* Blurred Background Atmosphere */}
          {currentVideo?.thumbnailUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-25 scale-125 pointer-events-none"
              style={{ backgroundImage: `url(${currentVideo.thumbnailUrl})` }}
            />
          )}

          {/* 9:16 Vertical Video Frame */}
          <div className="relative w-full h-full max-w-[380px] flex items-center justify-center">
            {isLoadingVideos ? (
              <Spin size="large" />
            ) : playbackInfo?.hlsUrl ? (
              <video
                ref={videoRef}
                controls
                playsInline
                className="w-full h-full object-contain relative z-10 shadow-2xl"
              />
            ) : (
              <div className="text-center text-gray-400 p-6 z-10">
                <PlaySquareOutlined className="text-4xl mb-2 text-red-500" />
                <div className="text-sm font-medium">วิดีโอไม่พร้อมใช้งาน</div>
              </div>
            )}

            {/* Floating Action Buttons Inside Frame */}
            <div className="absolute right-3 bottom-14 flex flex-col gap-4 items-center z-20">
              <button
                onClick={handleLike}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform group"
              >
                <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg group-hover:bg-black/80">
                  {likeState.liked ? (
                    <HeartFilled className="text-red-500 text-2xl" />
                  ) : (
                    <HeartOutlined className="text-white text-xl" />
                  )}
                </div>
                <span className="text-xs font-bold drop-shadow-md">{likeState.count}</span>
              </button>

              <button
                onClick={() => setCommentDrawerOpen(true)}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform group"
              >
                <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg group-hover:bg-black/80">
                  <MessageOutlined className="text-white text-xl" />
                </div>
                <span className="text-xs font-bold drop-shadow-md">
                  {currentVideo?.commentCount || 0}
                </span>
              </button>

              <button
                onClick={() => setReportModalOpen(true)}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform group"
              >
                <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg group-hover:bg-black/80">
                  <WarningOutlined className="text-white text-lg" />
                </div>
                <span className="text-[10px] font-medium drop-shadow-md">รายงาน</span>
              </button>
            </div>

            {/* Video Title Overlay (Top Left to avoid native video controls bar) */}
            {currentVideo && (
              <div className="absolute top-4 left-4 right-16 z-20 pointer-events-none bg-gradient-to-b from-black/80 via-black/40 to-transparent p-3 rounded-xl backdrop-blur-[2px]">
                <div className="font-bold text-sm text-white line-clamp-1 drop-shadow">{currentVideo.title}</div>
                <div className="text-[11px] text-gray-300 drop-shadow">Playlist: {playlist.name}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Playlist Items Sidebar */}
        <div className="w-full md:w-80 bg-[#121215] border-t md:border-t-0 md:border-l border-white/10 p-5 flex flex-col">
          <div className="mb-4 pr-8">
            <div className="text-[11px] text-red-400 font-bold tracking-wider uppercase mb-1">Playlist</div>
            <h3 className="font-bold text-base text-white line-clamp-1">{playlist.name}</h3>
            <div className="text-xs text-gray-400 mt-0.5">{videos.length} วิดีโอในคิว</div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {videos.map((v) => {
              const isActive = v.id === currentVideoId;
              return (
                <div
                  key={v.id}
                  onClick={() => setCurrentVideoId(v.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-gradient-to-r from-red-950/60 to-red-900/30 border-red-500/60 text-white shadow-md'
                      : 'bg-[#1a1a20] hover:bg-[#24242c] border-white/5 text-gray-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden flex-shrink-0 relative border border-white/10">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlaySquareOutlined className="text-gray-500" />
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
                      {v.title}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-3">
                      <span>{v.viewCount || 0} รับชม</span>
                      <span>{v.likeCount || 0} ไดก์</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comment Drawer */}
      <Drawer
        title="ความคิดเห็น"
        placement="bottom"
        onClose={() => setCommentDrawerOpen(false)}
        open={commentDrawerOpen}
        height="60vh"
        zIndex={2001}
        style={{ borderRadius: '20px 20px 0 0', overflow: 'hidden' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {commentsData?.items?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!</div>
            ) : (
              commentsData?.items?.map((c) => (
                <div key={c.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-gray-800">{c.userNickname || 'ผู้ใช้งาน'}</span>
                    <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div className="text-xs text-gray-700">{c.text}</div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex gap-2">
            <Input
              placeholder="เขียนความคิดเห็น..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onPressEnter={handleSendComment}
            />
            <Button type="primary" danger icon={<SendOutlined />} onClick={handleSendComment}>
              ส่ง
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Report Modal */}
      <Modal
        title="รายงานปัญหาวิดีโอ"
        open={reportModalOpen}
        onOk={handleSendReport}
        onCancel={() => setReportModalOpen(false)}
        okText="ส่งรายงาน"
        cancelText="ยกเลิก"
        zIndex={2002}
      >
        <div className="py-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">รายละเอียดปัญหาเพิ่มเติม</label>
          <Input.TextArea
            rows={3}
            value={reportDetail}
            onChange={(e) => setReportDetail(e.target.value)}
            placeholder="ระบุรายละเอียด เช่น วิดีโอไม่เล่น, เนื้อหาไม่เหมาะสม..."
          />
        </div>
      </Modal>
    </Modal>
  );
}
