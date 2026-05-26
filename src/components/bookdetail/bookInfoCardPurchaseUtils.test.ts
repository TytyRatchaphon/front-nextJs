import { describe, expect, it } from "vitest";
import { getEpisodePriceByMethod, getEpisodeRegularCoinPrice } from "./bookInfoCardPurchaseUtils";

describe("book detail purchase pricing", () => {
  it("uses the regular episode price for full-book display totals", () => {
    const episode = { coin: 30, discount_price: 20 };

    expect(getEpisodeRegularCoinPrice(episode)).toBe(30);
  });

  it("continues to use discounted episode pricing for manual selection", () => {
    const episode = { coin: 30, discount_price: 20 };

    expect(getEpisodePriceByMethod(episode, "coin")).toBe(20);
  });
});
