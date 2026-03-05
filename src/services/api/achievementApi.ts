import apiClient from "../apiClient";

// --- Fetch All Achievements ---
export const fetchAchievements = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/achievement');
    return response.data?.data || null;
  } catch (err) {
    console.error('[fetchAchievements] error:', err);
    return null;
  }
};

// --- Fetch Achievement Detail ---
export const fetchAchievementDetail = async (achievementId: string | number): Promise<any> => {
  try {
    const response = await apiClient.get(`/achievement/${achievementId}`);
    return response.data?.data || null;
  } catch (err) {
    console.error('[fetchAchievementDetail] error:', err);
    return null;
  }
};

// --- Claim Achievement Reward ---
export const claimAchievement = async (achievementId: string | number): Promise<any> => {
  try {
    const response = await apiClient.post(`/achievement/${achievementId}/claim`);
    return response.data;
  } catch (err) {
    console.error('[claimAchievement] error:', err);
    throw err;
  }
};
