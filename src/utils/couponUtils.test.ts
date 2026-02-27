import { describe, it, expect } from 'vitest'
import { processCoupons } from '@/utils/couponUtils'

describe('processCoupons', () => {

  // --- Basic coupon processing ---

  it('processes a COIN reward coupon', () => {
    const input = [{
      id: 1,
      name: 'Coin Coupon',
      rewards: [{
        rewardType: 'COIN',
        rewardConfig: '{"amount": 50}',
      }],
    }]

    const result = processCoupons(input)

    expect(result).toHaveLength(1)
    expect(result[0].discountAmount).toBe('50 เหรียญ')
    expect(result[0].type).toBe('cashback')
  })

  it('processes a FREECOIN reward coupon', () => {
    const input = [{
      id: 2,
      name: 'Free Coin',
      rewards: [{
        rewardType: 'FREECOIN',
        rewardConfig: '{"coin": 100}',
      }],
    }]

    const result = processCoupons(input)

    expect(result[0].discountAmount).toBe('100 เหรียญ')
    expect(result[0].type).toBe('cashback')
  })

  it('processes a NOVEL_WHOLE reward with book title', () => {
    const input = [{
      id: 3,
      name: 'Novel Coupon',
      rewards: [{
        rewardType: 'NOVEL_WHOLE',
        rewardConfig: '{}',
        book: { title: 'นิยายสุดเจ๋ง', img: '', img_full: '' },
      }],
    }]

    const result = processCoupons(input)

    expect(result[0].discountAmount).toBe('นิยายสุดเจ๋ง')
    expect(result[0].type).toBe('discount')
  })

  it('processes a NOVEL_WHOLE reward without book', () => {
    const input = [{
      id: 4,
      name: 'Free Novel',
      rewards: [{
        rewardType: 'NOVEL_WHOLE',
        rewardConfig: '{}',
      }],
    }]

    const result = processCoupons(input)

    expect(result[0].discountAmount).toBe('นิยายอ่านฟรี')
  })

  it('processes a BOXSET reward', () => {
    const input = [{
      id: 5,
      name: 'Boxset',
      rewards: [{
        rewardType: 'BOXSET',
        rewardConfig: '{}',
      }],
    }]

    const result = processCoupons(input)

    expect(result[0].discountAmount).toBe('Boxset')
    expect(result[0].type).toBe('discount')
  })

  it('processes PERCENT discount type', () => {
    const input = [{
      id: 6,
      name: 'Percent Off',
      rewards: [{
        rewardType: 'DISCOUNT',
        rewardConfig: '{"amount": 20, "type": "PERCENT"}',
      }],
    }]

    const result = processCoupons(input)

    expect(result[0].discountAmount).toBe('20%')
    expect(result[0].type).toBe('discount')
  })

  it('processes fixed amount discount (non-PERCENT)', () => {
    const input = [{
      id: 7,
      name: 'Fixed Discount',
      rewards: [{
        rewardType: 'DISCOUNT',
        rewardConfig: '{"amount": 30}',
      }],
    }]

    const result = processCoupons(input)

    expect(result[0].discountAmount).toBe('30฿')
  })

  // --- Color cycling ---

  it('assigns cycling colors to coupons', () => {
    const input = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      name: `Coupon ${i}`,
      rewards: [],
    }))

    const result = processCoupons(input)

    // 5 colors, so index 5 should cycle back to first color
    expect(result[0].color).toBe('from-orange-400 to-red-500')
    expect(result[5].color).toBe(result[0].color)
  })

  // --- User coupon handling ---

  it('processes user coupon with nested coupon object', () => {
    const input = [{
      id: 99,         // UserCoupon ID
      status: 'UNUSED',
      acquiredAt: '2026-01-01',
      expiresAt: '2026-12-31',
      coupon: {
        id: 10,       // Original coupon ID
        name: 'Nested Coupon',
        endAt: '2026-06-30',
        rewards: [{
          rewardType: 'COIN',
          rewardConfig: '{"amount": 25}',
        }],
      },
    }]

    const result = processCoupons(input)

    expect(result[0].id).toBe(99)        // Uses UserCoupon ID
    expect(result[0].couponId).toBe(10)   // Keeps original coupon ID
    expect(result[0].name).toBe('Nested Coupon')
    expect(result[0].status).toBe('UNUSED')
    expect(result[0].expiresAt).toBe('2026-12-31')
  })

  // --- Edge cases ---

  it('handles coupon with no rewards', () => {
    const input = [{
      id: 20,
      name: 'Empty',
      rewards: [],
    }]

    const result = processCoupons(input)

    expect(result[0].discountAmount).toBe('ส่วนลด') // default fallback
  })

  it('handles rewardConfig as object instead of string', () => {
    const input = [{
      id: 30,
      name: 'Object Config',
      rewards: [{
        rewardType: 'COIN',
        rewardConfig: { amount: 75 },
      }],
    }]

    const result = processCoupons(input)

    expect(result[0].discountAmount).toBe('75 เหรียญ')
  })

  it('handles invalid rewardConfig JSON gracefully', () => {
    const input = [{
      id: 40,
      name: 'Bad JSON',
      rewards: [{
        rewardType: 'COIN',
        rewardConfig: 'not-json{{{',
      }],
    }]

    const result = processCoupons(input)

    // Should not throw, falls back to 0
    expect(result[0].discountAmount).toBe('0 เหรียญ')
  })

  it('returns empty array for empty input', () => {
    expect(processCoupons([])).toEqual([])
  })
})
