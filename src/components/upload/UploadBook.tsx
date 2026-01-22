'use client';

import React, { useState, useEffect } from 'react';
import { Image, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload/interface';
import ImgCrop from 'antd-img-crop';


// ฟังก์ชัน Helper (ถ้าไม่ได้ import จากไฟล์อื่น)
const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

interface UploadCropBookProps {
  src?: string | null;
  onChange?: (file: RcFile | File) => void;
}

const UploadCropBook: React.FC<UploadCropBookProps> = ({ src, onChange }) => {

  // แก้ไขการเรียกใช้รูปภาพให้ปลอดภัย
  const defaultImage = ("/images/book.png" as any).src || "/images/book.png";
  
  const [filePreview, setFilePreview] = useState<string>(src || defaultImage);

  const ratio = 1.414516129032258;

  useEffect(() => {
    if (src) {
        setFilePreview(src);
    }
  }, [src]);

  const handleCrop = async (file: RcFile) => {
    try { 
        const encode = await getBase64(file);
        setFilePreview(encode);
        
        if (onChange) {
            onChange(file);
        }
    } catch (error) {
    }
  };

  const customRequest = ({ onSuccess }: any) => {
     setTimeout(() => {
       onSuccess("ok");
     }, 0);
  };

  return (
    <div>
      <ImgCrop 
        rotationSlider 
        aspect={1/ratio} 
        // ระบุ type ให้ file ตรงนี้เพื่อแก้ error 'implicitly any'
        onModalOk={(file: any) => handleCrop(file as RcFile)} 
      >
        <Upload
          // ลบ aspect={...} ออกจากตรงนี้ เพราะ Upload component ไม่รองรับ prop นี้
          listType="picture"
          showUploadList={false}
          accept=".png,.jpg,.jpeg"
          customRequest={customRequest}
        >
          <Image
            preview={false}
            src={filePreview}
            alt="Upload Book Cover" 
            className='rounded-lg cursor-pointer hover:opacity-80 transition-opacity'
            style={{ 
                objectFit: 'cover', 
                minHeight: '100px', 
                minWidth: '100px' 
            }}
          />
        </Upload>
      </ImgCrop>
    </div>
  );
};

export default UploadCropBook;