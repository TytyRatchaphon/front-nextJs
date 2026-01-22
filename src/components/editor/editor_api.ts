import axios, { AxiosProgressEvent } from "axios";
import Cookies from "js-cookie"; // ดึง cookie โดยตรง
import CryptoJS from "crypto-js"; // ดึง lib โดยตรง

// 1. ประกาศตัวแปร Config ในไฟล์นี้เลย
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3331';
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN || '';
const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY || '';
const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL;

// 2. สร้างฟังก์ชันสร้าง Headers ในไฟล์นี้ (ใช้ภายใน)
const getHeaders = () => {
    // 1. ดึง Token
    const token = Cookies.get('token') || localStorage.getItem('authToken');
    
    // 🛠️ Debug ดูว่า Token มีค่าไหม (กด F12 ดู console ตอนอัปโหลด)

    const encodedApiKey = typeof window !== 'undefined' 
        ? btoa(process.env.NEXT_PUBLIC_ACCESS_TOKEN || '') 
        : '';

    return {
        // ✅ แก้ไข: เพิ่ม 'Bearer ' นำหน้า (มาตรฐานส่วนใหญ่ใช้แบบนี้)
        "Authorization": token ? `Bearer ${token}` : '', 
        "X-API-Key": encodedApiKey,
    };
};

// 3. ฟังก์ชันถอดรหัส (ใช้ภายใน)
// const decryptData = (encryptedData: string) => {
//     try {
//         if (!encryptedData) return null;
//         const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
//         return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
//     } catch (error) {
//         return null;
//     }
// };

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
    const formdata = new FormData();
    formdata.append('img', file); // ✅ ถูกต้อง: Key ชื่อ img ตรงกับ Postman

    try {
        // ⚠️ แก้ไข: ลบ / หน้า user ออก (ถ้า API_URL มี / ปิดท้ายอยู่แล้ว)
        const response = await axios.post(`${API_URL}user/image_text_editor`, formdata, {
            headers: getHeaders() 
        });
        
        // ⚠️ แก้ไข: เปลี่ยนจาก .img เป็น .imageURL ตาม Postman Response
        if (response.data?.data?.imageURL) {
            return response.data.data.imageURL;
        }
        
        return '';
    } catch (error) {
        return '';
    }
};

export const imageUploadHandler = (blobInfo: BlobInfo, progress: (percent: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const formData = new FormData();
            // 1. แก้ชื่อ Key จาก 'smn' เป็น 'img' ตาม Postman
            formData.append('img', blobInfo.blob(), blobInfo.filename());

            // ยิง Axios
            // หมายเหตุ: ตรวจสอบ API_URL ใน env อีกทีว่ามี / ปิดท้ายหรือไม่ ถ้ามีแล้วให้ลบ / หน้า user ออก
            const res = await axios.post(`${API_URL}/user/image_text_editor`, formData, {
                headers: getHeaders(), 
                onUploadProgress: (e: AxiosProgressEvent) => {
                    if (progress && e.total) {
                        progress((e.loaded / e.total) * 100);
                    }
                }
            });

            // 2. ไม่ต้อง Decrypt แล้ว เพราะ Postman โชว์ข้อมูลดิบๆ เลย
            // 3. ดึง URL จาก res.data.data.imageURL โดยตรง
            const responseBody = res.data;
            if (responseBody.code === 200 && responseBody.data?.imageURL) {
                const url = responseBody.data.imageURL;
                resolve(url);
            } else {
                reject(responseBody.message || 'อัปโหลดล้มเหลว');
            }
        } catch (err) {
            reject('เกิดข้อผิดพลาดในการอัปโหลด');
        }
    });
};