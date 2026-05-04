"use client";
import { useEffect } from 'react';
import {
  Button,
  App,
  Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import { SprofileUserInfoForm } from './SprofileUserInfoForm';
import { SprofileProfilePicture } from './SprofileProfilePicture';
import { useSprofileSave } from '../hooks/useSprofileSave';

const isDataUrl = (src: string | null | undefined): boolean => {
  return typeof src === 'string' && src.startsWith('data:');
};

export const SprofileUserInfoTab = () => {
  const { notification } = App.useApp();
  const { user } = useAuthStore();

  const {
    saving,
    setProfileFile,
    bgPreview,
    setBgPreview,
    handleBgUpload,
    handleSaveAll,
  } = useSprofileSave({ notification });

  useEffect(() => {
    if ((user as any)?.banner) {
      setBgPreview((user as any).banner);
    }
  }, [user, setBgPreview]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:block">
          <SprofileProfilePicture onProfileFileChange={setProfileFile} />
        </div>
        <div className="flex-1">
          <SprofileUserInfoForm />
        </div>
      </div>

      <div className="w-full h-auto min-h-[300px] md:min-h-[466px] aspect-[1328/466]">
        <div className="border-2 border-gray-200 rounded-lg p-6 bg-white w-full h-full flex flex-col">
          <div className='w-full text-center mb-4'>
            <h3 className='text-lg font-bold font-primary text-black'>รูปพื้นหลัง</h3>
          </div>

          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden relative min-h-[200px]">
            <Image
              src={bgPreview || (user as any)?.banner || "/images/ejb-bg.png"}
              alt="รูปพื้นหลัง"
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setBgPreview("/images/ejb-bg.png")}
              unoptimized={isDataUrl(bgPreview)}
            />
          </div>

          <div className='text-center w-full mt-4'>
            <Upload showUploadList={false} beforeUpload={handleBgUpload} accept="image/*">
              <Button type="default" icon={<UploadOutlined />} className='font-primary hover:border-red-500 hover:text-red-500 transition-colors'>
                อัปโหลดพื้นหลัง
              </Button>
            </Upload>
          </div>
        </div>
      </div>

      <div className='w-full flex justify-center mt-6'>
        <Button
          type="primary"
          loading={saving}
          disabled={saving}
          className='font-primary font-medium text-white border-0'
          style={{ backgroundColor: '#FF0037', borderRadius: '8px', width: 'auto', minWidth: '67px', height: '40px', fontSize: '16px', padding: '0 20px' }}
          onClick={handleSaveAll}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>
    </div>
  );
};
