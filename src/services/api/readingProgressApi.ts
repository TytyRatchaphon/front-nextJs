import apiClient from "../apiClient";

export const syncReadingProgress = async (ep_id: string | number) => {
  try {
    const response = await apiClient.post('/reading-progress/sync', { ep_id: String(ep_id) });
    return response.data;
  } catch {
    return null;
  }
};

export const updateReadingProgress = async (book_id: string | number, ep_id: string | number, progress: number) => {
  try {
    const response = await apiClient.post('/reading-progress/update', {
      book_id: String(book_id),
      ep_id: String(ep_id),
      progress
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.code === 409001 || error.response?.data?.error_code === "READING_CONFLICT") {
      throw error.response.data;
    }
    return null;
  }
};
