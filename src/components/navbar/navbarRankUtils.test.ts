import { describe, expect, it } from 'vitest';
import {
  cleanNavbarRankToken,
  getClaimableRankRewardSnapshot,
  getCurrentRank,
  getHasRankRewardNotification,
  getRankRpValue,
  normalizeRankTruthy,
} from './navbarRankUtils';

describe('navbarRankUtils', () => {
  it('normalizes rank truthy values from backend shapes', () => {
    expect(normalizeRankTruthy(true)).toBe(true);
    expect(normalizeRankTruthy(1)).toBe(true);
    expect(normalizeRankTruthy('Y')).toBe(true);
    expect(normalizeRankTruthy('yes')).toBe(true);
    expect(normalizeRankTruthy('0')).toBe(false);
  });

  it('cleans quote-wrapped rank auth tokens', () => {
    expect(cleanNavbarRankToken('"abc"', null)).toBe('abc');
    expect(cleanNavbarRankToken(null, "'cookie-token'")).toBe('cookie-token');
  });

  it('builds stable claimable rank reward snapshots', () => {
    const snapshot = getClaimableRankRewardSnapshot({
      ranks: [
        { rank_id: 2, can_claim: 'Y', grant_id: 10 },
        { rank_id: 3, rewards: [{ id: 7, can_claim: true }] },
      ],
    });

    expect(snapshot.count).toBe(2);
    expect(snapshot.tokens).toEqual(['grant:10', 'reward:3:7']);
    expect(snapshot.signature).toBe('grant:10|reward:3:7');
  });

  it('selects current rank and notification state', () => {
    const rankData = {
      ranks: [
        { rank_id: 1, name: 'Bronze' },
        { rank_id: 2, name: 'Silver', is_current_rank: true, rewards: [{ can_claim: true }] },
      ],
    };

    expect(getCurrentRank(rankData)?.name).toBe('Silver');
    expect(getHasRankRewardNotification(rankData)).toBe(true);
  });

  it('resolves rp value from rank data before user fallback', () => {
    expect(getRankRpValue({ total_rp: 12 }, { current_rp: 5 })).toBe(12);
    expect(getRankRpValue({}, { current_rp: 5 })).toBe(5);
  });
});
