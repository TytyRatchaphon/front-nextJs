import React, { useRef, useState, useEffect } from 'react';
import { StoryGroup, StoryItem } from '../types/storyTypes';
import { useStoryPlayer } from '../hooks/useStoryPlayer';
import { useStoryStore } from '../stores/storyStore';
import { storyApi } from '../services/storyApi';
import StoryProgressBar from './StoryProgressBar';
import StoryCtaLinks from './StoryCtaLinks';
import StoryLikeButton from './StoryLikeButton';
import { CloseOutlined, LinkOutlined } from '@ant-design/icons';
import { VolumeX, Volume2, Play, Pause, X, MessageCircle, Send } from 'lucide-react';
import { Dropdown, App } from 'antd';
import Image from 'next/image';
import StoryCommentModal from './StoryCommentModal';
import { useVideoComments } from '../hooks/useVideoComments';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

interface StoryGroupSlideProps {
  group: StoryGroup;
  isActive: boolean;
  onManageLinks: () => void;
  isMobileSwiper?: boolean;
  currentItem: StoryItem | null;
  currentItemIndex: number;
  isLoadingItems: boolean;
}

const StoryGroupSlide: React.FC<StoryGroupSlideProps> = ({
  group,
  isActive,
  onManageLinks,
  isMobileSwiper = false,
  currentItem,
  currentItemIndex,
  isLoadingItems,
}) => {
  const { nextItem, prevItem, markItemViewed, closeViewer } = useStoryStore();
  const { message } = App.useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { isLoggedIn, user } = useAuthStore();
  const { openLoginModal } = useUIStore();

  const isOwnStory = group.section === 'own' || (isLoggedIn && user && user.user_id === group.user_id);

  const { createCommentMutation } = useVideoComments(
    isActive && currentItem ? currentItem.type : 'video_story_items',
    isActive && currentItem ? currentItem.ref_id : 0
  );

  const handleSendComment = () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (!commentText.trim()) return;
    createCommentMutation.mutate(commentText, {
      onSuccess: () => {
        setCommentText('');
        message.success('ส่งความคิดเห็นเรียบร้อยแล้ว');
      }
    });
  };

  const { playerState, errorMessage } = useStoryPlayer({
    item: isActive ? currentItem : null,
    videoRef,
    onEnded: () => {
      if (isActive) nextItem();
    },
    onTimeUpdate: (currentTime, duration) => {
      if (isActive) setProgress((currentTime / duration) * 100);
    },
    onPlay: () => {
      if (isActive && currentItem && !currentItem.is_viewed) {
        storyApi.sendView(currentItem.type, currentItem.ref_id).then((res) => {
          if (!res.skipped) {
            markItemViewed(currentItem.ref_id, currentItem.type);
          }
        }).catch(err => console.error("Failed to send view", err));
      }
    }
  });

  useEffect(() => {
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [currentItemIndex, isMuted, isActive]);

  // If not active, just render a static placeholder
  if (!isActive) {
    return (
      <div className="w-full h-full relative bg-zinc-900 flex flex-col overflow-hidden">
        {/* Mock Progress */}
        <StoryProgressBar totalItems={group.totalItems} currentIndex={0} progress={0} />

        {/* Mock Header */}
        <div className="absolute top-4 left-0 right-0 z-50 px-4 pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
              {group.user?.profile_image && (
                <Image src={group.user.profile_image} alt="User" width={32} height={32} className="object-cover w-full h-full" />
              )}
            </div>
            <span className="text-white font-medium text-sm drop-shadow-md">
              {group.user?.display_name || 'Enjoybook'}
            </span>
          </div>
        </div>

        {/* Thumbnail */}
        {group.preview?.thumbnail_url && (
          <Image src={group.preview.thumbnail_url} alt="Thumbnail" fill className="object-cover absolute inset-0" />
        )}
      </div>
    );
  }

  // Active state: render full video and interactions
  return (
    <div className="w-full h-full relative bg-zinc-900 flex flex-col overflow-hidden">
      <StoryProgressBar
        totalItems={group.totalItems}
        currentIndex={currentItemIndex}
        progress={progress}
      />

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-50 px-4 pt-2 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
            {group.user?.profile_image && (
              <Image
                src={group.user.profile_image}
                alt="User"
                width={32}
                height={32}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.srcset = '';
                  target.src = '/images/default-avatar.png';
                }}
              />
            )}
          </div>
          <span className="text-white font-medium text-sm drop-shadow-md">
            {group.user?.display_name || 'Enjoybook'}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                if (videoRef.current.paused) videoRef.current.play();
                else videoRef.current.pause();
              }
            }}
            className="w-8 h-8 flex items-center justify-center transition-colors cursor-pointer bg-black/20 hover:bg-black/40 rounded-full"
          >
            {playerState === 'playing' ? <Pause className="w-5 h-5 text-white" color="white" /> : <Play className="w-5 h-5 text-white" color="white" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="w-8 h-8 flex items-center justify-center transition-colors cursor-pointer bg-black/20 hover:bg-black/40 rounded-full"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-white" color="white" /> : <Volume2 className="w-5 h-5 text-white" color="white" />}
          </button>

          {isOwnStory ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'manage-links',
                    label: 'จัดการลิงก์',
                    icon: <LinkOutlined />,
                    onClick: onManageLinks,
                  }
                ]
              }}
              trigger={['click']}
              placement="bottomRight"
              getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
            >
              <button className="w-8 h-8 flex items-center justify-center transition-colors cursor-pointer bg-black/20 hover:bg-black/40 rounded-full">
                <span className="tracking-widest text-lg font-bold leading-none mb-2 text-white">...</span>
              </button>
            </Dropdown>
          ) : (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'copy-link',
                    label: 'คัดลอกลิงก์',
                    onClick: ({ domEvent }) => {
                      domEvent.stopPropagation();
                      navigator.clipboard.writeText(window.location.href);
                      message.success('คัดลอกลิงก์แล้ว');
                    },
                  },
                  {
                    key: 'report',
                    label: 'รายงานปัญหา',
                    danger: true,
                    onClick: ({ domEvent }) => {
                      domEvent.stopPropagation();
                      message.success('ขอบคุณที่แจ้งปัญหา เราจะดำเนินการตรวจสอบโดยเร็วที่สุด');
                    },
                  }
                ]
              }}
              trigger={['click']}
              placement="bottomRight"
              getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
            >
              <button
                className="w-8 h-8 flex items-center justify-center transition-colors cursor-pointer bg-black/20 hover:bg-black/40 rounded-full"
              >
                <span className="tracking-widest text-lg font-bold leading-none mb-2 text-white">...</span>
              </button>
            </Dropdown>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); closeViewer(); }}
            className="w-8 h-8 flex items-center justify-center transition-colors cursor-pointer bg-black/20 hover:bg-black/40 rounded-full md:hidden"
          >
            <X className="w-5 h-5 text-white" color="white" />
          </button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 w-full h-full relative group">
        {isMobileSwiper ? (
          /* Mobile: use a single tap zone that distinguishes taps from swipes */
          <div
            className="absolute inset-0 z-20"
            onTouchStart={(e) => {
              const touch = e.touches[0];
              (e.currentTarget as any)._tapStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
            }}
            onTouchEnd={(e) => {
              const start = (e.currentTarget as any)._tapStart;
              if (!start) return;
              const touch = e.changedTouches[0];
              const dx = Math.abs(touch.clientX - start.x);
              const dy = Math.abs(touch.clientY - start.y);
              const dt = Date.now() - start.time;
              // Only treat as tap if movement < 15px and duration < 300ms
              if (dx < 15 && dy < 15 && dt < 300) {
                const rect = e.currentTarget.getBoundingClientRect();
                const tapX = touch.clientX - rect.left;
                if (tapX < rect.width * 0.35) {
                  prevItem();
                } else if (tapX > rect.width * 0.65) {
                  nextItem();
                }
              }
            }}
          />
        ) : (
          /* Desktop: simple click zones */
          <>
            <div className="absolute inset-y-0 left-0 w-[20%] z-20 cursor-pointer" onClick={(e) => { e.stopPropagation(); prevItem(); }} />
            <div className="absolute inset-y-0 right-0 w-[20%] z-20 cursor-pointer" onClick={(e) => { e.stopPropagation(); nextItem(); }} />
          </>
        )}

        {errorMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 flex-col gap-2 p-4 text-center">
            <span className="text-white font-medium">{errorMessage}</span>
          </div>
        )}

        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity ${playerState === 'buffering' || playerState === 'loading' || isLoadingItems ? 'opacity-100 duration-300 delay-500' : 'opacity-0 duration-0'}`}>
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin shadow-lg" />
        </div>

        {currentItem?.thumbnail_url && playerState !== 'playing' && playerState !== 'paused' && (
          <Image
            src={currentItem.thumbnail_url}
            alt="Story thumbnail"
            fill
            className="object-cover absolute inset-0"
            priority
          />
        )}

        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted={isMuted}
          autoPlay
        />
      </div>

      {/* Footer / Links */}
      <div className="absolute bottom-16 left-0 right-0 z-50 px-4 pointer-events-none flex flex-col items-center">
        {currentItem?.links && currentItem.links.length > 0 && (
          <div className="pointer-events-auto w-full max-w-sm mb-2">
            <StoryCtaLinks links={currentItem.links} />
          </div>
        )}
      </div>

      {currentItem && (
        <>
          <div className="absolute bottom-4 left-4 right-4 z-50 pointer-events-auto flex items-center gap-3">
            <div className="flex-1 flex items-center bg-transparent border border-white/40 h-11 rounded-full px-1 pl-4 backdrop-blur-sm focus-within:border-white/80 focus-within:bg-black/20 transition-all">
              <inpu
                type="text"
                placeholder="ส่งข้อความ..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleSendComment();
                }}
                className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-white/80 h-full"
              />
              {commentText.trim() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendComment();
                  }}
                  disabled={createCommentMutation.isPending}
                  className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 hover:bg-blue-600 transition-colors mr-0.5"
                >
                  <Send className="w-4 h-4 !text-white" color="white" strokeWidth={2.5} />
                </button>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCommentModalOpen(true);
              }}
              className="flex flex-col items-center justify-center text-white drop-shadow-md hover:scale-110 active:scale-95 transition-transform shrink-0"
            >
              <MessageCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
            </button>

            <div className="shrink-0 flex items-center justify-center">
              <StoryLikeButton
                isLiked={currentItem.is_liked}
                likeCount={currentItem.like_count}
                refId={currentItem.ref_id}
                itemType={currentItem.type}
                isOwn={isOwnStory ?? false}
              />
            </div>
          </div>

          <StoryCommentModal
            isOpen={isCommentModalOpen}
            onClose={() => setIsCommentModalOpen(false)}
            type={currentItem.type}
            refId={currentItem.ref_id}
          />
        </>
      )}
    </div>
  );
};

export default StoryGroupSlide;
