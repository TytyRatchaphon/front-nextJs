"use client";
import * as React from "react";
import { useEffect, useState } from 'react';
import {
  Button,
  App,
  Upload,
  Modal,
} from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useFormStore } from '@/stores/formStore';
import { useAuthStore } from '@/stores/authStore';
import { fetchProfileFrames } from '@/services/apiServices';
import Image from 'next/image';
import GifLoader from '@/components/utility/GifLoader';
import FrameOverlayImage from '@/components/ui/FrameOverlayImage';

const isDataUrl = (src: string | null | undefined): boolean => {
  return typeof src === 'string' && src.startsWith('data:');
};

interface SprofileProfilePictureProps {
  onProfileFileChange: (file: File) => void;
}

export const SprofileProfilePicture = ({ onProfileFileChange }: SprofileProfilePictureProps) => {
  const { notification } = App.useApp();
  const { token, user } = useAuthStore();
  const { updateUserProfile } = useFormStore();

  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [isFrameModalOpen, setIsFrameModalOpen] = React.useState(false);
  const [frames, setFrames] = React.useState<any[]>([]);
  const [loadingFrames, setLoadingFrames] = React.useState(false);

  const [selectedFrameInModal, setSelectedFrameInModal] = React.useState<any>(null);
  const [currentFrameImg, setCurrentFrameImg] = React.useState<string | null>(null);

  useEffect(() => {
    if ((user as any)?.frame && (user as any).frame.img) {
      setCurrentFrameImg((user as any).frame.img);
      updateUserProfile('frame_id', (user as any).frame_id);
    } else {
      setCurrentFrameImg(null);
    }
  }, [user, updateUserProfile]);

  const fetchFramesData = async () => {
    if (!token) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'ไม่พบ token กรุณาเข้าสู่ระบบใหม่',
        placement: 'topRight',
      });
      return;
    }
    setLoadingFrames(true);
    try {
      const responseData = await fetchProfileFrames(token);
      if (responseData.code === 200 || responseData.status === 'success') {
        const fetchedFrames = responseData.data?.frames || [];
        setFrames(fetchedFrames);

        // Sync selection with server data
        const currentFrameId = responseData.data?.currentFrameId;
        if (currentFrameId) {
          const activeFrame = fetchedFrames.find((f: any) => f.frame_id === currentFrameId);
          if (activeFrame) {
            setSelectedFrameInModal(activeFrame);
          }
        } else {
             // If 0 or null, it means no frame equipped
             setSelectedFrameInModal(null);
        }
      }
    } catch {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลกรอบได้',
        placement: 'topRight',
      });
    } finally {
      setLoadingFrames(false);
    }
  };

  const handleOpenFrameModal = () => {
    setIsFrameModalOpen(true);
    fetchFramesData();
    
    // Set initially selected frame based on current user frame
    if ((user as any)?.frame && (user as any).frame.frame_id) {
      setSelectedFrameInModal((user as any).frame);
    } else {
      setSelectedFrameInModal(null);
    }
  };

  const handleSelectFrameInModal = (frame: any) => {
    setSelectedFrameInModal(frame);
  };

  const handleConfirmFrame = () => {
    if (selectedFrameInModal) {
      setCurrentFrameImg(selectedFrameInModal.img);
      updateUserProfile('frame_id', selectedFrameInModal.frame_id as any);
      notification.success({
        message: 'เลือกกรอบสำเร็จ',
        description: `เลือกกรอบ: ${selectedFrameInModal.name}`,
        placement: 'topRight',
      });
      setIsFrameModalOpen(false);
    } else if (selectedFrameInModal === null) {
      setCurrentFrameImg(null);
      updateUserProfile('frame_id', 0 as any);
      notification.success({
        message: 'นำกรอบออกเรียบร้อย',
        description: 'นำกรอบออกเรียบร้อยแล้ว',
        placement: 'topRight',
      });
      setIsFrameModalOpen(false);
    } else {
      notification.warning({
        message: 'กรุณาเลือกกรอบก่อน',
        description: 'กรุณาเลือกกรอบก่อน',
        placement: 'topRight',
      });
    }
  };

  const handleProfileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    onProfileFileChange(file);
    return false;
  };

  return (
    <div className='select-none w-full lg:w-[385px] h-full min-h-[524px] flex-shrink-0'>
      <div className='flex flex-col gap-4 h-full'>
        <div className='border-2 border-gray-200 rounded-lg p-6 bg-white flex flex-col items-center justify-between h-full'>
          <div className='w-full text-center mb-2'>
            <h3 className='text-lg font-bold font-primary text-black'>รูปโปรไฟล์</h3>
          </div>

          <div className='w-full flex justify-between gap-2 mb-4'>
            <Button size="small" icon={<UploadOutlined />} onClick={handleOpenFrameModal} style={{ borderColor: '#FF0037', color: '#FF0037' }} className='font-primary text-xs hover:bg-red-50'>
              เลือกกรอบ
            </Button>
            <Button size="small" icon={<span className='text-xs'>👑</span>} onClick={() => notification.info({
              message: 'เกิดข้อผิดพลาด',
              description: 'เลือกฉายา - ฟีเจอร์กำลังพัฒนา',
              placement: 'topRight',
            })} style={{ borderColor: '#FF0037', color: '#FF0037' }} className='font-primary text-xs hover:bg-red-50'>
              เลือกฉายา
            </Button>
          </div>

          <div className='flex-1 flex items-center justify-center'>
            <div className='relative' style={{ width: '280px', height: '280px' }}>
              <div className='w-full h-full rounded-full overflow-hidden border-4 border-gray-300 bg-gray-50 flex items-center justify-center'>
                <Image
                  src={previewImage || (user as any)?.img || "/images/default-avatar.png"}
                  alt="Profile"
                  style={{ width: '280px', height: '280px', objectFit: 'cover' }}
                  width={280}
                  height={280}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-avatar.png'; }}
                  unoptimized={isDataUrl(previewImage)}
                />
              </div>

              {currentFrameImg && (
                <div className='absolute inset-0 pointer-events-none'>
                  <FrameOverlayImage src={currentFrameImg} alt="Frame" className='object-contain' style={{ zIndex: 10 }} />
                </div>
              )}
            </div>
          </div>

          <div className='text-center w-full mb-4'>
            <Upload showUploadList={false} beforeUpload={handleProfileUpload} accept="image/*">
              <Button type="default" icon={<UploadOutlined />} className='font-primary upload-profile-btn'>
                อัปโหลดรูปโปรไฟล์
              </Button>
            </Upload>
          </div>

          <div className='text-center'>
            <p className='text-sm font-primary font-semibold text-black'>
              ฉายา: {(user as any)?.aka?.name || 'ไม่มีฉายา'}
            </p>
          </div>
        </div>

        <Modal 
          title={<span className='font-primary text-xl font-bold'>เลือกกรอบ</span>} 
          open={isFrameModalOpen} 
          onCancel={() => setIsFrameModalOpen(false)} 
          footer={
            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 sm:gap-0">
              <span className="text-sm font-primary text-gray-500 text-center sm:text-left leading-relaxed">
                กรอบและฉายา สามารถได้รับผ่านการซื้อในร้านค้า{' '}
                <a href="/store" className="!text-red-500 hover:!text-red-700 underline inline-flex items-center gap-1 align-bottom" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3.00977 11.22V15.71C3.00977 20.2 4.80977 22 9.29977 22H14.6898C19.1798 22 20.9798 20.2 20.9798 15.71V11.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12.0005 12C13.8305 12 15.1805 10.51 15.0005 8.68L14.3405 2H9.67048L9.00048 8.68C8.82048 10.51 10.1705 12 12.0005 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.3098 12C20.3298 12 21.8098 10.36 21.6098 8.35L21.3298 5.6C20.9698 3 19.9698 2 17.3498 2H14.2998L14.9998 9.01C15.1698 10.66 16.6598 12 18.3098 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.64037 12C7.29037 12 8.78037 10.66 8.94037 9.01L9.16037 6.8L9.64037 2H6.59037C3.97037 2 2.97037 3 2.61037 5.6L2.34037 8.35C2.14037 10.36 3.62037 12 5.64037 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 17C10.33 17 9.5 17.83 9.5 19.5V22H14.5V19.5C14.5 17.83 13.67 17 12 17Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  ไปที่ร้านค้า
                </a>
              </span>
              <Button key="submit" type="primary" onClick={handleConfirmFrame} className='font-primary font-medium w-full sm:w-auto' style={{ backgroundColor: '#FF0037', borderColor: '#FF0037' }}>ยืนยัน</Button>
            </div>
          } 
          width={1000} 
          centered
          zIndex={5000}
        >
          {loadingFrames ? (
            <div className='flex justify-center py-10'><GifLoader className="h-64" width={150} height={150} /></div>
          ) : (
            <div className='max-h-[60vh] overflow-y-auto p-4'>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4'>
                <div onClick={() => handleSelectFrameInModal(null)} className={`border-2 rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center h-40 transition-all ${selectedFrameInModal === null ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-400'}`}>
                  <span className='font-primary text-sm'>ไม่ใส่กรอบ</span>
                </div>
              {frames.map((frame) => {
                const isLocked = frame.isUnlocked === false;
                return (
                  <div
                    key={frame.frame_id}
                    onClick={() => !isLocked && handleSelectFrameInModal(frame)}
                    className={`border-2 rounded-lg p-2 flex flex-col items-center transition-all relative overflow-hidden
                    ${isLocked ? 'border-none bg-gray-400 cursor-not-allowed' : 'cursor-pointer'}
                    ${!isLocked && selectedFrameInModal?.frame_id === frame.frame_id ? 'border-green-500 bg-green-50' : ''}
                    ${!isLocked && selectedFrameInModal?.frame_id !== frame.frame_id ? 'border-gray-200 hover:border-gray-400' : ''}
                  `}
                  >
                    {isLocked && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                          <div className="bg-transparent p-2 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M6 10V8C6 4.69 7 2 12 2C17 2 18 4.69 18 8V10" stroke="#DFDFEC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 18.5C13.3807 18.5 14.5 17.3807 14.5 16C14.5 14.6193 13.3807 13.5 12 13.5C10.6193 13.5 9.5 14.6193 9.5 16C9.5 17.3807 10.6193 18.5 12 18.5Z" stroke="#DFDFEC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M17 22H7C3 22 2 21 2 17V15C2 11 3 10 7 10H17C21 10 22 11 22 15V17C22 21 21 22 17 22Z" stroke="#DFDFEC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </>
                    )}
                    <div className={`relative w-full h-28 mb-2 ${isLocked ? 'opacity-50' : ''}`}>
                      <FrameOverlayImage src={frame.img} alt={frame.name} className='object-contain' />
                    </div>
                    <span className={`text-xs ${isLocked ? 'text-white font-bold' : ''}`}>{frame.name}</span>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};
