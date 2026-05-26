import { describe, expect, it } from "vitest";
import {
  getEpisodeRegularCoinPrice,
  getEpisodePriceByMethod,
  hasUnexpectedFullBookDiscountQuote,
} from "./bookInfoCardPurchaseUtils";

describe("full-book regular price policy", () => {
  it("keeps the regular coin price for full-book totals while manual pricing can use an episode discount", () => {
    const episode = { coin: 30, discount_price: 20 };

    expect(getEpisodeRegularCoinPrice(episode)).toBe(30);
    expect(getEpisodePriceByMethod(episode, "coin")).toBe(20);
  });

  it("rejects an automatic discounted full-book quote without a selected coupon", () => {
    expect(hasUnexpectedFullBookDiscountQuote(9045, 6035, null)).toBe(true);
    expect(hasUnexpectedFullBookDiscountQuote(9045, 9045, null)).toBe(false);
  });

  it("allows an explicit full-book coupon to produce a lower final price", () => {
    expect(hasUnexpectedFullBookDiscountQuote(9045, 6035, 10)).toBe(false);
  });
});
