import apiClient from '../apiClient';
import type {
  DailyCoinPassMeResponse,
  DailyCoinPassClaimRequest,
  DailyCoinPassClaimResponse,
  DailyCoinPassCalendarResponse,
  DailyCoinPassPassHistoryResponse,
  DailyCoinPassClaimHistoryResponse
} from '@/types/dailyCoinPass';

/**
 * Fetch the current user's Daily Coin Pass summary, active passes, and claim state.
 */
export async function getDailyCoinPassMe(): Promise<DailyCoinPassMeResponse> {
  const response = await apiClient.get<{ data: DailyCoinPassMeResponse }>('/daily-coin-pass/me');
  return response.data?.data ?? (response.data as any);
}

/**
 * Claim daily rewards or catchup rewards.
 */
export async function claimDailyCoinPass(request: DailyCoinPassClaimRequest): Promise<DailyCoinPassClaimResponse> {
  const response = await apiClient.post<{ data: DailyCoinPassClaimResponse }>('/daily-coin-pass/claim', request);
  return response.data?.data ?? (response.data as any);
}

/**
 * Get the calendar detail for a specific pass.
 */
export async function getDailyCoinPassCalendar(userPassId: number): Promise<DailyCoinPassCalendarResponse> {
  const response = await apiClient.get<{ data: DailyCoinPassCalendarResponse }>('/daily-coin-pass/calendar', {
    params: { user_pass_id: userPassId }
  });
  return response.data?.data ?? (response.data as any);
}

/**
 * Get the history of passes owned by the user.
 */
export async function getDailyCoinPassHistory(page: number = 1, limit: number = 20): Promise<DailyCoinPassPassHistoryResponse> {
  const response = await apiClient.get<{ data: DailyCoinPassPassHistoryResponse }>('/daily-coin-pass/pass-history', {
    params: { page, limit }
  });
  return response.data?.data ?? (response.data as any);
}

/**
 * Get the history of reward claims.
 */
export async function getDailyCoinPassClaimHistory(page: number = 1, limit: number = 20): Promise<DailyCoinPassClaimHistoryResponse> {
  const response = await apiClient.get<{ data: DailyCoinPassClaimHistoryResponse }>('/daily-coin-pass/history', {
    params: { page, limit }
  });
  return response.data?.data ?? (response.data as any);
}
