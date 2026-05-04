import { describe, expect, it } from 'vitest';
import { getCurrencyIconSrc, normalizeCurrencyType } from './CurrencyIcon';

describe('CurrencyIcon helpers', () => {
  it('normalizes backend currency aliases', () => {
    expect(normalizeCurrencyType('current_rp')).toBe('rp');
    expect(normalizeCurrencyType('getcoin')).toBe('coin');
    expect(normalizeCurrencyType('getfreecoin')).toBe('freecoin');
  });

  it('uses website setting icons before default assets', () => {
    expect(getCurrencyIconSrc('coin', { coin: 'https://cdn.example/coin.png' })).toBe(
      'https://cdn.example/coin.png',
    );
  });

  it('can return null when unknown currencies should not fallback', () => {
    expect(getCurrencyIconSrc('baht', null, false)).toBeNull();
  });

  it('falls back to coin for unknown currencies by default', () => {
    expect(getCurrencyIconSrc('unknown')).toBe('/images/e-coin.png');
  });
});
