import apiClient from "../apiClient";

export interface LogActivityPayload {
  session_id?: string;
  page_session_id?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  path?: string;
  duration?: number;
  metadata?: any;
}

export const logActivity = async (payload: LogActivityPayload) => {
  try {
    const response = await apiClient.post('/log/activity', payload);
    return response.data;
  } catch (error) {
    console.error("Failed to log activity", error);
    return null;
  }
};
