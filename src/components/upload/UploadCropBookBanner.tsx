"use client";
import * as React from "react";
import { useState, useEffect } from 'react';
import { Upload, Image as AntdImage } from 'antd'; // 1. เปลี่ยนชื่อ Image ของ Antd
import type { RcFile } from 'antd/es/upload/interface';
import ImgCrop from 'antd-img-crop';
import NextImage from 'next/image'; // 2. เปลี่ยนชื่อ Image ของ Next.js


// --- Helper Function ---
const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// --- Internal Component: ImageBookBanner (รวมมาไว้ที่นี่) ---
interface InternalBannerProps {
    src: string | any; // รองรับทั้ง string path และ StaticImageData
    alt?: string;
}

const InternalImageBookBanner: React.FC<InternalBannerProps> = ({ src, alt = "book banner" }) => {
    // จัดการ Default Image
    const defaultSrc = ("/images/bookbanner.png" as any).src || "/images/bookbanner.png";
    
    const [imageSrc, setImageSrc] = useState<string | any>(defaultSrc);
    const [isLoad, setIsLoad] = useState(false);
    
    const NEXT_PUBLIC_IMAGE_BOOK_URL = process.env.NEXT_PUBLIC_IMAGE_BOOK_URL || '';
    const aspectRatio = 2.18694885361552;
    
    const imageStyle: React.CSSProperties = {
        width: '100%',
        height: 'auto',
        aspectRatio: `${aspectRatio} / 1`
    };

    useEffect(() => {
        if (src) {
            let imgUrl = src;

            // ตรวจสอบประเภทของ src
            if (typeof src === 'string') {
                // ถ้าเป็น Base64 ให้ใช้เลย, ถ้าไม่ใช่ให้ต่อ Path
                imgUrl = src.startsWith('data:image') ? src : NEXT_PUBLIC_IMAGE_BOOK_URL + src;
            } else if (typeof src === 'object' && src.src) {
                // กรณีเป็น StaticImageData (import มา)
                imgUrl = src.src;
            }

            // Preload Image Logic
            const testImage = new window.Image();
            testImage.src = imgUrl;

            testImage.onload = () => {
                setImageSrc(imgUrl);
                setIsLoad(true);
            };

            testImage.onerror = () => {
                setImageSrc(defaultSrc);
                setIsLoad(false); // โหลดไม่ผ่านให้ใช้ Default และแสดงด้วย NextImage
            };
        } else {
            setImageSrc(defaultSrc);
        }
    }, [src, NEXT_PUBLIC_IMAGE_BOOK_URL, defaultSrc]);

    return (
        <div style={imageStyle} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full overflow-hidden">
            {isLoad ? (
                <AntdImage 
                    className="rounded-lg w-full object-cover" 
                    style={imageStyle} 
                    src={imageSrc} 
                    alt={alt} 
                    preview={false} // ปิด preview ใน Upload เพราะมันจะตีกับ Upload click
                />
            ) : (
                <NextImage 
                    src={imageSrc} 
                    style={imageStyle} 
                    className="rounded-lg w-full" 
                    alt={alt} 
                    width={1240} // ใส่ width/height คร่าวๆ เพื่อให้ NextImage ทำงานได้ (เพราะ style คุม ratio ไว้แล้ว)
                    height={567}
                />
            )}
        </div>
    );
};

// --- Main Component ---
interface UploadCropBookBannerProps {
  src?: string | null;
  onChange?: (file: RcFile | File) => void;
}

const UploadCropBookBanner: React.FC<UploadCropBookBannerProps> = ({ src, onChange }) => {
  
  const defaultImage = ("/images/book.png" as any).src || "/images/book.png";
  const [filePreview, setFilePreview] = useState<string>(src || defaultImage);
  const ASPECT_RATIO = 2.18694885361552 / 1;

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
    } catch {
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
        aspect={ASPECT_RATIO} 
        onModalOk={(file: any) => handleCrop(file as RcFile)} 
      >
        <Upload
          listType="picture"
          showUploadList={false}
          accept=".png,.jpg,.jpeg"
          customRequest={customRequest}
        > 
          {/* เรียกใช้ Component ภายในที่เราสร้างไว้ข้างบน */}
          <InternalImageBookBanner src={filePreview} />
        </Upload>
      </ImgCrop>
    </div>
  );
};

export default UploadCropBookBanner;