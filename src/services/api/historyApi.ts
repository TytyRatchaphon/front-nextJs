import apiClient from "../apiClient";

export interface HistoryQueryParams {
  page?: number;
  limit?: number;
}

const fetchUserHistory = async (
  endpoint: string,
  params: HistoryQueryParams = {},
) => {
  const page = Number.isFinite(Number(params.page)) ? Number(params.page) : 1;
  const limit = Number.isFinite(Number(params.limit)) ? Number(params.limit) : 20;

  const response = await apiClient.get(endpoint, {
    params: { page, limit },
  });

  return response.data;
};

export const fetchPaymentHistory = (params: HistoryQueryParams = {}) =>
  fetchUserHistory("/user/his_payment", params);

export const fetchUseCoinHistory = (params: HistoryQueryParams = {}) =>
  fetchUserHistory("/user/his_usecoin", params);

export const fetchRedeemHistory = (params: HistoryQueryParams = {}) =>
  fetchUserHistory("/user/his_redeem", params);

export const fetchGachaHistory = (params: HistoryQueryParams = {}) =>
  fetchUserHistory("/user/his_gacha", params);

export const fetchGetMoreHistory = (params: HistoryQueryParams = {}) =>
  fetchUserHistory("/user/his_getmore", params);

export const fetchGiftHistory = (params: HistoryQueryParams = {}) =>
  fetchUserHistory("/user/his_gift", params);

export const fetchStoreHistory = (params: HistoryQueryParams = {}) =>
  fetchUserHistory("/user/his_store", params);
