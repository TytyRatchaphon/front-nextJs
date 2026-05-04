import { beforeEach, describe, expect, it, vi } from 'vitest';

import apiClient from '../apiClient';
import {
  fetchGachaHistory,
  fetchGetMoreHistory,
  fetchGiftHistory,
  fetchPaymentHistory,
  fetchRedeemHistory,
  fetchStoreHistory,
  fetchUseCoinHistory,
} from './historyApi';

vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe('historyApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedApiClient.get.mockResolvedValue({ data: { code: 200, data: [] } });
  });

  it.each([
    [fetchPaymentHistory, '/user/his_payment'],
    [fetchUseCoinHistory, '/user/his_usecoin'],
    [fetchRedeemHistory, '/user/his_redeem'],
    [fetchGachaHistory, '/user/his_gacha'],
    [fetchGetMoreHistory, '/user/his_getmore'],
    [fetchGiftHistory, '/user/his_gift'],
    [fetchStoreHistory, '/user/his_store'],
  ])('fetches %s with pagination params', async (fetcher, endpoint) => {
    await expect(fetcher({ page: 2, limit: 20 })).resolves.toEqual({ code: 200, data: [] });

    expect(mockedApiClient.get).toHaveBeenCalledWith(endpoint, {
      params: { page: 2, limit: 20 },
    });
  });
});
