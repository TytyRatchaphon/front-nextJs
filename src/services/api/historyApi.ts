import apiClient from '../apiClient';

export interface HistoryListParams {
  page: number;
  limit: number;
}

const fetchUserHistory = async (endpoint: string, params: HistoryListParams) => {
  const response = await apiClient.get(endpoint, { params });
  return response.data;
};

export const fetchPaymentHistory = (params: HistoryListParams) => (
  fetchUserHistory('/user/his_payment', params)
);

export const fetchUseCoinHistory = (params: HistoryListParams) => (
  fetchUserHistory('/user/his_usecoin', params)
);

export const fetchRedeemHistory = (params: HistoryListParams) => (
  fetchUserHistory('/user/his_redeem', params)
);

export const fetchGachaHistory = (params: HistoryListParams) => (
  fetchUserHistory('/user/his_gacha', params)
);

export const fetchGetMoreHistory = (params: HistoryListParams) => (
  fetchUserHistory('/user/his_getmore', params)
);

export const fetchGiftHistory = (params: HistoryListParams) => (
  fetchUserHistory('/user/his_gift', params)
);

export const fetchStoreHistory = (params: HistoryListParams) => (
  fetchUserHistory('/user/his_store', params)
);
