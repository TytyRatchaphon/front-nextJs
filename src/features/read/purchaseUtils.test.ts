import { describe, it, expect, vi } from 'vitest';
import { getReadEpisodePurchaseState, getRegularEpisodePrices } from './purchaseUtils';

describe('getRegularEpisodePrices', () => {
  it('treats Discount discount_price=0 as free discount and keeps end date', () => {
    const result = getRegularEpisodePrices({
      coin: 25,
      freecoin: 25,
      Discount: {
        discount_price: 0,
        end_date: '2026-12-31T23:59:59.000Z',
      },
    });

    expect(result.coinPrice).toBe(0);
    expect(result.freecoinPrice).toBe(0);
    expect(result.hasDiscount).toBe(true);
    expect(result.isDiscountFree).toBe(true);
    expect(result.discountEndDate).toBe('2026-12-31T23:59:59.000Z');
    expect(result.originalCoinPrice).toBe(25);
  });

  it('uses promotions[0].discount_price when Discount object is missing', () => {
    const result = getRegularEpisodePrices({
      coin: 15,
      promotions: [{ discount_price: 5, end_date: '2026-08-01T00:00:00.000Z' }],
    });

    expect(result.coinPrice).toBe(5);
    expect(result.hasDiscount).toBe(true);
    expect(result.isDiscountFree).toBe(false);
    expect(result.discountEndDate).toBe('2026-08-01T00:00:00.000Z');
  });

  it('falls back to normal price when discount is invalid or not cheaper', () => {
    const result = getRegularEpisodePrices({
      coin: 10,
      discount_price: 10,
    });

    expect(result.coinPrice).toBe(10);
    expect(result.hasDiscount).toBe(false);
    expect(result.isDiscountFree).toBe(false);
    expect(result.discountEndDate).toBeNull();
  });
});

describe('getReadEpisodePurchaseState', () => {
  it('propagates free-discount metadata', () => {
    const state = getReadEpisodePurchaseState(
      {
        coin: 9,
        Discount: { discount_price: 0, end_date: '2026-09-09T09:09:00.000Z' },
      },
      1,
    );

    expect(state.coinPrice).toBe(0);
    expect(state.hasDiscount).toBe(true);
    expect(state.isDiscountFree).toBe(true);
    expect(state.discountEndDate).toBe('2026-09-09T09:09:00.000Z');
  });

  it('supports structured early_access methods and daily_increase pricing', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-09T00:00:00.000Z').getTime());

    try {
      const state = getReadEpisodePurchaseState(
        {
          coin: 30,
          publish_datetime: '2026-04-11T00:00:00.000Z',
          early_access: {
            fast_ticket: {
              price: 1,
              daily_increase: 1,
              use: false,
            },
            fast_coin: {
              price: 3,
              daily_increase: 2,
              use: true,
            },
            isFast_buyable: false,
          },
        },
        1,
      );

      expect(state.isEarlyAccess).toBe(true);
      expect(state.canFastTicket).toBe(true);
      expect(state.canFastCoin).toBe(true);
      expect(state.isFastBuyable).toBe(true);
      expect(state.fastTicketPrice).toBe(3);
      expect(state.fastCoinPrice).toBe(7);
      expect(state.isFastLocked).toBe(false);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('still allows early-access methods when configured as objects even if use=false', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-09T00:00:00.000Z').getTime());
    try {
      const state = getReadEpisodePurchaseState(
        {
          coin: 30,
          publish_datetime: '2026-04-11T00:00:00.000Z',
          early_access: {
            fast_ticket: {
              price: 1,
              daily_increase: 1,
              use: false,
            },
            fast_coin: {
              price: 3,
              daily_increase: 1,
              use: false,
            },
            isFast_buyable: true,
          },
        },
        1,
      );

      expect(state.isEarlyAccess).toBe(true);
      expect(state.canFastTicket).toBe(true);
      expect(state.canFastCoin).toBe(true);
      expect(state.isFastBuyable).toBe(true);
      expect(state.isFastLocked).toBe(false);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('treats structured early_access as normal episode after publish_datetime has passed', () => {
    const state = getReadEpisodePurchaseState(
      {
        coin: 30,
        publish_datetime: '2021-04-16T07:55:00.000Z',
        early_access: {
          fast_ticket: {
            price: 1,
            daily_increase: 1,
            use: false,
          },
          fast_coin: {
            price: 3,
            daily_increase: 1,
            use: false,
          },
          isFast_buyable: false,
        },
      },
      1,
    );

    expect(state.isEarlyAccess).toBe(false);
    expect(state.canFastTicket).toBe(false);
    expect(state.canFastCoin).toBe(false);
    expect(state.isFastBuyable).toBe(false);
    expect(state.isFastLocked).toBe(false);
    expect(state.fastCoinPrice).toBe(3);
  });

  it('locks early-access purchase when sequential unlock flag is false', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-09T00:00:00.000Z').getTime());
    try {
      const state = getReadEpisodePurchaseState(
        {
          coin: 30,
          publish_datetime: '2026-04-11T00:00:00.000Z',
          early_access: {
            fast_ticket: { price: 1, use: true },
            fast_coin: { price: 3, use: true },
          },
        },
        1,
        { isSequentialUnlocked: false },
      );

      expect(state.isEarlyAccess).toBe(true);
      expect(state.canFastTicket).toBe(true);
      expect(state.canFastCoin).toBe(true);
      expect(state.isFastBuyable).toBe(false);
      expect(state.isFastLocked).toBe(true);
    } finally {
      nowSpy.mockRestore();
    }
  });
});
