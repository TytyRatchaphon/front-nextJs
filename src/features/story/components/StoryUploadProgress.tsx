import React from 'react';
import { useStoryStore } from '../stores/storyStore';
import { Progress } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, LoadingOutlined } from '@ant-design/icons';
import clsx from 'clsx';

const StoryUploadProgress = () => {
  const uploadStatus = useStoryStore((state) => state.uploadStatus);
  const uploadProgress = useStoryStore((state) => state.uploadProgress);
  const uploadStage = useStoryStore((state) => state.uploadStage);
  const resetUpload = useStoryStore((state) => state.resetUpload);

  if (uploadStatus === 'idle') return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9000] w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800">
          อัปโหลดสตอรี่
        </h4>
        {(uploadStatus === 'completed' || uploadStatus === 'failed') && (
          <button 
            onClick={resetUpload}
            className="text-gray-400 hover:text-gray-600 cursor-pointer text-sm"
          >
            ปิด
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {uploadStatus === 'uploading' || uploadStatus === 'processing' || uploadStatus === 'queued' ? (
          <LoadingOutlined className="text-red-500 text-xl" />
        ) : uploadStatus === 'completed' ? (
          <CheckCircleFilled className="text-green-500 text-xl" />
        ) : (
          <CloseCircleFilled className="text-red-500 text-xl" />
        )}

        <div className="flex-1">
          <p className={clsx("text-sm", {
            "text-gray-600": uploadStatus !== 'failed',
            "text-red-500": uploadStatus === 'failed'
          })}>
            {uploadStage || 'กำลังดำเนินการ...'}
          </p>
          <Progress 
            percent={Math.round(uploadProgress)} 
            size="small" 
            status={
              uploadStatus === 'failed' ? 'exception' : 
              uploadStatus === 'completed' ? 'success' : 'active'
            }
            strokeColor={uploadStatus === 'failed' ? undefined : uploadStatus === 'completed' ? '#22c55e' : '#ef4444'}
            showInfo={false}
          />
        </div>
      </div>
    </div>
  );
};

export default StoryUploadProgress;
