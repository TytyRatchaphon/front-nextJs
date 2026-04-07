import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRankProfile, fetchQuests, claimQuest } from './userApi';
import apiClient from '../apiClient';

vi.mock('../apiClient');
vi.mock('js-cookie');

describe('userApi - fetchRankProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch rank profile successfully when token is provided', async () => {
    const mockData = {
      code: 200,
      status: 'success',
      message: 'success',
      data: {
        total_rp: 4400,
        rp_needed: 600,
        current_rank: {
          rank_id: 30,
          name: 'Silver',
          min_rp: 0,
          max_rp: 5000,
          rank_img: 'mock-img-url',
        },
        next_rank_name: 'Gold',
      },
    };

    (apiClient.get as any).mockResolvedValueOnce({ data: mockData });

    const result = await fetchRankProfile('mock-token');

    expect(apiClient.get).toHaveBeenCalledWith('/rank/profile', {
      headers: { Authorization: 'mock-token' },
    });
    expect(result).toMatchObject({
      ...mockData.data,
      current_rank: {
        ...mockData.data.current_rank,
        rank_img: 'https://image.enjoybook.co/mock-img-url',
      },
      next_rank: {
        rank_img: '/images/user.png',
      },
    });
  });

  it('should fetch rank profile without token header when token is not provided', async () => {
    const mockData = {
      code: 200,
      status: 'success',
      message: 'success',
      data: {
        total_rp: 0,
        rp_needed: 10,
        current_rank: {
          rank_id: 1,
          name: 'Beginner',
          min_rp: 0,
          max_rp: 10,
          rank_img: 'mock-img-url',
        },
        next_rank_name: 'Novice',
      },
    };

    (apiClient.get as any).mockResolvedValueOnce({ data: mockData });

    const result = await fetchRankProfile();

    expect(apiClient.get).toHaveBeenCalledWith('/rank/profile', {});
    expect(result).toMatchObject({
      ...mockData.data,
      current_rank: {
        ...mockData.data.current_rank,
        rank_img: 'https://image.enjoybook.co/mock-img-url',
      },
      next_rank: {
        rank_img: '/images/user.png',
      },
    });
  });

  it('should return null if API call fails', async () => {
    (apiClient.get as any).mockRejectedValueOnce(new Error('Network error'));
    
    const result = await fetchRankProfile('mock-token');

    expect(result).toBeNull();
  });
});

describe('userApi - fetchQuests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch quests successfully with token', async () => {
    const mockData = {
      code: 200,
      status: 'success',
      message: 'success',
      data: [
        {
          group_name: 'ภารกิจรายสัปดาห์',
          quests: [
            {
              quest_id: 12,
              name: 'โปรเดือด อ่านสายบู๊',
              description: null,
              reward_rp: 'x2.00',
              max_per_user: null,
              current_count: 0,
              status: 'incomplete',
              group: 'weekly',
              start_date: '2026-02-24T04:15:59.000Z',
              end_date: '2026-02-27T17:00:00.000Z',
            },
          ],
        },
      ],
    };

    (apiClient.get as any).mockResolvedValueOnce({ data: mockData });

    const result = await fetchQuests('mock-token');

    expect(apiClient.get).toHaveBeenCalledWith('/rank/quests', {
      headers: { Authorization: 'mock-token' },
    });
    expect(result).toEqual(mockData.data);
  });

  it('should return null if API call fails', async () => {
    (apiClient.get as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchQuests('mock-token');

    expect(result).toBeNull();
  });
});

describe('userApi - claimQuest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should claim quest successfully', async () => {
    const mockResponse = {
      code: 200,
      status: 'success',
      message: 'Claimed successfully',
    };

    (apiClient.post as any).mockResolvedValueOnce({ data: mockResponse });

    const result = await claimQuest(13, 'mock-token');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/rank/quests/claim',
      { quest_id: 13 },
      { headers: { Authorization: 'mock-token' } }
    );
    expect(result).toEqual(mockResponse);
  });

  it('should throw error when claim fails', async () => {
    (apiClient.post as any).mockRejectedValueOnce(new Error('Claim failed'));

    await expect(claimQuest(13, 'mock-token')).rejects.toThrow('Claim failed');
  });
});
