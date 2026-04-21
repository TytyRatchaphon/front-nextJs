import { describe, expect, it } from "vitest";

import {
  getEarlyAccessDayMultiplier,
  isEpisodeSequentiallyUnlockable,
  normalizeEpisodeEarlyAccess,
} from "./earlyAccessUtils";

describe("getEarlyAccessDayMultiplier", () => {
  const nowMs = new Date("2026-04-21T00:00:00.000Z").getTime();

  it("returns 0 when remaining time is less than 24 hours", () => {
    const publish = new Date(nowMs + 23 * 60 * 60 * 1000 + 59 * 60 * 1000).toISOString();
    expect(getEarlyAccessDayMultiplier(publish, nowMs)).toBe(0);
  });

  it("returns 1 after one full day, 2 after two full days", () => {
    const plus24h = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
    const plus49h = new Date(nowMs + 49 * 60 * 60 * 1000).toISOString();

    expect(getEarlyAccessDayMultiplier(plus24h, nowMs)).toBe(1);
    expect(getEarlyAccessDayMultiplier(plus49h, nowMs)).toBe(2);
  });
});

describe("normalizeEpisodeEarlyAccess", () => {
  const nowMs = new Date("2026-04-21T00:00:00.000Z").getTime();

  it("does not apply daily increase when remaining time is below 24 hours", () => {
    const publish = new Date(nowMs + 12 * 60 * 60 * 1000).toISOString();
    const result = normalizeEpisodeEarlyAccess(
      {
        coin: 10,
        publish_datetime: publish,
        early_access: {
          fast_ticket: { price: 1, daily_increase: 2, use: true },
          fast_coin: { price: 3, daily_increase: 4, use: true },
        },
      },
      nowMs
    );

    expect(result.dayMultiplier).toBe(0);
    expect(result.fastTicketPrice).toBe(1);
    expect(result.fastCoinPrice).toBe(3);
  });
});

describe("isEpisodeSequentiallyUnlockable", () => {
  const nowMs = new Date("2026-04-21T00:00:00.000Z").getTime();
  const future = new Date(nowMs + 4 * 60 * 60 * 1000).toISOString();

  const buildEarlyEpisode = (overrides: Record<string, unknown> = {}) => ({
    coin: 3,
    publish_datetime: future,
    early_access: {
      fast_ticket: { price: 1, use: true },
      fast_coin: { price: 3, use: true },
    },
    ...overrides,
  });

  it("allows the first early-access episode in a group", () => {
    const list = [buildEarlyEpisode(), buildEarlyEpisode()];
    expect(isEpisodeSequentiallyUnlockable(list[0], 0, list, nowMs)).toBe(true);
  });

  it("locks the next early-access episode when the previous one is not bought", () => {
    const list = [buildEarlyEpisode(), buildEarlyEpisode()];
    expect(isEpisodeSequentiallyUnlockable(list[1], 1, list, nowMs)).toBe(false);
  });

  it("unlocks the next early-access episode after previous early episode is bought", () => {
    const list = [buildEarlyEpisode({ isBuy: true }), buildEarlyEpisode()];
    expect(isEpisodeSequentiallyUnlockable(list[1], 1, list, nowMs)).toBe(true);
  });
});
