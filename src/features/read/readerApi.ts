import { decryptEpisodePayloadOnClient } from "./readerContentUtils";

export const fetchEpisodeContent = async (epId: string) => {
  try {
    let data: any;
    const encodedEpisodeId = encodeURIComponent(epId);

    const response = await fetch(`/api/read/episode/${encodedEpisodeId}`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    data = await response.json();

    if (data?.code === 200 && data.data) {
      const resolvedPayload = decryptEpisodePayloadOnClient(data.data);
      if (resolvedPayload) {
        return resolvedPayload;
      }
      throw new Error("Failed to decrypt episode content");
    }

    if (data?.code === 401) {
      throw new Error(data.message || "คุณไม่มีสิทธิ์อ่านตอนนี้ กรุณาซื้อตอนก่อน");
    }

    throw new Error(data?.message || "ไม่พบข้อมูลตอน");
  } catch (err: any) {
    const status = err?.response?.status;
    const errorData = err?.response?.data;
    if (errorData) {
      const msg = errorData.message || (typeof errorData === "string" ? errorData : `ไม่สามารถดึงข้อมูลตอนได้ (${status})`);
      throw new Error(msg);
    }
    throw new Error(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
  }
};
