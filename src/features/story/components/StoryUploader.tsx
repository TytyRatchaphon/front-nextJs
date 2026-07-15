import React, { useRef, useState } from 'react';
import { useStoryUpload } from '../hooks/useStoryUpload';
import { PlusOutlined } from '@ant-design/icons';
import StoryUploadModal from './StoryUploadModal';

interface StoryUploaderProps {
  sourceType?: 'user' | 'admin';
  children?: React.ReactNode;
}

const StoryUploader: React.FC<StoryUploaderProps> = ({ sourceType = 'user', children }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadStory, isUploading, config } = useStoryUpload();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsModalOpen(true);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalUpload = async (links: { label: string; url: string; orderBy?: number }[]) => {
    if (selectedFile) {
      setIsModalOpen(false);
      await uploadStory(selectedFile, sourceType, undefined, undefined, links);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  if (!config || (!config.canUploadStory && sourceType === 'user') || (!config.canUploadAdminStory && sourceType === 'admin')) {
    return null; // Don't render if not allowed
  }

  return (
    <>
      <inpu
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={config?.allowedMimeTypes?.join(',') || 'video/mp4,video/quicktime'}
      />
      <div onClick={handleClick} className="cursor-pointer inline-block">
        {children || (
          <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors shadow-md">
            <PlusOutlined className="text-xl" />
          </div>
        )}
      </div>

      <StoryUploadModal
        open={isModalOpen}
        onCancel={handleModalCancel}
        onUpload={handleModalUpload}
        file={selectedFile}
        maxLinks={config?.maxCtaLinks || 3}
      />
    </>
  );
};

export default StoryUploader;
