import { describe, it, expect } from 'vitest';
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
});
