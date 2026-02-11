import { AxiosProgressEvent } from "axios";
import axios from "axios"; // Use direct axios to avoid interceptor/default header issues
import Cookies from "js-cookie";
import { useUIStore } from "@/stores/uiStore";

// 1. ประกาศตัวแปร Config ในไฟล์นี้เลย
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN;

// 2. สร้างฟังก์ชันสร้าง Headers ในไฟล์นี้ (ใช้ภายใน)
const getHeaders = () => {
    // 1. ดึง Token
    const rawToken = Cookies.get('token') || localStorage.getItem('authToken');
    const token = rawToken ? rawToken.replace(/^Bearer\s+/i, '').trim() : '';

    const encodedApiKey = typeof window !== 'undefined'
        ? btoa(process.env.NEXT_PUBLIC_ACCESS_TOKEN || '')
        : '';

    return {
        "Authorization": token, // Send just the token, matching apiClient behavior
        "X-API-Key": encodedApiKey,
    };
};

// Interface สำหรับ TinyMCE
interface BlobInfo {
    id: () => string;
    name: () => string;
    filename: () => string;
    blob: () => Blob;
    base64: () => string;
    blobUri: () => string;
}

// --- ฟังก์ชันหลักที่ส่งออกไปใช้งาน ---

export const uploadDesImage = async (file: File | Blob): Promise<string> => {
    console.log("uploadDesImage file:", file);
    const formdata = new FormData();
    formdata.append('img', file);

    try {
        // Use axios directly
        const response = await axios.post(`${API_URL}/user/image_text_editor`, formdata, {
            headers: getHeaders()
        });

        if (response.data?.data?.imageURL) {
            return response.data.data.imageURL;
        }

        return '';
    } catch (error: any) {
        console.error("uploadDesImage error:", error);
        return '';
    }
};

export const imageUploadHandler = (blobInfo: BlobInfo, progress: (percent: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const formData = new FormData();
            console.log("imageUploadHandler blob:", blobInfo.blob());
            formData.append('img', blobInfo.blob(), blobInfo.filename());

            // Use axios directly
            const res = await axios.post(`${API_URL}/user/image_text_editor`, formData, {
                headers: getHeaders(),
                onUploadProgress: (e: AxiosProgressEvent) => {
                    if (progress && e.total) {
                        progress((e.loaded / e.total) * 100);
                    }
                }
            });

            const responseBody = res.data;
            if (responseBody.code === 200 && responseBody.data?.imageURL) {
                const url = responseBody.data.imageURL;
                console.log("Image uploaded success:", url);
                resolve(url);
            } else {
                console.error("Image upload failed response:", responseBody);
                reject(responseBody.message || 'อัปโหลดล้มเหลว');
            }
        } catch (err: any) {
             console.error("Image upload exception:", err);
            reject('เกิดข้อผิดพลาดในการอัปโหลด');
        }
    });
};