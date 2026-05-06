import apiClient from "../apiClient";

export interface ActiveDevice {
  device_id: string;
  user_agent: string;
  book_id?: string | number | null;
  ep_id?: string | number | null;
  started_at: string;
  last_seen_at: string;
  is_current_device: boolean;
  can_logout: boolean;
  is_reading: boolean;
}

export interface ReadingSessionActiveData {
  current_device: ActiveDevice | null;
  active_devices: ActiveDevice[];
}

export interface ReadingSessionActiveResponse {
  code: number;
  status: string;
  message: string;
  data: ReadingSessionActiveData;
}

export const endReadingSession = async (book_id: string | number, ep_id: string | number) => {
  // Use keepalive for reliability during page unload
  try {
    const payload = JSON.stringify({
      book_id: String(book_id),
      ep_id: String(ep_id)
    });
    
    const token = apiClient.defaults.headers?.common?.Authorization || apiClient.defaults.headers?.Authorization;
    const deviceId = apiClient.defaults.headers?.common?.['x-device-id'] || apiClient.defaults.headers?.['x-device-id'];
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) headers['Authorization'] = String(token);
    if (deviceId) headers['x-device-id'] = String(deviceId);
    
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/reading-session/end`;

    // Try fetch with keepalive first
    if (typeof fetch !== 'undefined') {
      try {
        await fetch(url, {
          method: 'POST',
          headers,
          body: payload,
          keepalive: true
        });
        return { success: true };
      } catch (fetchError) {
        // Fallback if fetch fails
      }
    }
    
    // Fallback to normal apiClient if fetch with keepalive fails or is unavailable
    const response = await apiClient.post('/reading-session/end', {
      book_id: String(book_id),
      ep_id: String(ep_id)
    });
    return response.data;
  } catch (error) {
    return null; // Ignore errors for session end
  }
};

export const takeoverReadingSession = async (book_id: string | number, ep_id: string | number) => {
  const response = await apiClient.post('/reading-session/takeover', {
    book_id: String(book_id),
    ep_id: String(ep_id)
  });
  return response.data;
};

export const fetchActiveReadingSessions = async (): Promise<ReadingSessionActiveData | null> => {
  try {
    const response = await apiClient.get<ReadingSessionActiveResponse>('/reading-session/active');
    return response.data?.data || null;
  } catch {
    return null;
  }
};

export const logoutOtherDevice = async (target_device_id: string) => {
  const response = await apiClient.post('/reading-session/logout-other-device', {
    target_device_id
  });
  return response.data;
};
