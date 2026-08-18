"use client";

import React, { useState, useEffect } from 'react';
import {
  App,
  Tabs,
  Card,
  Button,
  Input,
  Progress,
  Tag,
  Modal,
  Upload,
  Switch,
  Popconfirm,
} from 'antd';
import {
  UploadOutlined,
  PlaySquareOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  HolderOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  useBookVideoConfig,
  useMyBookVideos,
  useMyBookPlaylists,
  useMyBookPlaylistDetail,
  useBookVideoMutations,
} from '../../hooks/useBookVideo';
import {
  uploadMyVideoDirect,
  addVideosToPlaylist,
  removeVideoFromPlaylist,
  reorderPlaylistVideos,
} from '@/services/api/bookVideoApi';
import { BookVideoItem, BookVideoPlaylist } from '@/types/bookVideo';
import { useBookVideoSocket } from '../../hooks/useBookVideoSocket';

interface BookVideoManagerProps {
  bookId: number;
}

// ------------------------------------
// Sortable Item Component for Videos inside Playlist
// ------------------------------------
function SortableVideoItem({
  video,
  onRemove,
}: {
  video: BookVideoItem;
  onRemove: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: video.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm mb-2"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab hover:text-red-500 text-gray-400 touch-none"
        >
          <HolderOutlined />
        </button>
        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <PlaySquareOutlined className="text-gray-400 text-xl" />
          )}
        </div>
        <div>
          <div className="font-semibold text-gray-800 text-sm line-clamp-1">{video.title}</div>
          <div className="text-xs text-gray-400">
            {video.durationSeconds ? `${video.durationSeconds}s` : 'Video'}
          </div>
        </div>
      </div>
      <Button
        type="text"
        danger
        icon={<DeleteOutlined />}
        onClick={() => onRemove(video.id)}
      />
    </div>
  );
}

// ------------------------------------
// Sortable Item Component for Playlists (Reordering)
// ------------------------------------
function SortablePlaylistItem({ playlist }: { playlist: BookVideoPlaylist }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: playlist.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm mb-2"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab hover:text-red-500 text-gray-400 touch-none"
        >
          <HolderOutlined />
        </button>
        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
          {playlist.coverUrl ? (
            <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <PictureOutlined className="text-gray-400 text-xl" />
          )}
        </div>
        <div>
          <div className="font-semibold text-gray-800 text-sm line-clamp-1">{playlist.name}</div>
          <div className="text-xs text-gray-400">{playlist.videoCount} วิดีโอ</div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------
// Main Manager Component
// ------------------------------------
export default function BookVideoManager({ bookId }: BookVideoManagerProps) {
  const { notification } = App.useApp();
  const { data: config } = useBookVideoConfig(bookId);
  const { data: videosData, refetch: refetchVideos } = useMyBookVideos(bookId);
  const { data: playlistsData, refetch: refetchPlaylists } = useMyBookPlaylists(bookId);
  const mutations = useBookVideoMutations(bookId);

  // Active video socket tracker
  const [activeSocketVideoId, setActiveSocketVideoId] = useState<number | null>(null);
  useBookVideoSocket({
    bookId,
    videoId: activeSocketVideoId,
    enabled: Boolean(activeSocketVideoId),
    onUpdate: (update) => {
      refetchVideos();
      if (update.status === 'completed' || update.status === 'failed') {
        setActiveSocketVideoId(null);
      }
    },
  });

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Modal states
  const [editVideo, setEditVideo] = useState<BookVideoItem | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [createPlaylistCoverFile, setCreatePlaylistCoverFile] = useState<File | null>(null);
  const [createPlaylistCoverPreview, setCreatePlaylistCoverPreview] = useState<string | null>(null);
  const [isReorderPlaylistsOpen, setIsReorderPlaylistsOpen] = useState(false);
  const [orderedPlaylists, setOrderedPlaylists] = useState<BookVideoPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const { data: playlistDetail } = useMyBookPlaylistDetail(bookId, selectedPlaylistId!);
  const [managedPlaylistVideos, setManagedPlaylistVideos] = useState<BookVideoItem[]>([]);
  const [isSavingPlaylistVideos, setIsSavingPlaylistVideos] = useState(false);

  // Sync managedPlaylistVideos whenever playlistDetail changes or modal opens
  useEffect(() => {
    if (playlistDetail?.videos) {
      setManagedPlaylistVideos(playlistDetail.videos);
    } else if (!selectedPlaylistId) {
      setManagedPlaylistVideos([]);
    }
  }, [playlistDetail, selectedPlaylistId]);

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const videos = videosData?.items || [];
  const playlists = playlistsData?.items || [];
  const completedVideos = videos.filter((v) => v.status === 'completed');

  // Handle Direct Upload
  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      notification.error({ message: 'กรุณาเลือกไฟล์วิดีโอ', placement: 'topLeft' });
      return;
    }
    if (!uploadTitle.trim()) {
      notification.error({ message: 'กรุณาระบุชื่อวิดีโอ', placement: 'topLeft' });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const res = await uploadMyVideoDirect(bookId, uploadFile, uploadTitle.trim(), (percent) => {
        setUploadProgress(percent);
      });

      notification.success({ message: 'อัปโหลดไฟล์สำเร็จ ระบบกำลังประมวลผลวิดีโอ', placement: 'topLeft' });
      setUploadFile(null);
      setUploadTitle('');
      setUploadProgress(null);
      refetchVideos();

      // Trigger socket tracking for the new video
      if (res.video?.id) {
        setActiveSocketVideoId(res.video.id);
      }
    } catch (err: any) {
      notification.error({ message: err?.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลดวิดีโอ', placement: 'topLeft' });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Edit Title
  const handleSaveTitle = () => {
    if (!editVideo || !editTitleInput.trim()) return;
    mutations.patchTitleMutation.mutate(
      { videoId: editVideo.id, title: editTitleInput.trim() },
      {
        onSuccess: () => {
          notification.success({ message: 'อัปเดตชื่อวิดีโอเรียบร้อย', placement: 'topLeft' });
          setEditVideo(null);
        },
      }
    );
  };

  // Handle Create Playlist
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    mutations.createPlaylistMutation.mutate(newPlaylistName.trim(), {
      onSuccess: (createdPlaylist) => {
        if (createPlaylistCoverFile && createdPlaylist?.id) {
          mutations.uploadCoverMutation.mutate({
            playlistId: createdPlaylist.id,
            file: createPlaylistCoverFile,
          });
        }
        notification.success({ message: 'สร้าง Playlist เรียบร้อย', placement: 'topLeft' });
        setIsCreatePlaylistOpen(false);
        setNewPlaylistName('');
        setCreatePlaylistCoverFile(null);
        setCreatePlaylistCoverPreview(null);
      },
      onError: (err: any) => {
        notification.error({ message: err?.response?.data?.message || 'สร้าง Playlist ไม่สำเร็จ', placement: 'topLeft' });
      },
    });
  };

  // Handle Playlist Reorder
  const handleOpenReorderPlaylists = () => {
    setOrderedPlaylists([...playlists]);
    setIsReorderPlaylistsOpen(true);
  };

  const handlePlaylistsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedPlaylists.findIndex((pl) => pl.id === active.id);
    const newIndex = orderedPlaylists.findIndex((pl) => pl.id === over.id);

    setOrderedPlaylists(arrayMove(orderedPlaylists, oldIndex, newIndex));
  };

  const handleSavePlaylistsOrder = () => {
    const playlistIds = orderedPlaylists.map((pl) => pl.id);
    mutations.reorderPlaylistsMutation.mutate(playlistIds, {
      onSuccess: () => {
        notification.success({ message: 'จัดลำดับ Playlist เรียบร้อย', placement: 'topLeft' });
        setIsReorderPlaylistsOpen(false);
      },
      onError: (err: any) => {
        notification.error({ message: err?.response?.data?.message || 'จัดลำดับ Playlist ไม่สำเร็จ', placement: 'topLeft' });
      },
    });
  };

  // Handle Video Reorder inside Playlist (Local state until confirmed)
  const handlePlaylistVideosDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = managedPlaylistVideos.findIndex((v) => v.id === active.id);
    const newIndex = managedPlaylistVideos.findIndex((v) => v.id === over.id);

    setManagedPlaylistVideos(arrayMove(managedPlaylistVideos, oldIndex, newIndex));
  };

  const handleRemoveManagedVideo = (videoId: number) => {
    setManagedPlaylistVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  const handleAddManagedVideos = (selectedIds: number[]) => {
    const newVideos = completedVideos.filter((v) => selectedIds.includes(v.id));
    setManagedPlaylistVideos((prev) => [...prev, ...newVideos]);
  };

  const handleSavePlaylistVideoManagement = async () => {
    if (!selectedPlaylistId) return;

    const originalIds = playlistDetail?.videos?.map((v) => v.id) || [];
    const currentIds = managedPlaylistVideos.map((v) => v.id);

    const addedIds = currentIds.filter((id) => !originalIds.includes(id));
    const removedIds = originalIds.filter((id) => !currentIds.includes(id));

    try {
      setIsSavingPlaylistVideos(true);

      if (addedIds.length > 0) {
        await addVideosToPlaylist(bookId, selectedPlaylistId, addedIds);
      }
      for (const id of removedIds) {
        await removeVideoFromPlaylist(bookId, selectedPlaylistId, id);
      }
      if (currentIds.length > 0) {
        await reorderPlaylistVideos(bookId, selectedPlaylistId, currentIds);
      }

      notification.success({
        message: 'บันทึกจัดลำดับและคิววิดีโอใน Playlist เรียบร้อย',
        placement: 'topLeft',
      });
      refetchPlaylists();
      setSelectedPlaylistId(null);
    } catch (err: any) {
      notification.error({
        message: err?.response?.data?.message || 'บันทึกจัดลำดับวิดีโอไม่สำเร็จ',
        placement: 'topLeft',
      });
    } finally {
      setIsSavingPlaylistVideos(false);
    }
  };

  // Render Status Badge
  const renderStatusTag = (v: BookVideoItem) => {
    switch (v.status) {
      case 'completed':
        return <Tag color="success">พร้อมใช้งาน</Tag>;
      case 'processing':
        return <Tag color="processing">กำลังแปลงไฟล์ ({v.processingProgressPercent}%)</Tag>;
      case 'queued':
        return <Tag color="warning">คิวประมวลผล</Tag>;
      case 'uploading':
        return <Tag color="blue">กำลังอัปโหลด</Tag>;
      case 'failed':
        return <Tag color="error">ล้มเหลว</Tag>;
      default:
        return <Tag>{v.status}</Tag>;
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <PlaySquareOutlined className="text-red-500" /> วิดีโอหนังสือ & Playlist
          </h2>
          <p className="text-sm text-gray-500">
            จัดการคลังวิดีโอความยาวสั้น/ไฮไลต์ และจัดกลุ่มเป็น Playlist สำหรับแสดงในหน้าหนังสือ
          </p>
        </div>
      </div>

      <Tabs
        defaultActiveKey="library"
        items={[
          {
            key: 'library',
            label: (
              <span className="flex items-center gap-2">
                <PlaySquareOutlined /> คลังวิดีโอ ({videos.length})
              </span>
            ),
            children: (
              <div className="space-y-6">
                {/* Upload Card */}
                <Card className="rounded-xl shadow-sm border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3 text-base">อัปโหลดวิดีโอใหม่</h3>
                  {config && (
                    <div className="text-xs text-gray-500 mb-4 bg-red-50/50 border border-red-100 p-3 rounded-lg">
                      • รองรับไฟล์: {config.upload.allowedExtensions.join(', ').toUpperCase()} | ขนาดไม่เกิน{' '}
                      {Math.round(config.upload.maxBytes / (1024 * 1024))} MB | ความยาวไม่เกิน{' '}
                      {config.upload.maxDurationSeconds} วินาที
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อวิดีโอ</label>
                      <Input
                        placeholder="เช่น ตัวอย่างตอนที่ 10, ไฮไลต์ฉากต่อสู้"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        disabled={isUploading}
                        maxLength={150}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">เลือกไฟล์วิดีโอ</label>
                      <Upload
                        accept="video/mp4,video/quicktime,video/webm"
                        beforeUpload={(file) => {
                          setUploadFile(file);
                          if (!uploadTitle) {
                            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                            setUploadTitle(nameWithoutExt);
                          }
                          return false;
                        }}
                        fileList={uploadFile ? [uploadFile as any] : []}
                        onRemove={() => setUploadFile(null)}
                        maxCount={1}
                        disabled={isUploading}
                      >
                        <Button icon={<UploadOutlined />} disabled={isUploading}>
                          {uploadFile ? uploadFile.name : 'เลือกไฟล์ MP4/MOV/WEBM'}
                        </Button>
                      </Upload>
                    </div>
                  </div>

                  {isUploading && uploadProgress !== null && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1 font-semibold">
                        <span>กำลังอัปโหลดวิดีโอ...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress percent={uploadProgress} status="active" strokeColor={{ '0%': '#f87171', '100%': '#ef4444' }} />
                    </div>
                  )}

                  <Button
                    type="primary"
                    danger
                    onClick={handleUploadSubmit}
                    loading={isUploading}
                    disabled={!uploadFile || !uploadTitle.trim()}
                  >
                    เริ่มอัปโหลดวิดีโอ
                  </Button>
                </Card>

                {/* Videos Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.length === 0 ? (
                    <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                      ยังไม่มีวิดีโอในคลัง กรุณาอัปโหลดไฟล์ด้านบน
                    </div>
                  ) : (
                    videos.map((v) => (
                      <Card key={v.id} className="rounded-xl shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex gap-3">
                          <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
                            {v.thumbnailUrl ? (
                              <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                            ) : (
                              <PlaySquareOutlined className="text-gray-400 text-2xl" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                {renderStatusTag(v)}
                                <div className="flex gap-1">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                      setEditVideo(v);
                                      setEditTitleInput(v.title);
                                    }}
                                  />
                                  <Popconfirm
                                    title="ยืนยันการลบวิดีโอ?"
                                    description="ไฟล์วิดีโอนี้จะถูกลบถาวรออกจากทุก Playlist"
                                    okText="ลบ"
                                    cancelText="ยกเลิก"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => mutations.deleteVideoMutation.mutate(v.id)}
                                  >
                                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                                  </Popconfirm>
                                </div>
                              </div>

                              <h4 className="font-bold text-gray-800 text-sm truncate">{v.title}</h4>
                            </div>

                            {v.status === 'failed' && (
                              <div className="mt-2">
                                <Button
                                  type="dashed"
                                  danger
                                  size="small"
                                  icon={<ReloadOutlined />}
                                  onClick={() => mutations.retryMutation.mutate(v.id)}
                                >
                                  ลองใหม่อีกครั้ง (Retry)
                                </Button>
                              </div>
                            )}

                            <div className="text-xs text-gray-400 mt-2 truncate">
                              ไฟล์: {v.originalFileName || `video-${v.id}`}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'playlists',
            label: (
              <span className="flex items-center gap-2">
                <UnorderedListOutlined /> จัดการ Playlist ({playlists.length})
              </span>
            ),
            children: (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 text-base">รายการ Playlist</h3>
                  <div className="flex items-center gap-2">
                    {playlists.length > 1 && (
                      <Button
                        icon={<HolderOutlined />}
                        onClick={handleOpenReorderPlaylists}
                      >
                        จัดลำดับ Playlist
                      </Button>
                    )}
                    <Button
                      type="primary"
                      danger
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setCreatePlaylistCoverFile(null);
                        setCreatePlaylistCoverPreview(null);
                        setIsCreatePlaylistOpen(true);
                      }}
                    >
                      สร้าง Playlist ใหม่
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {playlists.length === 0 ? (
                    <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                      ยังไม่มี Playlist
                    </div>
                  ) : (
                    playlists.map((pl) => (
                      <Card
                        key={pl.id}
                        className={`rounded-xl shadow-sm border transition-all ${
                          selectedPlaylistId === pl.id ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="h-32 rounded-lg bg-gray-100 overflow-hidden relative flex items-center justify-center group">
                            {pl.coverUrl ? (
                              <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover" />
                            ) : (
                              <PictureOutlined className="text-gray-400 text-3xl" />
                            )}
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md z-10">
                              {pl.videoCount} วิดีโอ
                            </div>

                            {/* Cover Upload Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Upload
                                accept="image/*"
                                showUploadList={false}
                                beforeUpload={(file) => {
                                  mutations.uploadCoverMutation.mutate({ playlistId: pl.id, file });
                                  return false;
                                }}
                              >
                                <Button size="small" type="primary" icon={<UploadOutlined />}>
                                  เปลี่ยนรูปปก
                                </Button>
                              </Upload>
                              {pl.coverUrl && (
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => mutations.deleteCoverMutation.mutate(pl.id)}
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-800 text-sm truncate">{pl.name}</h4>
                            <Switch
                              checkedChildren="เผยแพร่"
                              unCheckedChildren="ซ่อน"
                              checked={pl.publishStatus === 'published'}
                              onChange={(checked) => {
                                if (checked && pl.videoCount === 0) {
                                  notification.error({ message: 'ต้องมีวิดีโอที่พร้อมใช้งานอย่างน้อย 1 ตัวจึงจะเผยแพร่ได้', placement: 'topLeft' });
                                  return;
                                }
                                mutations.patchPlaylistMutation.mutate({
                                  playlistId: pl.id,
                                  data: { publishStatus: checked ? 'published' : 'unpublished' },
                                });
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <Button
                              type="link"
                              className="p-0 text-red-500 hover:text-red-600 text-xs font-semibold"
                              onClick={() => setSelectedPlaylistId(pl.id)}
                            >
                              จัดการวิดีโอในคิว ({pl.videoCount})
                            </Button>
                            <Popconfirm
                              title="ยืนยันการลบ Playlist?"
                              description="การลบจะไม่ลบไฟล์วิดีโอหลัก"
                              okText="ลบ"
                              cancelText="ยกเลิก"
                              okButtonProps={{ danger: true }}
                              onConfirm={() => mutations.deletePlaylistMutation.mutate(pl.id)}
                            >
                              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* Edit Title Modal */}
      <Modal
        title="แก้ไขชื่อวิดีโอ"
        open={Boolean(editVideo)}
        onOk={handleSaveTitle}
        onCancel={() => setEditVideo(null)}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <div className="py-2">
          <Input
            value={editTitleInput}
            onChange={(e) => setEditTitleInput(e.target.value)}
            maxLength={150}
            placeholder="ระบุชื่อวิดีโอ"
          />
        </div>
      </Modal>

      {/* Create Playlist Modal */}
      <Modal
        title="สร้าง Playlist ใหม่"
        open={isCreatePlaylistOpen}
        onOk={handleCreatePlaylist}
        onCancel={() => {
          setIsCreatePlaylistOpen(false);
          setCreatePlaylistCoverFile(null);
          setCreatePlaylistCoverPreview(null);
        }}
        okText="สร้าง"
        cancelText="ยกเลิก"
      >
        <div className="py-2 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อ Playlist</label>
            <Input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="เช่น ฉากเด็ดประจำสัปดาห์, ตัวอย่างตอนถัดไป"
              maxLength={150}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">รูปปก Playlist (ไม่บังคับ)</label>
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file) => {
                setCreatePlaylistCoverFile(file);
                setCreatePlaylistCoverPreview(URL.createObjectURL(file));
                return false;
              }}
            >
              <div className="w-full h-32 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
                {createPlaylistCoverPreview ? (
                  <img src={createPlaylistCoverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400 gap-1">
                    <PictureOutlined className="text-2xl" />
                    <span className="text-xs font-medium">คลิกเพื่ออัปโหลดรูปปก</span>
                  </div>
                )}
              </div>
            </Upload>
          </div>
        </div>
      </Modal>

      {/* Reorder Playlists Modal */}
      <Modal
        title="จัดลำดับการแสดงผล Playlist"
        open={isReorderPlaylistsOpen}
        onOk={handleSavePlaylistsOrder}
        onCancel={() => setIsReorderPlaylistsOpen(false)}
        okText="บันทึกการจัดลำดับ"
        cancelText="ยกเลิก"
        confirmLoading={mutations.reorderPlaylistsMutation.isPending}
        width={500}
      >
        <div className="py-2 space-y-2">
          <p className="text-xs text-gray-500 mb-3">
            ลากไอคอนจุด 6 จุดด้านซ้ายเพื่อสลับลำดับการแสดงผลบนหน้าอ่านนิยาย
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handlePlaylistsDragEnd}
          >
            <SortableContext
              items={orderedPlaylists.map((pl) => pl.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-h-[400px] overflow-y-auto pr-1">
                {orderedPlaylists.map((pl) => (
                  <SortablePlaylistItem key={pl.id} playlist={pl} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </Modal>

      {/* Playlist Video Management Modal with Drag and Drop & Confirmation */}
      <Modal
        title={`จัดการวิดีโอใน Playlist: ${playlistDetail?.name || ''}`}
        open={Boolean(selectedPlaylistId)}
        onOk={handleSavePlaylistVideoManagement}
        onCancel={() => setSelectedPlaylistId(null)}
        okText="บันทึกการเปลี่ยนแปลง"
        cancelText="ยกเลิก"
        confirmLoading={isSavingPlaylistVideos}
        width={600}
      >
        {selectedPlaylistId && (
          <div className="py-2 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-600">
                ลากไอคอนจุด 6 จุดด้านซ้ายเพื่อจัดลำดับวิดีโอ
              </span>
              <SelectVideosToPlaylistModal
                completedVideos={completedVideos}
                existingVideoIds={managedPlaylistVideos.map((v) => v.id)}
                onAdd={handleAddManagedVideos}
              />
            </div>

            {managedPlaylistVideos.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePlaylistVideosDragEnd}
              >
                <SortableContext
                  items={managedPlaylistVideos.map((v) => v.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="max-h-[400px] overflow-y-auto pr-1">
                    {managedPlaylistVideos.map((v) => (
                      <SortableVideoItem
                        key={v.id}
                        video={v}
                        onRemove={handleRemoveManagedVideo}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-8 text-gray-400 bg-gray-50 border border-dashed rounded-xl text-xs">
                ยังไม่มีวิดีโอใน Playlist นี้ กดปุ่มด้านบนเพื่อเพิ่มวิดีโอ
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// Sub-component to pick videos to add to playlist
function SelectVideosToPlaylistModal({
  completedVideos,
  existingVideoIds,
  onAdd,
}: {
  completedVideos: BookVideoItem[];
  existingVideoIds: number[];
  onAdd: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const availableVideos = completedVideos.filter((v) => !existingVideoIds.includes(v.id));

  const handleConfirm = () => {
    if (selectedIds.length > 0) {
      onAdd(selectedIds);
      setSelectedIds([]);
      setOpen(false);
    }
  };

  return (
    <>
      <Button type="dashed" danger size="small" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
        เพิ่มวิดีโอเข้า Playlist
      </Button>

      <Modal
        title="เลือกวิดีโอที่ต้องการเพิ่ม"
        open={open}
        onOk={handleConfirm}
        onCancel={() => setOpen(false)}
        okText="เพิ่มวิดีโอที่เลือก"
        cancelText="ยกเลิก"
      >
        <div className="py-2 max-h-[350px] overflow-y-auto space-y-2">
          {availableVideos.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs">
              ไม่มีวิดีโอที่พร้อมใช้งานที่ยังไม่ได้อยู่ใน Playlist นี้
            </div>
          ) : (
            availableVideos.map((v) => {
              const isChecked = selectedIds.includes(v.id);
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setSelectedIds((prev) =>
                      isChecked ? prev.filter((id) => id !== v.id) : [...prev, v.id]
                    );
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked ? 'border-red-400 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded text-red-500 focus:ring-red-400"
                  />
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <PlaySquareOutlined className="text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-800 text-xs truncate">{v.title}</div>
                    <div className="text-[11px] text-gray-400">{v.durationSeconds ? `${v.durationSeconds}s` : ''}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </>
  );
}
