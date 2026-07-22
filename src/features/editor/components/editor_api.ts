import { AxiosProgressEvent } from "axios";
import secureProxyClient from "@/services/secureProxyClient";
import "@/stores/uiStore";

interface BlobInfo {
  id: () => string;
  name: () => string;
  filename: () => string;
  blob: () => Blob;
  base64: () => string;
  blobUri: () => string;
}

export const imageUploadHandler = (
  blobInfo: BlobInfo,
  progress: (percent: number) => void,
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("img", blobInfo.blob(), blobInfo.filename());

      const res = await secureProxyClient.post("/user/image_text_editor", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (progress && e.total) {
            progress((e.loaded / e.total) * 100);
          }
        },
      });

      const responseBody = res.data;
      if (responseBody.code === 200 && responseBody.data?.imageURL) {
        resolve(responseBody.data.imageURL);
      } else {
        console.error("Image upload failed response:", responseBody);
        reject(responseBody.message || "Upload failed");
      }
    } catch (err: any) {
      console.error("Image upload exception:", err);
      reject("Upload failed");
    }
  });
};
